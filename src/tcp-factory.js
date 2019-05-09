const BufferPlus = require('buffer-plus');
const TcpClient = require('./tcp-client');

module.exports.createTcpClient = function(url, options) {
    return new TcpClient(url, options);
};

module.exports.createTcpJsonClient = function(url, options) {
    const key = typeof options.requestId === 'string' ? options.requestId : 'id';

    options.attachRequestId = (data, requestId) => {
        const target = {};
        target[key] = requestId;
        return Object.assign(target, data);
    };
    options.extractRequestId = (data) => {
        return data[key];
    };
    options.encodeMessage = (data) => JSON.stringify(data);
    options.decodeMessage = (data) => JSON.parse(data);

    return new TcpClient(url, options);
};

module.exports.createTcpBinaryClient = function(url, options) {
    const reqIdOffset = options.requestIdOffset;
    const reqIdLength = options.requestIdLength;
    if (typeof reqIdOffset !== 'number'
        || typeof reqIdLength !== 'number'
        || reqIdOffset < 0
        || reqIdLength < 1
    ) {
        throw new Error(`Requires 'options.requestIdOffset' & 'options.requestIdLength'`);
    }

    options.encodeMessage = (data) => {
        if (BufferPlus.isBufferPlus(data)) {
            data.moveTo(0);
            return data.toBuffer();
        } else if (Buffer.isBuffer(data)) {
            // return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            return data;
        }
        throw new TypeError(`data should be a BufferPlus`);
    };

    options.decodeMessage = (data) => {
        return BufferPlus.from(data);
    };

    options.attachRequestId = (data, requestId) => {
        if (typeof requestId !== 'string') {
            throw new TypeError(`requestId should be a String`);
        }

        let buf;
        if (BufferPlus.isBufferPlus(data)) {
            buf = data;
            buf.moveTo(reqIdOffset);
            buf.writeString(requestId, 'ascii');
            buf.moveTo(0);
        } else if (Buffer.isBuffer(data)) {
            buf = data;
            buf.write(requestId, reqIdOffset, reqIdLength, 'ascii');
        } else {
            throw new TypeError(`attachRequestId: data should be type of BufferPlus or Buffer`);
        }
        return buf;
    };

    options.extractRequestId = (data) => {
        if (data.length < reqIdOffset) {
            throw new Error(`extractRequestId: length of data shorter than requestId offset, offset: ${reqIdOffset}, length: ${data.length}`);
        }
        if (BufferPlus.isBufferPlus(data)) {
            data.moveTo(reqIdOffset);
            const requestId = data.readString(reqIdLength, 'ascii');
            data.moveTo(0);
            return requestId;
        } else if (Buffer.isBuffer(data)) {
            return data.toString('ascii', reqIdOffset, reqIdOffset + reqIdLength);
        } else {
            throw new TypeError(`extractRequestId: data should be type of BufferPlus or Buffer`);
        }
    };

    return new TcpClient(url, options);
};

