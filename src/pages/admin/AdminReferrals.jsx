import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Eye,
  ImagePlus,
  Percent,
  Plus,
  Save,
  Search,
  Share2,
  TrendingUp,
  Trash2,
  UserRoundPlus,
  UsersRound,
  Wallet,
  XCircle,
} from 'lucide-react';
import useAdminStore from '../../store/useAdminStore';
import useGroupStore from '../../store/useGroupStore';
import useResellerApplicationStore from '../../store/useResellerApplicationStore';
import { resolveUserAvatar } from '../../utils/avatar';
import { useLanguage } from '../../context/LanguageContext';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import apiClient from '../../services/client';

const IS_REAL_DATA_PROVIDER = String(import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase() === 'real';
const EMPTY_ADMIN_REFERRAL_DASHBOARD = {
  summary: {
    owners: 0,
    invited: 0,
    deposits: 0,
    earnings: 0,
    withdrawn: 0,
    currency: 'EGP',
    commissionRatePercent: 0,
  },
  owners: [],
};

const number = (value) => Number(value || 0) || 0;
const getReferrals = (user) => user?.referrals || user?.referredCustomers || user?.invitedCustomers || [];
const getWithdrawals = (user) => user?.referralWithdrawals || user?.withdrawalRequests || [];

const normalizeOwner = (user, index) => {
  const referrals = (Array.isArray(getReferrals(user)) ? getReferrals(user) : []).map((entry, referralIndex) => ({
    id: entry?.id || entry?._id || `${user?.id || index}-${referralIndex}`,
    name: entry?.name || entry?.username || entry?.email || '',
    email: entry?.email || '',
    avatar: resolveUserAvatar(entry, entry?.email || entry?.name),
    addedAmount: number(entry?.addedAmount ?? entry?.totalDeposits ?? entry?.depositsTotal ?? entry?.topupTotal),
    earnings: number(entry?.earnings ?? entry?.referralEarnings ?? entry?.commission),
    invitedAt: entry?.invitedAt || entry?.referralCreatedAt || entry?.joinedAt || entry?.createdAt,
  }));
  const withdrawals = Array.isArray(getWithdrawals(user)) ? getWithdrawals(user) : [];
  const referralsEarnings = referrals.reduce((total, entry) => total + entry.earnings, 0);
  const withdrawn = withdrawals
    .filter((entry) => String(entry?.status || '').toLowerCase() === 'completed')
    .reduce((total, entry) => total + number(entry?.amount), 0);

  return {
    id: user?.id || user?._id || `owner-${index}`,
    name: user?.name || user?.username || user?.email || '',
    email: user?.email || '',
    avatar: resolveUserAvatar(user, user?.email || user?.name),
    code: user?.referralCode || user?.inviteCode || 'â€”',
    currency: String(user?.currency || 'EGP').toUpperCase(),
    referrals,
    withdrawals,
    earnings: number(user?.earnings ?? user?.referralRewards ?? user?.referralEarnings ?? referralsEarnings),
    withdrawn: number(user?.withdrawn ?? withdrawn),
  };
};

const formatDate = (value, locale = 'ar-EG') => {
  if (!value) return 'â€”';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'â€”';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const AdminReferrals = () => {
  const { dir } = useLanguage();
  const isArabic = dir === 'rtl';
  const isRealReferralMode = IS_REAL_DATA_PROVIDER;
  const { addToast } = useToast();
  const { users, loadUsers, updateUserGroup } = useAdminStore();
  const { groups, loadGroups } = useGroupStore();
  const {
    adminApplications,
    isLoadingAdminApplications,
    isReviewingApplication,
    adminApplicationError,
    fetchAdminApplications,
    approveApplication,
    rejectApplication,
    suspendApplication,
    reactivateApplication,
  } = useResellerApplicationStore();
  const [query, setQuery] = useState('');
  const [activePanel, setActivePanel] = useState('earnings');
  const [filter, setFilter] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [newMethodName, setNewMethodName] = useState('');
  const [adminReferralDashboard, setAdminReferralDashboard] = useState(EMPTY_ADMIN_REFERRAL_DASHBOARD);
  const [isLoadingAdminReferralDashboard, setIsLoadingAdminReferralDashboard] = useState(false);
  const [adminReferralDashboardError, setAdminReferralDashboardError] = useState('');
  const [withdrawalMethods, setWithdrawalMethods] = useState([]);
  const [requestOverrides, setRequestOverrides] = useState({});
  const [agentRequests, setAgentRequests] = useState([]);
  const [agentGroupSelections, setAgentGroupSelections] = useState({});
  const [localRequests, setLocalRequests] = useState([]);
  const [adminPayouts, setAdminPayouts] = useState([]);
  const [isLoadingAdminPayouts, setIsLoadingAdminPayouts] = useState(false);
  const [adminPayoutError, setAdminPayoutError] = useState('');
  const [processingAdminPayoutId, setProcessingAdminPayoutId] = useState('');
  const [commissionRate, setCommissionRate] = useState(0);

  const loadAdminReferralDashboard = useCallback(async () => {
    if (!isRealReferralMode) {
      setAdminReferralDashboard(EMPTY_ADMIN_REFERRAL_DASHBOARD);
      setCommissionRate(0);
      return;
    }

    setIsLoadingAdminReferralDashboard(true);
    setAdminReferralDashboardError('');
    try {
      const result = await apiClient.adminReferralDashboard.get();
      const dashboard = {
        summary: {
          ...EMPTY_ADMIN_REFERRAL_DASHBOARD.summary,
          ...(result?.summary || {}),
        },
        owners: Array.isArray(result?.owners) ? result.owners : [],
      };
      setAdminReferralDashboard(dashboard);
      setCommissionRate(number(dashboard.summary.commissionRatePercent));
    } catch (error) {
      setAdminReferralDashboard(EMPTY_ADMIN_REFERRAL_DASHBOARD);
      setCommissionRate(0);
      setAdminReferralDashboardError(error?.message || (isArabic ? 'ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¥Ø­Ø§Ù„Ø©.' : 'Could not load referral data.'));
    } finally {
      setIsLoadingAdminReferralDashboard(false);
    }
  }, [isArabic, isRealReferralMode]);

  const loadAdminPayouts = useCallback(async () => {
    if (!isRealReferralMode) return;
    setIsLoadingAdminPayouts(true);
    setAdminPayoutError('');
    try {
      const result = await apiClient.adminReferralPayouts.list({ page: 1, limit: 50 });
      const items = Array.isArray(result?.items) ? result.items : (Array.isArray(result) ? result : []);
      setAdminPayouts(items);
    } catch (error) {
      setAdminPayoutError(error?.message || (isArabic ? 'ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø³Ø­Ø¨.' : 'Could not load payout requests.'));
    } finally {
      setIsLoadingAdminPayouts(false);
    }
  }, [isArabic, isRealReferralMode]);

  useEffect(() => {
    if (!isRealReferralMode) loadUsers().catch(() => {});
    loadGroups({ force: true }).catch(() => {});
  }, [isRealReferralMode, loadGroups, loadUsers]);

  useEffect(() => {
    loadAdminReferralDashboard();
  }, [loadAdminReferralDashboard]);

  useEffect(() => {
    loadAdminPayouts();
  }, [loadAdminPayouts]);

  useEffect(() => {
    if (!isRealReferralMode || activePanel !== 'agents') return;
    fetchAdminApplications({ page: 1, limit: 50 }).catch(() => {});
  }, [activePanel, fetchAdminApplications, isRealReferralMode]);

  const persistAgentRequests = (nextRequests) => {
    setAgentRequests(nextRequests);
  };

  const updateAgentRequestStatus = async (request, status) => {
    if (isRealReferralMode && request?.isServer) {
      try {
        if (status === 'approved') {
          const selectedGroupId = agentGroupSelections[request.id];
          if (!selectedGroupId) {
            addToast(isArabic ? 'Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã™â€¦Ã˜Â¬Ã™â€¦Ã™Ë†Ã˜Â¹Ã˜Â© Ã˜Â§Ã™â€žÃ™Ë†Ã™Æ’Ã™â€žÃ˜Â§Ã˜Â¡ Ã˜Â§Ã™â€žÃ˜Â¬Ã˜Â¯Ã™Å Ã˜Â¯Ã˜Â© Ã˜Â£Ã™Ë†Ã™â€žÃ™â€¹Ã˜Â§.' : 'Choose the new agent group first.', 'error');
            return;
          }
          await approveApplication(request.id, { assignedGroupId: selectedGroupId });
        } else if (status === 'rejected') {
          const reason = window.prompt(isArabic ? 'Ã˜Â³Ã˜Â¨Ã˜Â¨ Ã˜Â±Ã™ÂÃ˜Â¶ Ã˜Â·Ã™â€žÃ˜Â¨ Ã˜Â§Ã™â€žÃ™Ë†Ã™Æ’Ã™Å Ã™â€ž' : 'Reason for rejecting this application');
          if (!reason || !reason.trim()) return;
          await rejectApplication(request.id, { rejectionReason: reason.trim() });
        } else if (status === 'suspended') {
          const reason = window.prompt(isArabic ? 'Ã˜Â³Ã˜Â¨Ã˜Â¨ Ã˜ÂªÃ˜Â¹Ã™â€žÃ™Å Ã™â€š Ã˜Â§Ã™â€žÃ™Ë†Ã™Æ’Ã™Å Ã™â€ž' : 'Reason for suspending this reseller');
          if (!reason || !reason.trim()) return;
          await suspendApplication(request.id, { suspensionReason: reason.trim() });
        } else if (status === 'reactivated') {
          await reactivateApplication(request.id, { assignedGroupId: agentGroupSelections[request.id] || undefined });
        }
        addToast(isArabic ? 'Ã˜ÂªÃ™â€¦ Ã˜ÂªÃ˜Â­Ã˜Â¯Ã™Å Ã˜Â« Ã˜Â·Ã™â€žÃ˜Â¨ Ã˜Â§Ã™â€žÃ™Ë†Ã™Æ’Ã™Å Ã™â€ž.' : 'Reseller application updated.', 'success');
      } catch (error) {
        addToast(error?.message || (isArabic ? 'Ã˜ÂªÃ˜Â¹Ã˜Â°Ã˜Â± Ã˜ÂªÃ˜Â­Ã˜Â¯Ã™Å Ã˜Â« Ã˜Â§Ã™â€žÃ˜Â·Ã™â€žÃ˜Â¨.' : 'Could not update the application.'), 'error');
      }
      return;
    }
    if (status === 'approved') {
      const selectedGroupId = agentGroupSelections[request.id];
      const selectedGroup = groups.find((group) => String(group.id || group._id) === String(selectedGroupId));
      if (!selectedGroup) {
        addToast(isArabic ? 'Ø§Ø®ØªØ± Ù…Ø¬Ù…ÙˆØ¹Ø© Ø§Ù„ÙˆÙƒÙ„Ø§Ø¡ Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© Ø£ÙˆÙ„Ù‹Ø§.' : 'Choose the new agent group first.', 'error');
        return;
      }
      const matchedUser = users.find((entry) => String(entry.email || '').toLowerCase() === String(request.email || '').toLowerCase());
      if (matchedUser) await updateUserGroup(matchedUser.id || matchedUser._id, selectedGroup);
    }
    persistAgentRequests(agentRequests.map((entry) => entry.id === request.id ? { ...entry, status, reviewedAt: new Date().toISOString() } : entry));
    window.dispatchEvent(new CustomEvent('sub-agent-status-updated', { detail: { email: request.email, status } }));
    addToast(status === 'approved' ? (isArabic ? 'ØªÙ… Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ø·Ù„Ø¨ ÙˆØªØºÙŠÙŠØ± Ù…Ø¬Ù…ÙˆØ¹Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù….' : 'Request approved and user group updated.') : (isArabic ? 'ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨.' : 'Request rejected.'), status === 'approved' ? 'success' : 'warning');
  };

  const owners = useMemo(() => (Array.isArray(adminReferralDashboard?.owners) ? adminReferralDashboard.owners : [])
    .map(normalizeOwner)
    .filter((owner) => owner.id), [adminReferralDashboard]);

  const saveCommissionRate = () => {
    addToast(
      isArabic
        ? 'Ù†Ø³Ø¨Ø© Ø§Ù„Ø¥Ø­Ø§Ù„Ø© ØªÙÙ‚Ø±Ø£ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø³ÙŠØ±ÙØ±.'
        : 'Referral rate is read from server configuration.',
      'warning'
    );
  };

  const persistMethods = (nextMethods) => {
    setWithdrawalMethods(Array.isArray(nextMethods) ? nextMethods : []);
  };
  const addWithdrawalMethod = () => {
    setNewMethodName('');
    addToast(isArabic ? 'Ù„Ø§ ÙŠÙˆØ¬Ø¯ API Ù„Ø¥Ø¶Ø§ÙØ© Ø·Ø±Ù‚ Ø³Ø­Ø¨ Ø§Ù„Ø¥Ø­Ø§Ù„Ø© Ù…Ù† Ù‡Ø°Ù‡ Ø§Ù„ØµÙØ­Ø©.' : 'No referral withdrawal-method API is available on this page.', 'warning');
  };
  const updateRequest = (request, updates) => {
    if (isRealReferralMode && request?.isServer) {
      if (updates?.status === 'failed') {
        handleAdminRejectPayout(request);
      } else if (updates?.status === 'completed') {
        handleAdminSettlePayout(request);
      }
      return;
    }
    const next = { ...request, ...updates };
    setRequestOverrides((current) => ({ ...current, [request.id]: next }));
    if (request.isLocal) {
      const nextRequests = localRequests.map((entry) => entry.id === request.id ? next : entry);
      setLocalRequests(nextRequests);
    }
  };
  const attachReceipt = (request, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateRequest(request, { receiptImage: reader.result });
    reader.readAsDataURL(file);
  };
  const copyRequestValue = async (value, label) => {
    const text = String(value || '').trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      addToast(isArabic ? `ØªÙ… Ù†Ø³Ø® ${label}` : `${label} copied`, 'success');
    } catch {
      addToast(isArabic ? 'ØªØ¹Ø°Ø± Ø§Ù„Ù†Ø³Ø®.' : 'Could not copy.', 'error');
    }
  };

  async function handleAdminRejectPayout(request) {
    if (!isRealReferralMode || !request?.id) return;
    const reason = window.prompt(isArabic ? 'Ø³Ø¨Ø¨ Ø±ÙØ¶ Ø·Ù„Ø¨ Ø§Ù„Ø³Ø­Ø¨' : 'Reason for rejecting this payout');
    if (!reason || !reason.trim()) return;
    setProcessingAdminPayoutId(request.id);
    try {
      await apiClient.adminReferralPayouts.reject(request.id, { rejectionReason: reason.trim() });
      await loadAdminPayouts();
      addToast(isArabic ? 'ØªÙ… Ø±ÙØ¶ Ø·Ù„Ø¨ Ø§Ù„Ø³Ø­Ø¨ ÙˆØ¥ØªØ§Ø­Ø© Ø§Ù„Ø¹Ù…ÙˆÙ„Ø§Øª Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.' : 'Payout rejected and commissions unlocked.', 'success');
    } catch (error) {
      addToast(error?.message || (isArabic ? 'ØªØ¹Ø°Ø± Ø±ÙØ¶ Ø·Ù„Ø¨ Ø§Ù„Ø³Ø­Ø¨.' : 'Could not reject payout request.'), 'error');
    } finally {
      setProcessingAdminPayoutId('');
    }
  }

  async function handleAdminSettlePayout(request) {
    if (!isRealReferralMode || !request?.id) return;
    const isManual = String(request.rawMethod || request.method || '').toUpperCase() === 'MANUAL';
    let externalReference = '';
    if (isManual) {
      externalReference = window.prompt(isArabic ? 'Ù…Ø±Ø¬Ø¹ Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ù„ÙŠØ¯ÙˆÙŠ' : 'Manual settlement reference') || '';
      if (!externalReference.trim()) return;
    } else if (!window.confirm(isArabic ? 'ØªØ£ÙƒÙŠØ¯ ØªØ­ÙˆÙŠÙ„ Ø·Ù„Ø¨ Ø§Ù„Ø³Ø­Ø¨ Ø¥Ù„Ù‰ Ù…Ø­ÙØ¸Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ØŸ' : 'Confirm wallet settlement for this payout?')) {
      return;
    }
    setProcessingAdminPayoutId(request.id);
    try {
      await apiClient.adminReferralPayouts.settle(request.id, {
        externalReference: externalReference.trim(),
        settlementNote: isManual ? 'Manual settlement recorded from admin referral dashboard' : '',
      });
      await loadAdminPayouts();
      addToast(isArabic ? 'ØªÙ… ØªØ³ÙˆÙŠØ© Ø·Ù„Ø¨ Ø§Ù„Ø³Ø­Ø¨.' : 'Payout settled.', 'success');
    } catch (error) {
      addToast(error?.message || (isArabic ? 'ØªØ¹Ø°Ø± ØªØ³ÙˆÙŠØ© Ø·Ù„Ø¨ Ø§Ù„Ø³Ø­Ø¨.' : 'Could not settle payout request.'), 'error');
    } finally {
      setProcessingAdminPayoutId('');
    }
  }

  const visibleOwners = useMemo(() => owners.filter((owner) => {
    const term = query.trim().toLowerCase();
    const matchesSearch = !term || `${owner.name} ${owner.email} ${owner.code}`.toLowerCase().includes(term);
    const matchesFilter = filter === 'all'
      || (filter === 'active' && owner.referrals.length > 0)
      || (filter === 'balance' && owner.earnings - owner.withdrawn > 0);
    return matchesSearch && matchesFilter;
  }), [owners, query, filter]);

  const stats = useMemo(() => ({
    owners: owners.length,
    invited: owners.reduce((sum, owner) => sum + owner.referrals.length, 0),
    deposits: owners.reduce((sum, owner) => sum + owner.referrals.reduce((total, referral) => total + referral.addedAmount, 0), 0),
    earnings: owners.reduce((sum, owner) => sum + owner.earnings, 0),
    withdrawn: owners.reduce((sum, owner) => sum + owner.withdrawn, 0),
  }), [owners]);

  const currency = owners[0]?.currency || 'EGP';
  const allWithdrawalRequests = useMemo(() => {
    if (isRealReferralMode) {
      return adminPayouts.map((payout) => {
        const rawStatus = String(payout.status || 'PENDING').toUpperCase();
        const rawMethod = String(payout.method || 'WALLET').toUpperCase();
        return {
          id: payout.id || payout._id,
          isServer: true,
          rawMethod,
          ownerName: payout.referrer?.name || '',
          ownerEmail: payout.referrer?.email || '',
          ownerAvatar: resolveUserAvatar(payout.referrer || {}, payout.referrer?.email || payout.referrer?.name),
          method: rawMethod === 'WALLET' ? 'wallet' : 'manual',
          methodName: rawMethod === 'WALLET' ? (isArabic ? 'Ù…Ø­ÙØ¸Ø© Ø§Ù„Ù…Ù†ØµØ©' : 'Platform wallet') : (isArabic ? 'ØªØ³ÙˆÙŠØ© ÙŠØ¯ÙˆÙŠØ©' : 'Manual settlement'),
          requestedAmount: Number(payout.amount || payout.amountUsd || 0) || 0,
          amount: Number(payout.amount || payout.amountUsd || 0) || 0,
          amountDisplay: String(payout.amount || payout.amountUsd || '0.00'),
          currency: payout.currency || 'USD',
          status: rawStatus === 'PAID' ? 'completed' : rawStatus === 'REJECTED' ? 'failed' : 'processing',
          createdAt: payout.requestedAt || payout.createdAt,
          completedAt: payout.paidAt || payout.rejectedAt || null,
          commissionCount: payout.commissionCount || payout.commissionIds?.length || 0,
          externalReference: payout.externalReference || '',
          receiptImage: rawStatus === 'PENDING' ? 'server-payout' : '',
        };
      });
    }
    return localRequests.map((request) => {
      const resolvedRequest = requestOverrides[request.id] || request;
      const methodSettings = withdrawalMethods.find((method) => method.id === resolvedRequest.method);
      const requestedAmount = number(resolvedRequest.requestedAmount ?? resolvedRequest.amount);
      const discountPercent = Math.min(100, Math.max(0, number(methodSettings?.discountPercent ?? resolvedRequest.discountPercent)));
      const discountAmount = Number(((requestedAmount * discountPercent) / 100).toFixed(2));
      const netAmount = Number(Math.max(0, requestedAmount - discountAmount).toFixed(2));
      return {
        ...resolvedRequest,
        requestedAmount,
        discountPercent,
        discountAmount,
        amount: netAmount,
      };
    });
  }, [adminPayouts, isArabic, isRealReferralMode, owners, localRequests, requestOverrides, withdrawalMethods]);
  const visibleAgentRequests = useMemo(() => {
    if (!isRealReferralMode) return agentRequests;
    return (adminApplications || []).map((application) => ({
      id: application.id || application._id,
      isServer: true,
      name: application.user?.name || application.businessName || '',
      email: application.user?.emailMasked || '',
      message: application.experienceSummary || '',
      proofImage: application.proofImage || application.customerProofImage || application.customerProofUrl || '',
      status: String(application.status || 'PENDING').toLowerCase(),
      createdAt: application.submittedAt || application.createdAt,
      assignedGroup: application.assignedGroup || null,
      rejectionReason: application.rejectionReason || null,
      suspensionReason: application.suspensionReason || null,
    }));
  }, [adminApplications, agentRequests, isArabic, isRealReferralMode]);
  const locale = isArabic ? 'ar-EG' : 'en-GB';
  const statCards = [
    { label: isArabic ? 'Ø£ØµØ­Ø§Ø¨ Ø£ÙƒÙˆØ§Ø¯ Ø§Ù„Ø¥Ø­Ø§Ù„Ø©' : 'Referral owners', value: stats.owners, icon: Share2, iconClass: 'bg-violet-500/10 text-violet-500' },
    { label: isArabic ? 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø¯Ø¹ÙˆÙŠÙ†' : 'Total invited', value: stats.invited, icon: UserRoundPlus, iconClass: 'bg-sky-500/10 text-sky-500' },
    { label: isArabic ? 'Ø¥ÙŠØ¯Ø§Ø¹Ø§Øª Ø§Ù„Ù…Ø¯Ø¹ÙˆÙŠÙ†' : 'Invited deposits', value: `${stats.deposits.toLocaleString('en-US')} ${currency}`, icon: Wallet, iconClass: 'bg-amber-500/10 text-amber-500' },
    { label: isArabic ? 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø£Ø±Ø¨Ø§Ø­' : 'Total earnings', value: `${stats.earnings.toLocaleString('en-US')} ${currency}`, icon: TrendingUp, iconClass: 'bg-emerald-500/10 text-emerald-500' },
  ];

  return (
    <div className="admin-referrals-page mx-auto w-full max-w-[1500px] space-y-3 pb-10" dir={dir}>
      <section className="relative isolate overflow-hidden rounded-xl border border-violet-300/20 bg-[linear-gradient(125deg,#24104f,#5b21b6_48%,#a21caf)] px-3 py-2.5 text-white shadow-[0_18px_45px_-35px_rgb(124_58_237/0.8)]">
        <div className="absolute -end-8 -top-12 h-28 w-28 rounded-full bg-fuchsia-400/20 blur-2xl" />
        <div className="relative block">
          <span className="absolute start-0 top-0 grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10"><BadgeDollarSign className="h-4 w-4" /></span>
          <div className="w-full px-10">
            <span className="block text-center text-[0.48rem] font-black text-violet-200">{isArabic ? 'Ø¥Ø¯Ø§Ø±Ø© Ù†Ø¸Ø§Ù… Ø§Ù„Ù…ÙƒØ§ÙØ¢Øª' : 'Rewards management'}</span>
            <div className="mx-auto mt-2 grid w-full max-w-md grid-cols-2 gap-1 rounded-xl border border-white/25 bg-black/18 p-1 backdrop-blur-md">
              <button type="button" onClick={() => setActivePanel('earnings')} aria-pressed={activePanel === 'earnings'} className={`flex h-9 items-center justify-center rounded-lg border px-2 text-[0.68rem] font-black transition-all sm:text-xs ${activePanel === 'earnings' ? 'border-white/85 bg-[linear-gradient(105deg,#ffffff,#e9d5ff)] text-violet-800' : 'border-transparent bg-white/5 text-white/72 hover:bg-white/12 hover:text-white'}`}>{isArabic ? 'Ø£Ø±Ø¨Ø§Ø­ ÙƒÙˆØ¯ Ø§Ù„Ø¥Ø­Ø§Ù„Ø©' : 'Referral code earnings'}</button>
              <button type="button" onClick={() => setActivePanel('agents')} aria-pressed={activePanel === 'agents'} className={`flex h-9 items-center justify-center gap-1 rounded-lg border px-2 text-[0.68rem] font-black transition-all sm:text-xs ${activePanel === 'agents' ? 'border-cyan-100/90 bg-[linear-gradient(105deg,#cffafe,#ddd6fe)] text-cyan-950' : 'border-transparent bg-white/5 text-white/72 hover:bg-white/12 hover:text-white'}`}><span>{isArabic ? 'Ø·Ù„Ø¨Ø§Øª Ø§Ù„ÙˆÙƒÙ„Ø§Ø¡ Ø§Ù„ÙØ±Ø¹ÙŠÙŠÙ†' : 'Sub-agent requests'}</span><span className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.5rem] ${activePanel === 'agents' ? 'bg-cyan-700 text-white' : 'bg-white/15 text-white'}`}>{visibleAgentRequests.filter((request) => request.status === 'pending').length}</span></button>
            </div>
          </div>
        </div>
      </section>

      <section className={`${activePanel === 'agents' ? '' : 'hidden'} overflow-hidden rounded-xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgb(6_182_212/0.07),rgb(var(--color-card-rgb)/0.92)_48%,rgb(124_58_237/0.07))] shadow-[0_18px_48px_-38px_rgb(6_182_212/0.75)]`}>
        <div className="flex items-center justify-between gap-3 border-b border-[color:rgb(var(--color-border-rgb)/0.48)] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/10 text-cyan-500"><UserRoundPlus className="h-4 w-4" /></span>
            <div><h2 className="text-xs font-black text-[var(--color-text)]">{isArabic ? 'Ø·Ù„Ø¨Ø§Øª Ø§Ù„ÙˆÙƒÙ„Ø§Ø¡ Ø§Ù„ÙØ±Ø¹ÙŠÙŠÙ†' : 'Sub-agent requests'}</h2><p className="text-[0.55rem] font-semibold text-[var(--color-text-secondary)]">{isArabic ? 'Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø±Ø³Ø§Ù„Ø© ÙˆØ§Ù„Ø¥Ø«Ø¨Ø§Øª Ø«Ù… Ø§Ø®ØªØ± Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø©.' : 'Review the message and proof, then select the appropriate group.'}</p></div>
          </div>
          <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[0.55rem] font-black text-amber-500">{visibleAgentRequests.filter((request) => request.status === 'pending').length} {isArabic ? 'Ù…Ø¹Ù„Ù‚' : 'pending'}</span>
        </div>
        {isRealReferralMode && adminApplicationError ? <p className="px-3 pt-2 text-xs font-semibold text-rose-500">{adminApplicationError}</p> : null}
        {isRealReferralMode && isLoadingAdminApplications ? <p className="px-3 pt-2 text-xs font-semibold text-[var(--color-text-secondary)]">{isArabic ? 'Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨Ø§Øª...' : 'Loading applications...'}</p> : null}
        <div className="grid gap-2 p-2.5 lg:grid-cols-2">
          {visibleAgentRequests.map((request) => {
            const status = String(request.status || 'pending');
            return (
              <article key={request.id} className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.5)] bg-[color:rgb(var(--color-surface-rgb)/0.58)] p-3">
                <div className="flex items-center gap-2.5">
                  <img src={resolveUserAvatar({ name: request.name, email: request.email }, request.email)} alt={request.name} className="h-10 w-10 rounded-full object-cover" />
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-xs font-black text-[var(--color-text)]">{request.name}</p></div><p dir="ltr" className="truncate text-left text-[0.58rem] text-[var(--color-text-secondary)]">{request.email}</p></div>
                  <span className={`rounded-full px-2 py-1 text-[0.52rem] font-black ${status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : status === 'rejected' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>{status === 'approved' ? (isArabic ? 'Ù…Ù‚Ø¨ÙˆÙ„' : 'Approved') : status === 'rejected' ? (isArabic ? 'Ù…Ø±ÙÙˆØ¶' : 'Rejected') : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©' : 'Pending')}</span>
                </div>
                <div className="mt-2.5 rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.42)] bg-[color:rgb(var(--color-card-rgb)/0.52)] p-2.5"><p className="text-[0.52rem] font-black text-cyan-500">{isArabic ? 'Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ù…ØªÙ‚Ø¯Ù…' : 'Applicant message'}</p><p className="mt-1 text-[0.66rem] font-semibold leading-5 text-[var(--color-text-secondary)]">{request.message}</p></div>
                {request.proofImage ? <a href={request.proofImage} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-lg border border-violet-400/18 bg-violet-500/6 p-2 transition hover:border-violet-400/35"><img src={request.proofImage} alt={isArabic ? 'ØµÙˆØ±Ø© Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡' : 'Customer proof'} className="h-12 w-20 rounded-md object-cover" /><div><p className="text-[0.58rem] font-black text-[var(--color-text)]">{isArabic ? 'ØµÙˆØ±Ø© Ø¥Ø«Ø¨Ø§Øª ÙˆØ¬ÙˆØ¯ Ø¹Ù…Ù„Ø§Ø¡' : 'Customer proof image'}</p><p className="text-[0.5rem] font-semibold text-violet-500">{isArabic ? 'Ø§Ø¶ØºØ· Ù„Ø¹Ø±Ø¶ Ø§Ù„ØµÙˆØ±Ø© ÙƒØ§Ù…Ù„Ø©' : 'Open full image'}</p></div></a> : null}
                {status === 'pending' ? <div className="mt-2.5 flex items-center gap-1.5"><select value={agentGroupSelections[request.id] || ''} onChange={(event) => setAgentGroupSelections((current) => ({ ...current, [request.id]: event.target.value }))} className="h-6 min-w-0 max-w-36 flex-1 rounded-md border border-[color:rgb(var(--color-border-rgb)/0.6)] bg-[var(--color-surface)] px-1.5 text-[0.48rem] font-black text-[var(--color-text)] outline-none"><option value="">{isArabic ? 'Ø§Ø®ØªØ± Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©' : 'Choose new group'}</option>{groups.map((group) => <option key={group.id || group._id} value={group.id || group._id}>{isArabic ? (group.nameAr || group.name) : (group.name || group.nameAr)}</option>)}</select><button type="button" onClick={() => updateAgentRequestStatus(request, 'rejected')} className="h-8 rounded-lg bg-rose-500/10 px-2 text-[0.55rem] font-black text-rose-500">{isArabic ? 'Ø±ÙØ¶' : 'Reject'}</button><button type="button" onClick={() => updateAgentRequestStatus(request, 'approved')} className="h-8 rounded-lg bg-emerald-500 px-2.5 text-[0.55rem] font-black text-white">{isArabic ? 'Ù‚Ø¨ÙˆÙ„ ÙˆØªØºÙŠÙŠØ± Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©' : 'Approve'}</button></div> : null}
                {isRealReferralMode && status === 'approved' ? (
                  <div className="mt-2.5 flex justify-end">
                    <button type="button" disabled={isReviewingApplication} onClick={() => updateAgentRequestStatus(request, 'suspended')} className="h-8 rounded-lg bg-amber-500/10 px-2 text-[0.55rem] font-black text-amber-500 disabled:opacity-50">{isArabic ? 'ØªØ¹Ù„ÙŠÙ‚' : 'Suspend'}</button>
                  </div>
                ) : null}
                {isRealReferralMode && status === 'suspended' ? (
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <select value={agentGroupSelections[request.id] || ''} onChange={(event) => setAgentGroupSelections((current) => ({ ...current, [request.id]: event.target.value }))} className="h-6 min-w-0 max-w-36 flex-1 rounded-md border border-[color:rgb(var(--color-border-rgb)/0.6)] bg-[var(--color-surface)] px-1.5 text-[0.48rem] font-black text-[var(--color-text)] outline-none"><option value="">{isArabic ? 'Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø© Ø£Ùˆ Ø¨Ø¯ÙŠÙ„Ø©' : 'Previous or replacement group'}</option>{groups.map((group) => <option key={group.id || group._id} value={group.id || group._id}>{isArabic ? (group.nameAr || group.name) : (group.name || group.nameAr)}</option>)}</select>
                    <button type="button" disabled={isReviewingApplication} onClick={() => updateAgentRequestStatus(request, 'reactivated')} className="h-8 rounded-lg bg-emerald-500 px-2.5 text-[0.55rem] font-black text-white disabled:opacity-50">{isArabic ? 'Ø¥Ø¹Ø§Ø¯Ø© ØªÙØ¹ÙŠÙ„' : 'Reactivate'}</button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className={`${activePanel === 'earnings' ? '' : 'hidden'} relative overflow-hidden rounded-xl border border-emerald-300/20 bg-[linear-gradient(135deg,rgb(16_185_129/0.07),rgb(var(--color-card-rgb)/0.9)_60%,rgb(124_58_237/0.05))] p-2.5 shadow-[0_14px_35px_-30px_rgb(16_185_129/0.7)]`}>
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500"><Percent className="h-4 w-4" /></span>
            <div>
              <h2 className="text-xs font-black text-[var(--color-text)]">{isArabic ? 'Ù†Ø³Ø¨Ø© Ø±Ø¨Ø­ Ø§Ù„Ø¯Ø§Ø¹ÙŠ' : 'Inviter commission rate'}</h2>
              <p className="mt-0.5 max-w-lg text-[0.56rem] font-semibold leading-3.5 text-[var(--color-text-secondary)]">{isArabic ? 'Ø§Ù„Ù†Ø³Ø¨Ø© Ø§Ù„ØªÙŠ ÙŠØ­ØµÙ„ Ø¹Ù„ÙŠÙ‡Ø§ ØµØ§Ø­Ø¨ ÙƒÙˆØ¯ Ø§Ù„Ø¥Ø­Ø§Ù„Ø© Ù…Ù† Ø¥ÙŠØ¯Ø§Ø¹Ø§Øª Ø§Ù„Ù…Ø¯Ø¹ÙˆÙŠÙ†.' : 'The referral-code ownerâ€™s share of invited usersâ€™ deposits.'}</p>
            </div>
          </div>
          <div className="flex items-end gap-1.5">
            <label className="block">
              <span className="mb-0.5 block text-[0.52rem] font-black text-[var(--color-text-secondary)]">{isArabic ? 'Ø§Ù„Ù†Ø³Ø¨Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©' : 'Current rate'}</span>
              <div className="flex h-8 w-24 items-center overflow-hidden rounded-lg border border-emerald-400/25 bg-[var(--color-surface)] focus-within:border-emerald-400">
                <input type="number" min="0" max="100" step="0.1" value={commissionRate} readOnly className="h-full min-w-0 flex-1 appearance-none bg-transparent px-1.5 text-center text-sm font-black text-[var(--color-text)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <span className="grid h-full w-7 place-items-center border-s border-emerald-400/15 bg-emerald-500/10 text-[0.65rem] font-black text-emerald-500">%</span>
              </div>
            </label>
            <button type="button" onClick={saveCommissionRate} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-emerald-500 px-2.5 text-[0.58rem] font-black text-white shadow-[0_10px_22px_-14px_rgb(16_185_129/0.9)] transition hover:bg-emerald-600"><Save className="h-3 w-3" />{isArabic ? 'Ø­ÙØ¸' : 'Save'}</button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 border-t border-[color:rgb(var(--color-border-rgb)/0.35)] pt-2">
          <p className="mt-2 text-[0.58rem] font-bold text-[var(--color-text-secondary)]">{isArabic ? 'لا توجد أمثلة حسابية ثابتة.' : 'No static calculation examples are displayed.'}</p>
        </div>
      </section>

      <section className={`${activePanel === 'earnings' ? '' : 'hidden'} sticky top-2 z-20 grid grid-cols-4 gap-2 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.45)] bg-[color:rgb(var(--color-card-rgb)/0.94)] p-2 shadow-[0_12px_35px_-24px_rgb(0_0_0/0.55)] backdrop-blur-xl`}>
        {statCards.map(({ label, value, icon: Icon, iconClass }) => (
          <article key={label} className="flex min-w-0 items-center gap-2 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.4)] bg-[color:rgb(var(--color-surface-rgb)/0.6)] px-2.5 py-2.5 sm:px-3">
            <span className={`hidden h-8 w-8 shrink-0 place-items-center rounded-lg sm:grid ${iconClass}`}><Icon className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.56rem] font-bold text-[var(--color-text-secondary)] sm:text-[0.65rem]">{label}</p>
              <p dir="ltr" className="mt-1 truncate text-end text-xs font-black text-[var(--color-text)] sm:text-base">{value}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={`${activePanel === 'earnings' ? '' : 'hidden'} overflow-hidden rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.55)] bg-[color:rgb(var(--color-card-rgb)/0.82)] shadow-[0_18px_50px_-42px_rgb(var(--color-primary-rgb)/0.7)]`}>
        <div className="flex items-center justify-between gap-2 border-b border-[color:rgb(var(--color-border-rgb)/0.5)] p-2">
          <div className="shrink-0"><h2 className="text-[0.65rem] font-black text-[var(--color-text)]">{isArabic ? 'ØªÙØ§ØµÙŠÙ„ Ø£Ø±Ø¨Ø§Ø­ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†' : 'User earnings details'}</h2><p className="mt-0.5 text-[0.48rem] font-semibold text-[var(--color-text-secondary)]">{visibleOwners.length} {isArabic ? 'Ù…Ø³ØªØ®Ø¯Ù…' : 'users'}</p></div>
          <div className="flex min-w-0 flex-1 justify-end gap-0.5">
            <label className="relative min-w-0 max-w-24 flex-1"><Search className="absolute start-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 text-[var(--color-muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isArabic ? 'Ø§Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„ÙƒÙˆØ¯...' : 'Search name or code...'} className="h-3 w-full rounded-full border border-[color:rgb(var(--color-border-rgb)/0.65)] bg-[var(--color-surface)] pe-0.5 ps-2.5 text-[0.31rem] font-bold leading-none text-[var(--color-text)] outline-none focus:border-violet-400" /></label>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-3 max-w-10 appearance-none rounded-full border border-[color:rgb(var(--color-border-rgb)/0.65)] bg-[var(--color-surface)] px-0.5 text-[0.31rem] font-black leading-none text-[var(--color-text)] outline-none">
              <option value="all">{isArabic ? 'Ø§Ù„ÙƒÙ„' : 'All'}</option><option value="active">{isArabic ? 'Ù„Ø¯ÙŠÙ‡ Ù…Ø¯Ø¹ÙˆÙˆÙ†' : 'Has invites'}</option><option value="balance">{isArabic ? 'Ø±ØµÙŠØ¯ Ù…ØªØ§Ø­' : 'Available balance'}</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-[color:rgb(var(--color-border-rgb)/0.42)]">
          {visibleOwners.map((owner) => {
            const available = Math.max(0, owner.earnings - owner.withdrawn);
            return <article
              key={owner.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedOwner(owner)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedOwner(owner);
                }
              }}
              className="grid cursor-pointer grid-cols-3 gap-x-2 gap-y-3 p-3 transition-all hover:bg-[color:rgb(var(--color-primary-rgb)/0.055)] focus-visible:bg-[color:rgb(var(--color-primary-rgb)/0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 lg:grid-cols-[minmax(240px,1.3fr)_repeat(3,minmax(120px,.65fr))_auto] lg:items-center lg:gap-4 sm:p-5"
            >
              <div className="col-span-2 row-start-1 flex min-w-0 items-center gap-2 lg:col-span-1 lg:row-auto lg:gap-3"><img src={owner.avatar} alt={owner.name} className="h-10 w-10 rounded-full border-2 border-violet-400/25 object-cover shadow-md lg:h-12 lg:w-12" /><div className="min-w-0"><div className="flex items-center gap-1.5"><p className="truncate text-xs font-black text-[var(--color-text)] lg:text-sm">{owner.name}</p></div><p dir="ltr" className="truncate text-left text-[0.56rem] font-semibold text-[var(--color-text-secondary)] lg:text-[0.66rem]">{owner.email}</p><span dir="ltr" className="mt-0.5 inline-flex rounded-md bg-violet-500/10 px-1.5 py-0.5 font-mono text-[0.52rem] font-black tracking-wider text-violet-500 lg:mt-1 lg:px-2 lg:text-[0.62rem]">{owner.code}</span></div></div>
              <div className="col-start-1 row-start-2 min-w-0 lg:col-auto lg:row-auto"><p className="text-[0.5rem] font-bold text-[var(--color-text-secondary)] lg:text-[0.6rem]">{isArabic ? 'Ø§Ù„Ù…Ø¯Ø¹ÙˆÙˆÙ†' : 'Invited'}</p><div className="mt-0.5 flex items-center gap-1"><p className="text-sm font-black text-[var(--color-text)] lg:text-base">{owner.referrals.length}</p><div className="flex -space-x-2 rtl:space-x-reverse">{owner.referrals.slice(0, 3).map((referral) => <img key={referral.id} src={referral.avatar} alt="" title={referral.name} className="h-5 w-5 rounded-full border-2 border-[var(--color-card)] object-cover lg:h-6 lg:w-6" />)}</div></div></div>
              <div className="col-start-2 row-start-2 min-w-0 lg:col-auto lg:row-auto"><p className="truncate text-[0.5rem] font-bold text-[var(--color-text-secondary)] lg:text-[0.6rem]">{isArabic ? 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø±Ø¨Ø­' : 'Total earnings'}</p><p dir="ltr" className="mt-0.5 truncate text-end text-xs font-black text-emerald-500 lg:mt-1 lg:text-base">+{owner.earnings.toLocaleString('en-US')} <span className="text-[0.52rem] lg:text-[0.62rem]">{owner.currency}</span></p></div>
              <div className="col-start-3 row-start-2 min-w-0 lg:col-auto lg:row-auto"><p className="truncate text-[0.5rem] font-bold text-[var(--color-text-secondary)] lg:text-[0.6rem]">{isArabic ? 'Ù…ØªØ§Ø­ Ù„Ù„Ø³Ø­Ø¨' : 'Available'}</p><p dir="ltr" className="mt-0.5 truncate text-end text-xs font-black text-violet-500 lg:mt-1 lg:text-base">{available.toLocaleString('en-US')} <span className="text-[0.52rem] lg:text-[0.62rem]">{owner.currency}</span></p><p className="mt-0.5 truncate text-[0.46rem] font-bold text-[var(--color-text-secondary)] lg:mt-1 lg:text-[0.56rem]">{isArabic ? `ØªÙ… Ø³Ø­Ø¨ ${owner.withdrawn.toLocaleString('en-US')}` : `${owner.withdrawn.toLocaleString('en-US')} withdrawn`}</p></div>
              <button type="button" onClick={() => setSelectedOwner(owner)} aria-label={isArabic ? 'Ø¹Ø±Ø¶ Ø§Ù„ØªÙØ§ØµÙŠÙ„' : 'View details'} className="col-start-3 row-start-1 inline-flex h-9 items-center justify-self-end gap-1 rounded-lg border border-violet-400/20 bg-violet-500/10 px-2 text-[0.55rem] font-black text-violet-500 transition hover:bg-violet-500/15 lg:col-auto lg:row-auto lg:h-10 lg:justify-self-auto lg:gap-2 lg:rounded-xl lg:px-3 lg:text-xs"><Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4" /><span className="hidden sm:inline">{isArabic ? 'Ø§Ù„ØªÙØ§ØµÙŠÙ„' : 'Details'}</span><ChevronLeft className="hidden h-3.5 w-3.5 rtl:rotate-0 ltr:rotate-180 lg:block" /></button>
            </article>;
          })}
          {!visibleOwners.length ? <div className="p-12 text-center"><UsersRound className="mx-auto h-9 w-9 text-[var(--color-muted)]" /><p className="mt-3 text-sm font-black text-[var(--color-text)]">{isArabic ? 'لا توجد بيانات حتى الآن' : 'No data yet'}</p></div> : null}
        </div>
      </section>

      <section className={`${activePanel === 'earnings' ? '' : 'hidden'} grid gap-4 xl:grid-cols-2`}>
        <div className="rounded-[1.4rem] border border-[color:rgb(var(--color-border-rgb)/0.55)] bg-[color:rgb(var(--color-card-rgb)/0.84)] p-4">
          <h2 className="text-sm font-black text-[var(--color-text)]">{isArabic ? 'Ø·Ø±Ù‚ Ø³Ø­Ø¨ Ø£Ø±Ø¨Ø§Ø­ Ø§Ù„Ø¥Ø­Ø§Ù„Ø©' : 'Referral withdrawal methods'}</h2>
          <p className="mt-1 text-[0.6rem] font-bold text-[var(--color-text-secondary)]">{isArabic ? 'Ø§Ù„Ø·Ø±Ù‚ Ø§Ù„Ù…ÙØ¹Ù„Ø© ÙÙ‚Ø· Ø³ØªØ¸Ù‡Ø± Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù….' : 'Only enabled methods appear to users.'}</p>
          <div className="mt-3 space-y-2">
            {withdrawalMethods.map((method) => (
              <div key={method.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.45)] p-2.5">
                <span className="min-w-0 flex-1 text-xs font-black text-[var(--color-text)]">{method.name}</span>
                <label className="flex items-center gap-1.5">
                  <span className="text-[0.52rem] font-black text-[var(--color-text-secondary)]">{isArabic ? 'Ù†Ø³Ø¨Ø© Ø§Ù„Ø®ØµÙ…' : 'Deduction'}</span>
                  <div className="flex h-7 w-16 items-center overflow-hidden rounded-lg border border-amber-400/25 bg-[var(--color-surface)]">
                    <input type="number" min="0" max="100" step="0.1" value={number(method.discountPercent)} onChange={(event) => { const discountPercent = Math.min(100, Math.max(0, number(event.target.value))); persistMethods(withdrawalMethods.map((entry) => entry.id === method.id ? { ...entry, discountPercent } : entry)); }} className="h-full min-w-0 flex-1 bg-transparent px-1 text-center text-[0.6rem] font-black text-[var(--color-text)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    <span className="grid h-full w-5 place-items-center border-s border-amber-400/15 bg-amber-500/10 text-[0.55rem] font-black text-amber-500">%</span>
                  </div>
                </label>
                <button type="button" onClick={() => persistMethods(withdrawalMethods.map((entry) => entry.id === method.id ? { ...entry, enabled: !entry.enabled } : entry))} className={`relative h-6 w-11 rounded-full transition ${method.enabled ? 'bg-emerald-500' : 'bg-slate-400/40'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${method.enabled ? 'end-1' : 'end-6'}`} /></button>
                <button type="button" onClick={() => { persistMethods(withdrawalMethods.filter((entry) => entry.id !== method.id)); addToast(isArabic ? `ØªÙ… Ø­Ø°Ù Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø³Ø­Ø¨: ${method.name}` : `${method.name} deleted`, 'success'); }} aria-label={isArabic ? `Ø­Ø°Ù ${method.name}` : `Delete ${method.name}`} title={isArabic ? 'Ø­Ø°Ù Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø³Ø­Ø¨' : 'Delete withdrawal method'} className="grid h-7 w-7 place-items-center rounded-lg border border-rose-400/18 bg-rose-500/8 text-rose-500 transition hover:border-rose-400/35 hover:bg-rose-500/15"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {!withdrawalMethods.length ? <p className="py-6 text-center text-xs text-[var(--color-text-secondary)]">{isArabic ? 'لا توجد طرق سحب مضافة' : 'No withdrawal methods added'}</p> : null}
          </div>
          <div className="mt-3 flex gap-2"><input value={newMethodName} onChange={(event) => setNewMethodName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addWithdrawalMethod(); }} placeholder={isArabic ? 'Ø§ÙƒØªØ¨ Ø§Ø³Ù… Ø·Ø±ÙŠÙ‚Ø© Ø¬Ø¯ÙŠØ¯Ø©' : 'New method name'} className="h-9 min-w-0 flex-1 rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.6)] bg-[var(--color-surface)] px-3 text-xs font-bold text-[var(--color-text)] outline-none" /><button type="button" onClick={addWithdrawalMethod} className="inline-flex h-9 items-center gap-1 rounded-lg bg-violet-600 px-3 text-[0.6rem] font-black text-white"><Plus className="h-3.5 w-3.5" />{isArabic ? 'Ø¥Ø¶Ø§ÙØ©' : 'Add'}</button></div>
        </div>
        <div className="rounded-[1.4rem] border border-[color:rgb(var(--color-border-rgb)/0.55)] bg-[color:rgb(var(--color-card-rgb)/0.84)] p-4">
          <h2 className="text-sm font-black text-[var(--color-text)]">{isArabic ? 'Ø·Ù„Ø¨Ø§Øª Ø³Ø­Ø¨ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡' : 'Customer withdrawals'}</h2>
          <p className="mt-1 text-[0.6rem] font-bold text-[var(--color-text-secondary)]">{isArabic ? 'Ø£Ø±ÙÙ‚ ØµÙˆØ±Ø© Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø«Ù… ÙˆØ§ÙÙ‚ Ø¹Ù„Ù‰ Ø§Ù„Ø·Ù„Ø¨.' : 'Attach the transfer receipt, then approve.'}</p>
          {isRealReferralMode && (isLoadingAdminPayouts || adminPayoutError || processingAdminPayoutId) ? (
            <p className={`mt-2 rounded-lg px-2 py-1 text-[0.58rem] font-black ${adminPayoutError ? 'bg-rose-500/8 text-rose-500' : 'bg-violet-500/8 text-violet-500'}`}>
              {adminPayoutError || (processingAdminPayoutId ? (isArabic ? 'Ø¬Ø§Ø±Ù ØªÙ†ÙÙŠØ° Ø¥Ø¬Ø±Ø§Ø¡ Ø·Ù„Ø¨ Ø§Ù„Ø³Ø­Ø¨...' : 'Processing payout action...') : (isArabic ? 'Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø³Ø­Ø¨...' : 'Loading payout requests...'))}
            </p>
          ) : null}
          <div className="mt-3 max-h-[430px] space-y-2 overflow-y-auto">{allWithdrawalRequests.map((request) => { const status = String(request.status || 'processing').toLowerCase(); const ownerName = request.accountHolder || request.ownerName || request.name || (isArabic ? 'Ø¹Ù…ÙŠÙ„' : 'Customer'); const accountNumber = request.accountNumber || request.phone || ''; return <article key={request.id} className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.48)] p-3"><div className="flex items-center gap-2"><img src={request.ownerAvatar || resolveUserAvatar({ name: request.ownerName, email: request.ownerEmail }, request.ownerEmail)} alt="" className="h-9 w-9 rounded-full object-cover" /><div className="min-w-0 flex-1"><button type="button" onClick={() => copyRequestValue(ownerName, isArabic ? 'Ø§Ù„Ø§Ø³Ù…' : 'name')} title={isArabic ? 'Ø§Ø¶ØºØ· Ù„Ù†Ø³Ø® Ø§Ù„Ø§Ø³Ù…' : 'Click to copy name'} className="block max-w-full truncate text-xs font-black text-[var(--color-text)] hover:text-violet-500">{ownerName}</button><div className="mt-0.5 flex min-w-0 items-center gap-1 text-[0.55rem] text-[var(--color-text-secondary)]"><span className="shrink-0">{request.methodName || withdrawalMethods.find((method) => method.id === request.method)?.name || request.method} Â·</span><button type="button" dir="ltr" onClick={() => copyRequestValue(accountNumber, isArabic ? 'Ø±Ù‚Ù… Ø§Ù„Ø­Ø³Ø§Ø¨' : 'account number')} title={isArabic ? 'Ø§Ø¶ØºØ· Ù„Ù†Ø³Ø® Ø§Ù„Ø±Ù‚Ù…' : 'Click to copy'} className="truncate font-black hover:text-violet-500 hover:underline">{accountNumber || 'â€”'}</button></div></div><div className="text-end"><p dir="ltr" className="text-sm font-black text-[var(--color-text)]">{number(request.amount).toLocaleString('en-US')} {request.currency || 'EGP'}</p><span className={`text-[0.55rem] font-black ${status === 'completed' ? 'text-emerald-500' : status === 'failed' ? 'text-rose-500' : 'text-amber-500'}`}>{status === 'completed' ? (isArabic ? 'ØªÙ… Ø§Ù„ØªØ­ÙˆÙŠÙ„' : 'Completed') : status === 'failed' ? (isArabic ? 'Ù…Ø±ÙÙˆØ¶' : 'Rejected') : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©' : 'Pending')}</span></div></div><div className="mt-2 flex flex-wrap items-center gap-1.5"><label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg bg-violet-500/10 px-2 text-[0.55rem] font-black text-violet-500"><ImagePlus className="h-3.5 w-3.5" />{request.receiptImage ? (isArabic ? 'ØªØºÙŠÙŠØ± Ø§Ù„ØµÙˆØ±Ø©' : 'Change receipt') : (isArabic ? 'Ø£Ø±ÙÙ‚ Ø§Ù„ØµÙˆØ±Ø© Ø£ÙˆÙ„Ù‹Ø§' : 'Attach receipt first')}<input type="file" accept="image/*" className="hidden" onChange={(event) => attachReceipt(request, event.target.files?.[0])} /></label>{request.receiptImage ? <a href={request.receiptImage} target="_blank" rel="noreferrer" className="text-[0.55rem] font-black text-sky-500 underline">{isArabic ? 'Ù…Ø¹Ø§ÙŠÙ†Ø©' : 'Preview'}</a> : null}<span className="flex-1" />{status === 'processing' ? <><button type="button" onClick={() => updateRequest(request, { status: 'failed' })} className="h-8 rounded-lg bg-rose-500/10 px-2 text-[0.55rem] font-black text-rose-500">{isArabic ? 'Ø±ÙØ¶' : 'Reject'}</button><button type="button" disabled={!request.receiptImage} title={!request.receiptImage ? (isArabic ? 'Ø£Ø±ÙÙ‚ ØµÙˆØ±Ø© Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø£ÙˆÙ„Ù‹Ø§' : 'Attach receipt first') : ''} onClick={() => updateRequest(request, { status: 'completed', completedAt: new Date().toISOString() })} className="h-8 rounded-lg bg-emerald-500 px-2.5 text-[0.55rem] font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-55">{isArabic ? 'Ù…ÙˆØ§ÙÙ‚Ø© ÙˆØªØ­ÙˆÙŠÙ„' : 'Approve'}</button></> : null}</div></article>; })}{!allWithdrawalRequests.length ? <p className="py-8 text-center text-xs text-[var(--color-text-secondary)]">{isArabic ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ø³Ø­Ø¨.' : 'No withdrawal requests.'}</p> : null}</div>
        </div>
      </section>

      <Modal isOpen={Boolean(selectedOwner)} onClose={() => setSelectedOwner(null)} title={isArabic ? 'ØªÙØ§ØµÙŠÙ„ ÙƒÙˆØ¯ Ø§Ù„Ø¥Ø­Ø§Ù„Ø©' : 'Referral details'} size="xl">
        {selectedOwner ? <div className="space-y-4" dir={dir}>
          <div className="flex items-center gap-3 rounded-2xl bg-[color:rgb(var(--color-primary-rgb)/0.07)] p-4"><img src={selectedOwner.avatar} alt={selectedOwner.name} className="h-14 w-14 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="font-black text-[var(--color-text)]">{selectedOwner.name}</p><p dir="ltr" className="truncate text-left text-xs text-[var(--color-text-secondary)]">{selectedOwner.email}</p></div><span dir="ltr" className="rounded-lg bg-violet-500/12 px-3 py-1.5 font-mono text-xs font-black text-violet-500">{selectedOwner.code}</span></div>
          <div className="grid grid-cols-3 gap-2">{[
            [isArabic ? 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø±Ø¨Ø­' : 'Earnings', selectedOwner.earnings, TrendingUp],
            [isArabic ? 'ØªÙ… Ø³Ø­Ø¨Ù‡' : 'Withdrawn', selectedOwner.withdrawn, ArrowDownToLine],
            [isArabic ? 'Ù…ØªØ§Ø­' : 'Available', Math.max(0, selectedOwner.earnings - selectedOwner.withdrawn), Wallet],
          ].map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.5)] p-3"><Icon className="h-4 w-4 text-violet-500" /><p className="mt-2 text-[0.58rem] font-bold text-[var(--color-text-secondary)]">{label}</p><p dir="ltr" className="mt-1 text-end text-sm font-black text-[var(--color-text)]">{value.toLocaleString('en-US')} {selectedOwner.currency}</p></div>)}</div>
          <div><h3 className="mb-2 flex items-center gap-2 text-sm font-black text-[var(--color-text)]"><UsersRound className="h-4 w-4 text-violet-500" />{isArabic ? 'Ø§Ù„Ø£Ø´Ø®Ø§Øµ Ø§Ù„Ø°ÙŠÙ† Ø¯Ø¹Ø§Ù‡Ù…' : 'People invited'}</h3><div className="max-h-72 space-y-2 overflow-y-auto pe-1">{selectedOwner.referrals.map((referral) => <div key={referral.id} className="flex items-center gap-3 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.48)] p-3"><img src={referral.avatar} alt={referral.name} className="h-10 w-10 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-[var(--color-text)]">{referral.name}</p><p dir="ltr" className="truncate text-left text-[0.6rem] text-[var(--color-text-secondary)]">{referral.email}</p><p className="mt-1 flex items-center gap-1 text-[0.56rem] text-[var(--color-text-secondary)]"><CalendarDays className="h-3 w-3" />{formatDate(referral.invitedAt, locale)}</p></div><div className="text-end"><p dir="ltr" className="text-xs font-black text-[var(--color-text)]">{referral.addedAmount.toLocaleString('en-US')} {selectedOwner.currency}</p><p dir="ltr" className="mt-1 text-[0.65rem] font-black text-emerald-500">+{referral.earnings.toLocaleString('en-US')} {selectedOwner.currency}</p></div></div>)}{!selectedOwner.referrals.length ? <p className="py-6 text-center text-xs text-[var(--color-text-secondary)]">{isArabic ? 'Ù„Ù… ÙŠØ¯Ø¹Ù Ø£ÙŠ Ø´Ø®Øµ Ø¨Ø¹Ø¯' : 'No invitations yet'}</p> : null}</div></div>
          {selectedOwner.withdrawals.length ? <div><h3 className="mb-2 flex items-center gap-2 text-sm font-black text-[var(--color-text)]"><ArrowDownToLine className="h-4 w-4 text-violet-500" />{isArabic ? 'Ø·Ù„Ø¨Ø§Øª Ø³Ø­Ø¨ Ø§Ù„Ø£Ø±Ø¨Ø§Ø­' : 'Earnings withdrawals'}</h3><div className="space-y-2">{selectedOwner.withdrawals.map((withdrawal, index) => { const status = String(withdrawal?.status || 'processing').toLowerCase(); const StatusIcon = status === 'completed' ? CheckCircle2 : status === 'failed' ? XCircle : Clock3; return <div key={withdrawal?.id || index} className="flex items-center justify-between rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.48)] p-3"><span className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)]"><StatusIcon className={`h-4 w-4 ${status === 'completed' ? 'text-emerald-500' : status === 'failed' ? 'text-rose-500' : 'text-amber-500'}`} />{formatDate(withdrawal?.createdAt || withdrawal?.requestedAt, locale)}</span><span dir="ltr" className="text-sm font-black text-[var(--color-text)]">{number(withdrawal?.amount).toLocaleString('en-US')} {selectedOwner.currency}</span></div>; })}</div></div> : null}
        </div> : null}
      </Modal>
      {(isLoadingAdminReferralDashboard || adminReferralDashboardError) ? <div className={`fixed bottom-5 end-5 rounded-full px-4 py-2 text-xs font-black text-white shadow-xl ${adminReferralDashboardError ? 'bg-rose-600' : 'bg-violet-600'}`}>{adminReferralDashboardError || (isArabic ? 'جارٍ تحميل بيانات الإحالة...' : 'Loading referral data...')}</div> : null}
    </div>
  );
};

export default AdminReferrals;
