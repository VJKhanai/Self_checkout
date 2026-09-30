# Self_checkout (MERN)


## Live Demo
- App: https://self-checkout-flame.vercel.app
- API: https://self-checkout-api.onrender.com/api/brands

Demo login: any name and phone number, OTP `123456`.
Sample barcodes: ZUD11000, ZUD11001 (Zudio).

> The API runs on Render's free tier, so the first request may take up to a minute.


Mobile-first self-checkout for retail stores. Customers pick a store, scan product
barcodes with the phone camera, pay, and get a signed single-use **exit QR** plus a
GST bill that a guard verifies before removing security tags.

This delivery contains the **customer flow end to end** plus the full backend
(models, middleware, controllers, routes, seed). The guard and admin apps build on
the same models (`Staff`, `Order.status`, `Order.exitTokenHash`) and are the next step.

```
Self_checkout/
├─ server/                  # Node + Express + Mongoose API
│  ├─ .env.example
│  └─ src/
│     ├─ app.js  server.js
│     ├─ config/            # env + mongo connection
│     ├─ models/            # User, Brand, Product, Cart, Order, Staff, Otp
│     ├─ middleware/        # auth (JWT cookie), validate, rateLimit, error
│     ├─ controllers/       # auth, brand, product, cart, payment, order
│     ├─ routes/            # /api/auth /brands /products /cart /orders /payments
│     ├─ utils/             # pricing, exitToken, paymentGateway, invoice, otpProvider
│     └─ seed/seed.js       # 6 brands × 10 products + guard + admin
└─ client/                  # React (Vite) + Tailwind + React Router
   ├─ .env.example
   └─ src/
      ├─ api/client.js      # axios instance with credentials
      ├─ context/           # AuthContext, StoreContext, CartContext
      ├─ components/        # TopBar, CartBar, ProtectedRoute, loading/empty/error
      └─ pages/             # Landing, SignIn, Brands, Scan, Cart, Success, Orders
```

## 1. Setup

Requires Node 18+ and a MongoDB Atlas cluster (or local mongod).

```bash
# backend
cd server
cp .env.example .env        # set MONGO_URI, JWT_SECRET, EXIT_TOKEN_SECRET
npm install
npm run seed                # brands, products, guard1/guard@123, admin/admin@123
npm run dev                 # http://localhost:5000

# frontend (new terminal)
cd client
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173
```

The seed script prints sample barcodes (e.g. `ZUD11000`) — use them in the
scanner's manual-entry field when testing on a desktop.

## 2. Signing in (OTP)

`OTP_PROVIDER=mock` (default) never sends an SMS: the code is always `MOCK_OTP`
(`123456`) and it is also logged by the server. Set `OTP_PROVIDER=twilio` and fill
the Twilio variables to send real codes — `src/utils/otpProvider.js` is the only
file that changes. OTP and auth routes are rate-limited; codes are stored hashed
with a 5-minute TTL and 5 attempts.

The JWT is issued in an **httpOnly cookie**, so the frontend sends
`withCredentials: true` and `CLIENT_ORIGIN` must list the exact frontend origin.

## 3. Testing payments

`PAYMENT_PROVIDER=mock` runs a **simulated gateway with the Razorpay contract** —
no real money and no Razorpay account:

1. `POST /api/payments/create-order` prices the cart **from the database** and
   creates a `PENDING` order with a gateway order id.
2. `POST /api/payments/simulate` stands in for the Razorpay checkout callback and
   returns `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`. Send
   `{ outcome: "failure" }` to test the declined path and retry.
3. `POST /api/payments/verify` recomputes the HMAC signature server-side; only on a
   match does the order become `PAID`, stock decrement (in a transaction where the
   deployment supports it), the cart clear, and the exit QR get issued.
4. `POST /api/payments/webhook` is the backup path if the browser never returns.

To go live with real Razorpay test mode: `npm i razorpay`, replace
`src/utils/paymentGateway.js` with the SDK (`orders.create` and
`validateWebhookSignature`), set `PAYMENT_KEY_ID`/`PAYMENT_KEY_SECRET` from the
Razorpay dashboard, load `checkout.js` in the client and open checkout in
`pages/Cart.jsx` instead of calling `/payments/simulate`. Test cards: card
`4111 1111 1111 1111`, any future expiry, any CVV, OTP `1111`.

## 4. Testing the camera on a phone

Browsers only grant camera access on `https://` or `localhost`.

```bash
cd client && npm run dev -- --host       # note the LAN URL
npx ngrok http 5173                      # public https URL for your phone
```

Set `CLIENT_ORIGIN` (server `.env`) to the ngrok URL and `VITE_API_URL` to the
tunnelled API URL, then restart both apps. The scanner includes a flash toggle,
front/back camera switch, a 2.5s duplicate-scan debounce, and manual barcode
entry as a fallback when the camera is blocked.

## 5. Security notes

- Totals are **always recomputed server-side** from DB prices; the client can
  never set a price.
- The exit QR is a signed JWT (`orderId + nonce + expiry`); only its SHA-256 hash
  is stored, it is single-use, and it expires after `EXIT_TOKEN_TTL_MINUTES`.
- `helmet`, a CORS allow-list, `express-rate-limit`, `express-validator` on every
  write, role-based `requireAuth`, and no secret ever reaches the frontend.
- Stock decrements only after signature verification.
- `AUDIT_RATE` (default 0.1) randomly flags ~10% of paid orders for a full bag check.

## 6. Deployment

- **MongoDB Atlas** — create a cluster, allow your server IP, copy the SRV URI.
- **Backend on Render** — root `server/`, build `npm install`, start `npm start`,
  add every `.env` variable, set `NODE_ENV=production` (cookies become
  `secure` + `SameSite=None`).
- **Frontend on Vercel** — root `client/`, build `npm run build`, output `dist`,
  env `VITE_API_URL=https://<render-app>/api`.
- Put the Vercel domain in `CLIENT_ORIGIN` and point the Razorpay webhook at
  `https://<render-app>/api/payments/webhook`.

## Guard & Admin apps
- Staff sign-in: `/staff` (seeded: `guard1` / `guard@123`, `admin` / `admin@123`). Staff use a separate `staff_token` cookie, so one phone can hold both a customer and staff session.
- **Guard** (`/guard`): scans the customer's exit QR → server checks signature, expiry, store, payment, single-use and "latest QR" → shows the bill with item count and a random-audit warning → **Approve exit** (consumes the QR atomically) or **Flag** with a reason. Shows recent checks.
- **Admin** (`/admin`): Overview (revenue, today's paid orders, customers, flagged, per-brand), Orders (filter by status/brand), Products (add/edit/delete), Brands (add, show/hide), Staff (create guards/admins, tie a guard to one store, remove).
- APIs: `/api/staff/*`, `/api/guard/*` (guard or admin), `/api/admin/*` (admin only).
