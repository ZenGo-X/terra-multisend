import assert from 'assert';
import * as fs from 'fs';

import { DEFULT_GAS_PRICE } from './constants';

import {
  MnemonicKey,
  MsgExecuteContract,
  LCDClient,
  Wallet,
  MsgSend,
  Coin,
  Coins,
  Denom,
} from '@terra-money/terra.js';

type SendOptions = {
  memo?: string;
  feeDenom?: Denom;
};

type CSVPayment = {
  address: string;
  amount: string;
  denom: string;
};

type CustomCoin = {
  denom: string;
  amount: string;
};

type Payment = {
  recipient: string;
  pay: [CustomCoin];
};

type FeeResponse = {
  fee: CustomCoin;
};

export class TerraClient {
  private db: any;
  private terraWallet: Wallet;

  constructor(mainnet: boolean = false) {}

  public async getBalance(address?: string): Promise<Coins> {
    if (address == null) {
      address = this.terraWallet.key.accAddress;
    }
    return this.terraWallet.lcd.bank.balance(address);
  }

  public async multisend(
    payments: [CSVPayment],
    contractAddress: string,
    dryRun?: boolean,
  ) {
    // Required input by the sender
    let input = [];

    let parsedPayments = [];
    for (let payment of payments) {
      let parsedPayment = {
        recipient: payment.address,
        pay: [{ denom: payment.denom, amount: payment.amount }],
      };
      parsedPayments.push(parsedPayment);

      let inputCoin = new Coin(payment.denom, payment.amount);
      input.push(inputCoin);
    }

    let executeMsg = {
      multi_send: {
        payments: parsedPayments,
      },
    };
    contractAddress = 'terra1tndcaqxkpc5ce9qee5ggqf430mr2z3pefe5wj6';

    let fee = await this.getMultiSendFee(contractAddress);

    input.push(fee);

    const execute = new MsgExecuteContract(
      this.terraWallet.key.accAddress, // sender
      contractAddress, // contract account address
      { ...executeMsg }, // handle msg
      input, // coins
    );

    const tx = await this.terraWallet.createAndSignTx({
      msgs: [execute],
    });

    if (dryRun) {
      console.log('------ Dry Run ----- ');
      console.log(tx.toJSON());
    } else {
      console.log(' ===== Executing ===== ');
      console.log(tx.toJSON());
      let resp = await this.terraWallet.lcd.tx.broadcast(tx);
      return resp;
    }
  }

  private async getMultiSendFee(contractAddress: string) {
    ////// Query balance
    let queryMsgArguments = {
      get_fee: {},
    };

    const result: FeeResponse = await this.terraWallet.lcd.wasm.contractQuery(
      contractAddress,
      { ...queryMsgArguments }, // query msg
    );

    return new Coin(result.fee.denom, result.fee.amount);
  }

  public async transfer(
    to: string,
    amount: string,
    denom: Denom,
    options?: SendOptions,
    dryRun?: boolean,
  ) {
    // Set default denom to uluna
    if (denom == null) {
      denom = 'uluna';
    }

    // Coins for amount
    let coin = new Coin(denom, amount);
    let coins = new Coins([coin]);

    // Coins for gas fees
    const gasPriceCoin = new Coin(denom, DEFULT_GAS_PRICE);
    const gasPriceCoins = new Coins([gasPriceCoin]);

    let send = new MsgSend(this.terraWallet.key.accAddress, to, coins);

    let tx = await this.terraWallet.createAndSignTx({
      msgs: [send],
      gasPrices: gasPriceCoins,
    });

    // Step 3: Broadcasting the message
    if (dryRun) {
      console.log('------ Dry Run ----- ');
      console.log(tx.toJSON());
    } else {
      console.log(' ===== Executing ===== ');
      console.log(tx.toJSON());
      let resp = await this.terraWallet.lcd.tx.broadcast(tx);
      return resp;
    }
  }

  /**
   * Initiate the client
   * @param accAddress Address to use for wallet generation. Optional. Otherwise uses index 0
   */
  public async init(accAddress?: string) {
    let mnemonic;
    try {
      mnemonic = fs.readFileSync('./mnemonic').toString().trim();
    } catch {
      const mk = new MnemonicKey();
      mnemonic = mk.mnemonic;
      fs.writeFileSync('./mnemonic', mk.mnemonic);
      console.log('New mnemonic created');
    }

    // The LCD clients must be initiated with a node and chain_id
    const terraClient = new LCDClient({
      URL: 'http://localhost:1317',
      chainID: 'localterra',
      //URL: 'https://tequila-fcd.terra.dev,
      //chainID: 'tequila-0004'
      gasPrices: '0.15uluna',
      gasAdjustment: 1.2,
    });

    const mk = new MnemonicKey({
      mnemonic: mnemonic,
    });
    const key = new MnemonicKey(mk);
    this.terraWallet = terraClient.wallet(key);
  }

  public getAddress(): string {
    return this.terraWallet.key.accAddress;
  }
}
