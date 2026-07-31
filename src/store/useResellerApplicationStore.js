import { create } from 'zustand';
import apiClient from '../services/client';

const defaultPagination = { page: 1, limit: 10, total: 0, pages: 0 };

const normalizeError = (error) => (
  error?.response?.data?.message
  || error?.message
  || 'Unable to load reseller application data.'
);

const compactParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
);

const initialState = {
  currentApplication: null,
  applicationHistory: [],
  applicationPagination: { ...defaultPagination },
  applicationFilters: { page: 1, limit: 10 },
  resellerStatus: 'NONE',
  commercial: { approved: false, assignedGroup: null },
  canApply: true,
  adminApplications: [],
  adminPagination: { ...defaultPagination },
  adminFilters: { page: 1, limit: 20, status: '', search: '' },
  isLoadingApplication: false,
  isSubmittingApplication: false,
  isLoadingHistory: false,
  isLoadingAdminApplications: false,
  isReviewingApplication: false,
  applicationError: null,
  adminApplicationError: null,
  applicationRequestSeq: 0,
  historyRequestSeq: 0,
  adminRequestSeq: 0,
};

const useResellerApplicationStore = create((set, get) => ({
  ...initialState,

  fetchCurrentApplication: async () => {
    const requestSeq = get().applicationRequestSeq + 1;
    set({ applicationRequestSeq: requestSeq, isLoadingApplication: true, applicationError: null });
    try {
      const data = await apiClient.resellerApplications.getCurrent();
      if (get().applicationRequestSeq !== requestSeq) return data;
      set({
        currentApplication: data?.application || null,
        resellerStatus: data?.resellerStatus || 'NONE',
        commercial: data?.commercial || { approved: false, assignedGroup: null },
        canApply: data?.canApply !== false,
        isLoadingApplication: false,
        applicationError: null,
      });
      return data;
    } catch (error) {
      if (get().applicationRequestSeq === requestSeq) {
        set({ isLoadingApplication: false, applicationError: normalizeError(error) });
      }
      throw error;
    }
  },

  fetchApplicationHistory: async (params = {}) => {
    const requestSeq = get().historyRequestSeq + 1;
    const nextFilters = { ...get().applicationFilters, ...params };
    set({
      historyRequestSeq: requestSeq,
      applicationFilters: nextFilters,
      isLoadingHistory: true,
      applicationError: null,
    });
    try {
      const result = await apiClient.resellerApplications.getHistory(compactParams(nextFilters));
      if (get().historyRequestSeq !== requestSeq) return result;
      set({
        applicationHistory: Array.isArray(result?.items) ? result.items : [],
        applicationPagination: result?.pagination || { ...defaultPagination },
        isLoadingHistory: false,
        applicationError: null,
      });
      return result;
    } catch (error) {
      if (get().historyRequestSeq === requestSeq) {
        set({
          applicationHistory: [],
          applicationPagination: { ...defaultPagination },
          isLoadingHistory: false,
          applicationError: normalizeError(error),
        });
      }
      throw error;
    }
  },

  submitApplication: async (payload = {}) => {
    set({ isSubmittingApplication: true, applicationError: null });
    try {
      const application = await apiClient.resellerApplications.submit(payload);
      set({ isSubmittingApplication: false });
      await Promise.allSettled([
        get().fetchCurrentApplication(),
        get().fetchApplicationHistory({ page: 1 }),
      ]);
      return application;
    } catch (error) {
      set({ isSubmittingApplication: false, applicationError: normalizeError(error) });
      throw error;
    }
  },

  fetchAdminApplications: async (params = {}) => {
    const requestSeq = get().adminRequestSeq + 1;
    const nextFilters = { ...get().adminFilters, ...params };
    set({
      adminRequestSeq: requestSeq,
      adminFilters: nextFilters,
      isLoadingAdminApplications: true,
      adminApplicationError: null,
    });
    try {
      const result = await apiClient.adminResellerApplications.list(compactParams(nextFilters));
      if (get().adminRequestSeq !== requestSeq) return result;
      set({
        adminApplications: Array.isArray(result?.items) ? result.items : [],
        adminPagination: result?.pagination || { ...defaultPagination },
        isLoadingAdminApplications: false,
        adminApplicationError: null,
      });
      return result;
    } catch (error) {
      if (get().adminRequestSeq === requestSeq) {
        set({
          adminApplications: [],
          adminPagination: { ...defaultPagination },
          isLoadingAdminApplications: false,
          adminApplicationError: normalizeError(error),
        });
      }
      throw error;
    }
  },

  approveApplication: async (id, payload = {}) => {
    set({ isReviewingApplication: true, adminApplicationError: null });
    try {
      const application = await apiClient.adminResellerApplications.approve(id, payload);
      set({ isReviewingApplication: false });
      await get().fetchAdminApplications();
      return application;
    } catch (error) {
      set({ isReviewingApplication: false, adminApplicationError: normalizeError(error) });
      throw error;
    }
  },

  rejectApplication: async (id, payload = {}) => {
    set({ isReviewingApplication: true, adminApplicationError: null });
    try {
      const application = await apiClient.adminResellerApplications.reject(id, payload);
      set({ isReviewingApplication: false });
      await get().fetchAdminApplications();
      return application;
    } catch (error) {
      set({ isReviewingApplication: false, adminApplicationError: normalizeError(error) });
      throw error;
    }
  },

  suspendApplication: async (id, payload = {}) => {
    set({ isReviewingApplication: true, adminApplicationError: null });
    try {
      const application = await apiClient.adminResellerApplications.suspend(id, payload);
      set({ isReviewingApplication: false });
      await get().fetchAdminApplications();
      return application;
    } catch (error) {
      set({ isReviewingApplication: false, adminApplicationError: normalizeError(error) });
      throw error;
    }
  },

  reactivateApplication: async (id, payload = {}) => {
    set({ isReviewingApplication: true, adminApplicationError: null });
    try {
      const application = await apiClient.adminResellerApplications.reactivate(id, payload);
      set({ isReviewingApplication: false });
      await get().fetchAdminApplications();
      return application;
    } catch (error) {
      set({ isReviewingApplication: false, adminApplicationError: normalizeError(error) });
      throw error;
    }
  },

  resetResellerApplications: () => set({ ...initialState }),
}));

export default useResellerApplicationStore;
