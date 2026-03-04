"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.net_peerCount = exports.net_listening = exports.net_version = exports.methods = void 0;
function methods() {
    return {
        net_version: net_version,
        net_listening: net_listening,
        net_peerCount: net_peerCount
    };
}
exports.methods = methods;
function net_version(payload, cb) {
    // should be configured networkId
    cb(null, 1337);
}
exports.net_version = net_version;
function net_listening(payload, cb) {
    cb(null, true);
}
exports.net_listening = net_listening;
function net_peerCount(payload, cb) {
    cb(null, 0);
}
exports.net_peerCount = net_peerCount;
//# sourceMappingURL=net.js.map