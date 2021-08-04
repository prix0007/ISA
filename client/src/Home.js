import React, { Component } from 'react';

import getWeb3 from './getWeb3';

import { Link } from 'react-router-dom';

import ISAFactory from './contracts/ISAFactory.json';
import Refresh from './Refresh';
// const FACTORY_ADDRESS = "0x4e1e0024C675B19d157e4Ae7aFf8847d20d36941";

export class Home extends Component {
    state = { storageValue: 0, 
        web3: null,
        accounts: null, 
        factoryContract: null,
        contracts: [], 
        factoryAddress: "" 
    };

    componentDidMount = async () => {
        
        try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();

        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();

        // Get the contract isa Factory.
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = ISAFactory.networks[networkId];
        const isaFactory = new web3.eth.Contract(
            ISAFactory.abi,
            deployedNetwork && deployedNetwork.address,
        );

        // Set web3, accounts, and contract to the state, and then proceed with an
        // example of interacting with the contract's methods.
        this.setState({ web3, accounts, factoryContract: isaFactory, factoryAddress: deployedNetwork.address});
        this.fetchContracts()
        } catch (error) {
        // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    };

    fetchContracts = async () => {
        const {
            factoryContract
        } = this.state;
        console.log("fetching")
        const res = await factoryContract.methods.getDeployedISAs().call();
        this.setState({
            contracts: [
                ...this.state.contracts,
                ...res
            ]
        })
    }

    renderContracts() {
        const {contracts} = this.state;
        const UIItems = contracts.map((address) => {
          return (
            <div className="card m-3 is-one-fifth">
                <div className="card-content">
                    <div className="media">
                        <div className="media-left">
                            <figure className="image is-48x48">
                                <img src="https://bulma.io/images/placeholders/96x96.png" alt="Placeholder" />
                            </figure>
                        </div>
                        <div className="media-content">
                            <p className="title is-4">{address}</p>
                        </div>
                    </div>
            
                    <div className="content">
                        View this Contract on Rinkeby Network. <a target="_blank" href={`https://rinkeby.etherscan.io/address/${address}`}  rel="noopener noreferrer">Go</a>
                        
                        <br />
                        Goto Details <Link to={`/contract/${address}`}>Go</Link>
                    </div>
                </div>
            </div>
          );
        });
        return UIItems;
      }
    render() {
        const {
            factoryAddress,
            contracts
        } = this.state;
        return (
            <div className="container">
                <h1 className="title is-5">All ISA Contracts deployed from this factory</h1>
                <h1 className="title is-6">This Contract Factory Address on Rinkeby. <a target="_blank" href={`https://rinkeby.etherscan.io/address/${factoryAddress}`}  rel="noopener noreferrer">{factoryAddress}</a></h1>
                {
                    contracts.length > 0 ?
                    this.renderContracts() :
                    <Refresh />
                }
            </div>
        )
    }
}

export default Home
