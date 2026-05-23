// Mock data for wallet and payment features

export const mockWalletStats = {
  totalDeposits: '5,250 EGP',
  totalSpent: '2,750 EGP',
  netBalance: '2,500 EGP',
  totalTransactions: 24
};

export const mockTransactions = [
  {
    id: '1',
    type: 'deposit',
    description: 'إيداع من خلال فودافون كاش',
    amount: 500,
    currency: 'EGP',
    status: 'completed',
    date: '2024-01-15T10:30:00Z',
    reference: 'TXN-001'
  },
  {
    id: '2',
    type: 'purchase',
    description: 'شراء PUBG Mobile UC',
    amount: -325,
    currency: 'EGP',
    status: 'completed',
    date: '2024-01-14T15:45:00Z',
    reference: 'ORD-001'
  },
  {
    id: '3',
    type: 'transfer',
    description: 'تحويل إلى صديق',
    amount: -200,
    currency: 'EGP',
    status: 'completed',
    date: '2024-01-13T09:20:00Z',
    reference: 'TRF-001'
  },
  {
    id: '4',
    type: 'deposit',
    description: 'إيداع من خلال البنك',
    amount: 1000,
    currency: 'EGP',
    status: 'pending',
    date: '2024-01-12T14:10:00Z',
    reference: 'TXN-002'
  }
];

export const mockPaymentMethods = [];
