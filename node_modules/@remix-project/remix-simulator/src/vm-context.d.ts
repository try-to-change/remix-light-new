/// <reference types="node" />
import Web3 from 'web3';
import VM from '@ethereumjs/vm';
import Common from '@ethereumjs/common';
import StateManager from '@ethereumjs/vm/dist/state/stateManager';
import { StorageDump } from '@ethereumjs/vm/dist/state/interface';
declare class StateManagerCommonStorageDump extends StateManager {
    keyHashes: {
        [key: string]: string;
    };
    constructor();
    putContractStorage(address: any, key: any, value: any): Promise<void>;
    dumpStorage(address: any): Promise<StorageDump>;
    getStateRoot(force?: boolean): Promise<Buffer>;
    setStateRoot(stateRoot: any): Promise<void>;
}
export declare class VMContext {
    currentFork: string;
    blockGasLimitDefault: number;
    blockGasLimit: number;
    customNetWorks: any;
    blocks: any;
    latestBlockNumber: any;
    blockByTxHash: any;
    txByHash: any;
    currentVm: any;
    web3vm: any;
    logsManager: any;
    exeResults: any;
    constructor(fork?: any);
    createVm(hardfork: any): {
        vm: VM;
        web3vm: import("../../../dist/libs/remix-lib/src/web3Provider/web3VmProvider").Web3VmProvider;
        stateManager: StateManagerCommonStorageDump;
        common: Common;
    };
    getCurrentFork(): string;
    web3(): any;
    blankWeb3(): Web3;
    vm(): any;
    vmObject(): any;
    addBlock(block: any): void;
    trackTx(txHash: any, block: any, tx: any): void;
    trackExecResult(tx: any, execReult: any): void;
}
export {};
