"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eth_compileSerpent = exports.eth_compileLLL = exports.eth_compileSolidity = exports.eth_getCompilers = exports.web3_sha3 = exports.eth_hashrate = exports.eth_mining = exports.eth_syncing = exports.eth_protocolVersion = exports.web3_clientVersion = exports.methods = void 0;
const tslib_1 = require("tslib");
const web3_1 = (0, tslib_1.__importDefault)(require("web3"));
const version = require('../../package.json').version;
function methods() {
    return {
        web3_clientVersion: web3_clientVersion,
        eth_protocolVersion: eth_protocolVersion,
        eth_syncing: eth_syncing,
        eth_mining: eth_mining,
        eth_hashrate: eth_hashrate,
        web3_sha3: web3_sha3,
        eth_getCompilers: eth_getCompilers,
        eth_compileSolidity: eth_compileSolidity,
        eth_compileLLL: eth_compileLLL,
        eth_compileSerpent: eth_compileSerpent
    };
}
exports.methods = methods;
function web3_clientVersion(payload, cb) {
    cb(null, 'Remix Simulator/' + version);
}
exports.web3_clientVersion = web3_clientVersion;
function eth_protocolVersion(payload, cb) {
    cb(null, '0x3f');
}
exports.eth_protocolVersion = eth_protocolVersion;
function eth_syncing(payload, cb) {
    cb(null, false);
}
exports.eth_syncing = eth_syncing;
function eth_mining(payload, cb) {
    // TODO: should depend on the state
    cb(null, false);
}
exports.eth_mining = eth_mining;
function eth_hashrate(payload, cb) {
    cb(null, '0x0');
}
exports.eth_hashrate = eth_hashrate;
function web3_sha3(payload, cb) {
    const str = payload.params[0];
    cb(null, web3_1.default.utils.sha3(str));
}
exports.web3_sha3 = web3_sha3;
function eth_getCompilers(payload, cb) {
    cb(null, []);
}
exports.eth_getCompilers = eth_getCompilers;
function eth_compileSolidity(payload, cb) {
    cb(null, 'unsupported');
}
exports.eth_compileSolidity = eth_compileSolidity;
function eth_compileLLL(payload, cb) {
    cb(null, 'unsupported');
}
exports.eth_compileLLL = eth_compileLLL;
function eth_compileSerpent(payload, cb) {
    cb(null, 'unsupported');
}
exports.eth_compileSerpent = eth_compileSerpent;
//# sourceMappingURL=misc.js.map