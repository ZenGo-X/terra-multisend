# Terra Mulitsender Deployer

This is a basic script that uses `Terra.js` to deploy the multisender smart contract.
The scripts uses the hardcoded mnemonics of the [LocalTerra](https://github.com/terra-project/LocalTerra) network.

In order to upload to tequila-0004:

- Change the endpoint of the node in the code when creating the LCD
- Change the mnemonic to one you have funds on tequila-0004
- Change the name of the contract being uploaded in necessary

This is a template script that can be easily adapted to other smart contrats, as well as test functionality.

## Installation

```sh
yarn install
yarn build
```

Built files will be located in the `dist` folder.

## Running the Code

```
node ./dist/src/index.js
```

If all is correct, the script prints the address of your new contract

Example output:

```
{ height: 3285,
  txhash:
   '25D9B56813C25AEC4DF01DB28250EEA38A058C78042086E108DA99054F25D6E8',
  logs: [ { msg_index: 0, log: '', events: [Array] } ],
  raw_log:
   '[{"msg_index":0,"log":"","events":[{"type":"message","attributes":[{"key":"action","value":"store_code"},{"key":"module","value":"wasm"}]},{"type":"store_code","attributes":[{"key":"sender","value":"terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v"},{"key":"code_id","value":"2"}]}]}]',
  gas_wanted: 1739656,
  gas_used: 1446713,
  events: undefined,
  code: undefined }
CodeId 2
Contract address terra10pyejy66429refv3g35g2t7am0was7ya7kz2a4
```
