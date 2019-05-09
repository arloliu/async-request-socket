/* eslint-disable guard-for-in */
const tcp = require('./tcp-factory');
const ws = require('./ws-factory');
const factoryFunctions = {};

for (const method in tcp) {
    factoryFunctions[method] = tcp[method];
}

for (const method in ws) {
    factoryFunctions[method] = ws[method];
}

module.exports = factoryFunctions;
