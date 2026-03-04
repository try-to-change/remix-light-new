export declare class Provider {
    options: Record<string, unknown>;
    vmContext: any;
    Accounts: any;
    Transactions: any;
    methods: any;
    connected: boolean;
    constructor(options?: Record<string, unknown>);
    init(): Promise<void>;
    sendAsync(payload: any, callback: any): any;
    send(payload: any, callback: any): void;
    isConnected(): boolean;
    disconnect(): boolean;
    supportsSubscriptions(): boolean;
    on(type: any, cb: any): void;
}
export declare function extend(web3: any): void;
