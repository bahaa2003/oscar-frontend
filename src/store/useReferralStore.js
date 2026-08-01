import { create } from 'zustand';
import apiClient from '../services/client';

const defaultPagination = { page: 1, limit: 10, total: 0, pages: 0 };

const initialState = {
  dashboard: null,
  commissions: [],
  invitees: [],
  payouts: [],
  commissionPagination: { ...defaultPagination },
  inviteePagination: { ...defaultPagination },
  payoutPagination: { ...defaultPagination },
  commissionFilters: { page: 1, limit: 10, status: '', dateFrom: '', dateTo: '' },
  inviteeFilters: { page: 1, limit: 10, source: '', dateFrom: '', dateTo: '' },
  payoutFilters: { page: 1, limit: 10, status: '', method: '', dateFrom: '', dateTo: '' },
  selectedCommissionIds: [],
  selectedTotalUsd: '0.00',
  selectedPayoutCurrency: '',
  isLoadingDashboard: false,
  isLoadingCommissions: false,
  isLoadingInvitees: false,
  isLoadingPayouts: false,
  isCreatingPayout: false,
  dashboardError: null,
  commissionsError: null,
  inviteesError: null,
  payoutError: null,
  dashboardRequestSeq: 0,
  commissionsRequestSeq: 0,
  inviteesRequestSeq: 0,
  payoutsRequestSeq: 0,
};

const normalizeError = (error) => (
  error?.response?.data?.message
  || error?.message
  || 'Unable to load referral data.'
);

const compactParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
);

const useReferralStore = create((set, get) => ({
  ...initialState,

  fetchReferralDashboard: async () => {
    const requestSeq = get().dashboardRequestSeq + 1;
    set({
      dashboardRequestSeq: requestSeq,
      isLoadingDashboard: true,
      dashboardError: null,
    });

    try {
      const dashboard = await apiClient.referrals.getDashboard();
      if (get().dashboardRequestSeq !== requestSeq) return dashboard;
      set({
        dashboard,
        isLoadingDashboard: false,
        dashboardError: null,
      });
      return dashboard;
    } catch (error) {
      if (get().dashboardRequestSeq === requestSeq) {
        set({
          dashboard: null,
          isLoadingDashboard: false,
          dashboardError: normalizeError(error),
        });
      }
      throw error;
    }
  },

  fetchReferralCommissions: async (params = {}) => {
    const requestSeq = get().commissionsRequestSeq + 1;
    const nextFilters = {
      ...get().commissionFilters,
      ...params,
    };

    set({
      commissionsRequestSeq: requestSeq,
      commissionFilters: nextFilters,
      isLoadingCommissions: true,
      commissionsError: null,
    });

    try {
      const result = await apiClient.referrals.getCommissions(compactParams(nextFilters));
      if (get().commissionsRequestSeq !== requestSeq) return result;
      set({
        commissions: Array.isArray(result?.items) ? result.items : [],
        commissionPagination: result?.pagination || { ...defaultPagination },
        isLoadingCommissions: false,
        commissionsError: null,
      });
      return result;
    } catch (error) {
      if (get().commissionsRequestSeq === requestSeq) {
        set({
          commissions: [],
          commissionPagination: { ...defaultPagination, page: Number(nextFilters.page) || 1, limit: Number(nextFilters.limit) || 10 },
          isLoadingCommissions: false,
          commissionsError: normalizeError(error),
        });
      }
      throw error;
    }
  },

  fetchReferralInvitees: async (params = {}) => {
    const requestSeq = get().inviteesRequestSeq + 1;
    const nextFilters = {
      ...get().inviteeFilters,
      ...params,
    };

    set({
      inviteesRequestSeq: requestSeq,
      inviteeFilters: nextFilters,
      isLoadingInvitees: true,
      inviteesError: null,
    });

    try {
      const result = await apiClient.referrals.getInvitees(compactParams(nextFilters));
      if (get().inviteesRequestSeq !== requestSeq) return result;
      set({
        invitees: Array.isArray(result?.items) ? result.items : [],
        inviteePagination: result?.pagination || { ...defaultPagination },
        isLoadingInvitees: false,
        inviteesError: null,
      });
      return result;
    } catch (error) {
      if (get().inviteesRequestSeq === requestSeq) {
        set({
          invitees: [],
          inviteePagination: { ...defaultPagination, page: Number(nextFilters.page) || 1, limit: Number(nextFilters.limit) || 10 },
          isLoadingInvitees: false,
          inviteesError: normalizeError(error),
        });
      }
      throw error;
    }
  },

  fetchReferralPayouts: async (params = {}) => {
    const requestSeq = get().payoutsRequestSeq + 1;
    const nextFilters = {
      ...get().payoutFilters,
      ...params,
    };

    set({
      payoutsRequestSeq: requestSeq,
      payoutFilters: nextFilters,
      isLoadingPayouts: true,
      payoutError: null,
    });

    try {
      const result = await apiClient.referrals.getPayouts(compactParams(nextFilters));
      if (get().payoutsRequestSeq !== requestSeq) return result;
      set({
        payouts: Array.isArray(result?.items) ? result.items : [],
        payoutPagination: result?.pagination || { ...defaultPagination },
        isLoadingPayouts: false,
        payoutError: null,
      });
      return result;
    } catch (error) {
      if (get().payoutsRequestSeq === requestSeq) {
        set({
          payouts: [],
          payoutPagination: { ...defaultPagination, page: Number(nextFilters.page) || 1, limit: Number(nextFilters.limit) || 10 },
          isLoadingPayouts: false,
          payoutError: normalizeError(error),
        });
      }
      throw error;
    }
  },

  setSelectedCommissionIds: (ids = [], commissions = get().commissions) => {
    const uniqueIds = [...new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean))];
    const selected = (Array.isArray(commissions) ? commissions : [])
      .filter((commission) => uniqueIds.includes(String(commission?.id || commission?._id)));
    const currencies = new Set(selected.map((commission) => String(commission?.commissionCurrency || 'USD').toUpperCase()));
    const canTotal = currencies.size <= 1;
    const total = canTotal
      ? selected.reduce((sum, commission) => sum + Number(commission?.commissionAmount || commission?.commissionAmountUsd || 0), 0)
      : 0;
    set({
      selectedCommissionIds: uniqueIds,
      selectedTotalUsd: total.toFixed(2),
      selectedPayoutCurrency: canTotal ? ([...currencies][0] || '') : 'MIXED',
    });
  },

  createReferralPayout: async ({ commissionIds, method } = {}) => {
    set({ isCreatingPayout: true, payoutError: null });
    try {
      const payout = await apiClient.referrals.createPayout({ commissionIds, method });
      set({ isCreatingPayout: false, selectedCommissionIds: [], selectedTotalUsd: '0.00', selectedPayoutCurrency: '' });
      return payout;
    } catch (error) {
      set({ isCreatingPayout: false, payoutError: normalizeError(error) });
      throw error;
    }
  },

  resetReferralDashboard: () => set({ ...initialState }),
}));

export default useReferralStore;
