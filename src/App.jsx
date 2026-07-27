import React, { Suspense, lazy, useEffect } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import FloatingWhatsApp from './components/ui/FloatingWhatsApp';
import BarbaPageTransition from './components/ui/BarbaPageTransition';
import LazyOscarAIAssistant from './components/ai-assistant/LazyOscarAIAssistant';
import SessionBootstrap from './components/app/SessionBootstrap';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { ADMIN_ROLES, SUPERVISOR_ROLES, isSupervisorRole } from './utils/authRoles';
import { PERMISSIONS } from './utils/permissions';
import {
  ACCOUNT_PENDING_ROUTE,
  ACCOUNT_REJECTED_ROUTE,
  ACCOUNT_VERIFICATION_ROUTE,
} from './utils/accountStatus';
import useAuthStore from './store/useAuthStore';

const Layout = lazy(() => import('./components/layout/Layout'));
const Auth = lazy(() => import('./pages/Auth'));
const AccountPending = lazy(() => import('./pages/AccountPending'));
const AccountRejected = lazy(() => import('./pages/AccountRejected'));
const AccountVerificationRequired = lazy(() => import('./pages/AccountVerificationRequired'));
const EmailVerified = lazy(() => import('./pages/EmailVerified'));
const PublicCatalog = lazy(() => import('./pages/PublicCatalog'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Settings = lazy(() => import('./pages/Settings'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Account = lazy(() => import('./pages/Account'));
const AccountSecurity = lazy(() => import('./pages/AccountSecurity'));
const Referral = lazy(() => import('./pages/Referral'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminGroups = lazy(() => import('./pages/admin/AdminGroups'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminWallet = lazy(() => import('./pages/admin/AdminWallet'));
const AdminReferrals = lazy(() => import('./pages/admin/AdminReferrals'));
const AdminCurrencies = lazy(() => import('./pages/admin/AdminCurrencies'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminPaymentMethods = lazy(() => import('./pages/admin/AdminPaymentMethods'));
const AdminSupervisors = lazy(() => import('./pages/admin/AdminSupervisors'));
const SupervisorMonitoring = lazy(() => import('./pages/admin/SupervisorMonitoring'));
const AdminSuppliers = lazy(() => import('./pages/admin/AdminSuppliers'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUserTransactions = lazy(() => import('./pages/admin/AdminUserTransactions'));
const AdminTargetRequests = lazy(() => import('./pages/admin/AdminTargetRequests'));
const AdminWhatsApp = lazy(() => import('./pages/admin/AdminWhatsApp'));
const BuyTarget = lazy(() => import('./pages/BuyTarget'));
const TargetOrders = lazy(() => import('./pages/TargetOrders'));
const AddBalance = lazy(() => import('./pages/AddBalance'));
const WalletTopupHistory = lazy(() => import('./pages/WalletTopupHistory'));
const PaymentDetails = lazy(() => import('./pages/PaymentDetails'));

const ADMIN_PANEL_ROLES = [...ADMIN_ROLES, ...SUPERVISOR_ROLES];

const RouteLoader = () => null;

const renderSuspended = (element) => (
  <Suspense fallback={<RouteLoader />}>
    {element}
  </Suspense>
);

const AdminPanelDefaultRoute = () => {
  const user = useAuthStore((state) => state.user);
  const fallbackPath = isSupervisorRole(user?.role) ? '/dashboard' : '/admin/dashboard';

  return <Navigate to={fallbackPath} replace />;
};

const AdminDashboardRoute = () => {
  const user = useAuthStore((state) => state.user);

  if (isSupervisorRole(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return renderSuspended(<AdminDashboard />);
};

const AnimatedAppRoutes = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const transitionControls = useAnimationControls();
  const routeKey = location.pathname;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    if (shouldReduceMotion) {
      transitionControls.set({ opacity: 1, y: 0 });
      return;
    }

    transitionControls.set({ opacity: 0, y: 8 });
    transitionControls.start({
      opacity: 1,
      y: 0,
      transition: {
        opacity: { duration: 0.18, ease: 'easeOut' },
        y: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
      },
    });
  }, [routeKey, shouldReduceMotion, transitionControls]);

  const routes = (
    <Routes location={location}>
      <Route path="/" element={renderSuspended(<PublicCatalog />)} />
      <Route path="/catalog" element={renderSuspended(<PublicCatalog />)} />
      <Route path="/about-us" element={renderSuspended(<AboutUsPage />)} />
      <Route path="/auth" element={renderSuspended(<Auth />)} />
      <Route path="/login" element={renderSuspended(<Auth />)} />
      <Route path="/email-verified" element={renderSuspended(<EmailVerified />)} />
      <Route path={ACCOUNT_PENDING_ROUTE} element={renderSuspended(<AccountPending />)} />
      <Route path={ACCOUNT_REJECTED_ROUTE} element={renderSuspended(<AccountRejected />)} />
      <Route path={ACCOUNT_VERIFICATION_ROUTE} element={renderSuspended(<AccountVerificationRequired />)} />
      <Route path="/account-pending" element={<Navigate to={ACCOUNT_PENDING_ROUTE} replace />} />
      <Route path="/account-rejected" element={<Navigate to={ACCOUNT_REJECTED_ROUTE} replace />} />

      <Route element={renderSuspended(<Layout />)}>
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<Dashboard />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/orders"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<Orders />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/orders/:orderId"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<OrderDetailsPage />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/products"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<Products />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/products/:productId"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<ProductDetails />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/products/:id"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<ProductDetails />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/wallet"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<Wallet />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/settings"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<Settings />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/account"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<Account />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/account/security"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<AccountSecurity />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/account-security"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<AccountSecurity />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/referral"
          element={(
            <ProtectedRoute roles={['customer']}>
              {renderSuspended(<Referral />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/contact-us"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<ContactUs />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/buy-target"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<BuyTarget />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/target-orders"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<TargetOrders />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/wallet/add-balance"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<AddBalance />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/wallet/topups"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<WalletTopupHistory />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/wallet/topup-history"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<WalletTopupHistory />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/wallet/payment-details/:methodId"
          element={(
            <ProtectedRoute roles={['customer', 'admin', ...SUPERVISOR_ROLES]}>
              {renderSuspended(<PaymentDetails />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES}>
              <AdminPanelDefaultRoute />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/manager/dashboard"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES}>
              <AdminPanelDefaultRoute />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/supervisor/dashboard"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES}>
              <AdminPanelDefaultRoute />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/dashboard"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES}>
              <AdminDashboardRoute />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/users"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_USERS}>
              {renderSuspended(<AdminUsers />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/users/:userId/transactions"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_USERS}>
              {renderSuspended(<AdminUserTransactions />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/groups"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_GROUPS}>
              {renderSuspended(<AdminGroups />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/products"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_PRODUCTS}>
              {renderSuspended(<AdminProducts />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/wallet"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_WALLET}>
              {renderSuspended(<AdminWallet />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/referrals"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES}>
              {renderSuspended(<AdminReferrals />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/payments"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_PAYMENTS}>
              {renderSuspended(<AdminPayments />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/orders"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_ORDERS}>
              {renderSuspended(<AdminOrders />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/user-transactions"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_USER_TRANSACTIONS}>
              {renderSuspended(<AdminUserTransactions />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/supervisors"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_SUPERVISORS}>
              {renderSuspended(<AdminSupervisors />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/supervisors/:supervisorId/monitoring"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_SUPERVISORS}>
              {renderSuspended(<SupervisorMonitoring />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/supervisor-monitoring"
          element={(
            <ProtectedRoute roles={ADMIN_ROLES}>
              {renderSuspended(<SupervisorMonitoring />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/topups"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_PAYMENTS}>
              <Navigate to="/admin/payments" replace />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/payment-methods"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_PAYMENT_METHODS}>
              {renderSuspended(<AdminPaymentMethods />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/currencies"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_CURRENCIES}>
              {renderSuspended(<AdminCurrencies />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/suppliers"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_SUPPLIERS}>
              {renderSuspended(<AdminSuppliers />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/target-requests"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_TARGET_REQUESTS}>
              {renderSuspended(<AdminTargetRequests />)}
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/whatsapp"
          element={(
            <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.MANAGE_SETTINGS}>
              {renderSuspended(<AdminWhatsApp />)}
            </ProtectedRoute>
          )}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <>
      <BarbaPageTransition transitionKey={routeKey} />
      <motion.div
        className="min-h-screen"
        initial={false}
        animate={transitionControls}
      >
        {routes}
      </motion.div>
    </>
  );
};

const FloatingSupportWidgets = () => {
  const location = useLocation();
  const userRole = useAuthStore((state) => state.user?.role);
  const normalizedRole = String(userRole || '').trim().toLowerCase();
  const shouldShowAssistant = (
    normalizedRole === 'customer'
    || ADMIN_ROLES.includes(normalizedRole)
    || isSupervisorRole(userRole)
  );
  const shouldShowAssistantLauncher = location.pathname === '/dashboard';

  return (
    <>
      {shouldShowAssistant ? (
        <LazyOscarAIAssistant showLauncher={shouldShowAssistantLauncher} />
      ) : null}
      <FloatingWhatsApp />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <SessionBootstrap />
          <BrowserRouter>
            <AnimatedAppRoutes />
            <FloatingSupportWidgets />
          </BrowserRouter>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
