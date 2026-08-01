# Oscar Frontend

A production-ready **React + Vite** frontend for the Oscar digital products platform. The app provides a public storefront, authenticated customer panel, wallet and deposit flows, dynamic product purchase forms, referral/sub-agent tools, target purchase requests, customer support widgets, and a permission-aware admin/supervisor console.

The frontend is designed to work in two modes:

- **Mock mode** for UI development without a backend
- **Real API mode** for integration with the Express/MongoDB backend in `../Backend`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Core Directories](#4-core-directories)
5. [Routing and Access Control](#5-routing-and-access-control)
6. [API Provider Layer](#6-api-provider-layer)
7. [State Management](#7-state-management)
8. [Product and Order Experience](#8-product-and-order-experience)
9. [Wallet, Top-ups, and Financial Snapshots](#9-wallet-top-ups-and-financial-snapshots)
10. [Target Purchase System](#10-target-purchase-system)
11. [Referral, Support, and Mobile Additions](#11-referral-support-and-mobile-additions)
12. [Admin and Supervisor Capabilities](#12-admin-and-supervisor-capabilities)
13. [Localization, Theme, and UI System](#13-localization-theme-and-ui-system)
14. [Setup and Installation](#14-setup-and-installation)
15. [Environment Configuration](#15-environment-configuration)
16. [Available Scripts](#16-available-scripts)
17. [Build and Deployment](#17-build-and-deployment)
18. [Troubleshooting](#18-troubleshooting)
19. [Related Documentation](#19-related-documentation)

---

## 1. Project Overview

Oscar Frontend is the browser client for a digital products marketplace. Customers can browse products, register or sign in, manage their account, add wallet balance, purchase products, submit order-specific details, and track order history.

Admins and supervisors use the same app to manage users, products, groups, wallet operations, top-up approvals, payment settings, currencies, suppliers, orders, referral/sub-agent activity, WhatsApp sessions, target requests, and supervisor permissions.

**Core problems solved:**

- Presenting a fast Arabic-first storefront for digital goods
- Supporting both mock-data development and real backend integration
- Keeping customer flows, admin workflows, and supervisor permissions in one SPA
- Normalizing backend response shapes before they reach UI stores
- Preserving financial and order snapshots for historical display accuracy
- Providing route-level role and permission gates
- Keeping key reference data fresh without blocking initial rendering
- Supporting mobile builds through Capacitor Android

---

## 2. Key Features

### Public Storefront

The public catalog is available at `/` and `/catalog`. It displays products, categories, hero/announcement content, product cards, and public navigation before the user signs in.

### Authentication and Account States

The app supports login, registration, Google login hooks from the API layer, email verification states, two-factor login responses, pending accounts, rejected accounts, verification-required accounts, and the server-driven Google profile-completion flow for country/currency setup.

Account access states are routed through:

- `/auth`
- `/login`
- `/email-verified`
- `/auth/account-pending`
- `/auth/account-rejected`
- `/auth/verify-email`

### Role-Based Navigation

Supported frontend roles:

- `customer`
- `admin`
- `super_admin`
- `supervisor`
- `manager`
- `moderator`

Admins get full access. Supervisors, managers, and moderators are checked against granular permissions before admin pages render.

### Permission-Aware Admin Panel

Admin routes use permission constants from `src/utils/permissions.js`, including:

- `VIEW_USERS`
- `MANAGE_GROUPS`
- `MANAGE_PRODUCTS`
- `VIEW_WALLET`
- `MANAGE_DEPOSITS`
- `MANAGE_PAYMENT_METHODS`
- `MANAGE_CURRENCIES`
- `MANAGE_SUPPLIERS`
- `MANAGE_TARGETS`
- `MANAGE_SETTINGS`
- `MANAGE_WALLET`
- `MANAGE_USERS`
- `CONFIRM_ACCOUNTS`
- `CONFIRM_ORDERS`
- `CONFIRM_TARGET_REQUESTS`
- `VIEW_ACTIVITY_LOGS`

### Product Purchase Flow

Customers can open product details, select quantity, fill dynamic product/order fields, see pricing in their account currency, and submit an order through the selected API provider.

### Dynamic Order Fields

The frontend resolves product-specific fields from product metadata, supplier mappings, and legacy field shapes. Field helpers live in `src/utils/productPurchase.js`, while order display and enrichment helpers live in `src/utils/orders.js`.

### Multi-Currency Display

Currency metadata and exchange-rate information are loaded through `useSystemStore`. Pricing helpers in `src/utils/pricing.js` convert and format product/order amounts using available currency records.

### Wallet and Deposit Flow

Customers can view wallet balance, see transaction history, select payment methods, upload transfer proof, and submit top-up requests. Admins can review and approve or reject top-ups.

### Target Purchase Requests

Customers can submit target app purchase requests with payment proof. Admins can manage target apps/products and review target requests.

### Referral and Sub-Agent System

Customers can open `/referral` to copy/share referral codes, review invited customers, request earnings withdrawals, and submit sub-agent applications. Admins can use `/admin/referrals` to review referral owners, configure withdrawal methods and deduction percentages, attach withdrawal receipts, and approve/reject sub-agent requests.

### Customer Support Widgets

The authenticated app includes a floating customer service widget with WhatsApp, phone call, and Oscar Assistant actions. WhatsApp links use `VITE_ADMIN_WHATSAPP_NUMBER` when configured and fall back to the built-in support number.

### Oscar AI Assistant

`LazyOscarAIAssistant` mounts after idle time and supports product search, order/top-up guidance, payment help, navigation shortcuts, and local chat history. The dashboard shows the launcher directly, while the support widget can open the assistant from other supported customer routes.

### Route Transitions

`BarbaPageTransition` and Framer Motion provide branded page transitions while respecting reduced-motion preferences.

### Session Bootstrap

`SessionBootstrap` refreshes the active session, refreshes the profile, warms reference data, polls payment settings, listens for forced logout events, and synchronizes payment setting changes across tabs.

### Localization

The app is Arabic-first and supports Arabic and English with i18next. The page direction intentionally stays RTL to avoid layout jumps when switching language.

### Theme Support

The theme context supports dark and light modes. Dark mode is the default.

### Static Hosting Support

The app includes `public/_redirects` for SPA fallback routing and `public/_headers` for static hosting headers:

```text
/* /index.html 200
```

---

## 3. Frontend Architecture

```text
Browser
  |
  v
src/main.jsx
  |
  v
src/App.jsx
  |
  +-- ThemeProvider
  +-- LanguageProvider
  +-- ToastProvider
  +-- SessionBootstrap
  +-- BrowserRouter
        |
        +-- Floating Support Widgets
        |     LazyOscarAIAssistant, FloatingWhatsApp
        |
        +-- Public Routes
        |     /, /catalog, /about-us, /auth, /login
        |
        +-- Protected Layout
              |
              +-- Customer Routes
              |     dashboard, products, orders, wallet, account, referral, target requests
              |
              +-- Admin/Supervisor Routes
                    users, groups, products, wallet, payments, orders,
                    payment methods, currencies, suppliers, referrals,
                    WhatsApp, target requests

State Layer
  |
  +-- Zustand stores in src/store
  |
  v
API Provider Proxy
  |
  +-- src/services/client.js
        |
        +-- VITE_DATA_PROVIDER=mock -> src/services/mockApi.js
        |
        +-- VITE_DATA_PROVIDER=real -> src/services/realApi.js
              |
              +-- Axios -> VITE_API_BASE_URL
```

### Provider Flow

```text
UI page/component
  -> Zustand store action
    -> apiClient.<section>.<method>()
      -> mockApi or realApi
        -> normalized data returned to store
          -> UI renders stable frontend shape
```

### Session Flow

```text
Login/register/2FA
  -> useAuthStore writes auth state to localStorage key "auth-storage"
  -> realApi request interceptor attaches Bearer token
  -> SessionBootstrap refreshes profile and reference data
  -> ProtectedRoute checks auth, account status, role, and permission
```

---

## 4. Core Directories

| Path | Responsibility |
| --- | --- |
| `src/App.jsx` | Main route tree, lazy page loading, route guards, app providers |
| `src/main.jsx` | React entrypoint |
| `src/services/client.js` | API provider proxy that switches between mock and real API modules |
| `src/services/realApi.js` | Axios-backed backend adapter and response normalizer |
| `src/services/mockApi.js` | Mock data provider for local UI development |
| `src/store` | Zustand stores for auth, products, orders, top-ups, targets, admin data, system settings, and notifications |
| `src/pages` | Route-level page components |
| `src/pages/admin` | Admin and supervisor page components |
| `src/components` | Shared UI and feature components |
| `src/components/ai-assistant` | Lazy Oscar Assistant, assistant intent detection, and customer-support knowledge helpers |
| `src/components/app` | App-wide bootstrap components |
| `src/components/layout` | Authenticated shell, header, sidebars, brand UI |
| `src/components/home` | Public storefront sections |
| `src/components/orders` | Order tables, cards, filters, status badges, admin actions |
| `src/components/products` | Product cards, product search, loading skeletons, and empty states |
| `src/components/wallet` | Wallet cards, transaction UI, payment methods, receipt upload |
| `src/components/target` | Target request forms and admin target tables |
| `src/components/account` | Account security, OTP, confirmation, save bar |
| `src/components/ui` | Reusable primitives such as button, badge, card, modal, input, table, toast |
| `src/config` | Frontend feature flags |
| `src/context` | Theme and language providers |
| `src/services/accountSecurityApi.js` | Mock/in-memory account security and email OTP adapter used by the account security UI |
| `src/utils` | Formatting, routing, pricing, auth, permissions, order, wallet, image, WhatsApp, cache, and validation helpers |
| `src/data` | Mock data, country catalog, legacy translations, wallet seed data |
| `src/locales` | Bundled i18next locale JSON |
| `src/theme/tokens.css` | Design tokens |
| `src/assets` | Static product/storefront imagery |
| `public` | Favicons, app icons, static hosting redirects, and response headers |
| `android` | Capacitor Android project generated from the web build |
| `capacitor.config.ts` | Capacitor app id/name and web directory configuration |
| `scripts/build-android.ps1` | Android APK/AAB build helper |
| `scripts/generate-favicons.mjs` | Favicon generation script |

---

## 5. Routing and Access Control

Routes are declared in `src/App.jsx` and most pages are lazy-loaded with `React.lazy`.

### Public Routes

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | `PublicCatalog` | Public storefront |
| `/catalog` | `PublicCatalog` | Public catalog alias |
| `/about-us` | `AboutUsPage` | Public about page |
| `/auth` | `Auth` | Login/register page |
| `/login` | `Auth` | Login alias |
| `/email-verified` | `EmailVerified` | Email verification success |
| `/auth/account-pending` | `AccountPending` | Pending approval state |
| `/auth/account-rejected` | `AccountRejected` | Rejected account state |
| `/auth/verify-email` | `AccountVerificationRequired` | Email verification required |

Legacy account routes redirect:

- `/account-pending` -> `/auth/account-pending`
- `/account-rejected` -> `/auth/account-rejected`

### Authenticated Customer Routes

Most authenticated customer routes allow `customer`, `admin`, and supervisor roles. Customer-only routes are noted below.

| Route | Page | Purpose |
| --- | --- | --- |
| `/dashboard` | `Dashboard` | Customer/admin landing dashboard |
| `/orders` | `Orders` | Customer order history |
| `/orders/:orderId` | `OrderDetailsPage` | Order details |
| `/products` | `Products` | Authenticated product browser |
| `/products/:productId` | `ProductDetails` | Product details |
| `/products/:id` | `ProductDetails` | Product details alias |
| `/wallet` | `Wallet` | Wallet overview |
| `/wallet/add-balance` | `AddBalance` | Add balance flow |
| `/wallet/topups` | `WalletTopupHistory` | Top-up history |
| `/wallet/topup-history` | `WalletTopupHistory` | Top-up history alias |
| `/wallet/payment-details/:methodId` | `PaymentDetails` | Payment method instructions |
| `/settings` | `Settings` | Settings page |
| `/account` | `Account` | Account profile |
| `/account/security` | `AccountSecurity` | Account security and 2FA |
| `/account-security` | `AccountSecurity` | Security alias |
| `/referral` | `Referral` | Customer-only referral, earnings withdrawal, and sub-agent request page |
| `/contact-us` | `ContactUs` | Contact page |
| `/buy-target` | `BuyTarget` | Target purchase form |
| `/target-orders` | `TargetOrders` | Customer target order history |

### Admin and Supervisor Routes

`ADMIN_PANEL_ROLES` includes admins plus supervisor roles:

```js
['admin', 'super_admin', 'supervisor', 'manager', 'moderator']
```

| Route | Page | Permission |
| --- | --- | --- |
| `/admin` | redirect | Default admin panel route |
| `/manager/dashboard` | redirect | Manager dashboard alias |
| `/supervisor/dashboard` | redirect | Supervisor dashboard alias |
| `/admin/dashboard` | `AdminDashboard` | Admin panel role; supervisors redirect to `/dashboard` |
| `/admin/users` | `AdminUsers` | `VIEW_USERS` |
| `/admin/users/:userId/transactions` | `AdminUserTransactions` | `VIEW_USERS` |
| `/admin/groups` | `AdminGroups` | `MANAGE_GROUPS` |
| `/admin/products` | `AdminProducts` | `MANAGE_PRODUCTS` |
| `/admin/wallet` | `AdminWallet` | `VIEW_WALLET` |
| `/admin/referrals` | `AdminReferrals` | Admin panel role; referral feature flag must be enabled |
| `/admin/payments` | `AdminPayments` | `MANAGE_DEPOSITS` |
| `/admin/orders` | `AdminOrders` | `MANAGE_ORDERS` |
| `/admin/user-transactions` | `AdminUserTransactions` | Role gate only in the current permissions map |
| `/admin/supervisors` | `AdminSupervisors` | Role gate only in the current permissions map |
| `/admin/supervisors/:supervisorId/monitoring` | `SupervisorMonitoring` | Role gate only in the current permissions map |
| `/admin/supervisor-monitoring` | `SupervisorMonitoring` | Admin roles only |
| `/admin/topups` | redirect | Redirects to `/admin/payments` |
| `/admin/payment-methods` | `AdminPaymentMethods` | `MANAGE_PAYMENT_METHODS` |
| `/admin/currencies` | `AdminCurrencies` | `MANAGE_CURRENCIES` |
| `/admin/suppliers` | `AdminSuppliers` | `MANAGE_SUPPLIERS` |
| `/admin/target-requests` | `AdminTargetRequests` | `MANAGE_TARGETS` |
| `/admin/whatsapp` | `AdminWhatsApp` | `MANAGE_SETTINGS` |

### ProtectedRoute Behavior

`src/components/auth/ProtectedRoute.jsx` handles:

1. Redirect unauthenticated users to `/auth`
2. Redirect blocked accounts to account status pages
3. Validate role membership
4. Validate granular permissions
5. Redirect denied users to their default route or show an access-denied fallback

---

## 6. API Provider Layer

The frontend does not call `realApi.js` or `mockApi.js` directly from pages. UI code calls `apiClient`, which is a proxy created in `src/services/client.js`.

```js
const provider = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase();
```

### Mock Mode

```env
VITE_DATA_PROVIDER=mock
```

Mock mode loads `src/services/mockApi.js`.

Use this when:

- Working only on UI
- The backend is unavailable
- You want predictable local data
- You do not want network requests for core app data

### Real API Mode

```env
VITE_DATA_PROVIDER=real
VITE_API_BASE_URL=http://localhost:5000/api
```

Real mode loads `src/services/realApi.js`.

Real API behavior:

- Uses Axios
- Defaults to `http://localhost:5000/api` if `VITE_API_BASE_URL` is missing
- Attaches `Authorization: Bearer <token>` from `auth-storage`
- Attempts token refresh through `/auth/refresh`
- Dispatches `auth:force-logout` when the session expires
- Unwraps backend response envelopes
- Normalizes backend fields such as `_id` -> `id`
- Normalizes roles, statuses, products, users, orders, wallet transactions, and target requests

### API Sections

The provider modules expose these major sections so stores can switch between mock and real data without changing page code. Support varies slightly by section; for example, `publicCatalog` is implemented by the real API provider and the public catalog page falls back to the product/category store data when it is unavailable.

| Section | Responsibility |
| --- | --- |
| `auth` | Login, register, Google auth, profile, session refresh, 2FA |
| `notifications` | In-app notifications |
| `products` | Product catalog and admin product management |
| `categories` | Product categories |
| `suppliers` | Provider/supplier management |
| `users` | Admin user management |
| `adminWallets` | Admin wallet operations |
| `groups` | Pricing/user groups |
| `dashboard` | Admin dashboard summaries |
| `publicCatalog` | Public storefront data |
| `orders` | Customer and admin orders |
| `topups` | Deposit/top-up requests |
| `targetApps` | Target app management |
| `targetPurchases` | Target request lifecycle |
| `system` | Currencies, payment settings, runtime settings |
| `whatsapp` | Admin WhatsApp session status, reconnect, and reset actions |
| `audit` | Audit log access |
| `wallet` | Customer wallet stats and transactions |

---

## 7. State Management

The app uses Zustand stores under `src/store`. Stores own async data loading, cache windows, optimistic/local updates, and interaction with the API provider.

| Store | Responsibility |
| --- | --- |
| `useAuthStore` | User session, token, login/register, 2FA verification, profile refresh, blocked account state |
| `useMediaStore` | Products, categories, product/category CRUD, session cache, product normalization |
| `useOrderStore` | Customer orders, admin paginated orders, order creation, status updates, supplier status sync |
| `useTopupStore` | Customer top-up requests, admin top-up filtering, top-up approval/rejection |
| `useTargetStore` | Target apps/products, customer target requests, admin target request review |
| `useAdminStore` | Users, wallets, user transactions, admin activity feed, user management operations |
| `useGroupStore` | Pricing groups and group operations |
| `useSystemStore` | Currencies, payment settings, polling, cross-tab payment settings broadcast |
| `useNotificationStore` | Notifications and notification-related UI state |

### Cache and Refresh Behavior

| Data | Cache/Refresh Behavior |
| --- | --- |
| Auth profile | Short profile TTL, refresh on session bootstrap, window focus, online event, and interval |
| Products/categories | Session storage cache in real mode, short TTL to avoid refetch storms |
| Orders | Short cache by user/all scope |
| Currencies | Session storage cache in real mode |
| Payment settings | Fetched through system store, polled during authenticated sessions, broadcast across tabs |

### Session Storage and Local Storage Keys

| Key | Storage | Purpose |
| --- | --- | --- |
| `auth-storage` | localStorage | Persisted auth state and bearer token |
| `auth:logout-reason` | localStorage | Session logout reason, usually expired |
| `oscar-ai-assistant-history-v1` | localStorage | Local Oscar Assistant chat history |
| `kanzcoins_admin_referral_commission_rate` | localStorage | Admin referral commission-rate setting |
| `kanzcoins_referral_withdrawal_methods` | localStorage | Referral withdrawal method settings |
| `kanzcoins_referral_withdrawal_requests` | localStorage | Local referral withdrawal request queue |
| `oscar_sub_agent_requests` | localStorage | Local sub-agent request/review state |
| `oscar:media-cache:v1` | sessionStorage | Product/category cache |
| `oscar:currencies-cache:v1` | sessionStorage | Currency cache |

---

## 8. Product and Order Experience

### Product Loading

Products are loaded through `useMediaStore`, which calls:

```text
apiClient.products.list()
apiClient.categories.list()
```

The store normalizes product records so UI components can work with a stable shape across mock and real data.

Normalized product behavior includes:

- Resolving category IDs and category objects
- Mapping provider/supplier IDs
- Preserving provider product IDs
- Normalizing minimum, maximum, and step quantity
- Resolving display/base price
- Handling product availability flags
- Preserving inventory flags
- Building a search index

### Product Purchase Fields

Product purchase helpers in `src/utils/productPurchase.js` support:

- Quantity metadata
- Quantity clamping
- Dynamic order field resolution
- Field value sanitization
- Mapping product `orderFields`, `dynamicFields`, and supplier field mappings

Supported UI field types include:

| Type | Notes |
| --- | --- |
| `text` | Free text input |
| `number` | Numeric input |
| `email` | Email-shaped input |
| `select` | Option list |

The backend remains the source of truth for final validation and fulfillment. The frontend prepares and displays the fields so the customer can submit the required data.

### Order Creation

Order creation flows through `useOrderStore.addOrder()`.

High-level flow:

```text
Customer submits purchase form
  -> useOrderStore.addOrder()
  -> load current currencies and product data
  -> build frontend financial snapshot context
  -> apiClient.orders.create()
  -> prepend created order to order store
  -> notify admin/customer UI where relevant
```

### Order Display

Order helpers in `src/utils/orders.js` handle:

- Status normalization
- Manual order status labels
- Automatic vs manual order type display
- Site order number and supplier order number display
- Formatted order creation/update timestamps
- Fulfillment duration display from creation to completion/update time
- Dynamic order field display
- Primary identifier detection
- Money formatting using execution currency
- Order filtering, sorting, and summaries
- Supplier sync eligibility checks

---

## 9. Wallet, Top-ups, and Financial Snapshots

The frontend is built around the same financial principle as the backend: historical transactions should display the values recorded at execution time, not dynamically recalculated values from current exchange rates.

### Wallet Areas

| Area | Path |
| --- | --- |
| Wallet overview | `/wallet` |
| Add balance | `/wallet/add-balance` |
| Top-up history | `/wallet/topups` and `/wallet/topup-history` |
| Payment method details | `/wallet/payment-details/:methodId` |
| Admin wallet management | `/admin/wallet` |
| Admin payment review | `/admin/payments` |
| Payment method settings | `/admin/payment-methods` |

### Top-up Flow

```text
Customer selects payment method
  -> enters requested amount and sender details
  -> uploads receipt/proof
  -> useTopupStore.requestTopup()
  -> apiClient.topups.create/request endpoint
  -> admin reviews in payments panel
  -> approved top-up updates wallet data
```

### Financial Snapshot Rules

The frontend should:

- Prefer stored transaction/order snapshot values when available
- Display historical transaction execution currency when available
- Treat current exchange rates as affecting new transactions only
- Avoid recalculating old wallet or order amounts from current rates
- Keep backend-approved amounts as the source of truth
- Preserve and visibly highlight negative wallet balances when credit limits or admin adjustments allow them

Related helpers include:

- `src/utils/transactionCurrency.js`
- `src/utils/money.js`
- `src/utils/pricing.js`
- `src/utils/orders.js`

See `FINANCIAL_SNAPSHOT_SYSTEM.md` for the full business rules.

---

## 10. Target Purchase System

The target purchase system is separate from the standard product order flow. It lets customers submit requests for admin-managed target apps/products with proof of payment.

### Customer Flow

```text
/buy-target
  -> choose target app/product
  -> fill target form
  -> upload proof
  -> submit request
  -> track in /target-orders
```

### Admin Flow

```text
/admin/target-requests
  -> view customer target requests
  -> inspect uploaded proof and request details
  -> approve or reject with notes
```

### Store and API

| Layer | Path |
| --- | --- |
| Store | `src/store/useTargetStore.js` |
| API sections | `targetApps`, `targetPurchases` |
| Components | `src/components/target` |
| Customer pages | `BuyTarget`, `TargetOrders` |
| Admin page | `AdminTargetRequests` |

---

## 11. Referral, Support, and Mobile Additions

The referral and sub-agent UI is enabled by `REFERRALS_ENABLED` in `src/config/featureFlags.js`.

Customer referral capabilities:

- Copy the authenticated user's referral code
- Share a signup link; Real API mode combines the backend relative `sharePath` with `window.location.origin`
- Review invited customers, backend commission totals, commission history, filters, and pagination
- In Real API mode, select available commissions and submit payout requests to the backend
- In Mock mode, keep local/demo withdrawal previews for UI review
- Submit a sub-agent/reseller application and read backend current/history status in Real API mode

Admin referral capabilities:

- Review referral owners and invited-customer earnings
- Save a referral commission-rate setting
- Enable, disable, add, delete, and configure withdrawal methods
- Apply withdrawal deduction percentages
- Review backend payout requests in Real API mode and call admin reject/settle APIs
- Review local/mock withdrawal requests, attach transfer receipts, and mark them completed or failed in Mock mode
- Review backend reseller applications in Real API mode and call approve, reject, suspend, or reactivate APIs
- Approve or reject local/mock sub-agent requests and optionally move approved mock users into a selected group

In `VITE_DATA_PROVIDER=real`, the referral page uses `realApi.referrals.getDashboard()`, `getCommissions(params)`, `getInvitees(params)`, `getPayouts(params)`, and `createPayout(payload)` through `useReferralStore`. Financial totals come from persisted backend `ReferralCommission` records and remain Decimal strings in state; the browser does not calculate commission totals or use localStorage as a financial source. New currency-aware commissions display `commissionAmount` with `commissionCurrency`; payout selection refuses mixed currencies and submits selected commission ids and method only. Real-mode API failures show loading/error/empty states and do not fall back to mock commission data.

In Real API mode, the sub-agent area uses `realApi.resellerApplications.submit()`, `getCurrent()`, and `getHistory(params)` through `useResellerApplicationStore`. The browser does not write `oscar_sub_agent_requests`, approve itself, change reseller state, or mutate Groups locally in Real mode.

In Real API mode, `/admin/referrals` calls `realApi.adminReferralPayouts.list()`, `reject()`, and `settle()` for payouts and `realApi.adminResellerApplications.list()`, `approve()`, `reject()`, `suspend()`, and `reactivate()` for reseller applications. Backend actions own payout status, reseller state, and Group assignment; the admin UI does not locally mutate commission status, wallet balances, reseller status, or user Groups for server-backed records. Manual settlement prompts for an external reference; wallet settlement asks for confirmation and relies on backend wallet ledger idempotency. External payment-provider execution, payout cancellation, commission editing, reseller wallet credit limits, automatic reseller approval, and new auth roles are not implemented.

Phase 3B Real API mode renders backend-resolved product prices and uses `realApi.pricing.quote()` for purchase totals. The browser submits product id, quantity, and order fields only; it does not submit authoritative unit prices, totals, Groups, percentages, reseller status, exchange rates, or alternate user ids. Created order responses and immutable backend snapshots are the display truth after checkout. Real API failures do not fall back to mock pricing. Mock mode keeps its local demo pricing and quote logic independently.

Mock mode remains independent and local. Mock payout, withdrawal, and sub-agent request data is for UI review only and is not used as a fallback after Real API failures.

Google OAuth profile completion is server-driven in Real API mode. When the backend returns `profileCompletionRequired` and `missingProfileFields`, the auth page opens the existing completion form, requires country and currency, preserves any trusted OAuth referral as locked/read-only, and sends completion data to `/api/me/profile-completion`. Local storage is not treated as server truth for referral/profile completion.

### Support and Assistant Widgets

`FloatingWhatsApp` appears on supported authenticated routes for customers and admins. It offers WhatsApp, phone call, and Oscar Assistant actions, then builds support links through `src/utils/whatsapp.js`.

`LazyOscarAIAssistant` mounts after browser idle time and keeps local chat history under `oscar-ai-assistant-history-v1`. Assistant knowledge covers catalog search, payment methods, wallet/top-up guidance, order tracking, target services, support/contact navigation, and refund-policy responses.

### Motion and Mobile Shell

Route changes use `BarbaPageTransition` plus Framer Motion, with reduced-motion fallbacks. The newer shell also includes the compact/preview sidebar, wallet balance in the header/sidebar, unread-notification polling, and support-widget entry points.

The project now includes a tracked Capacitor Android project under `android/`; build commands are documented in the scripts and deployment sections.

---

## 12. Admin and Supervisor Capabilities

### User Management

Admins and permitted supervisors can:

- List users
- View user details
- View user transactions
- Approve or reject accounts
- Update profile fields
- Change user role
- Assign permissions
- Change user currency
- Assign pricing groups
- Set credit limits
- Update wallet balance
- Reset passwords
- Soft-delete and restore users
- Resend verification emails

### Product and Category Management

Admins can:

- Create products
- Update products
- Toggle product status
- Delete products
- Create/update/delete categories
- Configure supplier/provider links
- Configure inventory and availability fields
- Control visibility and purchase rules

### Order Management

Admins and permitted supervisors can:

- View paginated admin orders
- Filter/search orders by query, date range, page, and row limit
- Open order details
- Approve/complete orders
- Reject orders
- Update manual order status
- Sync supplier/provider order status
- See customer and product context

### Wallet and Payment Management

Admins can:

- View wallet balances
- Add, deduct, or set user balance
- View user transaction history
- Review top-up requests
- Approve/reject payment proof
- Configure payment methods and payment groups
- Manage WhatsApp support/payment contact number through payment settings

### Currency and Group Management

Admins can:

- Load currencies
- Add currencies
- Update currency rates/settings
- Delete currencies
- Manage pricing groups
- Apply group-based pricing metadata

### Supplier Management

Supplier/admin pages support supplier and provider-facing configuration from the frontend. The real behavior depends on backend provider support.

### Supervisor Monitoring

Admins can manage supervisor-like users and monitor supervisor activity through:

- `/admin/supervisors`
- `/admin/supervisors/:supervisorId/monitoring`
- `/admin/supervisor-monitoring`

### Referral and Sub-Agent Management

Admins can review referral earnings, configure withdrawal methods, process referral withdrawal requests, and approve/reject sub-agent applications through `/admin/referrals`.

### WhatsApp Session Management

Admins and permitted supervisor roles can use `/admin/whatsapp` to:

- Poll WhatsApp service status
- Display and refresh QR login state
- Reconnect the WhatsApp service
- Reset the stored WhatsApp session

---

## 13. Localization, Theme, and UI System

### Localization

i18next is configured in `src/i18n.js`.

| File | Purpose |
| --- | --- |
| `src/locales/ar/common.json` | Bundled Arabic translations |
| `src/locales/en/common.json` | Bundled English translations |
| `src/data/translations.js` | Legacy translation fallback |

Defaults:

- Default language: Arabic
- Fallback language: Arabic
- Supported languages: Arabic and English
- Layout direction: RTL

### Theme

`src/context/ThemeContext.jsx` provides:

- `theme`
- `isDark`
- `toggleTheme`
- `setTheme`

The app toggles:

- `document.documentElement.classList`
- `document.documentElement.dataset.theme`

### UI Building Blocks

Reusable UI lives in `src/components/ui`:

- `Button`
- `Badge`
- `Card`
- `Input`
- `Modal`
- `Table`
- `Toast`
- `Switch`
- `Loader`
- `SearchBar`
- `ThemeToggle`
- `LanguageSwitcher`
- `FloatingWhatsApp`
- `BackToTopButton`
- `BarbaPageTransition`

Feature UI also includes:

- `LazyOscarAIAssistant` and `OscarAIAssistant` in `src/components/ai-assistant`
- `ReferralBanner` on the public/customer home experience when referrals are enabled
- `WalletSidebarCard`, which keeps customer wallet balance visible in the sidebar

---

## 14. Setup and Installation

### Prerequisites

- Node.js 18 or newer
- npm
- Optional: backend API running from `../Backend`

### 1. Install dependencies

```powershell
cd Frontend
npm install
```

### 2. Create local environment file

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Bash/Git Bash:

```bash
cp .env.example .env.local
```

### 3. Choose API mode

For UI-only development:

```env
VITE_DATA_PROVIDER=mock
```

For backend integration:

```env
VITE_DATA_PROVIDER=real
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Start the frontend

```powershell
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

The `dev` script explicitly runs:

```text
vite --port=3000 --host=0.0.0.0
```

Note: `vite.config.js` also defines `server.port = 5173`, but the package script overrides it to `3000`.

---

## 15. Environment Configuration

Create `.env.local` in the frontend root.

Recommended local backend integration:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_DATA_PROVIDER=real
VITE_ADMIN_WHATSAPP_NUMBER=01066762671
VITE_PUBLIC_APP_URL=http://localhost:3000
VITE_APP_ENV=development
VITE_APP_MODE=development
APP_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key_here
```

### Phase 4B Staging Build

For controlled Staging verification, use Real API mode and the approved Staging Backend URL:

```env
VITE_DATA_PROVIDER=real
VITE_API_BASE_URL=https://staging-backend.example.com/api
VITE_PUBLIC_APP_URL=https://staging-frontend.example.com
VITE_APP_ENV=staging
VITE_APP_MODE=staging
```

Do not put secrets in `VITE_` variables because they are bundled into the browser build. Real mode must not fall back to mock/local financial data after an API failure.

### Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_DATA_PROVIDER` | Recommended | `mock` or `real`. Defaults to `mock` when missing. |
| `VITE_API_BASE_URL` | Required for real mode | Base backend API URL. Example: `http://localhost:5000/api`. |
| `VITE_ADMIN_WHATSAPP_NUMBER` | Optional | Number used by the WhatsApp floating/contact UI. Local Egyptian numbers such as `010...` are normalized to country code `20`. |
| `ADMIN_WHATSAPP_NUMBER` | Legacy fallback | Legacy non-`VITE_` name referenced by the WhatsApp helper. Vite client builds should use `VITE_ADMIN_WHATSAPP_NUMBER`. |
| `VITE_PUBLIC_APP_URL` | Optional | Public app origin used to build referral signup links. Defaults to `https://oscarstor.com`. |
| `VITE_OSCAR_BUILD_ID` | Optional | Build identifier exposed to the client by `vite.config.js`. |
| `VITE_APP_VERSION` | Optional | Fallback build identifier when `VITE_OSCAR_BUILD_ID` is not set. |
| `VITE_APP_ENV` | Optional | App environment label. |
| `VITE_APP_MODE` | Optional | App mode flag for feature/config checks. |
| `APP_URL` | Optional | Public frontend URL for app/self-reference integrations. |
| `GEMINI_API_KEY` | Optional | Present in templates for AI Studio/Gemini integrations; not required for the core UI. |
| `DISABLE_HMR` | Optional | Set to `true` to disable Vite HMR in development. |

### Environment Files

| File | Purpose |
| --- | --- |
| `.env.example` | Template for developers |
| `.env.local` | Private local overrides, should not be committed |
| `.env.development` | Shared development defaults |

Current shared development defaults include:

```env
VITE_API_BASE_URL=https://ibra-backend.onrender.com/api
VITE_ADMIN_WHATSAPP_NUMBER=01066762671
VITE_DATA_PROVIDER=mock
VITE_APP_ENV=development
VITE_APP_MODE=development
GEMINI_API_KEY=your_gemini_api_key_here
```

Important notes:

- Vite only exposes client-side variables that start with `VITE_`.
- Restart `npm run dev` after changing environment files.
- Use `.env.local` to override `VITE_DATA_PROVIDER` to `real` when testing the backend.
- Do not commit real API keys or credentials.

---

## 16. Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite on port `3000` and host `0.0.0.0`. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run TypeScript checks with `tsc --noEmit`. |
| `npm run sync:android` | Build the web app and sync `dist/` into the Capacitor Android project. |
| `npm run build:apk` | Build an Android debug APK through `scripts/build-android.ps1`. |
| `npm run build:aab` | Build an Android release bundle through `scripts/build-android.ps1`. |
| `npm run generate:favicons` | Generate favicon assets. |
| `npm run clean` | Remove `dist/`. |

### Quality Checks

```powershell
npm run lint
npm run build
```

There is currently no dedicated frontend unit test script in `package.json`. The main verification commands are the TypeScript no-emit check and the Vite production build.

---

## 17. Build and Deployment

### Production Build

```powershell
npm run build
```

Vite writes production assets to:

```text
dist/
```

`vite.config.js` also assigns `import.meta.env.VITE_OSCAR_BUILD_ID` from `VITE_OSCAR_BUILD_ID`, `VITE_APP_VERSION`, supported deploy commit variables, or a generated mode/timestamp fallback. Rollup chunks are grouped for major vendors such as React, React Router, Framer Motion, i18next, Zustand, Axios, and shared UI helpers.

### Preview Build

```powershell
npm run preview
```

### Android Build

The Android project is generated and tracked under `android/`, with Capacitor configured by `capacitor.config.ts`:

```ts
appId: 'com.oscar.app'
appName: 'Oscar'
webDir: 'dist'
```

Common Android commands:

```powershell
npm run sync:android
npm run build:apk
npm run build:aab
```

`sync:android` creates a fresh web build before running Capacitor sync. The APK/AAB scripts call `scripts/build-android.ps1` with the Gradle task needed for debug APK or release bundle output.

### Static Hosting

Deploy the contents of `dist/` to your hosting provider.

For Netlify-style static hosting, `public/_redirects` provides SPA fallback support:

```text
/* /index.html 200
```

For other hosts, configure all unknown routes to serve `index.html` so React Router deep links continue to work.

`public/_headers` is included for static-host response header configuration where the host supports it.

### Real API Deployment Checklist

1. Set `VITE_DATA_PROVIDER=real`
2. Set `VITE_API_BASE_URL` to the deployed backend API URL
3. Set `VITE_PUBLIC_APP_URL` to the deployed frontend URL if referral links should use that origin
4. Set `VITE_ADMIN_WHATSAPP_NUMBER` if the customer support/contact widget should use a deployed support number
5. Confirm backend CORS allows the frontend origin
6. Confirm auth refresh endpoint support if session refresh is expected
7. Confirm upload endpoints accept the deployed frontend origin
8. Confirm WhatsApp admin endpoints if `/admin/whatsapp` should be enabled in real mode
9. Run `npm run build`
10. Test login, catalog, wallet, order creation, referral, support widgets, and admin routes

---

## 18. Troubleshooting

### The app shows mock data while the backend is running

Check `.env.local`:

```env
VITE_DATA_PROVIDER=real
```

Then restart the dev server.

### API requests go to the wrong backend

Check:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Then restart `npm run dev`.

### Deep links return 404 after deployment

Configure SPA fallback to `index.html`. The repo already includes:

```text
public/_redirects
```

with:

```text
/* /index.html 200
```

Some hosting providers need an equivalent rule in their own config format.

### Login succeeds but protected pages redirect away

Check the user payload returned by the backend:

- `role` must match a supported frontend role
- `status` must normalize to `approved`
- supervisor users need the required permission for the route
- token must be saved under `auth-storage`

### Admin page says access denied

Check the route permission in `src/App.jsx` and the permission aliases in `src/utils/permissions.js`. Admin roles bypass permission checks, while supervisor roles require explicit permission entries.

### Product images or uploaded files do not load

Check:

- `VITE_API_BASE_URL`
- backend static upload hosting
- `src/utils/imageUrl.js`
- whether the backend returns relative upload paths such as `/uploads/products/...`

### Payment settings do not update across tabs

The app uses `BroadcastChannel` with:

```text
payment-settings-updates
```

If the browser does not support `BroadcastChannel`, the current tab still updates immediately, but other tabs may need refresh or polling.

### WhatsApp support opens the wrong number

Set:

```env
VITE_ADMIN_WHATSAPP_NUMBER=01066762671
```

Then restart the dev server or rebuild. Local Egyptian numbers beginning with `0` are normalized to `20...`.

### Admin WhatsApp page cannot connect

Check that the backend exposes:

```text
GET /admin/whatsapp/status
POST /admin/whatsapp/reconnect
POST /admin/whatsapp/reset
```

The frontend polls status while the session is disconnected, initializing, resetting, reconnecting, or waiting for QR scan.

### Referral links use the wrong production origin

Set:

```env
VITE_PUBLIC_APP_URL=https://your-frontend-domain.example
```

Then rebuild the frontend. The referral page uses this value when creating signup links.

### Android sync or build fails

Run a web build first, then sync Android:

```powershell
npm run build
npm run sync:android
```

If Gradle still fails, check local Android SDK/JDK setup and rerun `npm run build:apk` or `npm run build:aab`.

### Environment changes do not apply

Restart the Vite server. Vite reads environment variables at server startup/build time.

### TypeScript check fails on JavaScript files

The project uses:

```json
"allowJs": true,
"noEmit": true
```

So `npm run lint` can report type-checking issues from JavaScript files as well as JSX/TS-compatible code paths.

---

## 19. Related Documentation

| File | Purpose |
| --- | --- |
| `ENVIRONMENT_SETUP.md` | Detailed environment setup guide |
| `ENVIRONMENT_CONFIG.md` | Environment checklist |
| `FINANCIAL_SNAPSHOT_SYSTEM.md` | Financial snapshot rules for wallet/order integrity |
| `BALANCE_CALCULATION_TEST.md` | Balance calculation verification notes |
| `TROUBLESHOOTING_PRODUCTS.md` | Product troubleshooting notes |
| `FIX_SUMMARY.md` | Historical fix summary |
| `QUICK_FIX.md` | Historical quick-fix notes |
| `../Backend/README.md` | Backend architecture, APIs, jobs, wallet logic, provider system, and tests |

---

## Backend Pairing Notes

When running the full platform locally:

```powershell
# Terminal 1
cd Backend
npm install
npm run dev

# Terminal 2
cd Frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set frontend `.env.local`:

```env
VITE_DATA_PROVIDER=real
VITE_API_BASE_URL=http://localhost:5000/api
```

Then open:

```text
http://localhost:3000
```
