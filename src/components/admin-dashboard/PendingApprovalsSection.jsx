import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, LoaderCircle, UserCheck } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button, { cn } from '../ui/Button';
import {
  getAccountStatusBadgeVariant,
  getAccountStatusLabel,
  getSignupMethodLabel,
  getUserRegistrationDate,
} from '../../utils/accountStatus';
import { resolveUserAvatar } from '../../utils/avatar';

const PendingApprovalsSection = ({
  users = [],
  isArabic,
  formatDate,
  onApproveUser = null,
  onRejectUser = null,
  approvingUserId = '',
  rejectingUserId = '',
}) => {
  return (
    <Card variant="elevated" className="mx-auto w-[calc(100vw-1.5rem)] max-w-[42rem] p-4 sm:w-full sm:p-6 xl:max-w-none">
      <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', isArabic && 'sm:flex-row-reverse')}>
        <div className={cn(isArabic ? 'text-right' : 'text-left')}>
          <div className={cn('flex items-center gap-3', isArabic && 'flex-row-reverse')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-warning-rgb)/0.22)] bg-[color:rgb(var(--color-warning-rgb)/0.12)] text-[var(--color-warning)]">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)] sm:text-xl">
                {isArabic ? 'طلبات تفعيل الحسابات' : 'Account Activation Requests'}
              </h2>
              <p className="mt-1 text-xs leading-6 text-[var(--color-text-secondary)] sm:text-sm">
                {isArabic
                  ? 'الحسابات الجديدة المسجلة عبر Google أو بانتظار مراجعة الإدارة.'
                  : 'New accounts waiting for an admin approval review.'}
              </p>
            </div>
          </div>
        </div>

        <div className={cn('flex items-center gap-3', isArabic && 'sm:flex-row-reverse')}>
          <Badge variant="warning" className="px-3 py-1.5 text-xs">
            {isArabic ? `بانتظار التفعيل: ${users.length}` : `Pending approvals: ${users.length}`}
          </Badge>
          <Link to="/admin/users?status=pending">
            <Button variant="outline" size="sm">
              {isArabic ? 'مراجعة الحسابات' : 'Review Accounts'}
            </Button>
          </Link>
        </div>
      </div>

      {!users.length ? (
        <div className="mt-6 rounded-[var(--radius-xl)] border border-dashed border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.72)] px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:rgb(var(--color-success-rgb)/0.12)] text-[var(--color-success)]">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {isArabic ? 'لا توجد حسابات معلقة الآن' : 'No pending accounts right now'}
          </p>
          <p className="mt-1 text-xs leading-6 text-[var(--color-text-secondary)] sm:text-sm">
            {isArabic
              ? 'كل طلبات التسجيل الحالية تمت مراجعتها بالفعل.'
              : 'All current signups have already been reviewed.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {users.slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className={cn(
                'rounded-[var(--radius-xl)] border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.78)] p-4 shadow-[var(--shadow-subtle)]',
                isArabic ? 'text-right' : 'text-left'
              )}
            >
              <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between', isArabic && 'lg:flex-row-reverse')}>
                <div className={cn('flex items-center gap-3', isArabic && 'flex-row-reverse')}>
                  <img
                    src={resolveUserAvatar(entry, entry.name || entry.email || 'OSCAR User')}
                    alt={entry.name}
                    className="h-12 w-12 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.82)] object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {entry.name}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-secondary)]">
                      {entry.email}
                    </p>
                  </div>
                </div>

                <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-center', isArabic && 'lg:flex-row-reverse')}>
                  <div className={cn('grid gap-2 text-xs text-[var(--color-text-secondary)] sm:grid-cols-3 lg:min-w-[22rem]', isArabic && 'text-right')}>
                    <div>
                      <p>{isArabic ? 'طريقة التسجيل' : 'Signup method'}</p>
                      <p className="mt-1 font-semibold text-[var(--color-text)]">
                        {getSignupMethodLabel(entry.signupMethod || entry.authProvider, isArabic)}
                      </p>
                    </div>
                    <div>
                      <p>{isArabic ? 'تاريخ التسجيل' : 'Created at'}</p>
                      <p className="mt-1 font-semibold text-[var(--color-text)]">
                        {formatDate(getUserRegistrationDate(entry))}
                      </p>
                    </div>
                    <div>
                      <p>{isArabic ? 'الحالة' : 'Status'}</p>
                      <div className={cn('mt-1 flex items-center justify-between gap-3 rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.6)] bg-[color:rgb(var(--color-surface-rgb)/0.65)] px-2.5 py-2', isArabic ? 'flex-row-reverse' : '')}>
                        {(onApproveUser || onRejectUser) ? (
                          <div className={cn('flex items-center gap-2', isArabic && 'flex-row-reverse')}>
                            {onRejectUser ? (
                              <button
                                type="button"
                                onClick={() => onRejectUser(entry)}
                                disabled={approvingUserId === entry.id || rejectingUserId === entry.id}
                                className="inline-flex min-w-[4rem] items-center justify-center rounded-full border border-rose-500/35 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-700 shadow-[var(--shadow-subtle)] transition-all duration-200 hover:scale-[1.03] hover:bg-rose-500/18 hover:shadow-[var(--shadow-soft)] disabled:pointer-events-none disabled:opacity-60 dark:text-rose-200"
                              >
                                {rejectingUserId === entry.id
                                  ? (isArabic ? 'جارٍ الرفض...' : 'Rejecting...')
                                  : (isArabic ? 'رفض' : 'Reject')}
                              </button>
                            ) : null}
                            {onApproveUser ? (
                              <button
                                type="button"
                                onClick={() => onApproveUser(entry)}
                                disabled={approvingUserId === entry.id || rejectingUserId === entry.id}
                                className="inline-flex min-w-[4.5rem] items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-[var(--shadow-subtle)] transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-500/18 hover:shadow-[var(--shadow-soft)] disabled:pointer-events-none disabled:opacity-60 dark:text-emerald-200"
                              >
                                {approvingUserId === entry.id
                                  ? (isArabic ? 'جارٍ التفعيل...' : 'Approving...')
                                  : (isArabic ? 'موافقة' : 'Approve')}
                              </button>
                            ) : null}
                            {(approvingUserId === entry.id || rejectingUserId === entry.id) ? (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[var(--color-text-secondary)]" />
                            ) : null}
                          </div>
                        ) : null}
                        <Badge variant={getAccountStatusBadgeVariant(entry.status)}>
                          {getAccountStatusLabel(entry.status, isArabic)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {users.length > 5 && (
            <div className={cn('flex', isArabic ? 'justify-start' : 'justify-end')}>
              <Link to="/admin/users?status=pending" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                {isArabic ? 'عرض جميع الطلبات' : 'View all requests'}
                <ArrowRight className={`h-4 w-4 ${isArabic ? '' : 'rotate-180'}`} />
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default PendingApprovalsSection;
