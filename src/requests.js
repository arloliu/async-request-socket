const promiseFinally = require('promise.prototype.finally');
const PromiseTimeout = require('./promise-timeout');

class Requests {
    constructor() {
        this._pool = new Map();
    }

    create(requestId, timeout, handler) {
        this._isExistingRequest(requestId);
        const timeoutReason = `Request was rejected by timed out (${timeout} ms). RequestId: ${requestId}`;
        const request = new PromiseTimeout(timeout, timeoutReason);
        this._pool.set(requestId, request);

        return promiseFinally(request.execute(handler), () => {
            if (this._pool.get(requestId) === request) {
                this._pool.delete(requestId);
            }
        });
    }

    resolve(requestId, data) {
        if (requestId) {
            const req = this._pool.get(requestId);
            if (req) {
                req.resolve(data);
            }
        }
    }

    rejectAll(error) {
        this._pool.forEach((req) => {
            req.reject(error);
        });
    }

    _isExistingRequest(requestId) {
        const req = this._pool.get(requestId);
        if (req) {
            req.reject(new Error(`Request is duplicated, id: ${requestId}`));
        }
    }
}
module.exports = Requests;
