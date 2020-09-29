# Terra Multisend-client

## Project description

This is a basic client to interact with the terra-multisend smart contract.
The client uses Terra.js to implement basic wallet functionality such as address creation, transfer, and multisend.

The client reads a passed file of addresses and amounts, reads the fee demanded by the contract, and creates a consolidated transaction to be sent to the contract.

The script works either witt LocalTerra or Tequila-0004.
Update the parameters when creating a new wallet to point to either a LocalTerra to tequila-0004 network.
Upon first run, a new mnemonic will be created. This mnemonic should be preloaded with testnet LUNA tokens to operate with tequila testnet.

To work with LocalTerra preloaded accounts, create a file called `mnemonic` with one of the pass phrases in [LocalTerra](https://github.com/terra-project/LocalTerra);

### Usage instructions

## Build

```sh
yarn install
yarn build
```

Built files will be located in the `dist` folder.

## Running the Code

Client:

```sh
Usage: client [options] [command]
```

### Getting started

- Start by generating a new address.
  `./demo/client address`

  A new mnemonic will be created and saved in the file `./mnemonic` on the first run.

  This is the private key of the local wallet created

- Preload the generated address with **testnet** LUNA required for sending transactions. Faucet is available [here](https://faucet.terra.money). Choose `Tequilla-0004` in the upper bar.

### Commands:

##### Print an existing address or generate a new one

Show the created address with:

```
./demo/client address
```

##### Print balance of address

```
balance [options] <address>
```

Example

```
./demo/client balance
```

##### Regular transfer of an \<amount\> of [denom] to address \<to\>

- Add `--dry_run` to generate the transaction without executing

```
transfer [options] < to > < amount >
```

Regular transfer from the current private key to a terra address

Example

```
./demo/client transfer terra1qrkvv8dwc946cltuuqkd09r6yh0z3a30x3umxx 1000 --denom uusd --dry_run
```

##### Multisend to a list of addresses and amounts

```
multisend < CSV_file > [contractAddress]
```

The command passes a CSV file in the format:

```
address,denom,amount
terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp,uluna,200000000

```

- Column 1 : Terra address of recipient
- Column 2: Denom in **Native Terra Tokens**. One of `uluna` | `uusd` | `ukrt` ...
- Column 3: Amount to send in uTokens. Notice that that amount is specified in milli-tokens. To send 1 LUNA, secifiy 1,000,000. (1,000,000 uluna \* 1e-6 = 1 LUNA).

A working contract instance on the `tequila-0004` network is hard-coded and is available at address:

```
terra1kspjp9jtmqupr2n7hkew627hju389vw2ztntq9
```

[Terra finder link](https://finder.terra.money/tequila-0004/account/terra1kspjp9jtmqupr2n7hkew627hju389vw2ztntq9)

To use a different address, change the code or specify a different address with the `--address` flag

Example

```
./demo/client failed_transfer ./recipients.csv --address terra1sh36qn08g4cqg685cfzmyxqv2952q6r8gpczrt
```
