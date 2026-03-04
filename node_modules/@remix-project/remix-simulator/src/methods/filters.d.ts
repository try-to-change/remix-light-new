export declare class Filters {
    vmContext: any;
    constructor(vmContext: any);
    methods(): {
        eth_getLogs: any;
        eth_subscribe: any;
        eth_unsubscribe: any;
    };
    eth_getLogs(payload: any, cb: any): void;
    eth_subscribe(payload: any, cb: any): void;
    eth_unsubscribe(payload: any, cb: any): void;
    eth_newFilter(payload: any, cb: any): void;
    eth_newBlockFilter(payload: any, cb: any): void;
    eth_newPendingTransactionFilter(payload: any, cb: any): void;
    eth_uninstallfilter(payload: any, cb: any): void;
    eth_getFilterChanges(payload: any, cb: any): void;
    eth_getFilterLogs(payload: any, cb: any): void;
}
