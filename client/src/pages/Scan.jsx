import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import api, { apiError } from '../api/client';
import TopBar from '../components/TopBar.jsx';
import CartBar from '../components/CartBar.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const SCAN_COOLDOWN_MS = 2500;

export default function Scan() {
  const { brand } = useStore();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const pendingRef = useRef(Promise.resolve());
  const lastScanRef = useRef({ code: '', at: 0 });
  const [cameras, setCameras] = useState([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState('');
  const [product, setProduct] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    if (!brand) navigate('/brands', { replace: true });
  }, [brand, navigate]);

  const lookup = useCallback(
    async (code) => {
      if (!code) return;
      const now = Date.now();
      if (lastScanRef.current.code === code && now - lastScanRef.current.at < SCAN_COOLDOWN_MS) return;
      lastScanRef.current = { code, at: now };
      try {
        const { data } = await api.get(`/products/barcode/${encodeURIComponent(code)}`, { params: { brand: brand._id } });
        setProduct(data.product);
      } catch (err) {
        toast.error(apiError(err));
      }
    },
    [brand]
  );

  useEffect(() => {
    if (!brand) return undefined;
    let cancelled = false;
    const scanner = new Html5Qrcode('scanner-view', { verbose: false });
    scannerRef.current = scanner;

    // wait for any previous start/stop to finish before starting
    const begin = pendingRef.current.then(async () => {
      if (cancelled) return;
      try {
        const devices = await Html5Qrcode.getCameras();
        if (cancelled) return;
        if (devices.length === 0) throw new Error('No camera found');
        setCameras(devices);
        const deviceId = devices[Math.min(cameraIndex, devices.length - 1)].id;
        await scanner.start(
          deviceId,
          { fps: 12, qrbox: { width: 260, height: 180 } },
          (text) => lookup(text.trim()),
          () => {}
        );
        if (!cancelled) setScanning(true);
      } catch (err) {
        if (!cancelled) setCameraError(err?.message || 'Camera unavailable. Use manual entry below.');
      }
    });

    return () => {
      cancelled = true;
      setScanning(false);
      // stop safely once startup has finished; ignore "not running" errors
      pendingRef.current = begin.then(async () => {
        try {
          await scanner.stop();
        } catch {
          /* not running, fine */
        }
        try {
          scanner.clear();
        } catch {
          /* nothing to clear */
        }
      });
    };
  }, [brand, cameraIndex, lookup]);

  const toggleTorch = async () => {
    try {
      await scannerRef.current?.applyVideoConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch {
      toast.error('This device does not expose the flash to the browser');
    }
  };

  const switchCamera = () => {
    if (cameras.length < 2) return toast.error('Only one camera available');
    setCameraIndex((i) => (i + 1) % cameras.length);
  };

  const confirmAdd = async () => {
    setBusy(true);
    try {
      await addItem(product._id, brand._id, 1);
      toast.success(`${product.name} added`);
      setProduct(null);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen pb-28">
      <TopBar title="Scan products" back="/brands" />
      <div className="mx-auto max-w-md px-5 py-5">
        <div className="overflow-hidden rounded-2xl bg-black">
          <div id="scanner-view" className="aspect-[4/3] w-full" />
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          {cameraError ? cameraError : scanning ? 'Point at the barcode on the product tag' : 'Starting camera…'}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={toggleTorch} className="btn-ghost">{torchOn ? 'Flash off' : 'Flash on'}</button>
          <button onClick={switchCamera} className="btn-ghost">Switch camera</button>
        </div>

        <form
          className="mt-5 card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            lookup(manual.trim());
            setManual('');
          }}
        >
          <label className="label" htmlFor="manual">Manual barcode entry</label>
          <div className="flex gap-2">
            <input id="manual" className="input" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. ZUD11000" />
            <button className="btn-primary px-5">Find</button>
          </div>
        </form>

        <Link to="/orders" className="mt-4 block text-center text-xs font-semibold text-slate-500">
          View past orders
        </Link>
      </div>

      {product && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={() => setProduct(null)}>
          <div className="mx-auto w-full max-w-md rounded-t-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <div className="flex gap-4">
              <img src={product.image} alt="" className="h-24 w-24 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{product.name}</p>
                {product.size && <p className="text-sm text-slate-500">Size {product.size}</p>}
                <p className="mt-1 text-lg font-bold">₹{product.price.toFixed(2)}</p>
                <p className="text-xs text-slate-400">GST {product.gstPercent}% · barcode {product.barcode}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setProduct(null)}>Cancel</button>
              <button className="btn-accent flex-1" onClick={confirmAdd} disabled={busy}>
                {busy ? 'Adding…' : 'Add to cart'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CartBar />
    </div>
  );
}
