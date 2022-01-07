const hre = require('hardhat');
const { ethers } = require('hardhat');
const { parseEther, getAddress } = ethers.utils

const BN = ethers.BigNumber.from;

const config = require('../config.json');

const batchAllocationsFounders = require('../allocationFounders.json');
const batchAllocationsTeam = require('../allocationTeam.json');
const batchAllocationsDispatch = require('../allocationDispatch.json');

function getAllocationsDispatch() {
  return batchAllocationsDispatch.map(( {receiver, tokens} ) => ({receiver: receiver, tokens: parseEther('' + tokens)}))
}

function getAllocationsFounders() {
  return batchAllocationsFounders.map(({ name, tokens, receiver, type }) => {
    if (receiver === 'XXX') {
      console.log('USING PLACEHOLDER ADDRESS FOR', name)
      receiver = ethers.Wallet.createRandom().address;
    }

    // console.log({
    //   name: name,
    //   tokens: tokens,
    //   address: receiver,
    //   type: type,
    // });

    return {
      receiver: getAddress(receiver),
      amount: parseEther('' + tokens),
      claimed: 0,
      revocable: true,
    };
  });
}

function sumBN(allocation) {
  let sum = BN('0')
  for (let i = 0; i < allocation.length; i++)
    sum = sum.add(allocation[i])
  return sum
}

function getAllocationsTeam() {
  return batchAllocationsTeam.map(({ name, investment, tokens, receiver, type }) => {
    if (tokens == undefined) 
      tokens = parseInt((investment / 2) * 5);

    if (receiver === 'XXX') {
      console.log('USING PLACEHOLDER ADDRESS FOR', name)
      receiver = ethers.Wallet.createRandom().address;
    }

    

    // console.log({
    //   name: name,
    //   tokens: tokens,
    //   address: receiver,
    //   type: type,
    // });

    return {
      receiver: getAddress(receiver),
      amount: parseEther('' + tokens),
      claimed: 0,
      revocable: true,
    };
  });
}

async function attachContractsFromConfig() {
  const GamingStars = await ethers.getContractFactory('GamingStars');
  const VestingVault = await ethers.getContractFactory('VestingVault');
  const BatchTransfer = await ethers.getContractFactory('BatchTransfer');

  const token = await GamingStars.attach(config.tokenAddress);

  const totalSupply = await token.totalSupply();
  const symbol = await token.symbol();
  const name = await token.name();
  console.log(`\nToken '${name}' (${symbol})', supply`, totalSupply.toString(), 'attached to', token.address);

  const vaultFounders = await VestingVault.attach(config.vaultFounders);

  console.log('Founders vault attached to:', vaultFounders.address);
  console.log(
    'Vesting term:',
    new Date((await vaultFounders.vestingStartDate()).toNumber() * 1000),
    '-',
    new Date(( await vaultFounders.vestingEndDate() ).toNumber() * 1000)
  );

  const vaultTeam = await VestingVault.attach(config.vaultTeam);

  console.log('Team vault attached to:', vaultTeam.address);
  console.log(
    'Vesting term:',
    new Date((await vaultTeam.vestingStartDate()).toNumber() * 1000),
    '-',
    new Date(( await vaultTeam.vestingEndDate() ).toNumber() * 1000)
  );

  const batchTransfer = await BatchTransfer.attach(config.batchTransferAddress);

  // console.log('deploying batchTransfer');
  // const batchTransfer = await BatchTransfer.deploy();
  // await batchTransfer.deployed();

  return {
    token: token,
    vaultFounders: vaultFounders,
    vaultTeam: vaultTeam,
    batchTransfer: batchTransfer,
  };
}

async function dispatchDistribution(token, vault, allAllocations, batchTransfer) {
  const [owner, ...signers] = await ethers.getSigners();

  // Dispatch all initial allocations + vestings
  const totalSupply = await token.totalSupply();

  if (batchTransfer == undefined) {
    batchTransfer = await (await ethers.getContractFactory('BatchTransfer')).deploy();
    await batchTransfer.deployed();
    console.log('BatchTransfer deployed to:', batchTransfer.address);
  }

  await token.approve(vault.address, totalSupply);
  let tx = await token.approve(batchTransfer.address, totalSupply);
  await tx.wait();

  // console.log('vault allowance', (await token.allowance(owner.address, vault.address)).toString());
  // console.log('batchTransfer allowance', (await token.allowance(owner.address, batchTransfer.address)).toString());

  for (let group of allAllocations) {
    const { name, totalPerMille: totalPerMilleGroup, initialPerMille: initialPerMilleGroup, allocations } = group;

    const totalGroup = totalSupply.mul(totalPerMilleGroup).div(1000);

    const vestingAllocations = allocations.map((allocation) => {
      const totalAmount = totalGroup.mul(allocation.amountPerMille).div(1000);
      const initialAmount = totalAmount.mul(initialPerMilleGroup).div(1000);
      const vestedAmount = totalAmount.sub(initialAmount);

      return {
        receiver: allocation.receiver,
        amount: vestedAmount,
        revocable: allocation.revocable,
        claimed: 0,
      };
    });

    await vault.addAllocationBatch(vestingAllocations);

    let initialAllocations = allocations.map((allocation) => {
      const totalAmount = totalGroup.mul(allocation.amountPerMille).div(1000);
      const initialAmount = totalAmount.mul(initialPerMilleGroup).div(1000);

      return {
        receiver: allocation.receiver,
        amount: initialAmount,
      };
    });

    const initialAllocationsReceivers = initialAllocations.map((allocation) => allocation.receiver);
    const initialAllocationsAmounts = initialAllocations.map((allocation) => allocation.amount);

    await batchTransfer.dispatch(token.address, initialAllocationsReceivers, initialAllocationsAmounts);
  }
}

exports.attachContractsFromConfig = attachContractsFromConfig;
exports.dispatchDistribution = dispatchDistribution;

exports.getAllocationsDispatch = getAllocationsDispatch;
exports.getAllocationsFounders = getAllocationsFounders;
exports.getAllocationsTeam = getAllocationsTeam;
