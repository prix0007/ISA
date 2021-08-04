import React, {Component} from "react";


import getWeb3 from "./getWeb3";

import ISAFactory from './contracts/ISAFactory.json';

import { toast as superToast } from 'bulma-toast';

import Refresh from './Refresh';

const initError = {
    ehost: "",
    ecfa: "",
    eacceptedToken: "",
    estudent: "",
    elender: "",
    einstitute: "",
    ethresholdSalary: "",
    erate: "",
    etotalTime: ""    
}

const initContractState = {
    host: "0xeD5B5b32110c3Ded02a07c8b8e97513FAfb883B6",
    cfa: "0xF4C5310E51F6079F601a5fb7120bC72a70b96e2A",
    acceptedToken: "0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90",
    student: "",
    lender: "",
    institute: "",
    thresholdSalary: "",
    rate: "",
    totalTime: ""   
}
class NewCampaign extends Component {
    state = { storageValue: 0, 
        web3: null,
        accounts: null, 
        factoryContract: null,
        contractDetails: {
            ...initContractState
        }, 
        error: {
            ...initError
        },
        loading: false
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
        
        if(!this.checkForm()){
            return
        }
        if(factoryContract ){
            this.setState({
                loading: true
            });
            try {
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
                superToast({
                    message: `Create ISA Success with transaction Hash: ${res.transactionHash}`,
                    type: 'is-success',
                    dismissible: true,
                    pauseOnHover: true,
                });
                console.log(res)
                this.setState({
                    loading: false,
                    contractDetails: {
                        ...initContractState
                    }
                });
                
            } catch (err) {
                superToast({
                    message: `Create ISA Failed due to ${err.message}`,
                    type: 'is-danger',
                    dismissible: true,
                    pauseOnHover: true,
                })
                this.setState({
                    loading: false
                });
            }
            
        } else {
            alert("Looks like factory not loaded. Try Refreshing!");
        }

    }

    checkForm = () => {
        // Return true if form is correct
        const {
            contractDetails,
            web3
        } = this.state;

        const tempError = {};

        Object.keys(contractDetails).forEach((key) => {
            const curVal = contractDetails[key];
            // console.log(curVal)
            if(typeof curVal === "string" && curVal.startsWith("0x")) {
                if(!web3.utils.isAddress(curVal)){
                    // console.log("Not a Valid Address")
                    tempError["e"+key] = "Address is Not Correct!"
                } 
            } else if (typeof curVal === "string" && key !== "rate" && key !== "thresholdSalary" && key !== "totalTime") {
                if(curVal !== this.checkValue(curVal)){
                    tempError["e"+key] = this.checkValue(curVal)
                } 
            } else {
                try {
                    const num = parseInt(curVal)
                    
                    if(!Number.isNaN(num)){
                        switch(key){
                            case "rate": if(num < 10 || num > 80){
                                tempError["e"+key] = "Lender Rate can be between 10-80 % only"
                            }; break;
                            case "thresholdSalary": if(num < 0){
                                tempError["e"+key] = "Threshold Salary Can't be negative. Supply in wei/sec"
                            } break;
                            case "totalTime": if(num < 0 || num > 63072000){
                                tempError["e"+key] = "Total time of repayment can be between 0 to 63072000 e.g 0-2 Years in seconds"
                            } break;
                            default: 
                        }
                    } else {
                        tempError["e"+key] = "Error in Parsing Number. Only Positive Integers Allowed"
                    }
                   
                } catch{
                    tempError["e"+key] = "Wrong Value. Try Again"
                }
                
                  
            }
        })

        
       
        if(Object.keys(tempError).length === 0){
            this.setState({
                error: {
                    ...initError  
                  },
            });
            return true;
        } else {
            this.setState({
                error: {   
                    ...initError,                 
                    ...tempError
                }
            });
            return false;
        }

    }

    checkValue = (val) => {
        if (typeof val === "string") {
            if(val.trim().length === 0) {
                return "Value can't be Zero"
            }
            return val
        }
        return val
    }

    checkAddress = (addr) => {
        const { web3 } = this.state;
        if(web3){
            return web3.utils.isAddress(addr);
        } else {
            return false;
        }
    }

    render() {
        const { error, loading, factoryContract } = this.state;
        return (
            factoryContract ? 
            <div>
                <div>
                    <h5>These default contract addresses for host, cfa and acceptedToken you can find on Superfluid Network Directory. </h5>
                    <a href="https://docs.superfluid.finance/superfluid/networks/networks" target="_blank" rel="noopener noreferrer">Go to network Directory</a>
                </div>
                <div className="border">
                    <div className="row">
                        <p>Host Contract Address</p>
                        <input 
                            className="input is-primary" 
                            type="text" 
                            name="host" 
                            onChange={(e) => this.handleChange(e)}
                            placeholder="Enter the Superfluid host Contract from Superfluid"
                            value={this.state.contractDetails.host}
                        />
                    </div>
                    <p className="has-text-danger-dark">{error.ehost}</p>
                </div>
                <div className="border">
                    <div className="row">
                        <p>CFA Contract Address</p>
                        <input 
                            className="input is-primary" 
                            type="text" 
                            name="cfa" 
                            onChange={(e) => this.handleChange(e)}
                            placeholder="Enter the CFA Agreement Contract from Superfluid"
                            value={this.state.contractDetails.cfa}
                        />
                    </div>
                    <p className="has-text-danger-dark">{error.ecfa}</p>
                </div>
                <div className="border">
                    <div className="row">
                        <p>Accepted Token Address</p>
                        <input 
                            className="input is-primary" 
                            type="text" 
                            name="acceptedToken" 
                            onChange={(e) => this.handleChange(e)}
                            placeholder="Accepted Token Address Here It is fDAIx"
                            value={this.state.contractDetails.acceptedToken}
                        />
                    </div>
                    <p className="has-text-danger-dark">{error.eacceptedToken}</p>
                </div>
                <div className="border">
                    <div className="row">
                        <p>Student Address</p>
                        <input 
                            className="input is-primary" 
                            type="text" 
                            name="student" 
                            onChange={(e) => this.handleChange(e)}
                            placeholder="Student's Address Who is availing ISA"
                            value={this.state.contractDetails.student}
                        />
                    </div>
                    <p className="has-text-danger-dark">{error.estudent}</p>
                </div>
                <div className="border">
                    <div className="row">
                        <p>Lender Address</p>
                        <input 
                            className="input is-primary" 
                            type="text" 
                            name="lender" 
                            onChange={(e) => this.handleChange(e)}
                            placeholder="Lender's Address who will lend the Student 1 Ether"
                            value={this.state.contractDetails.lender}
                        />
                    </div>
                    <p className="has-text-danger-dark">{error.elender}</p>
                </div>
                <div className="border">
                    <div className="row">
                        <p>Institute Address</p>
                        <input 
                            className="input is-primary" 
                            type="text" 
                            name="institute" 
                            onChange={(e) => this.handleChange(e)}
                            placeholder="Student's Institute Address who can withdraw 1 Ether from ISA"
                            value={this.state.contractDetails.institute}
                        />
                    </div>
                    <p className="has-text-danger-dark">{error.einstitute}</p>
                </div>
                <div className="border">
                    <div className="row">
                        <p>Threshold Salary (wei/sec)</p>
                        <input 
                            className="input is-primary" 
                            type="text" 
                            name="thresholdSalary" 
                            onChange={(e) => this.handleChange(e)}
                            placeholder="Minimum Threshold Salary in wei/sec"
                            value={this.state.contractDetails.thresholdSalary}
                        />
                    </div>
                    <p className="has-text-danger-dark">{error.ethresholdSalary}</p>
                </div>
                <div className="border">
                    <div className="row">
                        <p>Rate ( in Lender's %)</p>
                        <input 
                            className="input is-primary" 
                            type="text" 
                            name="rate" 
                            onChange={(e) => this.handleChange(e)}
                            placeholder="% Rate of Lender in ISA (e.g Is 30% Lender then 70% to Student when income stream in contract is above threshold)"
                            value={this.state.contractDetails.rate}
                        />
                    </div>
                    <p className="has-text-danger-dark">{error.erate}</p>
                </div>
                <div className="border">
                    <div className="row">
                        <p>Total Time of Repayment (in seconds)</p>
                        <input 
                            className="input is-primary" 
                            type="text" 
                            name="totalTime" 
                            onChange={(e) => this.handleChange(e)}
                            placeholder="It will be in seconds between 0-2 years"
                            value={this.state.contractDetails.totalTime}
                        />
                    </div>
                    <p className="has-text-danger-dark">{error.etotalTime}</p>
                </div>
                {
                    loading ?
                    <progress class="progress is-small is-primary" max="100"></progress> : 
                    <button className="button mt-3 is-primary" onClick={() => this.handleSubmit()}>Create ISA</button>
                }
            </div> :
            <Refresh />
        );
  }
};

export default NewCampaign;
