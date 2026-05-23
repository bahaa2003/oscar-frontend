import React, { useEffect, useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import useTopupStore from '../../store/useTopupStore';
import useAuthStore from '../../store/useAuthStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/account/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate, formatNumber, formatTime } from '../../utils/intl';

const AdminTopups = () => {
  const { topups, loadTopups, updateTopupStatus } = useTopupStore();
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopup, setSelectedTopup] = useState(null);
  const [amount, setAmount] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsTopup, setDetailsTopup] = useState(null);
  const [rejectTopupId, setRejectTopupId] = useState('');

  useEffect(() => {
    loadTopups({ force: true });
  }, [loadTopups]);

  const getStatusVariant = (status) => {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'warning';
  };

  const getDisplayAmount = (topup) => {
    if (topup.financialSnapshot) {
      return `${formatNumber(topup.financialSnapshot.originalAmount, 'ar-EG')} ${topup.financialSnapshot.originalCurrency}`;
    }

    return formatNumber(topup.requestedAmount || topup.requestedCoins || 0, 'ar-EG');
  };

  const handleApproveClick = (topup) => {
    setSelectedTopup(topup);
    setAmount(String(topup.requestedCoins || topup.requestedAmount || ''));
    setIsModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedTopup) return;

    const finalAmount = Number(amount);
    if (!finalAmount || finalAmount <= 0) {
      addToast('المبلغ غير صالح', 'error');
      return;
    }

    await updateTopupStatus(selectedTopup.id, 'approved', {
      actualPaidAmount: finalAmount,
      currencyCode: selectedTopup.currencyCode || 'USD',
      adminNote: '',
    });

    addToast(`${t('approve')} ${finalAmount} ${t('coins')}`, 'success');
    setIsModalOpen(false);
  };

  const handleReject = (id) => {
    setRejectTopupId(id);
  };

  const confirmRejectTopup = async () => {
    if (!rejectTopupId) return;
    await updateTopupStatus(rejectTopupId, 'rejected');
    addToast(t('reject'), 'info');
    setRejectTopupId('');
  };

  const handleViewDetails = (topup) => {
    setDetailsTopup(topup);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="min-w-0 space-y-6">
      <section className="admin-premium-hero">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('topupRequests')}</h1>
      </section>

      <div className="space-y-3 md:hidden">
        {topups.map((topup) => (
          <article key={topup.id} className="admin-premium-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">{topup.userName}</p>
                <p className="mt-1 text-xs text-gray-500">المعرف: {topup.userId}</p>
                <p className="mt-1 text-xs text-gray-500">{formatDate(topup.createdAt, 'ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
              <Badge variant={getStatusVariant(topup.status)}>
                {t(`status_${topup.status}`) || topup.status}
              </Badge>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-white">{t('amount')}:</span>{' '}
                {getDisplayAmount(topup)}
              </p>

              {topup.financialSnapshot && (
                <p className="text-xs text-gray-500">
                  → {formatNumber(topup.financialSnapshot.finalAmountAtExecution, 'ar-EG')} coins
                </p>
              )}

              {topup.paymentChannel && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">{t('paymentMethod')}:</span>{' '}
                  {topup.paymentChannel}
                </p>
              )}

              {topup.type === 'game_topup' && topup.gameDetails && (
                <p className="text-xs font-medium text-blue-600">
                  {topup.gameDetails.gameName} - {topup.gameDetails.packageName}
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handleViewDetails(topup)}>
                <Eye className="h-4 w-4" />
              </Button>
              {topup.status === 'pending' && topup.type !== 'game_topup' && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() => handleApproveClick(topup)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(topup.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              {topup.status === 'pending' && topup.type === 'game_topup' && (
                <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  تلقائي
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="admin-premium-panel hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead className="text-center">{t('users')}</TableHead>
              <TableHead className="text-center">{t('amount')}</TableHead>
              <TableHead className="text-center">{t('common.status', { defaultValue: 'الحالة' })}</TableHead>
              <TableHead className="text-end">{t('actions') || 'الإجراءات'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topups.map((topup) => (
              <TableRow key={topup.id}>
                <TableCell>{formatDate(topup.createdAt, 'ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                <TableCell className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">{topup.userName}</div>
                  <div className="text-xs text-gray-500">المعرف: {topup.userId}</div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">{getDisplayAmount(topup)}</div>
                  {topup.financialSnapshot && (
                    <div className="text-xs text-gray-500">
                      → {formatNumber(topup.financialSnapshot.finalAmountAtExecution, 'ar-EG')} coins
                    </div>
                  )}
                  {topup.type === 'game_topup' && topup.gameDetails && (
                    <div className="text-xs font-medium text-blue-600">
                      {topup.gameDetails.gameName} - {topup.gameDetails.packageName}
                    </div>
                  )}
                  {topup.actualPaidAmount && topup.actualPaidAmount !== (topup.requestedAmount || topup.requestedCoins) && (
                    <div className="text-xs text-amber-600">
                      الفعلي: {formatNumber(topup.actualPaidAmount, 'ar-EG')} {topup.currencyCode}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={getStatusVariant(topup.status)}>
                    {t(`status_${topup.status}`) || topup.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(topup)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {topup.status === 'pending' && topup.type !== 'game_topup' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                          onClick={() => handleApproveClick(topup)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(topup.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {topup.status === 'pending' && topup.type === 'game_topup' && (
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                        تلقائي
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('topupRequests') || 'اعتماد طلب شحن'}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleConfirmApprove}>{t('confirm')}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('approve')} <strong>{selectedTopup?.userName}</strong>.
          </p>
          <Input
            label={t('coins')}
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={t('topupDetails') || 'تفاصيل الشحنة'}
        size="lg"
      >
        {detailsTopup && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{t('user')}</h3>
                <p className="text-gray-600 dark:text-gray-300">{detailsTopup.userName}</p>
                <p className="text-sm text-gray-500">المعرف: {detailsTopup.userId}</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{t('date')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {formatDate(detailsTopup.createdAt, 'ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })} {formatTime(detailsTopup.createdAt, 'ar-EG')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{t('amount')}</h3>
                <p className="text-gray-600 dark:text-gray-300">{getDisplayAmount(detailsTopup)}</p>
                {detailsTopup.financialSnapshot && (
                  <p className="text-sm text-gray-500">
                    → {formatNumber(detailsTopup.financialSnapshot.finalAmountAtExecution, 'ar-EG')} coins
                  </p>
                )}
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{t('common.status', { defaultValue: 'الحالة' })}</h3>
                <Badge variant={getStatusVariant(detailsTopup.status)}>
                  {t(`status_${detailsTopup.status}`) || detailsTopup.status}
                </Badge>
              </div>
            </div>

            {detailsTopup.paymentChannel && (
              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{t('paymentMethod')}</h3>
                <p className="text-gray-600 dark:text-gray-300">{detailsTopup.paymentChannel}</p>
              </div>
            )}

            {detailsTopup.senderWalletNumber && (
              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{t('senderWallet')}</h3>
                <p className="break-all text-gray-600 dark:text-gray-300">{detailsTopup.senderWalletNumber}</p>
              </div>
            )}

            {detailsTopup.proofImage && (
              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{t('proofOfPayment')}</h3>
                <img
                  src={detailsTopup.proofImage}
                  alt="Proof of payment"
                  className="h-auto max-w-full rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}

            {detailsTopup.financialSnapshot && (
              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{t('financialDetails')}</h3>
                <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 dark:text-gray-300">{t('exchangeRate')}:</span>
                    <span className="text-end font-medium">1 {detailsTopup.financialSnapshot.originalCurrency} = {formatNumber(detailsTopup.financialSnapshot.exchangeRateAtExecution, 'ar-EG')} coins</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 dark:text-gray-300">{t('convertedAmount')}:</span>
                    <span className="text-end font-medium">{formatNumber(detailsTopup.financialSnapshot.convertedAmountAtExecution, 'ar-EG')} coins</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 dark:text-gray-300">{t('finalAmount')}:</span>
                    <span className="text-end font-medium">{formatNumber(detailsTopup.financialSnapshot.finalAmountAtExecution, 'ar-EG')} coins</span>
                  </div>
                </div>
              </div>
            )}

            {detailsTopup.type === 'game_topup' && detailsTopup.gameDetails && (
              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{t('gameDetails')}</h3>
                <div className="space-y-2 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 dark:text-gray-300">{t('gameName')}:</span>
                    <span className="text-end font-medium">{detailsTopup.gameDetails.gameName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 dark:text-gray-300">{t('gameId')}:</span>
                    <span className="text-end font-medium">{detailsTopup.gameDetails.gameId}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 dark:text-gray-300">{t('package')}:</span>
                    <span className="text-end font-medium">{detailsTopup.gameDetails.packageName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 dark:text-gray-300">{t('quantity')}:</span>
                    <span className="text-end font-medium">{formatNumber(detailsTopup.gameDetails.quantity, 'ar-EG')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(rejectTopupId)}
        title="رفض طلب الشحن"
        description={t('deleteConfirm') || 'هل تريد رفض الطلب؟'}
        confirmLabel={t('reject') || 'رفض'}
        cancelLabel="إلغاء"
        onConfirm={confirmRejectTopup}
        onCancel={() => setRejectTopupId('')}
      />
    </div>
  );
};

export default AdminTopups;
