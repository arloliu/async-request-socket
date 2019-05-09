function isThenable(p) {
    return p && typeof p.then === 'function';
}

class PromiseTimeout {
    constructor(timeout, timeoutReason) {
        this._isPending = false;
        this._isFulfilled = false;
        this._isRejected = false;
        this._timeoutId = undefined;
        this._value = undefined;
        this._promise = undefined;

        this._timeout = timeout;
        this._timeoutReason = timeoutReason;
    }

    get isPending() {
        return this._isPending;
    }

    get isFulfilled() {
        return this._isFulfilled;
    }

    get isRejected() {
        return this._isRejected;
    }

    get promise() {
        return this._promise;
    }

    get value() {
        return this._value;
    }

    execute(handler) {
        if (!this._isPending) {
            this._promise = new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
                this._isPending = true;
            });

            // create timeout rejection
            if (this._timeout > 0) {
                this._timeoutId = setTimeout(() => {
                    this.reject(new Error(this._timeoutReason));
                }, this._timeout);
            }

            // call handler
            try {
                if (typeof handler === 'function') {
                    const result = handler();
                    if (isThenable(result)) {
                        this._attachResult(result);
                    }
                }
            } catch (err) {
                this.reject(err);
            }
        }
        return this._promise;
    }

    resolve(value) {
        if (this._isPending) {
            if (isThenable(value)) {
                this._attachResult(value);
            } else {
                this._finish(value);
                this._isFulfilled = true;
                this._resolve(value);
            }
        }
    }

    reject(error) {
        if (this._isPending) {
            this._finish(error);
            this._isRejected = true;
            this._reject(error);
        }
    }

    _finish(value) {
        this._value = value;
        this._isPending = false;
        this._clearTimeout();
    }

    _attachResult(p) {
        p.then((value) => this.resolve(value), (err) => this.reject(err));
        // p.then((value) => {
        //     console.log('_attachResult resolved, value:', value);
        //     this.resolve(value);
        // },
        // (err) => {
        //     console.log('_attachResult rejected, err:', err.message);
        //     this.reject(err);
        // });
    }

    _clearTimeout() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = undefined;
        }
    }
}
module.exports = PromiseTimeout;
