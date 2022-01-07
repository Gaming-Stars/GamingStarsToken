const { ethers } = require('hardhat');

const { centerTime } = require('./time.js');
const { getAllocationsFounders, getAllocationsTeam, getAllocationsDispatch } = require('./utils.js');
var time = centerTime();

const BN = ethers.BigNumber.from;

async function main() {
  const [owner] = await ethers.getSigners();

  console.log('Sender address', owner.address);

  const GamingStars = await ethers.getContractFactory('GamingStars');
  const VestingVault = await ethers.getContractFactory('VestingVault');
  const BatchTransfer = await ethers.getContractFactory('BatchTransfer');

  const provider = ethers.provider;
  const balBefore = await provider.getBalance(owner.address);

  // console.log('bal before', balBefore);

  const token = await GamingStars.deploy();
  await token.deployed();

  const totalSupply = await token.totalSupply();
  const symbol = await token.symbol();
  const name = await token.name();
  console.log(`\nToken '${name}' (${symbol})', supply`, totalSupply.toString(), 'deployed to', token.address);

  let vestingStartDate = time.future1d;
  const vaultFounders = await VestingVault.deploy(token.address, vestingStartDate);
  await vaultFounders.deployed();

  const vestingStartDateContract = await vaultFounders.vestingStartDate();
  const vestingEndDateContract = await vaultFounders.vestingEndDate();
  console.log('Founders vault deployed to:', vaultFounders.address);
  console.log('StartDate timestamp', vestingStartDate.toString());
  console.log(
    'Vesting term:',
    new Date(vestingStartDateContract.toNumber() * 1000),
    '-',
    new Date(vestingEndDateContract.toNumber() * 1000)
  );

  vestingStartDate = time.future(183 * time.delta1d);
  const vaultTeam = await VestingVault.deploy(token.address, vestingStartDate);
  await vaultTeam.deployed();

  const vestingStartDateContractTeam = await vaultTeam.vestingStartDate();
  const vestingEndDateContractTeam = await vaultTeam.vestingEndDate();
  console.log('Team vault deployed to:', vaultTeam.address);
  console.log('StartDate timestamp', vestingStartDate.toString());
  console.log(
    'Vesting term:',
    new Date(vestingStartDateContractTeam.toNumber() * 1000),
    '-',
    new Date(vestingEndDateContractTeam.toNumber() * 1000)
  );

  const batchTransfer = await BatchTransfer.deploy();
  await batchTransfer.deployed();
  console.log('BatchTransfer deployed to:', batchTransfer.address);

  console.log({
    tokenAddress: token.address,
    vaultFounders: vaultFounders.address,
    vaultTeam: vaultTeam.address,
    batchTransferAddress: batchTransfer.address,
  });

  // console.log('dispatching distribution');
  // await dispatchDistribution(token, vault, allAllocations);
  // console.log('done');

  // await token.transferOwnership(admin);
  // const newOwnerToken = await token.owner();
  // console.log('\nToken Ownership transferred, new owner:', newOwnerToken);

  // await vault.transferOwnership(admin);
  // const newOwnerVault = await vault.owner();
  // console.log('Vault Ownership transferred, new owner:', newOwnerVault);

  const allocationsFounders = getAllocationsFounders();
  const allocationsTeam = getAllocationsTeam();
  const batchAllocationsDispatch = getAllocationsDispatch();

  const foundersInitial = 10;

  const allocationsFoundersVested = allocationsFounders.map((allocation) => ({
    ...allocation,
    amount: allocation.amount.sub(allocation.amount.mul(foundersInitial).div(BN(100))),
  }));
  const initialReceivers = allocationsFounders.map(({ receiver }) => receiver);
  const initialAmounts = allocationsFounders.map(({ amount }) => amount.mul(foundersInitial).div(100));

  const dispatchReceivers = batchAllocationsDispatch.map(({ receiver, tokens }) => receiver);
  const dispatchAmounts = batchAllocationsDispatch.map(({ receiver, tokens }) => tokens);

  await token.approve(vaultFounders.address, totalSupply);
  await token.approve(vaultTeam.address, totalSupply);
  let tx = await token.approve(batchTransfer.address, totalSupply);
  await tx.wait();

  await vaultFounders.addAllocationBatch(allocationsFoundersVested);
  await vaultTeam.addAllocationBatch(allocationsTeam);
  await batchTransfer.dispatch(token.address, initialReceivers, initialAmounts);
  await batchTransfer.dispatch(token.address, dispatchReceivers, dispatchAmounts);

  console.log((await token.balanceOf(owner.address)).toString());

  const balAfter = await provider.getBalance(owner.address);
  // console.log('bal After', balAfter);
  console.log('deploy costs', ethers.utils.formatEther(balBefore.sub(balAfter)));
  await vaultTeam.transferOwnership('0x56BEe757266812646a0DD07d93232210529CFeE8');
  await vaultFounders.transferOwnership('0x56BEe757266812646a0DD07d93232210529CFeE8');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
