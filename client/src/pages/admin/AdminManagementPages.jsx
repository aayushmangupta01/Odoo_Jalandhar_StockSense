import { useEffect, useState } from 'react';
import { ScrollText, UserRoundCog } from 'lucide-react';
import { authApi } from '../../services/authApi';
import { inventoryApi } from '../../services/api';

const panel = 'rounded-xl border border-slate-800 bg-slate-900';
const control = 'h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-cyan-500';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [warehouseId, setWarehouseId] = useState('WH-01');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try { setUsers(await authApi.getUsers()); }
    catch (loadError) { setError(loadError.response?.data?.error || loadError.message || 'Unable to load user accounts.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createUser(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await authApi.createUser({ name, email, password, role, warehouseId: role === 'staff' ? warehouseId : null });
      setName(''); setEmail(''); setPassword('');
      setNotice('Account created.');
      await load();
    } catch (createError) { setError(createError.response?.data?.error || createError.message || 'Unable to create account.'); }
  }

  async function toggleActive(user) {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    setError('');
    try {
      await authApi.updateUser(user.id, { isActive: !user.isActive });
      await load();
    } catch (updateError) { setError(updateError.response?.data?.error || updateError.message || 'Unable to update account.'); }
  }

  async function changeRole(user, nextRole) {
    if (nextRole === user.role) return;
    if (!window.confirm(`Change ${user.name}'s role to ${nextRole}?`)) return;
    const warehouseId = nextRole === 'staff'
      ? user.warehouseId || window.prompt('Assign this staff account to a warehouse:', 'WH-01')
      : null;
    if (nextRole === 'staff' && !warehouseId) return;
    setError('');
    try {
      await authApi.updateUser(user.id, { role: nextRole, warehouseId });
      await load();
    } catch (updateError) { setError(updateError.response?.data?.error || updateError.message || 'Unable to update role.'); }
  }

  async function changeWarehouse(user) {
    const warehouseId = window.prompt('Warehouse ID for this staff account:', user.warehouseId || 'WH-01');
    if (!warehouseId?.trim()) return;
    setError('');
    try {
      await authApi.updateUser(user.id, { warehouseId: warehouseId.trim() });
      await load();
    } catch (updateError) { setError(updateError.response?.data?.error || updateError.message || 'Unable to update warehouse assignment.'); }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100"><UserRoundCog className="h-6 w-6 text-cyan-400" />Users & Permissions</h1>
        <p className="mt-1 text-sm text-slate-400">Create staff accounts, assign warehouse access, and activate or deactivate users.</p>
      </header>
      {error && <div role="alert" className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
      <form onSubmit={createUser} className={`${panel} grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3`}>
        <h2 className="text-sm font-semibold text-slate-100 md:col-span-2 xl:col-span-3">Create account</h2>
        <label className="space-y-1 text-xs text-slate-400">Name<input className={control} required minLength={2} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="space-y-1 text-xs text-slate-400">Email<input className={control} required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="space-y-1 text-xs text-slate-400">Temporary password<input className={control} required minLength={10} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label className="space-y-1 text-xs text-slate-400">Role<select className={control} value={role} onChange={(event) => setRole(event.target.value)}><option value="staff">Staff</option><option value="admin">Admin</option></select></label>
        {role === 'staff' && <label className="space-y-1 text-xs text-slate-400">Assigned warehouse<input className={control} required value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} /></label>}
        <button className="self-end rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500">Create user</button>
      </form>
      <section className={panel}>
        <div className="border-b border-slate-800 px-4 py-3"><h2 className="text-sm font-semibold text-slate-100">Account directory</h2></div>
        {loading ? <p className="px-4 py-8 text-center text-sm text-slate-400">Loading users…</p> : users.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">No users found.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-slate-500"><tr>{['User', 'Role', 'Warehouse', 'Status', 'Action'].map((field) => <th key={field} className="px-4 py-3">{field}</th>)}</tr></thead><tbody className="divide-y divide-slate-800 text-slate-300">{users.map((user) => <tr key={user.id}><td className="px-4 py-3"><strong className="text-slate-100">{user.name}</strong><p className="mt-1 text-slate-500">{user.email}</p></td><td className="px-4 py-3"><select aria-label={`Role for ${user.name}`} value={user.role} onChange={(event) => changeRole(user, event.target.value)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1 capitalize text-slate-200"><option value="staff">Staff</option><option value="admin">Admin</option></select></td><td className="px-4 py-3">{user.warehouseId || 'All warehouses'} {user.role === 'staff' && <button type="button" onClick={() => changeWarehouse(user)} className="ml-2 text-cyan-300 hover:text-cyan-200">Change</button>}</td><td className="px-4 py-3">{user.isActive ? 'Active' : 'Inactive'}</td><td className="px-4 py-3"><button type="button" onClick={() => toggleActive(user)} className="font-semibold text-cyan-300 hover:text-cyan-200">{user.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    inventoryApi.getAuditLogs()
      .then(setLogs)
      .catch((loadError) => setError(loadError.response?.data?.error || loadError.message || 'Unable to load audit logs.'))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="space-y-5">
      <header><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100"><ScrollText className="h-6 w-6 text-cyan-400" />Audit Log</h1><p className="mt-1 text-sm text-slate-400">Recorded successful API changes, with the acting user and submitted values.</p></header>
      {error && <div role="alert" className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</div>}
      <section className={panel}>
        {loading ? <p className="px-4 py-8 text-center text-sm text-slate-400">Loading audit history…</p> : logs.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">No audited changes yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-slate-500"><tr>{['Timestamp', 'User', 'Action', 'Entity', 'Location', 'Submitted values'].map((field) => <th key={field} className="px-4 py-3">{field}</th>)}</tr></thead><tbody className="divide-y divide-slate-800 text-slate-300">{logs.map((log) => <tr key={log.id}><td className="px-4 py-3">{log.created_at}</td><td className="px-4 py-3">{log.user_name}</td><td className="px-4 py-3">{log.action}</td><td className="px-4 py-3">{log.entity}{log.entity_id ? ` · ${log.entity_id}` : ''}</td><td className="px-4 py-3">{log.warehouse_id || '—'}{log.location_id ? ` · ${log.location_id}` : ''}</td><td className="max-w-72 truncate px-4 py-3" title={log.new_value || ''}>{log.new_value || '—'}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
