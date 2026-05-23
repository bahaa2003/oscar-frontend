import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wallet as WalletIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BalanceCard from '../../components/wallet/BalanceCard';
import StatsCards from '../../components/wallet/StatsCards';
import FilterBar from '../../components/wallet/FilterBar';
import EmptyTransactions from '../../components/wallet/EmptyTransactions';
import TransactionCard from '../../components/wallet/TransactionCard';
import { useLanguage } from '../../context/LanguageContext';

const Wallet = () => {
  const { dir } = useLanguage();
  const navigate = useNavigate();
  const isRTL = dir === 'rtl';

  // Mock data - in real app, this would come from API
  const [balance] = useState(2500);
  const [stats] = useState({
    totalDeposits: '5,250 EGP',
    totalSpent: '2,750 EGP',
    netBalance: '2,500 EGP',
    totalTransactions: '24'
  });

  const [transactions] = useState([
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
  ]);

  // If some references should be hidden (disputed/fraud), list them here
  const hiddenReferences = ['10057', '10056', '10055', '10054', '10051', '10050'];

  const visibleTransactionsInitial = transactions.filter(t => !hiddenReferences.includes(t.reference));

  const [filteredTransactions, setFilteredTransactions] = useState(visibleTransactionsInitial);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleFilterChange = (filters) => {
    let filtered = [...transactions];

    if (filters.period !== 'all') {
      const now = new Date();
      const periodMap = {
        today: 1,
        week: 7,
        month: 30,
        year: 365
      };
      const days = periodMap[filters.period];
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.date) >= cutoffDate);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // remove hidden/disputed references before updating
    filtered = filtered.filter(t => !hiddenReferences.includes(t.reference));

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const handleAddBalance = () => {
    navigate('/wallet/add-balance');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-12 sm:pb-16 ${isRTL ? 'rtl' : 'ltr'}`} dir={dir}>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-3 sm:px-4 sm:space-y-8">
        
        {/* Hero Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[32px] border border-gray-200/60 bg-gradient-to-br from-white via-white/95 to-gray-50/80 p-8 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:p-10 dark:border-gray-800/60 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800/80"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-200/30 to-transparent blur-3xl dark:from-blue-900/20" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-br from-purple-200/20 to-transparent blur-3xl dark:from-purple-900/10" />
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
              <WalletIcon className="h-7 w-7" />
            </div>
            
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                محفظتك
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                إدارة أموالك ومتابعة المعاملات
              </p>
            </div>
          </div>
        </motion.header>

        {/* Balance Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <BalanceCard
            balance={balance}
            currency="EGP"
            secondaryBalance={Math.round(balance / 50)}
            secondaryCurrency="USD"
            onAddBalance={handleAddBalance}
          />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatsCards stats={stats} />
        </motion.div>

        {/* Transactions Header Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative overflow-hidden rounded-[28px] border border-gray-200/60 bg-gradient-to-br from-white via-white/95 to-gray-50/80 p-6 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:p-8 dark:border-gray-800/60 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800/80"
        >
          <h2 className={`text-2xl font-bold text-gray-950 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
            المعاملات الأخيرة
          </h2>
          <p className={`mt-2 text-sm text-gray-600 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
            متابعة جميع معاملاتك والإيداعات والمشتريات
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <FilterBar
            onFilterChange={handleFilterChange}
            total={filteredTransactions.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-2 sm:space-y-3"
        >
          {filteredTransactions.length === 0 ? (
            <EmptyTransactions onAddBalance={handleAddBalance} />
          ) : (
            <>
              {(() => {
                const total = filteredTransactions.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const start = (currentPage - 1) * pageSize;
                const pageSlice = filteredTransactions.slice(start, start + pageSize);

                return pageSlice.map((transaction, idx) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    index={start + idx}
                  />
                ));
              })()}
            </>
          )}
        </motion.div>
        {/* Pagination Controls */}
        <div className="mx-auto mt-3 flex w-full max-w-6xl items-center justify-center px-3 sm:px-4">
          {filteredTransactions.length > pageSize && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 shadow-sm dark:bg-gray-800/60">
              {(() => {
                const total = filteredTransactions.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10);
                return (
                  <>
                    {pages.map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-2 py-1 text-sm font-semibold ${p === currentPage ? 'bg-blue-500 text-white rounded' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        {p}
                      </button>
                    ))}
                    {totalPages > pages.length && (
                      <span className="px-2 text-sm text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage((s) => Math.min(totalPages, s + 1))}
                      className="ml-2 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      التالي
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Balance Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleAddBalance}
        className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 shadow-lg transition-all hover:shadow-2xl sm:bottom-8 sm:right-8 sm:h-14 sm:w-14"
      >
        <Plus className="h-7 w-7 text-white sm:h-6 sm:w-6" />
      </motion.button>
    </div>
  );
};

export default Wallet;


