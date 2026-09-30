const router = require('express').Router();
const c = require('../controllers/staffController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
router.post('/login', authLimiter, c.login);
router.get('/me', requireAuth(['guard', 'admin']), c.me);
router.post('/logout', c.logout);
module.exports = router;
