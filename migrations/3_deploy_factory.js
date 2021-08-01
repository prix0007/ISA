var ISAFactory = artifacts.require("./ISAFactory.sol");

// TODO: Deployment from truffle is failing (succeeding from remix)
module.exports = async function(deployer, network, accounts) {
  console.log("Deploying ISA Factory...")
  await deployer.deploy(
    ISAFactory
  ); 
  const instance = await ISAFactory.deployed();
  console.log(instance.address);
};
