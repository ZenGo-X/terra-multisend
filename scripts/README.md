# Terra Failed txs

## Installation

Clone the github repostory

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

- Preload the generated address with **real** LUNA required for sending failed transactions. Each failed transactions will burn some gas.

- Send a failed transactions by specifying the destination address, amount and denom. (see example below)

- Amounts are designated in u\<Token\> (milliToken). So 1000 uluna = 1000 \* 1e-6 luna = 0.001 luna. The amount in the command thus must be an integer.

- Denom is one of `uluna`/`uusd`/`ukrw`

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

##### Failed Trasnfer an \<amount\> of [denom] from address \<from\> to address \<to\>

```
failed_transfer <to> <amount>
```

Example

```
./demo/client failed_transfer terra1qrkvv8dwc946cltuuqkd09r6yh0z3a30x3umxx 1000 --denom uusd --dry_run
```

##### Regular Trasnfer of an \<amount\> of [denom] to address \<to\>

- Add `--dry_run` to generate the trnasaction without executing

```
transfer [options] <to> <amount>
```

Example

```
./demo/client transfer terra1qrkvv8dwc946cltuuqkd09r6yh0z3a30x3umxx 1000 --denom uusd --dry_run
```
