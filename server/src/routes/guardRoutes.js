const router = require('express').Router();
const c = require('../controllers/guardController');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth(['guard', 'admin']));
router.post('/verify', c.verify);
router.post('/orders/:id/exit', c.confirmExit);
router.post('/orders/:id/flag', c.flag);
router.get('/recent', c.recent);
module.exports = router;
