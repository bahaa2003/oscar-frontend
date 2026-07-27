import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Ban, Circle, Plus, Search, ShieldCheck, Trash2, UserCheck, UserCog, UserPlus, Users } from 'lucide-react';
import useAdminStore from '../../store/useAdminStore';
import useAuthStore from '../../store/useAuthStore';
import apiClient from '../../services/client';
import { useToast } from '../../components/ui/Toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/account/ConfirmDialog';
import {
  getAccountStatusBadgeVariant,
  getAccountStatusLabel,
  isRejectedAccountStatus,
  normalizeAccountStatus,
} from '../../utils/accountStatus';
import { SUPERVISOR_PERMISSION_GROUPS, normalizePermissions } from '../../utils/permissions';
import { resolveUserAvatar } from '../../utils/avatar';

const SUPERVISOR_ROLES = ['supervisor', 'manager', 'moderator'];

const AdminSupervisors = () => {
  const { users, loadUsers, updateUserRole, updateUserStatus, updateUserPermissions } = useAdminStore();
  const { user: actor } = useAuthStore();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [permissionTarget, setPermissionTarget] = useState(null);
  const [activityTarget, setActivityTarget] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateUsers, setCandidateUsers] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isPromotingSupervisor, setIsPromotingSupervisor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [demoteTarget, setDemoteTarget] = useState(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    Promise.resolve(loadUsers({ force: true })).finally(() => {
      if (mounted) setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [loadUsers]);

  const supervisors = useMemo(
    () => (users || []).filter((entry) => SUPERVISOR_ROLES.includes(String(entry.role || '').toLowerCase())),
    [users]
  );

  useEffect(() => {
    if (!isAddModalOpen) return undefined;

    let mounted = true;
    const timeout = setTimeout(async () => {
      setIsLoadingCandidates(true);
      try {
        const result = await apiClient.users.list({
          page: 1,
          limit: 20,
          sortBy: 'name',
          sortOrder: 'asc',
          search: candidateSearch.trim(),
        });
        const items = Array.isArray(result) ? result : (result?.users || []);
        const candidates = items.filter((entry) => {
          const role = String(entry?.role || '').toLowerCase();
          return entry?.id && !SUPERVISOR_ROLES.includes(role) && role !== 'admin';
        });

        if (mounted) {
          setCandidateUsers(candidates);
          setSelectedCandidateId((previous) => (
            candidates.some((entry) => String(entry.id) === String(previous)) ? previous : ''
          ));
        }
      } catch (error) {
        if (mounted) {
          setCandidateUsers([]);
          addToast(error?.message || 'فشل تحميل المستخدمين.', 'error');
        }
      } finally {
        if (mounted) setIsLoadingCandidates(false);
      }
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [addToast, candidateSearch, isAddModalOpen]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return supervisors.filter((entry) => {
      const normalizedStatus = normalizeAccountStatus(entry.status);
      const matchesStatus = statusFilter === 'all' ? true : normalizedStatus === statusFilter;
      const matchesSearch = !term
        ? true
        : String(entry.name || '').toLowerCase().includes(term)
          || String(entry.email || '').toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, supervisors]);

  const supervisorStats = useMemo(() => ({
    total: supervisors.length,
    online: supervisors.filter((entry) => isOnline(entry)).length,
    active: supervisors.filter((entry) => normalizeAccountStatus(entry.status) === 'approved').length,
    permissions: supervisors.reduce((total, entry) => total + normalizePermissions(entry.permissions).length, 0),
  }), [supervisors]);

  const handleRoleChange = async (id, nextRole) => {
    try {
      await updateUserRole(id, nextRole, actor);
      addToast('تم تحديث الدور بنجاح.', 'success');
      await loadUsers({ force: true });
    } catch (error) {
      addToast(error?.message || 'فشل تحديث الدور.', 'error');
    }
  };

  const openAddSupervisorModal = () => {
    setCandidateSearch('');
    setCandidateUsers([]);
    setSelectedCandidateId('');
    setIsAddModalOpen(true);
  };

  const closeAddSupervisorModal = () => {
    if (isPromotingSupervisor) return;
    setIsAddModalOpen(false);
    setCandidateSearch('');
    setCandidateUsers([]);
    setSelectedCandidateId('');
  };

  const promoteSelectedUser = async () => {
    if (!selectedCandidateId) {
      addToast('اختر مستخدمًا أولًا.', 'error');
      return;
    }

    setIsPromotingSupervisor(true);
    try {
      await updateUserRole(selectedCandidateId, 'SUPERVISOR', actor);
      addToast('تمت إضافة المشرف بنجاح.', 'success');
      setIsAddModalOpen(false);
      setCandidateSearch('');
      setCandidateUsers([]);
      setSelectedCandidateId('');
      await loadUsers({ force: true });
    } catch (error) {
      addToast(error?.message || 'فشل إضافة المشرف.', 'error');
    } finally {
      setIsPromotingSupervisor(false);
    }
  };

  const handleStatusToggle = async (target) => {
    const nextStatus = isRejectedAccountStatus(target.status) ? 'approved' : 'rejected';
    try {
      await updateUserStatus(target.id, nextStatus, actor);
      addToast(nextStatus === 'approved' ? 'تم تفعيل المشرف.' : 'تم حظر المشرف.', 'success');
      await loadUsers({ force: true });
    } catch (error) {
      addToast(error?.message || 'فشل تحديث الحالة.', 'error');
    }
  };

  const handleDemoteSupervisor = async (target) => {
    setDemoteTarget(target);
  };

  const confirmDemoteSupervisor = async () => {
    if (!demoteTarget?.id) return;
    try {
      await updateUserRole(demoteTarget.id, 'CUSTOMER', actor);
      await updateUserPermissions(demoteTarget.id, [], actor);
      addToast('تم تحويل المشرف إلى عميل.', 'success');
      setDemoteTarget(null);
      await loadUsers({ force: true });
    } catch (error) {
      addToast(error?.message || 'فشل تحويل المشرف إلى عميل.', 'error');
    }
  };

  const openPermissionsModal = (target) => {
    setPermissionTarget(target);
    setSelectedPermissions(normalizePermissions(target?.permissions));
  };

  const togglePermission = (permission) => {
    setSelectedPermissions((previous) => (
      previous.includes(permission)
        ? previous.filter((item) => item !== permission)
        : [...previous, permission]
    ));
  };

  const savePermissions = async () => {
    if (!permissionTarget?.id) return;
    setIsSavingPermissions(true);
    try {
      await updateUserPermissions(permissionTarget.id, selectedPermissions, actor);
      addToast('تم تحديث صلاحيات المشرف.', 'success');
      setPermissionTarget(null);
      await loadUsers({ force: true });
    } catch (error) {
      addToast(error?.message || 'فشل تحديث الصلاحيات.', 'error');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  function isOnline(entry) {
    if (entry?.isOnline || entry?.online) return true;
    const rawLastSeen = entry?.lastSeen || entry?.lastActiveAt || entry?.updatedAt;
    const lastSeen = rawLastSeen ? new Date(rawLastSeen).getTime() : 0;
    return lastSeen > 0 && Date.now() - lastSeen < 5 * 60 * 1000;
  }

  const getActivityLogs = (entry) => (
    Array.isArray(entry?.activityLogs) && entry.activityLogs.length
      ? entry.activityLogs
      : [
          { id: 'login', action: 'آخر ظهور', createdAt: entry?.lastSeen || entry?.lastActiveAt || entry?.updatedAt || entry?.createdAt },
          { id: 'permissions', action: `عدد الصلاحيات الحالية: ${normalizePermissions(entry?.permissions).length}`, createdAt: entry?.updatedAt || entry?.createdAt },
        ]
  );

  return (
    <div className="admin-supervisors-page min-w-0 space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-cyan-400/20 bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.96),rgb(var(--color-elevated-rgb)/0.78))] p-5 shadow-[var(--shadow-medium)] sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 h-60 w-60 rounded-full bg-fuchsia-500/14 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1.5 text-xs font-bold text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              مركز التحكم والصلاحيات
            </div>
            <h1 className="flex items-center gap-3 text-2xl font-black text-[var(--color-text)] sm:text-3xl">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#22d3ee,#7c3aed,#f43fdd)] text-white shadow-[0_16px_35px_-18px_rgba(34,211,238,0.8)]">
                <UserCog className="h-6 w-6" />
              </span>
              إدارة المشرفين
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
              إدارة فريق العمل، توزيع الصلاحيات ومتابعة حالة كل مشرف من مكان واحد.
            </p>
          </div>
          <Button type="button" onClick={openAddSupervisorModal} className="min-h-11 shrink-0 px-5">
            <UserPlus className="h-4 w-4" />
            إضافة مشرف جديد
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'إجمالي المشرفين', value: supervisorStats.total, icon: Users, iconClass: 'bg-cyan-400/10 text-cyan-300' },
          { label: 'متصل الآن', value: supervisorStats.online, icon: Activity, iconClass: 'bg-emerald-400/10 text-emerald-300' },
          { label: 'حسابات مفعّلة', value: supervisorStats.active, icon: UserCheck, iconClass: 'bg-violet-400/10 text-violet-300' },
          { label: 'صلاحيات ممنوحة', value: supervisorStats.permissions, icon: ShieldCheck, iconClass: 'bg-fuchsia-400/10 text-fuchsia-300' },
        ].map((stat) => (
          <div key={stat.label} className="group rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.62)] bg-[color:rgb(var(--color-card-rgb)/0.72)] p-4 shadow-[var(--shadow-subtle)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-400/30">
            <div className="mb-4 flex items-start justify-between gap-2">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${stat.iconClass}`}>
                <stat.icon className="h-5 w-5" />
              </span>
              <span className="text-2xl font-black text-[var(--color-text)]">{stat.value}</span>
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-[color:rgb(var(--color-border-rgb)/0.62)] bg-[color:rgb(var(--color-card-rgb)/0.62)] p-3 shadow-[var(--shadow-subtle)] backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <Input placeholder="ابحث باسم المشرف أو البريد الإلكتروني..." value={search} onChange={(event) => setSearch(event.target.value)} icon={<Search className="h-4 w-4" />} variant="search" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {[
              ['all', 'الكل'], ['approved', 'المفعّلون'], ['pending', 'قيد الانتظار'], ['rejected', 'المحظورون'],
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${statusFilter === value ? 'border-cyan-400/40 bg-cyan-400/12 text-cyan-300 shadow-[0_8px_20px_-14px_rgba(34,211,238,0.8)]' : 'border-transparent bg-[color:rgb(var(--color-surface-rgb)/0.5)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-[1.5rem] bg-[color:rgb(var(--color-primary-rgb)/0.08)]" />)}
        </div>
      ) : filtered.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => {
            const online = isOnline(entry);
            const permissionCount = normalizePermissions(entry.permissions).length;
            return (
              <article key={entry.id} className="group relative overflow-hidden rounded-[1.5rem] border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[linear-gradient(145deg,rgb(var(--color-card-rgb)/0.9),rgb(var(--color-surface-rgb)/0.72))] p-4 shadow-[var(--shadow-subtle)] transition duration-200 hover:-translate-y-1 hover:border-cyan-400/35 hover:shadow-[var(--shadow-medium)] sm:p-5">
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-fuchsia-500/8 blur-3xl" />
                <div className="relative flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img src={resolveUserAvatar(entry, entry.name || entry.email || 'OSCAR User')} alt={entry.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-14 w-14 rounded-2xl border border-white/10 bg-[var(--color-surface)] object-cover shadow-lg" />
                    <span className={`absolute -bottom-1 -left-1 h-4 w-4 rounded-full border-[3px] border-[var(--color-card)] ${online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-black text-[var(--color-text)]">{entry.name || 'مشرف بدون اسم'}</h2>
                    <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]" dir="ltr">{entry.email}</p>
                    <span className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold ${online ? 'text-emerald-300' : 'text-[var(--color-muted)]'}`}>
                      <Circle className={`h-2 w-2 ${online ? 'fill-current' : ''}`} />
                      {online ? 'متصل الآن' : 'غير متصل'}
                    </span>
                  </div>
                  <Badge variant={getAccountStatusBadgeVariant(entry.status)}>{getAccountStatusLabel(entry.status, true)}</Badge>
                </div>

                <div className="relative mt-5 grid grid-cols-2 gap-2">
                  <label className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.55)] bg-[color:rgb(var(--color-surface-rgb)/0.48)] p-2.5">
                    <span className="mb-1.5 block text-[10px] font-bold text-[var(--color-muted)]">الدور الوظيفي</span>
                    <select className="w-full bg-transparent text-xs font-bold text-[var(--color-text)] outline-none" value={entry.role} onChange={(event) => handleRoleChange(entry.id, event.target.value)}>
                      <option value="manager">مانجر</option><option value="moderator">مشرف</option><option value="supervisor">سوبرفايزر</option><option value="customer">عميل</option><option value="admin">أدمن</option>
                    </select>
                  </label>
                  <button type="button" onClick={() => openPermissionsModal(entry)} className="rounded-xl border border-violet-400/20 bg-violet-400/8 p-2.5 text-start transition hover:border-violet-400/40 hover:bg-violet-400/12">
                    <span className="mb-1.5 block text-[10px] font-bold text-[var(--color-muted)]">الصلاحيات</span>
                    <span className="flex items-center gap-1.5 text-xs font-black text-violet-300"><ShieldCheck className="h-4 w-4" />{permissionCount} صلاحية</span>
                  </button>
                </div>

                <div className="relative mt-4 flex items-center gap-2 border-t border-[color:rgb(var(--color-border-rgb)/0.42)] pt-4">
                  <Button size="sm" variant="outline" onClick={() => setActivityTarget(entry)} className="flex-1"><Activity className="h-4 w-4" />النشاط</Button>
                  <Button size="sm" variant={isRejectedAccountStatus(entry.status) ? 'primary' : 'outline'} onClick={() => handleStatusToggle(entry)} className="flex-1">
                    {isRejectedAccountStatus(entry.status) ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}{isRejectedAccountStatus(entry.status) ? 'تفعيل' : 'حظر'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDemoteSupervisor(entry)} aria-label="تحويل إلى عميل" title="تحويل إلى عميل"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.5)] px-5 py-14 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><Search className="h-6 w-6" /></span>
          <h2 className="mt-4 font-black text-[var(--color-text)]">لا توجد نتائج مطابقة</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">جرّب تغيير عبارة البحث أو اختيار حالة أخرى.</p>
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddSupervisorModal}
        title="إضافة مشرف"
        size="lg"
        footer={(
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={closeAddSupervisorModal} disabled={isPromotingSupervisor}>
              إلغاء
            </Button>
            <Button onClick={promoteSelectedUser} disabled={!selectedCandidateId || isPromotingSupervisor}>
              <UserPlus className="h-4 w-4" />
              {isPromotingSupervisor ? 'جارٍ الإضافة...' : 'تأكيد'}
            </Button>
          </div>
        )}
      >
        <div className="space-y-4">
          <Input
            label="البحث عن مستخدم"
            placeholder="ابحث بالاسم أو البريد..."
            value={candidateSearch}
            onChange={(event) => setCandidateSearch(event.target.value)}
            icon={<Search className="h-4 w-4" />}
            variant="search"
          />

          <div className="max-h-80 space-y-2 overflow-y-auto pe-1">
            {isLoadingCandidates ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-[color:rgb(var(--color-primary-rgb)/0.08)]" />
              ))
            ) : candidateUsers.length ? (
              candidateUsers.map((candidate) => {
                const isSelected = String(selectedCandidateId) === String(candidate.id);
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition ${
                      isSelected
                        ? 'border-[color:rgb(var(--color-primary-rgb)/0.65)] bg-[color:rgb(var(--color-primary-rgb)/0.12)]'
                        : 'border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.46)] hover:border-[color:rgb(var(--color-primary-rgb)/0.34)]'
                    }`}
                  >
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full bg-gray-800 object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[var(--color-text)]">{candidate.name}</span>
                      <span className="block truncate text-xs text-[var(--color-text-secondary)]">{candidate.email}</span>
                    </span>
                    <Badge variant={getAccountStatusBadgeVariant(candidate.status)}>
                      {getAccountStatusLabel(candidate.status, true)}
                    </Badge>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.42)] p-5 text-center text-sm text-[var(--color-text-secondary)]">
                لا يوجد مستخدمون متاحون للترقية.
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(permissionTarget)}
        onClose={() => !isSavingPermissions && setPermissionTarget(null)}
        title={permissionTarget ? `صلاحيات ${permissionTarget.name}` : 'صلاحيات المشرف'}
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPermissionTarget(null)} disabled={isSavingPermissions}>
              إلغاء
            </Button>
            <Button onClick={savePermissions} disabled={isSavingPermissions}>
              حفظ الصلاحيات
            </Button>
          </div>
        )}
      >
        <div className="grid gap-4">
          {SUPERVISOR_PERMISSION_GROUPS.map((group) => (
            <section key={group.id} className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.42)] p-3">
              <h3 className="mb-3 text-sm font-black text-[var(--color-text)]">{group.title}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.options.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.66)] bg-[color:rgb(var(--color-card-rgb)/0.58)] p-3 text-sm text-[var(--color-text)] transition hover:border-[color:rgb(var(--color-primary-rgb)/0.28)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(item.key)}
                      onChange={() => togglePermission(item.key)}
                      className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(activityTarget)}
        onClose={() => setActivityTarget(null)}
        title={activityTarget ? `سجلات النشاط - ${activityTarget.name}` : 'سجلات النشاط'}
        footer={<Button variant="ghost" onClick={() => setActivityTarget(null)}>إغلاق</Button>}
      >
        <div className="max-h-[50vh] space-y-2 overflow-y-auto pe-1">
          {activityTarget ? getActivityLogs(activityTarget).map((log) => (
            <div key={log.id || `${log.action}-${log.createdAt}`} className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.44)] p-3">
              <p className="text-sm font-semibold text-[var(--color-text)]">{log.action || log.message || 'Activity'}</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {log.createdAt ? new Date(log.createdAt).toLocaleString('ar-EG') : 'لا يوجد وقت مسجل'}
              </p>
            </div>
          )) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(demoteTarget)}
        title="تحويل المشرف إلى عميل"
        description={demoteTarget ? `تحويل المشرف ${demoteTarget.name || demoteTarget.email || ''} إلى عميل؟` : ''}
        confirmLabel="تحويل"
        cancelLabel="إلغاء"
        onConfirm={confirmDemoteSupervisor}
        onCancel={() => setDemoteTarget(null)}
      />
    </div>
  );
};

export default AdminSupervisors;
