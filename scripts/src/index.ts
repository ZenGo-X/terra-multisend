import {
  LCDClient,
  MsgStoreCode,
  MnemonicKey,
  MsgExecuteContract,
  MsgInstantiateContract,
  Coin,
} from '@terra-money/terra.js';
import * as fs from 'fs';

export async function main() {
  // test1 key from localterra accounts
  const mk = new MnemonicKey({
    mnemonic:
      'notice oak worry limit wrap speak medal online prefer cluster roof addict wrist behave treat actual wasp year salad speed social layer crew genius',
  });

  // connect to localterra
  const terra = new LCDClient({
    URL: 'http://localhost:1317',
    chainID: 'localterra',
    gasPrices: '0.15uluna',
    gasAdjustment: 1.2,
  });

  const wallet = terra.wallet(mk);
  // Create Contract code
  const storeCode = new MsgStoreCode(
    wallet.key.accAddress,
    fs.readFileSync('../artifacts/terra_echo.wasm').toString('base64'),
  );

  const storeCodeTx = await wallet.createAndSignTx({
    msgs: [storeCode],
  });
  const storeCodeTxResult = await terra.tx.broadcast(storeCodeTx);
  console.log(storeCodeTxResult);
  const codeId = storeCodeTxResult.logs[0].events[1].attributes[1].value;

  console.log('CodeId', codeId);

  let initMsg = {
    fee: { denom: 'uluna', amount: '100' },
  };

  const instantiate = new MsgInstantiateContract(
    wallet.key.accAddress, // owner
    Number(codeId), // code ID
    { ...initMsg }, // InitMsg
    {}, // init coins
    false, // migratable
  );
  const instantiateTx = await wallet.createAndSignTx({
    msgs: [instantiate],
  });
  const instantiateTxResult = await terra.tx.broadcast(instantiateTx);
  const contractAddress =
    instantiateTxResult.logs[0].events[0].attributes[2].value;
  console.log('Contract address', contractAddress);

  // Execute a transfer message
  let executeMsg = {
    echo: {
      recipient: 'terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp',
    },
  };

  const execute = new MsgExecuteContract(
    wallet.key.accAddress, // sender
    contractAddress, // contract account address
    { ...executeMsg }, // handle msg
    { uluna: 100000000 }, // coins
    // {}, // coins
  );

  const executeTx = await wallet.createAndSignTx({
    msgs: [execute],
  });

  const executeTxResult = await terra.tx.broadcast(executeTx);
  console.log('ExecuteTxResult', executeTxResult);

  ////// Query balance
  // let queryMsgArguments = {
  //   balance: {
  //     address: 'terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v',
  //   },
  // };

  // const result = await terra.wasm.contractQuery(
  //   //contractAddress,
  //   'terra1l09lzlktar3m0hth59z3se86fsyz084map2yln',
  //   { ...queryMsgArguments }, // query msg
  // );

  // console.log('Result', result);
}

main();
