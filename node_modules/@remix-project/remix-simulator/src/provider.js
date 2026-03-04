"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extend = exports.Provider = void 0;
const tslib_1 = require("tslib");
const blocks_1 = require("./methods/blocks");
const logs_1 = require("./utils/logs");
const merge_1 = (0, tslib_1.__importDefault)(require("merge"));
const accounts_1 = require("./methods/accounts");
const filters_1 = require("./methods/filters");
const misc_1 = require("./methods/misc");
const net_1 = require("./methods/net");
const transactions_1 = require("./methods/transactions");
const debug_1 = require("./methods/debug");
const genesis_1 = require("./genesis");
const vm_context_1 = require("./vm-context");
class Provider {
    constructor(options = {}) {
        this.options = options;
        this.connected = true;
        this.vmContext = new vm_context_1.VMContext(options['fork']);
        this.Accounts = new accounts_1.Accounts(this.vmContext);
        this.Transactions = new transactions_1.Transactions(this.vmContext);
        this.methods = {};
        this.methods = (0, merge_1.default)(this.methods, this.Accounts.methods());
        this.methods = (0, merge_1.default)(this.methods, (new blocks_1.Blocks(this.vmContext, options)).methods());
        this.methods = (0, merge_1.default)(this.methods, (0, misc_1.methods)());
        this.methods = (0, merge_1.default)(this.methods, (new filters_1.Filters(this.vmContext)).methods());
        this.methods = (0, merge_1.default)(this.methods, (0, net_1.methods)());
        this.methods = (0, merge_1.default)(this.methods, this.Transactions.methods());
        this.methods = (0, merge_1.default)(this.methods, (new debug_1.Debug(this.vmContext)).methods());
    }
    init() {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            yield (0, genesis_1.generateBlock)(this.vmContext);
            yield this.Accounts.resetAccounts();
            this.Transactions.init(this.Accounts.accounts);
        });
    }
    sendAsync(payload, callback) {
        // log.info('payload method is ', payload.method) // commented because, this floods the IDE console
        const method = this.methods[payload.method];
        if (this.options.logDetails) {
            (0, logs_1.info)(payload);
        }
        if (method) {
            return method.call(method, payload, (err, result) => {
                if (this.options.logDetails) {
                    (0, logs_1.info)(err);
                    (0, logs_1.info)(result);
                }
                if (err) {
                    return callback(err);
                }
                const response = { id: payload.id, jsonrpc: '2.0', result: result };
                callback(null, response);
            });
        }
        callback(new Error('unknown method ' + payload.method));
    }
    send(payload, callback) {
        this.sendAsync(payload, callback || function () { });
    }
    isConnected() {
        return true;
    }
    disconnect() {
        return false;
    }
    ;
    supportsSubscriptions() {
        return true;
    }
    ;
    on(type, cb) {
        this.vmContext.logsManager.addListener(type, cb);
    }
}
exports.Provider = Provider;
function extend(web3) {
    if (!web3.extend) {
        return;
    }
    // DEBUG
    const methods = [];
    if (!(web3.eth && web3.eth.getExecutionResultFromSimulator)) {
        methods.push(new web3.extend.Method({
            name: 'getExecutionResultFromSimulator',
            call: 'eth_getExecutionResultFromSimulator',
            inputFormatter: [null],
            params: 1
        }));
    }
    if (!(web3.eth && web3.eth.getHHLogsForTx)) {
        methods.push(new web3.extend.Method({
            name: 'getHHLogsForTx',
            call: 'eth_getHHLogsForTx',
            inputFormatter: [null],
            params: 1
        }));
    }
    if (!(web3.eth && web3.eth.getHashFromTagBySimulator)) {
        methods.push(new web3.extend.Method({
            name: 'getHashFromTagBySimulator',
            call: 'eth_getHashFromTagBySimulator',
            inputFormatter: [null],
            params: 1
        }));
    }
    if (methods.length > 0) {
        web3.extend({
            property: 'eth',
            methods: methods,
            properties: []
        });
    }
}
exports.extend = extend;
//# sourceMappingURL=provider.js.map