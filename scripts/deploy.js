const hre = require('hardhat')

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log('deployer', deployer.address)

  const Pass = await hre.ethers.getContractFactory('BaseBlasterPass')
  const pass = await Pass.deploy('https://example.com/{id}.json', deployer.address)
  await pass.waitForDeployment()

  const Score = await hre.ethers.getContractFactory('ScoreRegistry')
  const score = await Score.deploy()
  await score.waitForDeployment()

  console.log('PASS', await pass.getAddress())
  console.log('SCORE', await score.getAddress())
}

main().catch((e) => { console.error(e); process.exit(1) })


