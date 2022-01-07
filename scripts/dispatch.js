const hre = require('hardhat');
const { ethers } = require('hardhat');
const { BigNumber, utils } = require('ethers');

const {
  attachContractsFromConfig,
  getAllocationsDispatch,
  getAllocationsTeam,
  getAllocationsFounders,
} = require('./utils.js');
const { formatEther } = require('ethers/lib/utils');

const BN = BigNumber.from;

async function main() {
  const [owner, ...signers] = await ethers.getSigners();

  console.log('Sender address', owner.address);

  const allocationsFounders = getAllocationsFounders();
  const allocationsTeam = getAllocationsTeam();
  const batchAllocationsDispatch = getAllocationsDispatch();

  const allocationsFoundersVested = allocationsFounders.map((allocation) => ({
    ...allocation,
    amount: allocation.amount.sub(allocation.amount.mul(BN(20)).div(BN(100))),
  }));
  const initialReceivers = allocationsFounders.map(({ receiver }) => receiver);
  const initialAmounts = allocationsFounders.map(({ amount }) => amount.mul(20).div(100));

  const dispatchReceivers = batchAllocationsDispatch.map(({ receiver, tokens }) => receiver);
  const dispatchAmounts = batchAllocationsDispatch.map(({ receiver, tokens }) => tokens);

  const sumFounders = sumBN(allocationsFounders.map(({ amount }) => amount));
  const sumFoundersInitial = sumBN(initialAmounts);
  const sumFoundersVested = sumBN(allocationsFoundersVested.map(({ amount }) => amount));
  const sumTeam = sumBN(allocationsTeam.map(({ amount }) => amount));
  const sumDispatch = sumBN(dispatchAmounts);

  console.log(
    'Total sum of tokens founders',
    formatEther(sumFounders),
    '(initial)',
    formatEther(sumFoundersInitial),
    '(vested)',
    formatEther(sumFoundersVested)
  );
  console.log('Total sum of tokens team', formatEther(sumTeam));
  console.log('Total sum of treasury, etc.', formatEther(sumDispatch));
  console.log('Full sum', formatEther(sumFounders.add(sumTeam).add(sumDispatch)));

  // const { token, vaultFounders, vaultTeam, batchTransfer } = await attachContractsFromConfig();
  // const totalSupply = await token.totalSupply();
  // await token.approve(vaultFounders.address, totalSupply);
  // await token.approve(vaultTeam.address, totalSupply);
  // let tx = await token.approve(batchTransfer.address, totalSupply);
  // await tx.wait();

  // await vaultFounders.addAllocationBatch(allocationsFoundersVested)
  // await vaultTeam.addAllocationBatch(allocationsTeam)
  // console.log('start')
  // console.log(initialAmounts)
  // await batchTransfer.dispatch(token.address, initialReceivers, initialAmounts)
  // console.log('done')
  // console.log(dispatchAmounts)
  // await batchTransfer.dispatch(token.address, dispatchReceivers, dispatchAmounts)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
