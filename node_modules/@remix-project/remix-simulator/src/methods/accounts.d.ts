export declare class Accounts {
    web3: any;
    accounts: Record<string, unknown>;
    accountsKeys: Record<string, unknown>;
    vmContext: any;
    constructor(vmContext: any);
    resetAccounts(): Promise<void>;
    _addAccount(privateKey: any, balance: any): Promise<unknown>;
    newAccount(cb: any): any;
    methods(): Record<string, unknown>;
    eth_accounts(_payload: any, cb: any): any;
    eth_getBalance(payload: any, cb: any): void;
    eth_sign(payload: any, cb: any): any;
}
