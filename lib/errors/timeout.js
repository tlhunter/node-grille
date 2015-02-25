'use strict';

function TimeoutError(message) {
    this.message = message;
    this.stack = (new Error()).stack;
}

TimeoutError.prototype.name = 'TimeoutError';

TimeoutError.prototype = Object.create(Error.prototype);

TimeoutError.prototype.constructor = TimeoutError;

module.exports = TimeoutError;
