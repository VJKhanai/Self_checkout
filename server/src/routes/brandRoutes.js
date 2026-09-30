const router = require('express').Router();
const c = require('../controllers/brandController');

router.get('/', c.listBrands);
router.get('/:id', c.getBrand);

module.exports = router;
