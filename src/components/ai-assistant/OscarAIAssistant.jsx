import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Loader2,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import useMediaStore from '../../store/useMediaStore';
import useSystemStore from '../../store/useSystemStore';
import apiClient from '../../services/client';
import { resolveImageUrl } from '../../utils/imageUrl';
import { formatOrderDateTime, getOrderStatusMeta, resolveSiteOrderNumber } from '../../utils/orders';
import coinsImage from '../../assets/عملات.webp';
import oscarAssistantIcon from '../../assets/ChatGPT_Image_31_مايو_2026__08_01_23_م-removebg-preview.png';
import {
  ASSISTANT_MAX_MESSAGES,
  ASSISTANT_STORAGE_KEY,
  assistantCopy,
  buildAssistantCatalog,
  createAssistantMessageId,
  createChargingMessage,
  createFallbackMessage,
  createGreetingMessage,
  createNavigationMessage,
  createOrderProcessMessage,
  createPaymentMessage,
  createProductMessage,
  createRefundMessage,
  detectAssistantIntent,
  detectMessageLanguage,
  detectNavigationTarget,
  extractReferenceNumber,
  formatAssistantTime,
  isArabicLanguage,
  normalizeAssistantText,
  searchAssistantProducts,
} from './assistantKnowledge';
import {
  GENERAL_ASSISTANT_QUESTIONS,
  createAssistantKnowledgeResponse,
  createRelatedQuestionsForMessage,
  getRelatedQuestions,
} from './aiKnowledgeBase';

const dataProvider = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase();
const isRealProvider = dataProvider === 'real';
const ASSISTANT_REQUEST_TIMEOUT_MS = 15_000;
const ASSISTANT_LOG_PREFIX = '[OscarAIAssistant]';
const UNREADABLE_ASSISTANT_RESPONSE = 'تم استلام طلبك، لكن لم أتمكن من قراءة الرد بشكل صحيح.';
const ASSISTANT_TEMPORARY_ERROR = 'حصلت مشكلة مؤقتة في المساعد الذكي، حاول مرة أخرى.';

const getAssistantNow = () => (
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
);

const createAssistantTimeoutError = (label) => {
  const error = new Error(`${label} timed out after ${ASSISTANT_REQUEST_TIMEOUT_MS / 1000} seconds.`);
  error.name = 'AbortError';
  error.code = 'OSCAR_AI_TIMEOUT';
  return error;
};

const isAssistantTimeoutError = (error) => (
  error?.code === 'OSCAR_AI_TIMEOUT' || error?.name === 'AbortError'
);

const getApiErrorStatus = (error) => Number(
  error?.response?.status
  || error?.status
  || error?.cause?.response?.status
  || 0
);

const getAssistantErrorMessage = (language) => (
  language === 'ar'
    ? ASSISTANT_TEMPORARY_ERROR
    : 'Something went wrong while processing your request. Please try again in a moment.'
);

const ASSISTANT_TEXT_KEYS = ['text', 'message', 'reply', 'response', 'content', 'answer'];

const extractAssistantText = (value, depth = 0) => {
  if (depth > 4 || value === null || value === undefined) return '';

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = extractAssistantText(item, depth + 1);
      if (text) return text;
    }
    return '';
  }

  if (typeof value !== 'object') return '';

  const choiceText = extractAssistantText(value.choices?.[0]?.message?.content, depth + 1)
    || extractAssistantText(value.choices?.[0]?.text, depth + 1)
    || extractAssistantText(value.candidates?.[0]?.content?.parts?.[0]?.text, depth + 1);
  if (choiceText) return choiceText;

  for (const key of ASSISTANT_TEXT_KEYS) {
    const text = extractAssistantText(value[key], depth + 1);
    if (text) return text;
  }

  return extractAssistantText(value.data, depth + 1);
};

const normalizeAssistantResponse = (response, language) => {
  const data = response?.data?.data ?? response?.data ?? response;
  const text = extractAssistantText(data) || extractAssistantText(response) || UNREADABLE_ASSISTANT_RESPONSE;
  const source = data && typeof data === 'object' ? data : {};
  const responseSource = response && typeof response === 'object' ? response : {};

  return {
    text,
    content: text,
    actions: Array.isArray(source.actions) ? source.actions : (Array.isArray(responseSource.actions) ? responseSource.actions : []),
    products: Array.isArray(source.products) ? source.products : (Array.isArray(responseSource.products) ? responseSource.products : []),
    details: Array.isArray(source.details) ? source.details : (Array.isArray(responseSource.details) ? responseSource.details : []),
    relatedQuestions: Array.isArray(source.relatedQuestions)
      ? source.relatedQuestions
      : (Array.isArray(source.related)
        ? source.related
        : (Array.isArray(responseSource.relatedQuestions) ? responseSource.relatedQuestions : [])),
  };
};

const createRuntimeMessageId = () => (
  globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now())
);

const withAssistantTimeout = async (requestFactory, label, meta = {}) => {
  const startedAt = getAssistantNow();
  let timeoutId = null;

  console.debug(`${ASSISTANT_LOG_PREFIX} Request started`, { label, ...meta });

  try {
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = globalThis.setTimeout(() => {
        reject(createAssistantTimeoutError(label));
      }, ASSISTANT_REQUEST_TIMEOUT_MS);
    });

    const response = await Promise.race([
      Promise.resolve().then(requestFactory),
      timeoutPromise,
    ]);

    console.debug(`${ASSISTANT_LOG_PREFIX} Response received`, { label, ...meta, response });
    return response;
  } catch (error) {
    console.error(`${ASSISTANT_LOG_PREFIX} Error received`, { label, ...meta, error });
    throw error;
  } finally {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }

    console.debug(`${ASSISTANT_LOG_PREFIX} Request finished`, {
      label,
      ...meta,
      durationMs: Math.round(getAssistantNow() - startedAt),
    });
  }
};

const readStoredMessages = (language) => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(ASSISTANT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed) || !parsed.length) return [];

    const storedMessages = parsed
      .filter((message) => message && ['assistant', 'user'].includes(message.role) && message.text)
      .slice(-ASSISTANT_MAX_MESSAGES);

    if (!storedMessages.length) return [];

    const firstMessage = storedMessages[0];
    const firstText = String(firstMessage?.text || '');
    const isLegacyWelcome = firstMessage?.role === 'assistant' && (
      storedMessages.length === 1
      || firstText.includes('أهلًا بك في OSCAR STORE')
      || firstText.includes('Welcome to OSCAR STORE')
    );

    if (isLegacyWelcome && firstText !== assistantCopy[language].welcome) {
      return [
        {
          ...firstMessage,
          text: assistantCopy[language].welcome,
          content: assistantCopy[language].welcome,
          updatedAt: new Date().toISOString(),
        },
        ...storedMessages.slice(1),
      ];
    }

    return storedMessages;
  } catch {
    return [];
  }
};

const createWelcomeMessage = (language) => ({
  id: createAssistantMessageId('assistant'),
  role: 'assistant',
  text: assistantCopy[language].welcome,
  createdAt: new Date().toISOString(),
});

const getInitialMessages = (language) => {
  const stored = readStoredMessages(language);
  return stored.length ? stored : [createWelcomeMessage(language)];
};

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const normalizeUiLanguage = (i18n) => (
  String(i18n?.resolvedLanguage || i18n?.language || 'ar').toLowerCase().startsWith('en') ? 'en' : 'ar'
);

const getTopupStatusLabel = (status, language) => {
  const normalized = String(status || '').trim().toLowerCase();
  const isAr = language === 'ar';

  if (['approved', 'completed', 'success'].includes(normalized)) {
    return isAr ? 'مقبول / مكتمل' : 'Approved / completed';
  }
  if (['rejected', 'denied', 'failed', 'cancelled', 'canceled'].includes(normalized)) {
    return isAr ? 'مرفوض أو غير مكتمل' : 'Rejected or incomplete';
  }
  return isAr ? 'قيد المراجعة' : 'Under review';
};

const buildAuthRequiredMessage = (language) => ({
  text: assistantCopy[language].authRequired,
  actions: [{ label: assistantCopy[language].login, to: '/auth?mode=login' }],
});

const buildTrackingErrorMessage = (language, fallbackText, actions, error) => {
  const status = getApiErrorStatus(error);
  const shouldShowGenericError = isAssistantTimeoutError(error) || status >= 500;

  return {
    text: shouldShowGenericError ? getAssistantErrorMessage(language) : fallbackText,
    actions,
  };
};

const withRelatedQuestions = (response, message, fallbackQuestions = GENERAL_ASSISTANT_QUESTIONS) => {
  const ownRelated = Array.isArray(response?.relatedQuestions)
    ? response.relatedQuestions
    : (Array.isArray(response?.related) ? response.related : []);

  return {
    ...(response || {}),
    relatedQuestions: ownRelated.length
      ? getRelatedQuestions(ownRelated, message)
      : createRelatedQuestionsForMessage(message, fallbackQuestions),
  };
};

const cleanAssistantValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  return '';
};

const createDetailRows = (rows = []) => rows
  .map((row) => ({
    label: cleanAssistantValue(row?.label),
    value: cleanAssistantValue(row?.value),
  }))
  .filter((row) => row.label && row.value && row.value !== 'undefined' && row.value !== 'null');

const formatAssistantDateLabel = (value, language = 'ar') => {
  const raw = cleanAssistantValue(value);
  if (!raw) return '';

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return formatOrderDateTime(date.toISOString(), language === 'ar' ? 'ar-EG' : 'en-US');
  } catch {
    return date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
  }
};

const formatAssistantAmount = (amount, currency = 'USD') => {
  const raw = cleanAssistantValue(amount);
  if (!raw) return '';

  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric === 0) return '';

  const normalizedCurrency = String(currency || 'USD').toUpperCase();
  return `${Math.abs(numeric).toLocaleString('en-US', { maximumFractionDigits: 6 })} ${normalizedCurrency}`;
};

const getOperationStatusExplanation = (status, language = 'ar') => {
  const normalized = normalizeAssistantText(status);
  const isAr = language === 'ar';

  if (['completed', 'complete', 'success', 'successful', 'done', 'approved', 'paid', 'مكتمل', 'ناجح', 'تم', 'مقبول'].some((term) => normalized.includes(normalizeAssistantText(term)))) {
    return isAr ? 'تمت العملية بنجاح ✅' : 'The operation was completed successfully.';
  }

  if (['pending', 'review', 'processing', 'manual_review', 'under_review', 'قيد المراجعه', 'مراجعه', 'قيد التنفيذ', 'معلق'].some((term) => normalized.includes(normalizeAssistantText(term)))) {
    return isAr ? 'العملية قيد المراجعة أو التنفيذ ⏳' : 'The operation is under review or processing.';
  }

  if (['waiting', 'queued', 'wait', 'انتظار', 'في الانتظار'].some((term) => normalized.includes(normalizeAssistantText(term)))) {
    return isAr ? 'العملية في الانتظار وسيتم مراجعتها قريبًا ⏱️' : 'The operation is waiting and will be reviewed soon.';
  }

  if (['failed', 'rejected', 'reject', 'canceled', 'cancelled', 'denied', 'مرفوض', 'فشل', 'فشلت', 'ملغي', 'ملغى'].some((term) => normalized.includes(normalizeAssistantText(term)))) {
    return isAr ? 'العملية مرفوضة أو فشلت ❌' : 'The operation was rejected, canceled, or failed.';
  }

  return isAr ? 'الحالة محتاجة مراجعة من تفاصيل العملية.' : 'Check the operation details for the latest status.';
};

const getOrderStatusExplanation = (status, language = 'ar') => {
  const normalized = normalizeAssistantText(status);
  const isAr = language === 'ar';

  if (normalized.includes('pending') || normalized.includes('review') || normalized.includes('مراجعه')) {
    return isAr
      ? 'قيد المراجعة يعني الطلب وصل للإدارة ويتم فحص البيانات أو الدفع.'
      : 'Under review means the order data or payment is being checked.';
  }

  if (normalized.includes('processing') || normalized.includes('قيد التنفيذ')) {
    return isAr
      ? 'قيد التنفيذ يعني الطلب بدأ تنفيذه ومحتاج وقت حسب الخدمة.'
      : 'Processing means the order has started and needs time depending on the service.';
  }

  if (normalized.includes('completed') || normalized.includes('success') || normalized.includes('مكتمل')) {
    return isAr
      ? 'مكتمل يعني الطلب تم تنفيذه بنجاح.'
      : 'Completed means the order was fulfilled successfully.';
  }

  if (normalized.includes('rejected') || normalized.includes('failed') || normalized.includes('denied') || normalized.includes('مرفوض')) {
    return isAr
      ? 'مرفوض يعني الطلب لم يتم قبوله، غالبًا بسبب بيانات غير صحيحة أو مشكلة في الدفع.'
      : 'Rejected means the order was not accepted, often due to incorrect data or payment issues.';
  }

  if (normalized.includes('cancel')) {
    return isAr
      ? 'ملغي يعني الطلب تم إلغاؤه ولن يتم تنفيذه.'
      : 'Canceled means the order was canceled and will not be fulfilled.';
  }

  return getOperationStatusExplanation(status, language);
};

const SENSITIVE_ORDER_FIELD_RE = /(password|pass|token|secret|otp|auth|session|cookie|api.?key|كلمه|كلمة|مرور|توكن|رمز\s*سري)/i;

const getSafeOrderFieldRows = (order, language = 'ar') => {
  const values = order?.orderFieldsValues || order?.customInputs || order?.orderFields || {};
  if (!values || typeof values !== 'object' || Array.isArray(values)) return [];

  return Object.entries(values)
    .filter(([key, value]) => !SENSITIVE_ORDER_FIELD_RE.test(String(key || '')) && cleanAssistantValue(value))
    .slice(0, 4)
    .map(([key, value]) => ({
      label: language === 'ar' ? `بيانات الشحن: ${key}` : `Field: ${key}`,
      value: cleanAssistantValue(value).slice(0, 80),
    }));
};

const getAssistantTimestamp = (entry) => {
  const date = new Date(entry?.createdAt || entry?.date || entry?.timestamp || entry?.updatedAt || 0);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
};

const isOrderGuideRequest = (message) => {
  const text = normalizeAssistantText(message);
  return ['كيف اتابع', 'ازاي اتابع', 'فين الاقي الطلبات', 'تصفح الطلبات'].some((term) => text.includes(normalizeAssistantText(term)));
};

const isOrderListRequest = (message) => {
  const text = normalizeAssistantText(message);
  return ['طلباتي', 'الطلبات بتاعتي', 'كل الطلبات', 'اخر طلب'].some((term) => text.includes(normalizeAssistantText(term)));
};

const isLatestTopupRequest = (message) => {
  const text = normalizeAssistantText(message);
  return ['اخر شحن', 'آخر شحن', 'طلب الشحن', 'شحن المحفظه', 'شحن المحفظة'].some((term) => text.includes(normalizeAssistantText(term)));
};

const CompactIconButton = ({ label, children, className = '', ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`oscar-ai-icon-button ${className}`}
    {...props}
  >
    {children}
  </button>
);

const TypingIndicator = ({ language }) => (
  <div className="oscar-ai-message-row assistant" dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <div className="oscar-ai-avatar" aria-hidden="true">
      <img src={oscarAssistantIcon} alt="" className="oscar-ai-brand-avatar" loading="lazy" decoding="async" />
    </div>
    <div className="oscar-ai-bubble assistant typing" aria-live="polite">
      <span className="sr-only">{assistantCopy[language].typing}</span>
      <span className="oscar-ai-dot" />
      <span className="oscar-ai-dot" />
      <span className="oscar-ai-dot" />
    </div>
  </div>
);

const ProductSuggestion = memo(({ product, language, onOpen }) => (
  <button
    type="button"
    className="oscar-ai-product"
    onClick={() => onOpen(product)}
    dir={language === 'ar' ? 'rtl' : 'ltr'}
  >
    <span className="oscar-ai-product-image">
      <img
        src={product.image ? resolveImageUrl(product.image) : coinsImage}
        alt={product.name}
        loading="lazy"
        decoding="async"
      />
    </span>
    <span className="min-w-0 flex-1">
      <span className="oscar-ai-product-title">{product.name}</span>
      {product.description ? <span className="oscar-ai-product-description">{product.description}</span> : null}
    </span>
    <span className="oscar-ai-product-open-label">{product.actionLabel || assistantCopy[language]?.openProduct}</span>
    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
  </button>
));

ProductSuggestion.displayName = 'ProductSuggestion';

const ChatMessage = memo(({
  message,
  language,
  onAction,
  onProductOpen,
  onSuggestedQuestion,
  isAuthenticated,
}) => {
  const isUser = message.role === 'user';
  const messageLanguage = message.language || language;
  const dir = isArabicLanguage(messageLanguage) ? 'rtl' : 'ltr';

  return (
    <div className={`oscar-ai-message-row ${isUser ? 'user' : 'assistant'}`} dir={dir}>
      {!isUser ? (
        <div className="oscar-ai-avatar" aria-hidden="true">
          <img src={oscarAssistantIcon} alt="" className="oscar-ai-brand-avatar" loading="lazy" decoding="async" />
        </div>
      ) : null}

      <div className={`oscar-ai-bubble ${isUser ? 'user' : 'assistant'}`}>
        <p className="whitespace-pre-line">{message.text}</p>

        {Array.isArray(message.products) && message.products.length > 0 ? (
          <div className="mt-3 space-y-2">
            {message.products.map((product) => (
              <ProductSuggestion
                key={product.id}
                product={product}
                language={messageLanguage}
                onOpen={onProductOpen}
              />
            ))}
          </div>
        ) : null}

        {Array.isArray(message.details) && message.details.length > 0 ? (
          <div className="oscar-ai-detail-cards">
            {message.details.map((card) => (
              <div key={card.id || card.title} className="oscar-ai-detail-card">
                {card.title ? <strong>{card.title}</strong> : null}
                {Array.isArray(card.rows) && card.rows.length > 0 ? (
                  <dl>
                    {card.rows.map((row) => (
                      <div key={`${row.label}-${row.value}`}>
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {Array.isArray(message.actions) && message.actions.length > 0 ? (
          <div className="oscar-ai-actions">
            {message.actions.map((action) => {
              const needsLogin = action.authRequired && !isAuthenticated;
              const label = needsLogin ? assistantCopy[messageLanguage]?.login || action.label : action.label;
              return (
                <button
                  key={`${action.to || action.publicTo}-${action.label}`}
                  type="button"
                  onClick={() => onAction(action)}
                  className="oscar-ai-action"
                >
                  <span>{label}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        ) : null}

        {!isUser && Array.isArray(message.relatedQuestions) && message.relatedQuestions.length > 0 ? (
          <div className="oscar-ai-related-questions">
            {message.relatedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                className="oscar-ai-related-question"
                onClick={() => onSuggestedQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
        ) : null}

        <span className="oscar-ai-time">{formatAssistantTime(message.createdAt, messageLanguage)}</span>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

const OscarAIAssistant = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadProducts = useMediaStore((state) => state.loadProducts);
  const loadPaymentSettings = useSystemStore((state) => state.loadPaymentSettings);
  const paymentSettings = useSystemStore((state) => state.paymentSettings);

  const uiLanguage = useMemo(() => normalizeUiLanguage(i18n), [i18n.resolvedLanguage, i18n.language]);
  const copy = assistantCopy[uiLanguage];

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => getInitialMessages(uiLanguage));
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        ASSISTANT_STORAGE_KEY,
        JSON.stringify(messages.slice(-ASSISTANT_MAX_MESSAGES))
      );
    } catch {
      // Local storage can be unavailable in private mode; chat still works in-memory.
    }
  }, [messages]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.dataset.aiAssistantOpen = String(isOpen);
    return () => {
      delete document.body.dataset.aiAssistantOpen;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isOpen, messages, isTyping]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 160);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isClearConfirmOpen) {
          setIsClearConfirmOpen(false);
          return;
        }

        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClearConfirmOpen, isOpen]);

  const appendAssistantMessage = useCallback((response, language) => {
    const normalizedResponse = normalizeAssistantResponse(response, language);
    const aiText = normalizedResponse.text;
    const timestamp = new Date().toISOString();
    const nextMessage = {
      id: createRuntimeMessageId(),
      role: 'assistant',
      type: 'assistant',
      text: aiText,
      content: aiText,
      actions: normalizedResponse.actions,
      products: normalizedResponse.products,
      details: normalizedResponse.details,
      relatedQuestions: normalizedResponse.relatedQuestions,
      language,
      timestamp,
      createdAt: timestamp,
    };

    setMessages((current) => [...current, nextMessage].slice(-ASSISTANT_MAX_MESSAGES));
    console.log('[OscarAIAssistant] Assistant message added', aiText);
  }, []);

  const resolveCatalog = useCallback(async (language) => {
    let mediaState = useMediaStore.getState();
    let products = Array.isArray(mediaState.products) ? mediaState.products : [];
    let categories = Array.isArray(mediaState.categories) ? mediaState.categories : [];

    if (!products.length || !categories.length) {
      try {
        await withAssistantTimeout(
          () => loadProducts({ force: false }),
          'catalog-store-load',
          { source: 'useMediaStore.loadProducts' }
        );
      } catch {
        // Keep the assistant responsive and continue with any catalog state already available.
      }

      mediaState = useMediaStore.getState();
      products = Array.isArray(mediaState.products) ? mediaState.products : [];
      categories = Array.isArray(mediaState.categories) ? mediaState.categories : [];
    }

    if (isRealProvider && !products.length) {
      const publicCatalog = await withAssistantTimeout(
        () => apiClient.publicCatalog.fetch(),
        'public-catalog-fetch',
        { endpoint: 'GET /public/catalog' }
      ).catch(() => null);

      if (publicCatalog) {
        products = Array.isArray(publicCatalog.products) ? publicCatalog.products : products;
        categories = Array.isArray(publicCatalog.categories) ? publicCatalog.categories : categories;
      }
    }

    return buildAssistantCatalog(products, categories, { language, user });
  }, [loadProducts, user]);

  const fetchOrderResponse = useCallback(async (orderId, language) => {
    if (!isAuthenticated) return buildAuthRequiredMessage(language);

    try {
      let order = await withAssistantTimeout(
        () => apiClient.orders.getById(orderId, user?.id),
        'order-status-fetch',
        { endpoint: 'GET /me/orders/:id or fallback', orderId }
      ).catch(async (error) => {
        const orders = await withAssistantTimeout(
          () => (apiClient.orders.listAll
            ? apiClient.orders.listAll(user?.id, { limit: 30, maxPages: 3 })
            : apiClient.orders.list(user?.id)),
          'orders-reference-search',
          { endpoint: 'GET /me/orders fallback search', orderId }
        );
        const normalizedTarget = normalizeAssistantText(orderId);
        const matched = (Array.isArray(orders) ? orders : []).find((entry) => {
          const refs = [
            entry?.id,
            entry?._id,
            entry?.orderNumber,
            entry?.siteOrderNumber,
            entry?.internalOrderNumber,
            entry?.externalOrderId,
            resolveSiteOrderNumber(entry),
          ].map(normalizeAssistantText);
          return refs.some((ref) => ref && ref === normalizedTarget);
        });
        if (matched) return matched;
        throw error;
      });

      order = order?.order || order;
      const statusMeta = getOrderStatusMeta(order?.status, language);
      const orderNumber = resolveSiteOrderNumber(order) || orderId;
      const productName = language === 'ar'
        ? order?.productNameAr || order?.productName || order?.productId || ''
        : order?.productName || order?.productNameAr || order?.productId || '';
      const createdAt = order?.createdAt || order?.date || order?.updatedAt;
      const createdLabel = createdAt
        ? formatOrderDateTime(createdAt, language === 'ar' ? 'ar-EG' : 'en-US')
        : '';
      const quantity = cleanAssistantValue(order?.quantity || order?.quantitySnapshot);
      const amountLabel = formatAssistantAmount(
        order?.total ?? order?.totalPrice ?? order?.priceCoins ?? order?.unitPrice ?? order?.amount,
        order?.currencyCode || order?.currency || order?.financialSnapshot?.originalCurrency || user?.currency || 'USD'
      );
      const adminNotes = cleanAssistantValue(order?.adminNotes || order?.notes || order?.providerReferenceMessage || order?.rejectionReason);
      const rows = createDetailRows([
        { label: language === 'ar' ? 'رقم الطلب' : 'Order number', value: orderNumber },
        { label: language === 'ar' ? 'المنتج' : 'Product', value: productName },
        { label: language === 'ar' ? 'الكمية' : 'Quantity', value: quantity },
        { label: language === 'ar' ? 'السعر' : 'Price', value: amountLabel },
        { label: language === 'ar' ? 'الحالة' : 'Status', value: statusMeta.label },
        { label: language === 'ar' ? 'تاريخ الطلب' : 'Created', value: createdLabel },
        ...getSafeOrderFieldRows(order, language),
        { label: language === 'ar' ? 'ملاحظات الإدارة' : 'Admin notes', value: adminNotes },
      ]);

      setPendingIntent(null);

      return {
        text: language === 'ar'
          ? `راجعت بيانات الطلب #${orderNumber}. الحالة الحالية: ${statusMeta.label}.\n${getOrderStatusExplanation(order?.status, language)}`
          : `I checked order #${orderNumber}. Current status: ${statusMeta.label}.\n${getOrderStatusExplanation(order?.status, language)}`,
        details: rows.length ? [{
          id: `order-${order?.id || orderNumber}`,
          title: language === 'ar' ? 'تفاصيل الطلب' : 'Order details',
          rows,
        }] : [],
        actions: [{
          label: assistantCopy[language].browseOrders,
          to: `/orders?orderId=${encodeURIComponent(order?.id || orderId)}`,
          authRequired: true,
        }],
      };
    } catch (error) {
      return buildTrackingErrorMessage(
        language,
        assistantCopy[language].orderNotFound,
        [{ label: assistantCopy[language].viewOrders, to: '/orders', authRequired: true }],
        error
      );
    }
  }, [isAuthenticated, user?.id]);

  const fetchTopupResponse = useCallback(async (topupId, language) => {
    if (!isAuthenticated) return buildAuthRequiredMessage(language);

    try {
      const topup = await withAssistantTimeout(
        () => apiClient.topups.getById(topupId, user?.id),
        'topup-status-fetch',
        { endpoint: 'GET /me/deposits/:id or fallback', topupId }
      );
      const statusLabel = getTopupStatusLabel(topup?.status, language);
      const amount = Number(topup?.actualPaidAmount ?? topup?.requestedAmount ?? topup?.amount ?? 0);
      const currency = String(topup?.currencyCode || topup?.currency || user?.currency || 'USD').toUpperCase();
      const amountLabel = Number.isFinite(amount) && amount > 0 ? `${amount} ${currency}` : '';

      setPendingIntent(null);

      return {
        text: language === 'ar'
          ? `حالة طلب الشحن #${topup?.id || topupId}: ${statusLabel}${amountLabel ? `\nالمبلغ: ${amountLabel}` : ''}\nيمكنك مراجعة سجل الشحن من المحفظة.`
          : `Top-up request #${topup?.id || topupId} status: ${statusLabel}${amountLabel ? `\nAmount: ${amountLabel}` : ''}\nYou can review top-up history from Wallet.`,
        actions: [{ label: assistantCopy[language].wallet, to: '/wallet/topup-history', authRequired: true }],
      };
    } catch (error) {
      return buildTrackingErrorMessage(
        language,
        assistantCopy[language].topupNotFound,
        [{ label: assistantCopy[language].wallet, to: '/wallet/topup-history', authRequired: true }],
        error
      );
    }
  }, [isAuthenticated, user?.currency, user?.id]);

  const fetchLatestOperationResponse = useCallback(async (language, focus = 'all') => {
    if (!isAuthenticated) return buildAuthRequiredMessage(language);

    const [transactionsResult, topupsResult, ordersResult] = await Promise.allSettled([
      withAssistantTimeout(
        () => apiClient.wallet.getTransactions({ page: 1, limit: 20 }),
        'wallet-transactions-fetch',
        { endpoint: 'GET /wallet/transactions' }
      ),
      withAssistantTimeout(
        () => apiClient.topups.list(),
        'topups-list-fetch',
        { endpoint: 'GET /me/deposits or mock topups' }
      ),
      withAssistantTimeout(
        () => (apiClient.orders.listAll
          ? apiClient.orders.listAll(user?.id, { limit: 20, maxPages: 3 })
          : apiClient.orders.list(user?.id)),
        'orders-list-fetch',
        { endpoint: 'GET /me/orders' }
      ),
    ]);

    const userId = String(user?.id || '').trim();
    const transactions = transactionsResult.status === 'fulfilled' && Array.isArray(transactionsResult.value)
      ? transactionsResult.value
      : [];
    const topups = topupsResult.status === 'fulfilled' && Array.isArray(topupsResult.value)
      ? topupsResult.value.filter((item) => !userId || !item?.userId || String(item.userId) === userId)
      : [];
    const orders = ordersResult.status === 'fulfilled' && Array.isArray(ordersResult.value)
      ? ordersResult.value.filter((item) => !userId || !item?.userId || String(item.userId) === userId)
      : [];

    const toReferenceLabel = (reference, fallback = '') => {
      if (reference && typeof reference === 'object') {
        return cleanAssistantValue(resolveSiteOrderNumber(reference) || reference.orderNumber || reference.id || reference._id || fallback);
      }
      return cleanAssistantValue(reference || fallback);
    };

    const walletCandidates = transactions.map((tx) => {
      const type = normalizeAssistantText(tx?.type);
      const typeLabel = type.includes('debit')
        ? (language === 'ar' ? 'خصم / شراء' : 'Debit / purchase')
        : type.includes('refund')
          ? (language === 'ar' ? 'استرجاع' : 'Refund')
          : (language === 'ar' ? 'شحن / إضافة رصيد' : 'Credit / top-up');

      return {
        source: 'wallet',
        id: cleanAssistantValue(tx?.id || tx?._id || tx?.transactionId || tx?.reference),
        reference: toReferenceLabel(tx?.reference, tx?.id || tx?._id),
        typeLabel,
        status: cleanAssistantValue(tx?.status || 'completed'),
        amount: tx?.amount ?? Math.abs(Number(tx?.signedAmount || 0)),
        currency: tx?.currency || tx?.currencyCode || user?.currency || 'USD',
        date: tx?.createdAt || tx?.date || tx?.timestamp,
        notes: cleanAssistantValue(tx?.description || tx?.note || tx?.sourceType),
        route: '/wallet',
        timestamp: getAssistantTimestamp(tx),
      };
    });

    const topupCandidates = topups.map((topup) => ({
      source: 'topup',
      id: cleanAssistantValue(topup?.id || topup?._id),
      reference: cleanAssistantValue(topup?.id || topup?._id),
      typeLabel: language === 'ar' ? 'طلب شحن محفظة' : 'Wallet top-up request',
      status: cleanAssistantValue(topup?.status || 'pending'),
      amount: topup?.actualPaidAmount ?? topup?.requestedAmount ?? topup?.amount,
      currency: topup?.currencyCode || topup?.currency || user?.currency || 'USD',
      date: topup?.createdAt || topup?.date || topup?.updatedAt,
      notes: cleanAssistantValue(topup?.adminNotes || topup?.notes || topup?.reviewNote),
      route: '/wallet/topup-history',
      timestamp: getAssistantTimestamp(topup),
    }));

    const orderCandidates = orders.map((order) => {
      const statusMeta = getOrderStatusMeta(order?.status, language);
      return {
        source: 'order',
        id: cleanAssistantValue(order?.id || order?._id),
        reference: cleanAssistantValue(resolveSiteOrderNumber(order) || order?.orderNumber || order?.id),
        typeLabel: language === 'ar' ? 'طلب منتج' : 'Product order',
        status: cleanAssistantValue(statusMeta.label || order?.status),
        rawStatus: order?.status,
        amount: order?.total ?? order?.totalPrice ?? order?.priceCoins ?? order?.amount,
        currency: order?.currencyCode || order?.currency || order?.financialSnapshot?.originalCurrency || user?.currency || 'USD',
        date: order?.createdAt || order?.date || order?.updatedAt,
        notes: cleanAssistantValue(order?.adminNotes || order?.notes || order?.providerReferenceMessage || order?.rejectionReason),
        productName: language === 'ar'
          ? order?.productNameAr || order?.productName || order?.productId
          : order?.productName || order?.productNameAr || order?.productId,
        route: `/orders?orderId=${encodeURIComponent(order?.id || order?.orderNumber || '')}`,
        timestamp: getAssistantTimestamp(order),
      };
    });

    const candidates = focus === 'topup'
      ? [...topupCandidates, ...walletCandidates.filter((item) => normalizeAssistantText(item.typeLabel).includes(normalizeAssistantText('شحن')) || normalizeAssistantText(item.typeLabel).includes('credit'))]
      : focus === 'orders'
        ? orderCandidates
        : [...walletCandidates, ...topupCandidates, ...orderCandidates];

    const latest = candidates
      .filter((item) => item.timestamp > 0 || item.id || item.reference)
      .sort((left, right) => right.timestamp - left.timestamp)[0];

    if (!latest) {
      const text = focus === 'orders'
        ? (language === 'ar' ? 'لا توجد طلبات ظاهرة حاليًا على حسابك.' : 'There are no visible orders on your account right now.')
        : focus === 'topup'
          ? (language === 'ar' ? 'لا توجد عمليات شحن ظاهرة حاليًا على حسابك.' : 'There are no visible top-up operations on your account right now.')
          : (language === 'ar' ? 'لا توجد عمليات ظاهرة حاليًا على حسابك.' : 'There are no visible operations on your account right now.');

      return {
        text,
        actions: [
          { label: assistantCopy[language].wallet, to: '/wallet', authRequired: true },
          { label: assistantCopy[language].browseOrders, to: '/orders', authRequired: true },
        ],
      };
    }

    const statusExplanation = latest.source === 'order'
      ? getOrderStatusExplanation(latest.rawStatus || latest.status, language)
      : getOperationStatusExplanation(latest.status, language);
    const amountLabel = formatAssistantAmount(latest.amount, latest.currency);
    const dateLabel = formatAssistantDateLabel(latest.date, language);
    const rows = createDetailRows([
      { label: language === 'ar' ? 'رقم العملية' : 'Operation number', value: latest.reference || latest.id },
      { label: language === 'ar' ? 'نوع العملية' : 'Operation type', value: latest.typeLabel },
      { label: language === 'ar' ? 'الحالة' : 'Status', value: latest.status },
      { label: language === 'ar' ? 'المبلغ' : 'Amount', value: amountLabel },
      { label: language === 'ar' ? 'التاريخ' : 'Date', value: dateLabel },
      { label: language === 'ar' ? 'المنتج' : 'Product', value: latest.productName },
      { label: language === 'ar' ? 'ملاحظات' : 'Notes', value: latest.notes },
    ]);

    return {
      text: language === 'ar'
        ? `${focus === 'orders' ? 'دي أحدث طلباتك الظاهرة عندي.' : 'دي أحدث عملية ظاهرة على حسابك.'}\n${statusExplanation}`
        : `${focus === 'orders' ? 'This is your latest visible order.' : 'This is the latest visible operation on your account.'}\n${statusExplanation}`,
      details: rows.length ? [{
        id: `operation-${latest.source}-${latest.id || latest.reference}`,
        title: focus === 'orders'
          ? (language === 'ar' ? 'آخر طلب' : 'Latest order')
          : (language === 'ar' ? 'آخر عملية' : 'Latest operation'),
        rows,
      }] : [],
      actions: latest.source === 'order'
        ? [{ label: assistantCopy[language].browseOrders, to: latest.route || '/orders', authRequired: true }]
        : [
          { label: assistantCopy[language].wallet, to: latest.route || '/wallet', authRequired: true },
          { label: assistantCopy[language].browseOrders, to: '/orders', authRequired: true },
        ],
    };
  }, [isAuthenticated, user?.currency, user?.id]);

  const resolveAssistantResponse = useCallback(async (message, language) => {
    const intent = detectAssistantIntent(message, pendingIntent);
    const knowledgeResponse = createAssistantKnowledgeResponse(message);

    if (intent === 'general_site_info') {
      setPendingIntent(null);
      return withRelatedQuestions({
        ...(knowledgeResponse || {
          text: 'OSCAR STORE منصة بتساعدك تشتري وتشحن منتجات رقمية زي شحن الألعاب، تطبيقات الدردشة الصوتية، الاشتراكات، وخدمات السوشيال. تقدر تبحث عن المنتج، تشحن رصيدك، تعمل طلب، وبعدها تتابع حالة الطلب من صفحة الطلبات.',
        }),
        actions: [
          { label: assistantCopy[language].viewProducts, to: '/products', publicTo: '/catalog' },
          { label: assistantCopy[language].addBalance, to: '/wallet/add-balance', authRequired: true },
        ],
      }, message, [
        'إزاي أشتري منتج؟',
        'إزاي أشحن المحفظة؟',
        'إزاي أتابع طلبي؟',
        'ما هي طرق الدفع؟',
      ]);
    }

    if (intent === 'transaction_tracking') {
      setPendingIntent(null);
      return withRelatedQuestions(
        await fetchLatestOperationResponse(language, isLatestTopupRequest(message) ? 'topup' : 'all'),
        message,
        [
          'إزاي أتابع عملية الدفع؟',
          'أين أجد رقم العملية؟',
          'ماذا يعني قيد المراجعة؟',
          'ماذا أفعل لو العملية اترفضت؟',
        ]
      );
    }

    if (intent === 'orderTracking') {
      const orderId = extractReferenceNumber(message);

      if (orderId) {
        return withRelatedQuestions(await fetchOrderResponse(orderId, language), message, [
          'ماذا أفعل لو الطلب اتأخر؟',
          'إزاي أعرف إن الطلب اكتمل؟',
          'ما هي سياسة الاسترجاع؟',
        ]);
      }

      if (isOrderListRequest(message)) {
        setPendingIntent(null);
        return withRelatedQuestions(await fetchLatestOperationResponse(language, 'orders'), message, [
          'كيف أتابع طلبي؟',
          'إيه معنى قيد المراجعة؟',
          'ماذا أفعل لو الطلب اتأخر؟',
          'فين ألاقي رقم الطلب؟',
        ]);
      }

      if (isOrderGuideRequest(message)) {
        setPendingIntent(null);
        return withRelatedQuestions({
          ...(knowledgeResponse || { text: assistantCopy[language].needOrderNumber }),
          actions: [{ label: assistantCopy[language].browseOrders, to: '/orders', authRequired: true }],
        }, message, [
          'ماذا أفعل لو الطلب اتأخر؟',
          'يعني إيه طلب قيد المراجعة؟',
          'إزاي أعرف إن الطلب اكتمل؟',
          'فين ألاقي رقم الطلب؟',
        ]);
      }

      {
        setPendingIntent({ type: 'orderTracking' });
        return withRelatedQuestions({
          text: language === 'ar'
            ? 'لو عايز أفحص طلب معين ابعت رقم الطلب. وتقدر تفتح الطلبات من السايد بار ثم تضغط على الطلبات لمراجعة كل الطلبات وحالاتها وتفاصيلها.'
            : 'Send the order number if you want me to check a specific order. You can also open Orders from the sidebar to review all orders and statuses.',
          actions: [{ label: assistantCopy[language].browseOrders, to: '/orders', authRequired: true }],
        }, message, [
          'ماذا أفعل لو الطلب اتأخر؟',
          'يعني إيه طلب قيد المراجعة؟',
          'إزاي أعرف إن الطلب اكتمل؟',
          'فين ألاقي رقم الطلب؟',
        ]);
      }
    }

    if (intent === 'topupTracking') {
      const topupId = extractReferenceNumber(message);
      if (!topupId) {
        setPendingIntent({ type: 'topupTracking' });
        return withRelatedQuestions({
          text: assistantCopy[language].needTopupNumber,
          actions: [{ label: assistantCopy[language].wallet, to: '/wallet/topup-history', authRequired: true }],
        }, message, [
          'فين ألاقي سجل الشحن؟',
          'ماذا أفعل لو دفعت والرصيد ما ظهرش؟',
          'إزاي أشحن المحفظة؟',
        ]);
      }

      return withRelatedQuestions(await fetchTopupResponse(topupId, language), message, [
        'ماذا أفعل لو دفعت والرصيد ما ظهرش؟',
        'إزاي أشحن المحفظة؟',
        'ما هي طرق الدفع؟',
      ]);
    }

    setPendingIntent(null);

    if (intent === 'order_status_explain') {
      return withRelatedQuestions(knowledgeResponse || {
        text: 'حالات الطلب أو العملية معناها كده: قيد المراجعة يعني الطلب وصل للإدارة ويتم فحص البيانات أو الدفع. قيد التنفيذ يعني الطلب بدأ تنفيذه ومحتاج وقت حسب الخدمة. مكتمل يعني الطلب تم تنفيذه بنجاح. مرفوض يعني الطلب لم يتم قبوله، غالبًا بسبب بيانات غير صحيحة أو مشكلة في الدفع. ملغي يعني الطلب تم إلغاؤه ولن يتم تنفيذه.',
      }, message, [
        'كيف أتابع طلبي؟',
        'آخر عملية عندي',
        'ماذا أفعل لو الطلب اتأخر؟',
        'الرصيد ما ظهرش',
      ]);
    }

    if (intent === 'support_help') {
      return withRelatedQuestions({
        ...(knowledgeResponse || {
          text: 'لو محتاج دعم، افتح صفحة تواصل معنا وابعت تفاصيل المشكلة. لو المشكلة تخص طلب أو دفع، جهز رقم الطلب أو رقم العملية وصورة الإيصال لو موجودة.',
        }),
        actions: [{ label: assistantCopy[language].contact, to: '/contact-us', authRequired: true }],
      }, message, [
        'فين ألاقي رقم الطلب؟',
        'أين أجد رقم العملية؟',
        'الرصيد ما ظهرش',
        'ماذا أفعل لو الطلب اتأخر؟',
      ]);
    }

    if (intent === 'productSearch') {
      const catalog = await resolveCatalog(language);
      return withRelatedQuestions(
        createProductMessage(searchAssistantProducts(message, catalog), language),
        message,
        [
          'إزاي أشحن منتج؟',
          'ما البيانات المطلوبة للشحن؟',
          'كيف أتابع طلبي؟',
          'ماذا أفعل لو الطلب اتأخر؟',
        ]
      );
    }

    if (intent === 'wallet_help') {
      return withRelatedQuestions({
        ...(knowledgeResponse || {
          text: 'المحفظة هي المكان اللي بيظهر فيه رصيدك داخل Oscar Store. تقدر تشحنها من صفحة الدفع أو شحن الرصيد، وبعد ظهور الرصيد تقدر تستخدمه في شراء المنتجات.',
        }),
        actions: [
          { label: assistantCopy[language].wallet, to: '/wallet', authRequired: true },
          { label: assistantCopy[language].addBalance, to: '/wallet/add-balance', authRequired: true },
        ],
      }, message, [
        'إزاي أتابع عملية الدفع؟',
        'أين أجد رقم العملية؟',
        'ماذا يعني قيد المراجعة؟',
        'ماذا أفعل لو العملية اترفضت؟',
      ]);
    }

    if (intent === 'payment') {
      const settings = await withAssistantTimeout(
        () => loadPaymentSettings({ force: false }),
        'payment-settings-load',
        { endpoint: isRealProvider ? 'GET /settings/payment or /admin/settings' : 'mock system.paymentSettings' }
      ).catch(() => useSystemStore.getState().paymentSettings || paymentSettings);

      const paymentResponse = createPaymentMessage(settings || paymentSettings, language);
      const hasPaymentMethods = paymentResponse.text !== assistantCopy[language].paymentEmpty;

      if (hasPaymentMethods) {
        return withRelatedQuestions(paymentResponse, message, [
          'إزاي أشحن المحفظة؟',
          'الرصيد بيظهر بعد قد إيه؟',
          'ماذا أفعل لو دفعت والرصيد ما ظهرش؟',
        ]);
      }

      return withRelatedQuestions({
        ...(knowledgeResponse || paymentResponse),
        actions: [{ label: assistantCopy[language].addBalance, to: '/wallet/add-balance', authRequired: true }],
      }, message, [
        'إزاي أشحن المحفظة؟',
        'الرصيد بيظهر بعد قد إيه؟',
        'ماذا أفعل لو دفعت والرصيد ما ظهرش؟',
      ]);
    }

    if (intent === 'charging') {
      const response = knowledgeResponse || createChargingMessage(language);
      return withRelatedQuestions({
        ...response,
        actions: response.actions || [
          { label: assistantCopy[language].addBalance, to: '/wallet/add-balance', authRequired: true },
          { label: assistantCopy[language].viewProducts, to: '/products', publicTo: '/catalog' },
        ],
      }, message);
    }

    if (intent === 'orderProcess') {
      return withRelatedQuestions(knowledgeResponse || createOrderProcessMessage(language), message, [
        'اشرح طريقة الشحن',
        'ما البيانات المطلوبة للشحن؟',
        'كيف أتابع طلبي؟',
        'ماذا أفعل لو الطلب اتأخر؟',
      ]);
    }

    if (intent === 'refund') {
      return withRelatedQuestions(knowledgeResponse || createRefundMessage(language), message, [
        'كيف أتابع طلبي؟',
        'ماذا أفعل لو الطلب اتأخر؟',
        'إزاي أعرف إن الطلب اكتمل؟',
      ]);
    }

    if (intent === 'greeting') return withRelatedQuestions(createGreetingMessage(language), message);

    if (intent === 'navigation') {
      const target = detectNavigationTarget(message);
      if (target) return withRelatedQuestions(createNavigationMessage(target, language, isAuthenticated), message);
    }

    return createAssistantKnowledgeResponse(message, { fallbackToGeneral: true }) || withRelatedQuestions(createFallbackMessage(language), message);
  }, [
    fetchOrderResponse,
    fetchTopupResponse,
    fetchLatestOperationResponse,
    isAuthenticated,
    loadPaymentSettings,
    paymentSettings,
    pendingIntent,
    resolveCatalog,
  ]);

  const handleSubmitMessage = useCallback(async (event, overrideText = '') => {
    event?.preventDefault?.();
    const rawMessage = String(overrideText || inputValue || '').trim();
    if (!rawMessage || isTyping || isLoading) return;

    const language = detectMessageLanguage(rawMessage, uiLanguage);
    const userMessage = {
      id: createAssistantMessageId('user'),
      role: 'user',
      text: rawMessage,
      language,
      createdAt: new Date().toISOString(),
    };

    setInputValue('');
    setIsOpen(true);
    setIsClearConfirmOpen(false);
    setMessages((current) => [...current, userMessage].slice(-ASSISTANT_MAX_MESSAGES));
    setIsTyping(true);
    setLoading(true);

    const startedAt = Date.now();

    try {
      const response = await withAssistantTimeout(
        () => resolveAssistantResponse(rawMessage, language),
        'assistant-response',
        { language, messageLength: rawMessage.length }
      );

      // reduce console noise — keep as debug-level
      console.debug(`${ASSISTANT_LOG_PREFIX} Full Response:`, response);

      const remainingDelay = Math.max(260, 620 - (Date.now() - startedAt));
      await sleep(remainingDelay);

      appendAssistantMessage(response, language);
    } catch (error) {
      appendAssistantMessage({
        text: ASSISTANT_TEMPORARY_ERROR,
        content: ASSISTANT_TEMPORARY_ERROR,
      }, language);
      console.error(`${ASSISTANT_LOG_PREFIX} Assistant response failed`, { error });
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  }, [appendAssistantMessage, inputValue, isLoading, isTyping, resolveAssistantResponse, uiLanguage]);

  const handleSuggestedQuestion = useCallback((question) => {
    handleSubmitMessage(null, question);
  }, [handleSubmitMessage]);

  const handleAction = useCallback((action) => {
    const target = action.authRequired && !isAuthenticated
      ? '/auth?mode=login'
      : (!isAuthenticated && action.publicTo ? action.publicTo : action.to);

    if (target) {
      navigate(target);
      setIsOpen(false);
    }
  }, [isAuthenticated, navigate]);

  const handleProductOpen = useCallback((product) => {
    if (!isAuthenticated) {
      navigate('/auth?mode=login');
      setIsOpen(false);
      return;
    }

    navigate(`/products?purchase=${encodeURIComponent(product.id)}`);
    setIsOpen(false);
  }, [isAuthenticated, navigate]);

  const handleClearChat = useCallback(() => {
    setIsClearConfirmOpen(true);
  }, []);

  const handleCancelClearChat = useCallback(() => {
    setIsClearConfirmOpen(false);
  }, []);

  const handleConfirmClearChat = useCallback(() => {
    setPendingIntent(null);
    setInputValue('');
    setIsTyping(false);
    setLoading(false);
    setMessages([createWelcomeMessage(uiLanguage)]);
    setIsClearConfirmOpen(false);
    console.info(`${ASSISTANT_LOG_PREFIX} Chat history cleared`);
  }, [uiLanguage]);

  const hasOnlyWelcome = messages.length <= 1 && messages[0]?.role === 'assistant';

  return (
    <div className={`oscar-ai-assistant-shell ${isOpen ? 'is-open' : ''}`}>
      {!isOpen ? (
        <button
          type="button"
          className="oscar-ai-launcher"
          onClick={() => setIsOpen(true)}
          aria-label={copy.launcher}
          aria-expanded={isOpen}
        >
          <span className="oscar-ai-launcher-ring" aria-hidden="true" />
          <span className="oscar-ai-launcher-tooltip">{copy.launcher}</span>
          <span className="oscar-ai-launcher-icon" aria-hidden="true">
            <img
              src={oscarAssistantIcon}
              alt=""
              className="oscar-ai-launcher-image"
              loading="eager"
              decoding="async"
            />
          </span>
        </button>
      ) : (
        <section
          className="oscar-ai-panel"
          role="dialog"
          aria-modal="false"
          aria-label={copy.title}
          dir={uiLanguage === 'ar' ? 'rtl' : 'ltr'}
        >
          <header className="oscar-ai-header">
            <div className="flex min-w-0 items-center gap-3">
              <span className="oscar-ai-header-icon" aria-hidden="true">
                <img src={oscarAssistantIcon} alt="" className="oscar-ai-brand-avatar" loading="lazy" decoding="async" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-[var(--color-text)]">{copy.title}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] shadow-[0_0_12px_rgb(var(--color-success-rgb)/0.72)]" />
                  {copy.online}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <CompactIconButton label={copy.clear} onClick={handleClearChat}>
                <Trash2 className="h-4 w-4" />
              </CompactIconButton>
              <CompactIconButton label={copy.close} onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </CompactIconButton>
            </div>
          </header>

          {isClearConfirmOpen ? (
            <div
              className="oscar-ai-confirm-layer"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  handleCancelClearChat();
                }
              }}
            >
              <div
                className="oscar-ai-confirm-card"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="oscar-ai-clear-title"
                aria-describedby="oscar-ai-clear-description"
              >
                <div className="oscar-ai-confirm-icon" aria-hidden="true">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 id="oscar-ai-clear-title">{copy.clearConfirmTitle}</h3>
                  <p id="oscar-ai-clear-description">{copy.clearConfirmMessage}</p>
                </div>
                <div className="oscar-ai-confirm-actions">
                  <button type="button" className="oscar-ai-confirm-cancel" onClick={handleCancelClearChat}>
                    {copy.clearCancel}
                  </button>
                  <button type="button" className="oscar-ai-confirm-delete" onClick={handleConfirmClearChat}>
                    {copy.clearConfirmAction}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="oscar-ai-context-strip" aria-hidden="true">
            <span><Search className="h-3.5 w-3.5" /> {uiLanguage === 'ar' ? 'بحث منتجات' : 'Product search'}</span>
            <span><Clock3 className="h-3.5 w-3.5" /> {uiLanguage === 'ar' ? 'تتبع طلب' : 'Order tracking'}</span>
            <span><CreditCard className="h-3.5 w-3.5" /> {uiLanguage === 'ar' ? 'طرق الدفع' : 'Payments'}</span>
          </div>

          <div className="oscar-ai-messages" role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                language={uiLanguage}
                onAction={handleAction}
                onProductOpen={handleProductOpen}
                onSuggestedQuestion={handleSuggestedQuestion}
                isAuthenticated={isAuthenticated}
              />
            ))}
            {isTyping ? <TypingIndicator language={uiLanguage} /> : null}
            <div ref={messagesEndRef} />
          </div>

          {hasOnlyWelcome ? (
            <div className="oscar-ai-prompts">
              {copy.quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={(event) => handleSubmitMessage(event, prompt)}
                  className="oscar-ai-prompt"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <form className="oscar-ai-composer" onSubmit={handleSubmitMessage}>
            <label className="sr-only" htmlFor="oscar-ai-message-input">{copy.placeholder}</label>
            <textarea
              id="oscar-ai-message-input"
              ref={inputRef}
              rows={1}
              value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmitMessage(event);
                }
              }}
              placeholder={copy.placeholder}
              className="oscar-ai-input"
              disabled={isTyping || isLoading}
            />
            <button
              type="submit"
              className="oscar-ai-send"
              disabled={!inputValue.trim() || isTyping || isLoading}
              aria-label={copy.send}
              title={copy.send}
            >
              {isTyping || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>

          <div className="oscar-ai-footer-note">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{copy.subtitle}</span>
          </div>
        </section>
      )}
    </div>
  );
};

export default OscarAIAssistant;
