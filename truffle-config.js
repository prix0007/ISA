const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require('dotenv').config()



module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: process.env.MNEUMONIC
          },
          providerOrUrl: "https://ropsten.infura.io/v3/bf567dab1a2d408398fedddef254c344",
         
        }),
      network_id: '3',
    },
    goreli: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: process.env.MNEUMONIC
          },
          providerOrUrl: "https://ropsten.infura.io/v3/bf567dab1a2d408398fedddef254c344",
        
        }),
      network_id: '5',
    },
    rinkeby: {
      provider: new HDWalletProvider({
        mnemonic: {
          phrase: process.env.MNEUMONIC
        },
        providerOrUrl: "https://rinkeby.infura.io/v3/bf567dab1a2d408398fedddef254c344",
        
      }),
      network_id: '4',
      
    },
  },
  compilers: {
    solc: {
      version:"^0.7.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200  // Optimize for how many times you intend to run the code
        },
        
      },
     
    }
  }
};
