import type { Resources, SubscribableResources } from "./Resources";
import { BN } from "ethereumjs-util";
import crypto from "crypto";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require("web3");
import type Web3Type from "web3";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ganache = require("ganache");

type Web3Extended = Web3Type;

export const EMPTY = "0x";

export class Chain {
  public web3: Web3Extended;
  private ready: Promise<void>;

  constructor(private resources: Resources) {
    const server = ganache.server({
      wallet: { totalAccounts: 15 },
      miner: { blockGasLimit: 30000000 },
      logging: { quiet: true },
    });

    this.ready = new Promise((resolve, reject) => {
      server.listen(0, (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }
        const port = (server.address() as { port: number }).port;
        const provider = ganache.provider({
          wallet: { totalAccounts: 15 },
          miner: { blockGasLimit: 30000000 },
          chain: { hardfork: "shanghai" },
          logging: { quiet: true },
        });
        this.web3 = new Web3(provider);
        resolve();
      });
    });

    // Use provider directly (no server needed)
    const provider = ganache.provider({
      wallet: { totalAccounts: 15 },
      miner: { blockGasLimit: 30000000 },
      logging: { quiet: true },
    });
    this.web3 = new Web3(provider);
    this.ready = Promise.resolve();
  }

  public registerResources(subscribableResources: SubscribableResources) {
    subscribableResources["accounts"] = async () => {
      return await this.fetchAccounts();
    };
  }

  private async fetchAccounts(): Promise<string[]> {
    await this.ready;
    const accounts = await this.web3.eth.getAccounts();
    if (!this.resources.account) {
      this.resources.account = accounts[0];
    }
    return accounts;
  }

  public async deployContract(
    from: string,
    bytecode: string,
    types: string[],
    params: string[],
  ) {
    await this.ready;
    const paramsbytecode = this.web3.eth.abi
      .encodeParameters(types, params)
      .slice(2);
    const tx = await this.sendTx({
      from: from,
      data: bytecode + paramsbytecode,
    });
    return {
      address: tx.contractAddress,
      cost: tx.gasUsed,
      hash: tx.transactionHash,
    };
  }

  public async call(
    from: string,
    contract: string,
    abi: Record<string, unknown>,
    types: string[],
    params: string[],
  ) {
    await this.ready;
    const callInput = {
      from,
      to: contract,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: this.web3.eth.abi.encodeFunctionCall(abi as any, params),
    };
    const result = this.web3.eth.abi.decodeParameters(
      types,
      await this.web3.eth.call(callInput),
    );
    const estimatedGas = await this.web3.eth.estimateGas(callInput);
    return {
      result,
      cost: estimatedGas,
      hash: "0x" + crypto.randomBytes(32).toString("hex"),
    };
  }

  public async tx(
    from: string,
    contract: string,
    abi: Record<string, unknown>,
    types: string[],
    params: string[],
  ) {
    await this.ready;
    const tx = await this.sendTx({
      from,
      to: contract,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: this.web3.eth.abi.encodeFunctionCall(abi as any, params),
    });
    // Decode return value from receipt logs or simulate via call
    let result = {};
    try {
      const callInput = {
        from,
        to: contract,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: this.web3.eth.abi.encodeFunctionCall(abi as any, params),
      };
      const raw = await this.web3.eth.call(callInput);
      result = this.web3.eth.abi.decodeParameters(types, raw);
    } catch (_) {
      /* no return value */
    }
    return { result, cost: tx.gasUsed, hash: tx.transactionHash };
  }

  public async sendEth(from: string, to: string, amount: BN | number | string) {
    await this.ready;
    await this.sendTx({ from, to, value: new BN(amount) });
  }

  public async sendTx(args: {
    from: string;
    to?: string;
    data?: string;
    value?: BN;
    timestamp?: number;
    gasLimit?: string;
  }) {
    await this.ready;
    const accounts = await this.web3.eth.getAccounts();
    console.log("ganache accounts:", accounts);
    console.log("args.from:", args.from);
    const from =
      accounts.find((a) => a.toLowerCase() === args.from?.toLowerCase()) ||
      accounts[0];
    console.log("using from:", from);
    return await this.web3.eth.sendTransaction({
      data: EMPTY,
      gas: 10000000,
      ...args,
      from,
    });
  }
}
