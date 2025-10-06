require('dotenv').config()
require('@nomicfoundation/hardhat-toolbox')

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.24',
  networks: {
    basesepolia: {
      url: 'https://sepolia.base.org',
      chainId: 84532,
      accounts: process.env.pk ? [process.env.pk] : []
    },
    base: {
      url: 'https://mainnet.base.org',
      chainId: 8453,
      accounts: process.env.pk ? [process.env.pk] : []
    }
  },
  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY || ''
  }
}


