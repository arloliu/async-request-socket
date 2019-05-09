const EventEmitter = require('events');
const uniqid = require('uniqid');
const merge = require('lodash.merge');
const PromiseTimeout = require('./promise-timeout');
const Requests = require('./requests');

const alphabet = 'bjectSymhasOwnProp-0123456789ABCDEFGHIJKLMNQRTUVWXYZ_dfgiklquvxz';
function defaultRequestIdGenerator() {
    let id = uniqid.process();
    if (id.length < 12) {
        let len = 12 - id.length;
        const alphabetlength = alphabet.length;
        while (len-- > 0) {
            id += alphabet[Math.random() * alphabetlength | 0];
        }
    }
    return id;
}

const defaultOptions = {
    timeout: 0,
    connectionTimeout: 0,
    reconnect: true,
    generateRequestId: defaultRequestIdGenerator,
    attachRequestId: null,
    extractRequestId: null,
    encodeMessage: (data) => data,
    decodeMessage: (data) => data,
};

class Client {
    constructor(url, options) {
        this._url = url;
        this._options = merge(defaultOptions, options);
        this._requests = new Requests();
        this._connecting = this._initialConnectingPromise();
        this._closing = this._initialClosingPromise();

        this._events = new EventEmitter();
        this._isConntected = true;
        this._socket = null;
    }

    connect() {
        return this._connecting.execute(() => {
            return this._connect();
        })
        .then((value) => {
            this._isConntected = true;
            return value;
        })
        .catch((err) => {
            this._isConntected = false;
            this._requests.rejectAll(err);
            throw err;
        });
    }

    close() {
        return this._closing.execute(() => {
            return this._close();
        })
        .then(() => {
            this._isConntected = false;
            return;
        });
    }

    sendData(data) {
        const encodedData = this._options.encodeMessage(data);
        this._send(encodedData);
    }

    onError(errorHandler) {
        this._events.addListener('error', errorHandler);
    }

    onClose(closeHandler) {
        this._events.addListener('close', closeHandler);
    }

    get connection() {
        return this._socket;
    }

    _rejectAllRequests(err) {
        this._requests.rejectAll(err);
    }

    _handleError(error) {
        this._events.emit('error', error);
    }

    _handleClose(event) {
        this._events.emit('close', event);
        this._closing.resolve(event);
    }

    _connectingReject(error) {
        if (this._connecting.isPending) {
            this._connecting.reject(error);
        }
    }

    _handleResponse(data) {
        const message = this._options.decodeMessage(data);
        const requestId = this._options.extractRequestId(message);
        this._requests.resolve(requestId, message);
    }

    sendRequest(data, options = {}) {
        if (!this._isConntected) {
            throw new Error('connection has not established');
        }
        if (typeof this._options.attachRequestId !== 'function'
            || typeof this._options.extractRequestId !== 'function'
        ) {
            throw new Error(`'options.attachRequestId / options.extractRequestId' is not defined.`);
        }

        const requestId = options.requestId || this._options.generateRequestId();
        const timeout = options.timeout !== undefined ? options.timeout : this._options.timeout;
        return this._requests.create(requestId, timeout, () => {
            const result = this._options.attachRequestId(data, requestId);
            this.sendData(result);
        });
    }

    _initialConnectingPromise() {
        const timeout = this._options.connectionTimeout || this._options.timeout;
        return new PromiseTimeout(
                timeout,
                `Can't open connection within allowed timeout: ${timeout} ms.`,
        );
    }

    _initialClosingPromise() {
        const timeout = this._options.timeout;
        return new PromiseTimeout(
                timeout,
                `Can't close connection within allowed timeout: ${timeout} ms.`,
        );
    }

    /*
     * Pure Interfaces
     */
    _connect() {
        throw new Error('_connect not implemented yet.');
    }

    _close() {
        throw new Error('_close not implemented yet.');
    }

    _send(data) {
        throw new Error('_send not implemented yet.');
    }
}
module.exports = Client;
