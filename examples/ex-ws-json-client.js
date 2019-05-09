/* eslint-disable no-console */
const {createWsJsonClient} = require('../src');

const client = createWsJsonClient('ws://127.0.0.1:9001', {
    timeout: 2000,
    connectionTimeout: 1000,
    requestId: 'req_id',
});

client.onError((err) => {
    console.error('Client error:', err.stack);
});

client.onClose((event) => {
    console.error('Client close:', event);
});

async function main() {
    try {
        await client.connect();
        for (let i = 0; i < 100; i++) {
            const payload = {
                name: 'test' + (i + 1),
            };
            const response = await client.sendRequest(payload);
            console.log('response:', response);
        }
        await client.close();
    } catch (err) {
        console.error('client error:', err.stack);
    }
}

main();
