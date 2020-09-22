const {
  TerraThreshSigClient,
  getTxInfo,
  getTransactions,
  getDelegationInfo,
  getRewardsInfo,
} = require('../dist/src');
const assert = require('assert');

const client = new TerraThreshSigClient();

// This address must be configured with both uluna and uusd, ukrw
const bank = {
  address: 'terra1xpjtwmemdwz053q4jxjx0ht4dtp25rc799deyf',
};

// This is only for receiving, it can have any balance
const sinkAccount = {
  address: 'terra1ya82k8ywtgd7yq8tndf0sejgqd58r66pw5em59',
};

// This address should be empty of any tokens at start of testing
const emptyAccount = {
  address: 'terra1teqqprrnw5mx8mx8pn5hnx3v5jrxkcj2c3356q',
};

// And address with uusd tokens and not uluna, it can have any balance
const uusdOnlyAccount = {
  address: 'terra1efhd0j476zznhq4c2czjyfnyufjxt8rc7fqxpj',
};

describe('Terra API tests', () => {
  it('Transfers uluna to account', async () => {
    await client.init(bank.address);
    const balanceBefore = await client.getBalance(sinkAccount.address);
    //console.log('Balance before', balanceBefore._coins.uluna.amount);

    // Init the client
    const res = await client.transfer(sinkAccount.address, '10000', 'uluna');
    assert.ok(res.logs[0].success);

    const balanceAfter = await client.getBalance(sinkAccount.address);
    const oldBalance = balanceBefore._coins.uluna.amount || 0;
    const newBalance = balanceAfter._coins.uluna.amount;

    const expectedBalance = parseInt(oldBalance) + 10000;
    assert.equal(expectedBalance.toString(), newBalance);
  }).timeout(100000);

  it('Transfers uluna to an account then sends all funds back', async () => {
    await client.init(bank.address);
    const balanceBefore = await client.getBalance(emptyAccount.address);
    //console.log(balanceBefore._coins);
    assert.equal(Object.keys(balanceBefore._coins).length, 0);
    // Init the client
    await client.init();
    const res = await client.transfer(emptyAccount.address, '10000', 'uluna');

    assert.ok(res.logs[0].success);
    let balanceAfter = await client.getBalance(emptyAccount.address);

    balanceAfter = balanceAfter._coins.uluna.amount;
    // console.log('Balance After', balanceAfter);
    assert.equal(balanceAfter, '10000');

    await client.init(emptyAccount.address);
    // Send all back to bank
    await client.transfer(bank.address, '10000', 'uluna', null, true);

    const balanceFinally = await client.getBalance(sinkAccount.address);
    assert.equal(Object.keys(balanceBefore._coins).length, 0);
  }).timeout(100000);

  it('Transfers uusd to account', async () => {
    await client.init(bank.address);
    const balanceBefore = await client.getBalance(sinkAccount.address);
    //console.log('Balance before', balanceBefore._coins.uluna.amount);

    // Transfer
    const res = await client.transfer(sinkAccount.address, '10000', 'uusd');
    assert.ok(res.logs[0].success);

    const balanceAfter = await client.getBalance(sinkAccount.address);
    const oldBalance = balanceBefore._coins.uusd.amount || 0;
    const newBalance = balanceAfter._coins.uusd.amount;

    const expectedBalance = parseInt(oldBalance) + 10000;
    assert.equal(expectedBalance.toString(), newBalance);
  }).timeout(100000);

  it('Transfers uusd from account without uluna', async () => {
    await client.init(uusdOnlyAccount.address);
    const balanceBefore = await client.getBalance(sinkAccount.address);
    //console.log('Balance before', balanceBefore._coins.uluna.amount);

    // Transfer
    const res = await client.transfer(sinkAccount.address, '10000', 'uusd');
    assert.ok(res.logs[0].success);

    const balanceAfter = await client.getBalance(sinkAccount.address);
    const oldBalance = balanceBefore._coins.uusd.amount || 0;
    const newBalance = balanceAfter._coins.uusd.amount;

    const expectedBalance = parseInt(oldBalance) + 10000;
    assert.equal(expectedBalance.toString(), newBalance);
  }).timeout(100000);

  it('Transfers uusd to an account then sends all funds back', async () => {
    await client.init(bank.address);
    const balanceBefore = await client.getBalance(emptyAccount.address);
    //console.log(balanceBefore._coins);
    assert.equal(Object.keys(balanceBefore._coins).length, 0);
    // Init the client
    await client.init();
    const res = await client.transfer(emptyAccount.address, '10000', 'uusd');

    assert.ok(res.logs[0].success);
    let balanceAfter = await client.getBalance(emptyAccount.address);

    balanceAfter = balanceAfter._coins.uusd.amount;
    // console.log('Balance After', balanceAfter);
    assert.equal(balanceAfter, '10000');

    await client.init(emptyAccount.address);
    // Send all back to bank
    await client.transfer(bank.address, '10000', 'uusd', null, true);

    const balanceFinally = await client.getBalance(sinkAccount.address);
    assert.equal(Object.keys(balanceBefore._coins).length, 0);
  }).timeout(100000);

  it('Transfers ukrw to account', async () => {
    await client.init(bank.address);
    const balanceBefore = await client.getBalance(sinkAccount.address);
    //console.log('Balance before', balanceBefore._coins.uluna.amount);

    // Transfer
    const res = await client.transfer(sinkAccount.address, '10000', 'ukrw');
    assert.ok(res.logs[0].success);

    const balanceAfter = await client.getBalance(sinkAccount.address);
    const oldBalance = balanceBefore._coins.ukrw.amount || 0;
    const newBalance = balanceAfter._coins.ukrw.amount;

    const expectedBalance = parseInt(oldBalance) + 10000;
    assert.equal(expectedBalance.toString(), newBalance);
  }).timeout(100000);

  it('Transfers ukrw to an account then sends all funds back', async () => {
    await client.init(bank.address);
    const balanceBefore = await client.getBalance(emptyAccount.address);
    //console.log(balanceBefore._coins);
    assert.equal(Object.keys(balanceBefore._coins).length, 0);
    // Init the client
    await client.init();
    const res = await client.transfer(emptyAccount.address, '10000', 'ukrw');

    assert.ok(res.logs[0].success);
    let balanceAfter = await client.getBalance(emptyAccount.address);

    balanceAfter = balanceAfter._coins.ukrw.amount;
    // console.log('Balance After', balanceAfter);
    assert.equal(balanceAfter, '10000');

    await client.init(emptyAccount.address);
    // Send all back to bank
    await client.transfer(bank.address, '10000', 'ukrw', null, true);

    const balanceFinally = await client.getBalance(sinkAccount.address);
    assert.equal(Object.keys(balanceBefore._coins).length, 0);
  }).timeout(100000);
});
