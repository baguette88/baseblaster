const hre = require('hardhat')

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  const passAddr = process.env.PASS_ADDR
  const scoreAddr = process.env.SCORE_ADDR
  if (!passAddr || !scoreAddr) throw new Error('Set PASS_ADDR and SCORE_ADDR env vars')

  const uri = 'https://example.com/{id}.json'
  await hre.run('verify:verify', { address: passAddr, constructorArguments: [uri, deployer.address] })
  await hre.run('verify:verify', { address: scoreAddr })
}

main().catch((e) => { console.error(e); process.exit(1) })


