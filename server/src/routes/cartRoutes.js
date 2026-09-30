const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/cartController');

router.use(requireAuth(['customer']));

router.get('/', c.getCart);
router.post(
  '/items',
  body('productId').isMongoId(),
  body('brandId').isMongoId(),
  body('qty').optional().isInt({ min: 1, max: 20 }),
  validate,
  c.addItem
);
router.patch('/items/:productId', body('qty').isInt({ min: 0, max: 20 }), validate, c.updateItem);
router.delete('/items/:productId', c.removeItem);
router.delete('/', c.clearCart);

module.exports = router;
