import React, {Component} from "react";


import getWeb3 from "./getWeb3";

import ISAFactory from './contracts/ISAFactory.json';

class NewCampaign extends Component {
    state = { storageValue: 0, 
        web3: null,
        accounts: null, 
        factoryContract: null,
        contractDetails: {
          host: "",
          cfa: "",
          acceptedToken: "",
          student: "",
          lender: "",
          institute: "",
          thresholdSalary: "",
          rate: "",
          totalTime: ""      
        }, 
         
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
        this.setState({ web3, accounts, factoryContract: isaFactory});
        
        } catch (error) {
        // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    };

    handleChange = (e) => {
        this.setState({
            contractDetails: {
                ...this.state.contractDetails,
                [e.target.name]: e.target.value
            }
        })
    } 

    handleSubmit = async () => {
        const {
            accounts,
            factoryContract,
            contractDetails: {
                host,
                cfa,
                acceptedToken,
                student,
                lender,
                institute,
                thresholdSalary,
                totalTime,
                rate,
            }
        } = this.state
        if(factoryContract){
            const res = await factoryContract.methods.createISA(
                host,
                cfa,
                acceptedToken,
                student,
                lender,
                institute,
                thresholdSalary,
                totalTime,
                rate
            ).send({from: accounts[0]});

            console.log(res);
        } else {
            alert("Looks like factory not loaded. Try Refreshing!");
        }

    }

    render() {
        return (
            <div>
                <div className="row border">
                    <p>Host Contract Address</p>
                    <input className="input is-primary" type="text" name="host" onChange={(e) => this.handleChange(e)}/>
                </div>
                <div className="row border">
                    <p>CFA Contract Address</p>
                    <input className="input is-primary" type="text" name="cfa" onChange={(e) => this.handleChange(e)}/>
                </div>
                <div className="row border">
                    <p>Accepted Token Address</p>
                    <input className="input is-primary" type="text" name="acceptedToken" onChange={(e) => this.handleChange(e)}/>
                </div>
                <div className="row border">
                    <p>Student Address</p>
                    <input className="input is-primary" type="text" name="student" onChange={(e) => this.handleChange(e)}/>
                </div>
                <div className="row border">
                    <p>Lender Address</p>
                    <input className="input is-primary" type="text" name="lender" onChange={(e) => this.handleChange(e)}/>
                </div>
                <div className="row border">
                    <p>Institute Address</p>
                    <input className="input is-primary" type="text" name="institute" onChange={(e) => this.handleChange(e)}/>
                </div>
                <div className="row border">
                    <p>Threshold Salary (wei/sec)</p>
                    <input className="input is-primary" type="text" name="thresholdSalary" onChange={(e) => this.handleChange(e)}/>
                </div>
                <div className="row border">
                    <p>Rate ( in Lender's %)</p>
                    <input className="input is-primary" type="text" name="rate" onChange={(e) => this.handleChange(e)}/>
                </div>
                <div className="row border">
                    <p>Total Time of Repayment (in seconds)</p>
                    <input className="input is-primary" type="text" name="totalTime" onChange={(e) => this.handleChange(e)}/>
                </div>
                <button className="button mt-3 is-primary" onClick={() => this.handleSubmit()}>Create ISA</button>
            </div>
        );
  }
};

export default NewCampaign;
