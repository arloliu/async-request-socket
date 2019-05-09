"use strict";

const WebSocket = require('uws');

const Client = require('./client');

class WebsocketClient extends Client {
  constructor(url, options) {
    super(url, options);
  }

  _cleanup(err) {
    this._socket.removeAllListeners('message').removeAllListeners('data').removeAllListeners('close');

    this._socket = null;

    this._rejectAllRequests(err);
  }

  _connect() {
    return new Promise((resolve, reject) => {
      this._socket = new WebSocket(this._url);

      this._socket.on('open', () => {
        resolve(this);
      });

      this._socket.on('close', (code, reason) => {
        this._handleClose({
          code,
          reason: 'websocket closed'
        });

        const err = new Error(`WebSocket closed with reason: ${reason} (${code}).`);

        this._connectingReject(err);

        this._cleanup(err);
      });

      this._socket.on('error', err => {
        if (err.message === 'uWs client connection error') {
          this._socket.emit('close', 0, err.message);
        } else {
          this._handleError(err);
        }
      });

      this._socket.on('message', data => {
        this._handleResponse(data);
      });
    });
  }

  _send(data) {
    this._socket.send(data);
  }

  _close() {
    this._socket.close();
  }

}

module.exports = WebsocketClient;