import React, { Component } from "react";
import ISA from "./contracts/ISA.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { 
    storageValue: 0, 
    web3: null,
    accounts: null, 
    contract: null, 
    cAddresses: [],
    currentContractData: {}
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = ISA.networks[networkId];
      const instance = new web3.eth.Contract(
        ISA.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance, cAddresses: [...this.state.cAddresses, deployedNetwork.address] }, this.getAllData);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  getAllData = async () => {
    let { contract } = this.state;
    if(contract){
      const res = await contract.methods.currentState().call();
      console.log(res);
      this.setState({
        currentContractData: res
      })
    }
  }

  render() {

    const {
      cAddresses,
      currentContractData
    } = this.state;

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Hi to the ISA Factory.</h1>
        <p>Powered by Superfluid, you can now lend money on chain. </p>
        <h2>ISA</h2>
        <p>
          Contract Address: {cAddresses.length > 0 && cAddresses[0]}
        </p>
        {
          Object.keys(currentContractData).map((key) => {
            if(isNaN(key)){
              return (
                <p key={key}>
                  {key}: {currentContractData[key]}
                </p>
              );
            }
          })  
        }
      </div>
    );
  }
}

export default App;
