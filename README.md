# Solidity Vesting Vault for a BEP20 / ERC20 token

```shell
npx hardhat compile
npx hardhat test
node scripts/deploy.js
```

## Generate Addresses

```shell
npx hardhat run scripts/generateKeys.js
```

## Verify allocations

```shell
npx hardhat test
```

## Deploy

```shell
npx hardhat run scripts/deploy.js --network bscTest
```

update `vault-args.js`

```shell
npx hardhat verify 0xf300e4F1A193Dd047B0C6747aD4E16dedf886297 --network bsc --contract contracts/GamingStars.sol:GamingStars
npx hardhat verify 0x361945e1476e327E4017E03177FD389EBA2F498C --network bsc --constructor-args vault-args.js
```

## Tests

```
  Allocations
    ✓ correct ownership set
    ✓ all allocations in JSON sum to 100%
    ✓ all distributed allocations sum to totalSupply

  VestingVault
    ✓ allow owner withdrawing for non-vault tokens (50ms)
    when creating the vault
      ✓ all fields are set correctly
      ✓ owner access control is set
      ✓ time access control is set
      ✓ claimable amount is zero
      ✓ only owner can allocate allowance
    when creating an allocation
      ✓ requirements are met
      ✓ all fields are set correctly
      ✓ claimable amount is zero
      ✓ allowance can be revoked by owner
    when claiming
      ✓ amount is paid out daily
      ✓ amount is correctly paid out over time
    when revoking
      ✓ amount is calculated correctly
      ✓ ability to revoke can be removed


  17 passing (2s)
```

npx hardhat run scripts/deploy.js --network bscTest

npx hardhat verify 0xD0e7797D91eee19373545236aD243BF303B39CA7 --network bscTest --contract contracts/GamingStars.sol:GamingStars

Edit: vault-args.js
npx hardhat verify 0xaC9255686e6c0fa9A97DaFD0B5A465EB94aA4880 --network bscTest --constructor-args vault-args.js

Edit: config.json

npx hardhat run scripts/dispatch.js --network bscTest

https://testnet.bscscan.com/address/0xDDceDB15dd7125223163F27D9E649D42F576EfB0#code

Total sum of tokens founders 38704080 (initial) 7740816 (vested) 30963264
Total sum of tokens team 15300000
Total sum of treasury, etc. 47995920
Full sum 102000000
