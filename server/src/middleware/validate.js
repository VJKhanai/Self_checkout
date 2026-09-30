const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/apiError');

module.exports = function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(new ApiError(422, result.array()[0].msg));
  }
  next();
};
