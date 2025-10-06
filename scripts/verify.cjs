const hre = require('hardhat')

async function main() {
  const passAddr = process.env.PASS_ADDR
  const scoreAddr = process.env.SCORE_ADDR
  if (!passAddr || !scoreAddr) throw new Error('Set PASS_ADDR and SCORE_ADDR env vars')

  // Read actual constructor args from chain to avoid guessing
  const pass = await hre.ethers.getContractAt('BaseBlasterPass', passAddr)
  const owner = await pass.owner()
  // ERC1155 exposes uri(uint256). We can read any token id's uri to get base template
  const baseUri = await pass.uri(1)

  await hre.run('verify:verify', { address: passAddr, constructorArguments: [baseUri, owner] })
  await hre.run('verify:verify', { address: scoreAddr })
}

main().catch((e) => { console.error(e); process.exit(1) })


