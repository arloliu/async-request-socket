const net = require('net');
const {URL} = require('url');
const Client = require('./client');

class TcpClient extends Client {
    constructor(url, options) {
        super(url, options);
        const urlObj = new URL(url);
        this._host = urlObj.hostname;
        this._port = urlObj.port;
    };

    _createSocket() {
        this._socket = new net.Socket();
        this._socket.on('error', (err) => {
            this._handleError(err);
        });

        this._socket.on('close', () => {
            this._handleClose({code: 0, reason: 'socket close'});

            const err = new Error(`Socket closed with reason: 'socket close' (0).`);
            this._connectingReject(err);
            this._cleanup(err);
        });

        this._socket.on('data', (data) => {
            this._handleResponse(data);
        });
    }

    _cleanup(err) {
        this._socket.removeAllListeners('data')
            .removeAllListeners('error')
            .removeAllListeners('close');
        this._socket = null;
        this._rejectAllRequests(err);
    }

    _connect() {
        return new Promise((resolve, reject) => {
            this._createSocket();
            this._socket.connect(this._port, this._host, () => {
                resolve(this);
            });
        });
    }

    _send(data) {
        if (data instanceof ArrayBuffer) {
            this._socket.write(Buffer.from(data));
        } else {
            this._socket.write(data);
        }
    }

    _close() {
        this._socket.end();
    }
}
module.exports = TcpClient;
