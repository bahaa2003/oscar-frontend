import { useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';

const loadLayout = () => import('../layout/Layout');
const loadAuth = () => import('../../pages/Auth');
const loadDashboard = () => import('../../pages/Dashboard');
const loadProducts = () => import('../../pages/Products');
const loadOrders = () => import('../../pages/Orders');
const loadWallet = () => import('../../pages/Wallet');
const loadSettings = () => import('../../pages/Settings');
const loadAdminDashboard = () => import('../../pages/AdminDashboard');
const loadAdminOrders = () => import('../../pages/admin/AdminOrders');
const loadAdminProducts = () => import('../../pages/admin/AdminProducts');

const warmupByRole = {
  guest: [loadAuth, loadLayout],
  customer: [loadLayout, loadDashboard, loadProducts, loadOrders, loadWallet],
  manager: [loadLayout, loadAdminDashboard, loadAdminOrders, loadSettings],
  admin: [
    loadLayout,
    loadDashboard,
    loadProducts,
    loadAdminDashboard,
    loadAdminOrders,
    loadAdminProducts,
    loadSettings,
  ],
};

const scheduleIdle = (callback, timeout = 2500) => {
  if (typeof window === 'undefined') return null;
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  }
  return window.setTimeout(callback, Math.min(timeout, 900));
};

const clearIdle = (handle) => {
  if (typeof window === 'undefined' || handle == null) return;
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
};

const canWarmRoutes = () => {
  if (typeof window === 'undefined') return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) return false;
  const effectiveType = String(connection?.effectiveType || '').toLowerCase();
  return !effectiveType.includes('2g');
};

const preloadLoaders = (loaders = []) => {
  Array.from(new Set(loaders)).forEach((loader, index) => {
    scheduleIdle(() => {
      loader().catch(() => {});
    }, 2200 + (index * 700));
  });
};

const RouteWarmup = () => {
  const role = useAuthStore((state) => String(state.user?.role || '').toLowerCase());

  useEffect(() => {
    if (!canWarmRoutes()) return undefined;

    const normalizedRole = ['customer', 'manager', 'moderator', 'supervisor', 'admin'].includes(role)
      ? role
      : role === 'super_admin'
        ? 'admin'
        : 'guest';
    const warmupRole = ['manager', 'moderator', 'supervisor'].includes(normalizedRole) ? 'manager' : normalizedRole;
    const handle = scheduleIdle(() => {
      preloadLoaders(warmupByRole[warmupRole]);
    });

    return () => clearIdle(handle);
  }, [role]);

  return null;
};

export default RouteWarmup;
