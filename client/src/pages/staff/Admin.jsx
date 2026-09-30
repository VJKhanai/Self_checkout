import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { apiError } from '../../api/client.js';
import { useStaff } from '../../context/StaffContext.jsx';

const inr = (n) => `₹${Number(n || 0).toFixed(2)}`;
const TABS = ['Overview', 'Orders', 'Products', 'Brands', 'Staff'];
const input = 'rounded-lg border border-slate-300 px-3 py-2 text-sm';

export default function Admin() {
  const { staff, logout } = useStaff();
  const [tab, setTab] = useState('Overview');
  const [brands, setBrands] = useState([]);
  const loadBrands = () => api.get('/admin/brands').then((r) => setBrands(r.data.brands));
  useEffect(() => { loadBrands(); }, []);
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <p className="font-bold">Self_checkout Admin</p>
        <div className="flex items-center gap-4 text-sm"><span className="text-slate-500">{staff?.username}</span>
          <a href="/guard" className="font-semibold">Guard view</a>
          <button onClick={logout} className="font-semibold text-slate-500">Sign out</button></div>
      </header>
      <nav className="flex gap-2 overflow-x-auto border-b bg-white px-6">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-3 py-3 text-sm font-semibold ${tab === t ? 'border-brandink' : 'border-transparent text-slate-500'}`}>{t}</button>
        ))}
      </nav>
      <div className="mx-auto max-w-6xl p-6">
        {tab === 'Overview' && <Overview />}
        {tab === 'Orders' && <Orders brands={brands} />}
        {tab === 'Products' && <Products brands={brands} />}
        {tab === 'Brands' && <Brands brands={brands} reload={loadBrands} />}
        {tab === 'Staff' && <Staff brands={brands} />}
      </div>
    </main>
  );
}

function Card({ label, value }) {
  return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}

function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)).catch((e) => toast.error(apiError(e))); }, []);
  if (!s) return <p className="text-slate-500">Loading…</p>;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="Total revenue" value={inr(s.revenue)} /><Card label="Paid orders today" value={s.paidToday} />
        <Card label="Customers" value={s.customers} /><Card label="Flagged orders" value={s.flagged} />
      </div>
      <h2 className="mt-8 font-semibold">By brand</h2>
      <table className="mt-2 w-full rounded-2xl bg-white text-sm"><tbody>
        {s.byBrand.map((b) => <tr key={b._id} className="border-b"><td className="p-3">{b.name}</td><td className="p-3">{b.orders} orders</td><td className="p-3 text-right">{inr(b.revenue)}</td></tr>)}
      </tbody></table>
    </>
  );
}

function Orders({ brands }) {
  const [orders, setOrders] = useState([]);
  const [f, setF] = useState({ status: '', brand: '' });
  useEffect(() => {
    api.get('/admin/orders', { params: f }).then((r) => setOrders(r.data.orders)).catch((e) => toast.error(apiError(e)));
  }, [f]);
  return (
    <>
      <div className="flex gap-2">
        <select className={input} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">All statuses</option>{['PENDING', 'PAID', 'EXITED', 'FLAGGED'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={input} value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })}>
          <option value="">All brands</option>{brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white"><table className="w-full text-sm">
        <thead className="text-left text-slate-500"><tr><th className="p-3">Date</th><th>Brand</th><th>Customer</th><th>Total</th><th>Status</th><th>Checked by</th></tr></thead>
        <tbody>{orders.map((o) => (
          <tr key={o._id} className="border-t">
            <td className="p-3">{new Date(o.createdAt).toLocaleString()}</td><td>{o.brand?.name}</td>
            <td>{o.user?.name} {o.user?.phone}</td><td>{inr(o.total)}</td>
            <td className={o.status === 'FLAGGED' ? 'text-red-600' : ''}>{o.status}{o.auditRequired ? ' · audit' : ''}{o.flagReason ? ` — ${o.flagReason}` : ''}</td>
            <td>{o.verifiedBy?.username || '—'}</td>
          </tr>))}</tbody>
      </table></div>
    </>
  );
}

const emptyP = { name: '', barcode: '', price: '', gstPercent: 12, size: '', image: '', stock: 0, brand: '' };
function Products({ brands }) {
  const [list, setList] = useState([]);
  const [brand, setBrand] = useState('');
  const [f, setF] = useState(emptyP);
  const load = () => api.get('/admin/products', { params: brand ? { brand } : {} }).then((r) => setList(r.data.products));
  useEffect(() => { load(); }, [brand]);
  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { ...f, price: Number(f.price), gstPercent: Number(f.gstPercent), stock: Number(f.stock) };
      if (f._id) await api.patch(`/admin/products/${f._id}`, body); else await api.post('/admin/products', body);
      toast.success('Saved'); setF(emptyP); load();
    } catch (err) { toast.error(apiError(err)); }
  };
  const del = async (id) => { if (!window.confirm('Delete product?')) return; await api.delete(`/admin/products/${id}`); load(); };
  return (
    <>
      <form onSubmit={save} className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-4 md:grid-cols-4">
        <select className={input} required value={f.brand?._id || f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })}>
          <option value="">Brand…</option>{brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
        {['name', 'barcode', 'price', 'gstPercent', 'size', 'stock', 'image'].map((k) => (
          <input key={k} className={input} placeholder={k} value={f[k] ?? ''} required={['name', 'barcode', 'price'].includes(k)}
            onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        ))}
        <button className="rounded-lg bg-brandink px-3 py-2 text-sm font-semibold text-white">{f._id ? 'Update' : 'Add product'}</button>
      </form>
      <select className={`${input} mt-4`} value={brand} onChange={(e) => setBrand(e.target.value)}>
        <option value="">All brands</option>{brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
      </select>
      <div className="mt-2 overflow-x-auto rounded-2xl bg-white"><table className="w-full text-sm"><tbody>
        {list.map((p) => (
          <tr key={p._id} className="border-t">
            <td className="p-3">{p.name}</td><td>{p.brand?.name}</td><td>{p.barcode}</td><td>{inr(p.price)}</td><td>GST {p.gstPercent}%</td><td>Stock {p.stock}</td>
            <td className="space-x-3 text-right pr-3"><button onClick={() => setF({ ...p, brand: p.brand?._id })} className="font-semibold">Edit</button>
              <button onClick={() => del(p._id)} className="font-semibold text-red-600">Delete</button></td>
          </tr>))}
      </tbody></table></div>
    </>
  );
}

function Brands({ brands, reload }) {
  const [f, setF] = useState({ name: '', logo: '' });
  const add = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/brands', f); setF({ name: '', logo: '' }); reload(); } catch (err) { toast.error(apiError(err)); }
  };
  const toggle = async (b) => { await api.patch(`/admin/brands/${b._id}`, { isActive: !b.isActive }); reload(); };
  return (
    <>
      <form onSubmit={add} className="flex gap-2 rounded-2xl bg-white p-4">
        <input className={input} placeholder="Brand name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={`${input} flex-1`} placeholder="Logo URL" value={f.logo} onChange={(e) => setF({ ...f, logo: e.target.value })} />
        <button className="rounded-lg bg-brandink px-4 text-sm font-semibold text-white">Add</button>
      </form>
      <ul className="mt-4 grid gap-2 md:grid-cols-3">
        {brands.map((b) => (
          <li key={b._id} className="flex items-center justify-between rounded-xl bg-white p-4">
            <span className="font-semibold">{b.name}</span>
            <button onClick={() => toggle(b)} className={`text-sm font-semibold ${b.isActive ? 'text-brandlime' : 'text-slate-400'}`}>{b.isActive ? 'Active' : 'Hidden'}</button>
          </li>))}
      </ul>
    </>
  );
}

function Staff({ brands }) {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ username: '', password: '', role: 'guard', brand: '' });
  const load = () => api.get('/admin/staff').then((r) => setList(r.data.staff));
  useEffect(() => { load(); }, []);
  const add = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/staff', f); toast.success('Staff added'); setF({ username: '', password: '', role: 'guard', brand: '' }); load(); }
    catch (err) { toast.error(apiError(err)); }
  };
  const del = async (id) => {
    if (!window.confirm('Remove this account?')) return;
    try { await api.delete(`/admin/staff/${id}`); load(); } catch (err) { toast.error(apiError(err)); }
  };
  return (
    <>
      <form onSubmit={add} className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-4 md:grid-cols-5">
        <input className={input} placeholder="Username" required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        <input className={input} placeholder="Password (6+)" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <select className={input} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="guard">Guard</option><option value="admin">Admin</option></select>
        <select className={input} value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })}>
          <option value="">Any store</option>{brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
        <button className="rounded-lg bg-brandink px-3 py-2 text-sm font-semibold text-white">Add staff</button>
      </form>
      <ul className="mt-4 space-y-2">
        {list.map((s) => (
          <li key={s._id} className="flex items-center justify-between rounded-xl bg-white p-4 text-sm">
            <span><b>{s.username}</b> · {s.role}{s.brand ? ` · ${s.brand.name}` : ''}</span>
            <button onClick={() => del(s._id)} className="font-semibold text-red-600">Remove</button>
          </li>))}
      </ul>
    </>
  );
}
