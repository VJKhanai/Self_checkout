const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/productController');

router.get('/barcode/:code', requireAuth(['customer']), c.getByBarcode);
router.get('/brand/:brandId', requireAuth(['customer']), c.listByBrand);

module.exports = router;
