const env = require('./config/env');
const app = require('./app');
const { connectDB } = require('./config/db');
const { ensureFixedStaff } = require('./utils/ensureStaff');   // ← add

(async () => {
  try {
    await connectDB(env.MONGO_URI);
    await ensureFixedStaff();                                     // ← add
    app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();
