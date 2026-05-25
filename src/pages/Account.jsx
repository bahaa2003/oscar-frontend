import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Eye, EyeOff, KeyRound, Mail, Phone, Save, ShieldCheck, User, UserCircle2, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { inputBaseClassName } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import SaveChangesBar from '../components/account/SaveChangesBar';
import useAuthStore from '../store/useAuthStore';
import useAdminStore from '../store/useAdminStore';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/ui/Toast';
import { resolveUserAvatar } from '../utils/avatar';
import { getReadableErrorMessage } from '../utils/errorMessages';

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9 ()-]{7,20}$/;
const usernameRegex = /^[a-zA-Z0-9_.-]{3,30}$/;

const getProfileFromUser = (user) => {
  const fullName = String(user?.name || '').trim();
  const username = String(user?.username || '').trim();
  const email = String(user?.email || '').trim().toLowerCase();
  const phone = String(user?.phone || '').trim();
  const avatar = String(user?.avatar || '').trim();

  return { fullName, username, email, phone, avatar };
};

const Account = () => {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const passwordSectionRef = useRef(null);

  const { user, updateUserSession } = useAuthStore();
  const { updateUserProfile, updateUserAvatar } = useAdminStore();
  const { addToast } = useToast();
  const { language } = useLanguage();

  const isEnglish = language === 'en';
  const text = useMemo(
    () =>
      isEnglish
        ? {
            pageTitle: 'My Account',
            pageSubtitle: 'View and manage your personal details and security preferences',
            activeAccount: 'Active account',
            changePhoto: 'Change image',
            removePhoto: 'Remove image',
            imageHint: 'Supported: JPG, JPEG, PNG, WEBP (max 2MB)',
            personalInfo: 'Personal Info',
            fullName: 'Full name',
            username: 'Username (optional)',
            contactInfo: 'Contact Info',
            emailAddress: 'Email address',
            phoneNumber: 'Phone number',
            emailVerified: 'Email verified',
            emailNotVerified: 'Email not verified',
            email2faHint: 'Email is used for two-factor verification.',
            passwordCard: 'Change Password',
            currentPassword: 'Current password',
            newPassword: 'New password',
            confirmPassword: 'Confirm new password',
            passwordHint: 'Use at least 8 characters including uppercase, lowercase, and a number.',
            saveLabel: 'Save changes',
            cancelLabel: 'Cancel',
            dirtyHint: 'You have unsaved changes.',
            cleanHint: 'Everything is saved.',
            saveSuccess: 'Account changes saved successfully.',
            saveError: 'Could not save account changes.',
            unsavedAlert: 'You have pending edits. Save or cancel before leaving this page.',
            loading: 'Loading account data...',
            validationRequired: 'This field is required.',
            validationNameMin: 'Name must be at least 3 characters.',
            validationNameMax: 'Name must be no more than 60 characters.',
            validationUsername: 'Username must be 3-30 chars, letters/numbers/._- only.',
            validationEmail: 'Enter a valid email format.',
            validationPhone: 'Enter a valid phone number.',
            validationCurrentPassword: 'Current password is required to change password.',
            validationPasswordLength: 'New password must be at least 8 characters.',
            validationPasswordPattern: 'Password must include uppercase, lowercase, and a number.',
            validationPasswordMatch: 'Confirmation password does not match.',
            invalidImageType: 'Invalid image type. Use JPG, JPEG, PNG, or WEBP.',
            invalidImageSize: 'Image size must be 2MB or less.',
            securityTitle: 'Security',
            profileTitle: 'Profile'
          }
        : {
            pageTitle: 'حسابي',
            pageSubtitle: 'عرض وتعديل بياناتك الشخصية وإعدادات الأمان',
            activeAccount: 'حساب نشط',
            changePhoto: 'تغيير الصورة',
            removePhoto: 'إزالة الصورة',
            imageHint: 'الصيغ المدعومة: JPG, JPEG, PNG, WEBP (بحد أقصى 2MB)',
            personalInfo: 'البيانات الشخصية',
            fullName: 'الاسم الكامل',
            username: 'اسم العرض (اختياري)',
            contactInfo: 'بيانات التواصل',
            emailAddress: 'البريد الإلكتروني',
            phoneNumber: 'رقم الهاتف',
            emailVerified: 'البريد موثّق',
            emailNotVerified: 'البريد غير موثّق',
            email2faHint: 'يُستخدم البريد الإلكتروني للتحقق في المصادقة الثنائية.',
            passwordCard: 'تغيير كلمة المرور',
            currentPassword: 'كلمة المرور الحالية',
            newPassword: 'كلمة المرور الجديدة',
            confirmPassword: 'تأكيد كلمة المرور الجديدة',
            passwordHint: 'استخدم 8 أحرف على الأقل تتضمن حرفًا كبيرًا وصغيرًا ورقمًا.',
            saveLabel: 'حفظ التعديلات',
            cancelLabel: 'إلغاء',
            dirtyHint: 'لديك تغييرات غير محفوظة.',
            cleanHint: 'كل التعديلات محفوظة.',
            saveSuccess: 'تم حفظ تعديلات الحساب بنجاح.',
            saveError: 'تعذّر حفظ تعديلات الحساب.',
            unsavedAlert: 'لديك تعديلات معلّقة. احفظها أو ألغها قبل مغادرة الصفحة.',
            loading: 'جاري تحميل بيانات الحساب...',
            validationRequired: 'هذا الحقل مطلوب.',
            validationNameMin: 'الاسم يجب أن يكون 3 أحرف على الأقل.',
            validationNameMax: 'الاسم يجب ألا يتجاوز 60 حرفًا.',
            validationUsername: 'اسم العرض يجب أن يكون 3-30 حرفًا ويقبل الأحرف والأرقام و . _ - فقط.',
            validationEmail: 'أدخل بريدًا إلكترونيًا بصيغة صحيحة.',
            validationPhone: 'أدخل رقم هاتف بصيغة صحيحة.',
            validationCurrentPassword: 'كلمة المرور الحالية مطلوبة لتغيير كلمة المرور.',
            validationPasswordLength: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.',
            validationPasswordPattern: 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم.',
            validationPasswordMatch: 'تأكيد كلمة المرور غير مطابق.',
            invalidImageType: 'نوع الصورة غير صالح. استخدم JPG أو JPEG أو PNG أو WEBP.',
            invalidImageSize: 'حجم الصورة يجب ألا يتجاوز 2MB.',
            securityTitle: 'الأمان',
            profileTitle: 'الملف الشخصي'
          },
    [isEnglish]
  );

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState({ type: 'idle', message: '' });
  const [errors, setErrors] = useState({});

  const [savedProfile, setSavedProfile] = useState(() => getProfileFromUser(user));
  const [form, setForm] = useState(() => ({
    ...getProfileFromUser(user),
    avatarPreview: String(user?.avatar || '').trim(),
    avatarFile: null,
    avatarAction: 'keep'
  }));
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });

  useEffect(() => {
    const initialProfile = getProfileFromUser(user);
    setSavedProfile(initialProfile);
    setForm({
      ...initialProfile,
      avatarPreview: initialProfile.avatar,
      avatarFile: null,
      avatarAction: 'keep'
    });
    setPasswordForm({ current: '', next: '', confirm: '' });
    setErrors({});
    setSaveState({ type: 'idle', message: '' });

    const timer = setTimeout(() => setIsInitialLoading(false), 350);
    return () => clearTimeout(timer);
  }, [user?.id, user?.name, user?.email, user?.avatar, user?.phone, user?.username]);

  useEffect(() => {
    if (!location.hash) return;
    const sectionMap = {
      '#password': passwordSectionRef.current
    };

    const target = sectionMap[location.hash];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const avatarIdentity = form.fullName || savedProfile.fullName || form.username || savedProfile.username || form.email || savedProfile.email || 'OSCAR User';
  const fallbackAvatar = resolveUserAvatar({ name: avatarIdentity, avatar: '' }, avatarIdentity);
  const displayedAvatar =
    form.avatarAction === 'remove'
      ? fallbackAvatar
      : resolveUserAvatar(form.avatarPreview || savedProfile.avatar, avatarIdentity);

  const hasAvatarChanges = form.avatarAction !== 'keep';
  const hasPersonalInfoChanges =
    form.fullName.trim() !== savedProfile.fullName ||
    form.username.trim() !== savedProfile.username;
  const hasProfileChanges =
    hasPersonalInfoChanges ||
    form.email.trim().toLowerCase() !== savedProfile.email ||
    form.phone.trim() !== savedProfile.phone ||
    hasAvatarChanges;
  const hasPasswordChanges = Boolean(passwordForm.current || passwordForm.next || passwordForm.confirm);
  const isDirty = hasProfileChanges || hasPasswordChanges;

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type.toLowerCase())) {
      setErrors((prev) => ({ ...prev, avatar: text.invalidImageType }));
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, avatar: text.invalidImageSize }));
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, avatarPreview: nextPreview, avatarFile: file, avatarAction: 'update' }));
    setErrors((prev) => ({ ...prev, avatar: '' }));
  };

  const handleRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, avatarPreview: '', avatarFile: null, avatarAction: 'remove' }));
    setErrors((prev) => ({ ...prev, avatar: '' }));
  };

  const handleCancel = () => {
    setForm({
      ...savedProfile,
      avatarPreview: savedProfile.avatar,
      avatarFile: null,
      avatarAction: 'keep'
    });
    setPasswordForm({ current: '', next: '', confirm: '' });
    setErrors({});
    setSaveState({ type: 'idle', message: '' });
  };

  const validateForm = () => {
    const validationErrors = {};
    const fullName = form.fullName.trim();
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!fullName) validationErrors.fullName = text.validationRequired;
    else if (fullName.length < 3) validationErrors.fullName = text.validationNameMin;
    else if (fullName.length > 60) validationErrors.fullName = text.validationNameMax;

    if (username && !usernameRegex.test(username)) {
      validationErrors.username = text.validationUsername;
    }

    if (!email) validationErrors.email = text.validationRequired;
    else if (!emailRegex.test(email)) validationErrors.email = text.validationEmail;

    if (phone && !phoneRegex.test(phone)) validationErrors.phone = text.validationPhone;

    const wantsPasswordChange = Boolean(passwordForm.current || passwordForm.next || passwordForm.confirm);
    if (wantsPasswordChange) {
      if (!passwordForm.current) validationErrors.currentPassword = text.validationCurrentPassword;
      if (!passwordForm.next) validationErrors.nextPassword = text.validationRequired;
      else if (passwordForm.next.length < 8) validationErrors.nextPassword = text.validationPasswordLength;
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.next)) {
        validationErrors.nextPassword = text.validationPasswordPattern;
      }

      if (passwordForm.confirm !== passwordForm.next) {
        validationErrors.confirmPassword = text.validationPasswordMatch;
      }
    }

    return validationErrors;
  };

  const validatePersonalInfo = () => {
    const validationErrors = {};
    const fullName = form.fullName.trim();
    const username = form.username.trim();

    if (!fullName) validationErrors.fullName = text.validationRequired;
    else if (fullName.length < 3) validationErrors.fullName = text.validationNameMin;
    else if (fullName.length > 60) validationErrors.fullName = text.validationNameMax;

    if (username && !usernameRegex.test(username)) {
      validationErrors.username = text.validationUsername;
    }

    return validationErrors;
  };

  const handleSavePersonalInfo = async () => {
    if (!user?.id) return;

    const validationErrors = validatePersonalInfo();
    setErrors((prev) => ({
      ...prev,
      fullName: validationErrors.fullName || '',
      username: validationErrors.username || '',
    }));

    if (Object.keys(validationErrors).length > 0) {
      setSaveState({ type: 'error', message: text.saveError });
      addToast(text.saveError, 'error');
      return;
    }

    setIsSaving(true);
    setSaveState({ type: 'saving', message: '' });

    const trimmedProfile = {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
    };

    try {
      const profilePayload = {
        name: trimmedProfile.fullName,
        username: trimmedProfile.username,
      };

      await updateUserProfile(user.id, profilePayload, user);

      updateUserSession({
        name: profilePayload.name,
        username: profilePayload.username,
      });

      setSavedProfile((prev) => ({
        ...prev,
        fullName: trimmedProfile.fullName,
        username: trimmedProfile.username,
      }));
      setForm((prev) => ({
        ...prev,
        fullName: trimmedProfile.fullName,
        username: trimmedProfile.username,
      }));
      setErrors((prev) => ({ ...prev, fullName: '', username: '' }));
      setSaveState({ type: 'success', message: text.saveSuccess });
      addToast(text.saveSuccess, 'success');
    } catch (error) {
      const message = getReadableErrorMessage(error, text.saveError, { language });
      setSaveState({ type: 'error', message });
      addToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSaveState({ type: 'error', message: text.saveError });
      addToast(text.saveError, 'error');
      return;
    }

    setIsSaving(true);
    setSaveState({ type: 'saving', message: '' });

    const trimmedProfile = {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim()
    };

    try {
      const profilePayload = {
        name: trimmedProfile.fullName,
        email: trimmedProfile.email,
        username: trimmedProfile.username,
        phone: trimmedProfile.phone
      };

      if (passwordForm.next) {
        profilePayload.password = passwordForm.next;
      }

      if (hasAvatarChanges) {
        // Send File object for upload, or null for removal
        const avatarPayload = form.avatarAction === 'remove' ? null : form.avatarFile;
        await updateUserAvatar(user.id, avatarPayload, user);
      }

      await updateUserProfile(user.id, profilePayload, user);

      const nextAvatarValue = hasAvatarChanges
        ? form.avatarAction === 'remove'
          ? ''
          : form.avatarPreview
        : savedProfile.avatar;

      updateUserSession({
        name: profilePayload.name,
        email: profilePayload.email,
        username: profilePayload.username,
        phone: profilePayload.phone,
        avatar: nextAvatarValue
      });

      const nextSaved = {
        fullName: trimmedProfile.fullName,
        username: trimmedProfile.username,
        email: trimmedProfile.email,
        phone: trimmedProfile.phone,
        avatar: nextAvatarValue
      };

      setSavedProfile(nextSaved);
      setForm({
        ...nextSaved,
        avatarPreview: nextSaved.avatar,
        avatarFile: null,
        avatarAction: 'keep'
      });
      setPasswordForm({ current: '', next: '', confirm: '' });
      setErrors({});
      setSaveState({ type: 'success', message: text.saveSuccess });
      addToast(text.saveSuccess, 'success');
    } catch (error) {
      const message = getReadableErrorMessage(error, text.saveError, { language });
      setSaveState({ type: 'error', message });
      addToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (isInitialLoading) {
    return (
      <div className="compact-ui mx-auto max-w-5xl space-y-3">
        <div className="h-11 animate-pulse rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.9)]" />
        <div className="h-40 animate-pulse rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.9)]" />
        <div className="h-48 animate-pulse rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.9)]" />
      </div>
    );
  }

  const emailVerified = Boolean(user?.emailVerified ?? true);

  return (
    <div className="compact-ui mx-auto max-w-5xl space-y-3 pb-20">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-3 shadow-[var(--shadow-subtle)] backdrop-blur-md sm:p-4"
      >
        <h1 className="text-xl font-bold text-[var(--color-text)]">{text.pageTitle}</h1>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{text.pageSubtitle}</p>
      </motion.header>

      {isDirty ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-200">
          {text.unsavedAlert}
        </div>
      ) : null}

      {saveState.message ? (
        <div
          className={`rounded-xl border p-2.5 text-xs ${
            saveState.type === 'success'
              ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              : saveState.type === 'error'
                ? 'border-rose-400/25 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                : 'border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.88)] text-[var(--color-text-secondary)]'
          }`}
        >
          {saveState.message}
        </div>
      ) : null}

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
              <UserCircle2 className="h-4 w-4 text-[var(--color-primary)]" />
              {text.profileTitle}
            </h2>
            <Badge variant="success">{text.activeAccount}</Badge>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <img
              src={displayedAvatar}
              alt={form.fullName || text.pageTitle}
              className="h-16 w-16 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.68)] object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-[var(--color-text)]">{form.fullName || '---'}</p>
              <p className="truncate text-xs text-[var(--color-text-secondary)]">{form.email || '---'}</p>
              <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">{text.imageHint}</p>
              {errors.avatar ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{errors.avatar}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4" />
                {text.changePhoto}
              </Button>
              {(form.avatarPreview || savedProfile.avatar) ? (
                <Button type="button" variant="outline" onClick={handleRemoveAvatar}>
                  <X className="h-4 w-4" />
                  {text.removePhoto}
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-3 sm:p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <User className="h-4 w-4 text-[var(--color-primary)]" />
            {text.personalInfo}
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              label={text.fullName}
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              error={errors.fullName}
              placeholder={isEnglish ? 'Enter full name' : 'أدخل الاسم الكامل'}
            />
            <Input
              label={text.username}
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              error={errors.username}
              placeholder={isEnglish ? 'Optional username' : 'اسم عرض اختياري'}
            />
          </div>
        </Card>
        <div className="mt-2.5 flex justify-end">
          <button
            type="button"
            onClick={handleSavePersonalInfo}
            disabled={isSaving || !hasPersonalInfoChanges}
            className="inline-flex h-9 min-w-[8rem] items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 text-xs font-bold text-[var(--color-button-text)] shadow-[0_10px_24px_-14px_rgb(var(--color-primary-rgb)/0.9)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (isEnglish ? 'Saving...' : 'جاري الحفظ...') : text.saveLabel}
          </button>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
              <Mail className="h-4 w-4 text-[var(--color-primary)]" />
              {text.contactInfo}
            </h2>
            <Badge variant={emailVerified ? 'success' : 'warning'}>
              {emailVerified ? text.emailVerified : text.emailNotVerified}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              label={text.emailAddress}
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              error={errors.email}
              placeholder={isEnglish ? 'name@example.com' : 'name@example.com'}
            />
            <Input
              label={text.phoneNumber}
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              error={errors.phone}
              placeholder={isEnglish ? '+1 555 123 4567' : '+20 100 123 4567'}
            />
          </div>
          <p className="mt-2.5 text-[11px] text-[var(--color-muted)]">{text.email2faHint}</p>
        </Card>
      </motion.section>

      <motion.section ref={passwordSectionRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-3 sm:p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <KeyRound className="h-4 w-4 text-[var(--color-primary)]" />
            {text.passwordCard}
          </h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { key: 'current', label: text.currentPassword, error: errors.currentPassword },
              { key: 'next', label: text.newPassword, error: errors.nextPassword },
              { key: 'confirm', label: text.confirmPassword, error: errors.confirmPassword }
            ].map((item) => (
              <div key={item.key}>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">{item.label}</label>
                <div className="relative">
                  <input
                    type={showPassword[item.key] ? 'text' : 'password'}
                    value={passwordForm[item.key]}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, [item.key]: event.target.value }))}
                    className={`${inputBaseClassName} pl-10 ${
                      item.error
                        ? 'border-[color:rgb(var(--color-error-rgb)/0.85)] focus:border-[color:rgb(var(--color-error-rgb)/0.8)] focus:ring-[color:rgb(var(--color-error-rgb)/0.16)]'
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key]
                      }))
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  >
                    {showPassword[item.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {item.error ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{item.error}</p> : null}
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-[var(--color-muted)]">{text.passwordHint}</p>
        </Card>
      </motion.section>

      <SaveChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={handleCancel}
        saveLabel={text.saveLabel}
        cancelLabel={text.cancelLabel}
        dirtyHint={text.dirtyHint}
        cleanHint={text.cleanHint}
      />

      <div className="h-3" />
      <div className="hidden items-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5" />
        <Mail className="h-3.5 w-3.5" />
        <Phone className="h-3.5 w-3.5" />
        <Save className="h-3.5 w-3.5" />
      </div>
    </div>
  );
};

export default Account;
