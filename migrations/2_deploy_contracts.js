
var ISA = artifacts.require("./ISA.sol");

// TODO: Deployment from truffle is failing (succeeding from remix)
module.exports = async function(deployer, network, accounts) {
  console.log("Deploying ISA...")
  await deployer.deploy(
    ISA, 
    "0xeD5B5b32110c3Ded02a07c8b8e97513FAfb883B6",
    "0xF4C5310E51F6079F601a5fb7120bC72a70b96e2A",
    "0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90",
    "0x6e39261b2E76736D57f9161F1F01A68e82f0Ca8B",
    "0xf2700a4f973998496F09051c2E1075de40D69F8B",
    "0xe1e51Fbf5b1eCC73700d24D88b190f645dE27298",
    38051750380517,
    63072000,
    30
  ); 
  const instance = await ISA.deployed();
  console.log(instance.address);
};
