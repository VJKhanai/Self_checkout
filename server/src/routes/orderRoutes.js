const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/orderController');

router.use(requireAuth(['customer']));

router.get('/', c.myOrders);
router.get('/:id', c.getOrder);
router.get('/:id/exit-qr', c.exitQr);
router.get('/:id/invoice', c.invoice);

module.exports = router;
