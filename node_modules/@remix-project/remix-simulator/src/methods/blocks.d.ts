export declare class Blocks {
    vmContext: any;
    coinbase: string;
    constructor(vmContext: any, _options: any);
    methods(): Record<string, unknown>;
    eth_getBlockByNumber(payload: any, cb: any): any;
    toHex(value: any): string;
    eth_getBlockByHash(payload: any, cb: any): void;
    eth_gasPrice(payload: any, cb: any): void;
    eth_coinbase(payload: any, cb: any): void;
    eth_blockNumber(payload: any, cb: any): void;
    eth_getBlockTransactionCountByHash(payload: any, cb: any): void;
    eth_getBlockTransactionCountByNumber(payload: any, cb: any): void;
    eth_getUncleCountByBlockHash(payload: any, cb: any): void;
    eth_getUncleCountByBlockNumber(payload: any, cb: any): void;
    eth_getStorageAt(payload: any, cb: any): void;
}
