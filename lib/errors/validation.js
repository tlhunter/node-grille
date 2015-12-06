'use strict';

function ValidationError(message) {
  this.message = message;
  this.stack = (new Error()).stack;
}

ValidationError.prototype.name = 'ValidationError';

ValidationError.prototype = Object.create(Error.prototype);

ValidationError.prototype.constructor = ValidationError;

module.exports = ValidationError;
