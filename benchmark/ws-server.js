/* eslint-disable no-console */

const uWebSocket = require('uWebSockets.js');

const server = uWebSocket.App();

server.ws('/*', {
    compression: 0,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 10,
    message: (ws, message, isBinary) => {
        ws.send(message, isBinary);
    },
}).listen(9001, (socket) => {
    if (socket) {
        console.log('Listening');
    }
});
