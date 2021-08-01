import React, { Component } from "react";
import ISA from "./contracts/ISA.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import { countdown } from './common';

import SuperfluidSDK from '@superfluid-finance/js-sdk';
import Web3 from 'web3';

const ACCEPTED_TOKEN = "0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90";
class App extends Component {
  state = { 
    storageValue: 0, 
    web3: null,
    accounts: null, 
    contract: null, 
    cAddresses: [],
    currentContractData: {},
    student: {
      flowRate: 0,
      weiRate: 0,
      scale: "sec",
    },
    lender: {
      flowRate: 0,
      weiRate: 0,
      scale: "sec"
    },
    contractBalances: null,
    contractFlows: null, 
    contractParties: null, 
    contractRates: null,
    sf: null,
    currentUser: null
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      const sf = new SuperfluidSDK.Framework({
        web3: new Web3(window.ethereum),
      });
      await sf.initialize();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = ISA.networks[networkId];
      const instance = new web3.eth.Contract(
        ISA.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ 
        web3, 
        sf,
        accounts, 
        contract: instance, 
        cAddresses: [...this.state.cAddresses, deployedNetwork.address] }, 
        this.getAllData
      );
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Please make sure you are on RINKEBY TESTNET in order to use ISA`,
      );
      console.error(error);
    }
  };

  getAllData = async () => {
    let { contract, sf, accounts } = this.state;
    if(contract){
      const res = await contract.methods.currentState().call();
      
      this.setState({
        currentContractData: res,
        student: {
          ...this.state.student,
          weiRate: res['studentflowRate'],
          flowRate: this.convertWeiToDai(res['studentflowRate'])
        },
        lender: {
          ...this.state.lender,
          weiRate: res['lenderflowRate'],
          flowRate: this.convertWeiToDai(res['lenderflowRate'])
        },

      });

      const contractBalances = await contract.methods.contractBalances().call();
      const contractFlows = await contract.methods.contractFlows().call();
      const contractParties = await contract.methods.contractParties().call();
      const contractRates = await contract.methods.contractRates().call();

      this.setState({
        contractBalances, contractFlows, contractParties, contractRates
      })
    }
    if(sf) {
      const currentUser = sf.user({
        address: accounts[0],
        token: ACCEPTED_TOKEN
      })
      this.setState({currentUser})
    }
  }

  convertWeiToDai = (wei) => {
    return (wei/10**18)
  }

  convertToTime = (unit, wei) => {
    const amtSec = this.convertWeiToDai(wei);
    switch(unit) {
      case "sec": return amtSec;
      case "minute": return amtSec*60;
      case "hour": return amtSec*60*60;
      case "day": return amtSec*60*60*24;
      case "month": return amtSec*60*60*24*30;
      case "year": return amtSec*60*60*24*365;
      default: return wei;
    }
  } 

  handleTimeChange = (e, type) => {
    // console.log(e.target.value);
    // console.log(type);
    const { student, lender } = this.state;
    switch(type){
      case "student" : this.setState({
        student: {
          ...student,
          flowRate: this.convertToTime(e.target.value, student.weiRate)
        },
        scale: e.target.value
      }); break;
      case "lender": 
      this.setState({
        lender: {
          ...lender,
          flowRate: this.convertToTime(e.target.value, lender.weiRate)
        },
        scale: e.target.value
      });
    }
  }

  convertToLocalTime = (unixTimeStamp) => {
    const date = new Date(unixTimeStamp);
    return date.toLocaleString();
  }

  renderInteractions = () => {
    const {
      accounts,
      contract,
      currentUser,
      contractParties
    } = this.state;

    let views = [];

    if(contractParties){
      switch(accounts[0]){
        case contractParties['student']: views.push(<p> Hi there, student </p>); break;
        case contractParties['lender']: views.push(<p> Hi there lender.</p>); break;
        case contractParties['lender']: views.push(<p> Hi Institute</p>); break;
        default: console.log('Non Party')
      }
    }

    return views

  }

  render() {

    const times = ["sec", "minute", "hour", "day", "month", "year"];

    const {
      cAddresses,
      currentContractData,
      student,
      lender,
      contractBalances, 
      contractFlows, 
      contractParties, 
      contractRates
    } = this.state;

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1 className="title">Hi to the ISA Factory.</h1>
        <p className="subtitle">Powered by Superfluid, you can now lend money on chain. </p>
        
        <div className="columns">
          <div className="column is-four-fifths">
            <h2 className="title">ISA</h2>
            <p className="subtitle">
              Details for Contract Address: <strong>{cAddresses.length > 0 && cAddresses[0]}</strong>
            </p>
            {contractRates ? <div className="container">
              <div className="row">
                {contractBalances && <div>
                    <p className="subtitle">Contract Balance Details</p>
                    <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
                      <thead>
                        <tr className="is-selected">
                          <th>Label</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Current Lender Rate (Outflow to lender)</td>
                          <td>{contractBalances['currentLenderRate']} wei/sec</td>
                        </tr>
                        <tr>
                          <td>Current Student Rate (Outflow to student)</td>
                          <td>{contractBalances['currentStudentRate']} wei/sec</td>
                        </tr>
                        <tr>
                          <td>Time Already Paid to Lender</td>
                          <td>{countdown(contractBalances['timeUnitPaid'])}</td>
                        </tr>
                        <tr>
                        <td>Time Contracted Time to Pay</td>
                          <td>{countdown(contractBalances['totalTime'])}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                }
                {contractFlows && <div>
                  <p className="subtitle">Contract Flows</p>
                  <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
                    <thead>
                      <tr className="is-selected">
                        <th>Label</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Current Lender Flow</td>
                        <td>{contractFlows['lenderflowRate']} wei/sec</td>
                      </tr>
                      <tr>
                        <td>Current Student Flow</td>
                        <td>{contractFlows['studentflowRate']} wei/sec</td>
                      </tr>
                      <tr>
                        <td>Net Flow of Contract (this should remain 0)</td>
                        <td>{contractFlows['netFlowISA']}</td>
                      </tr>
                      <tr>
                        <td>Minimum Payout of this contract to lender(threshold*timeLeft)</td>
                        <td>{this.convertWeiToDai(contractRates['thresholdSalary']*(contractBalances['totalTime']-contractBalances['timeUnitPaid'])).toFixed(4)} dai</td>
                      </tr>
                    </tbody>
                  </table>
                </div>}
              </div>
              <div className="row">
                {contractParties && <div>
                  <p className="subtitle">Contract Parties</p>
                  <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
                    <thead>
                      <tr className="is-selected">
                        <th>Label</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Student</td>
                        <td>{contractParties['student']}</td>
                      </tr>
                      <tr>
                        <td>Lender</td>
                        <td>{contractParties['lender']}</td>
                      </tr>
                      <tr>
                        <td>Institute</td>
                        <td>{contractParties['institute']}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>}
                {contractRates && <div>
                  <p className="subtitle">Contract Rates</p>
                  <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
                    <thead>
                      <tr className="is-selected">
                        <th>Label</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Accepted Token</td>
                        <td>{contractRates['acceptedToken']}</td>
                      </tr>
                      <tr>
                        <td>Distribution Rate of ISA</td>
                        <td>{contractRates['distributionRate']}% to Lender / {100-contractRates['distributionRate']}% to student</td>
                      </tr>
                      <tr>
                        <td>Threshold Income of Student to Activate ISA Repayment</td>
                        <td>{contractRates['thresholdSalary']} wei/sec</td>
                      </tr>
                      <tr>
                        <td>Is available for Trade(only set by lender)</td>
                        <td>{contractRates['isTradeable'] ? `Yes, Price set by Lender ${contractRates['tradePrice']}` : "No"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>}
              </div>
            </div> : <progress className="progress is-small is-primary" max="100">15%</progress>}
            <div>
              <p className=" ">Contract data raw form</p>
              <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
                <thead>
                  <tr className="is-selected">
                    <th>Label</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    Object.keys(currentContractData).map((key) => {
                      if(isNaN(key)){
                        return (
                          <tr key={key}>
                            <td>{key}</td>
                            <td><strong>{currentContractData[key]}</strong></td>
                          </tr>
                        );
                      }
                    })  
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div className="column is-one-fifth">
            <h3 className="title">Contract Interactions</h3>
            {
              this.renderInteractions()
            }
          </div>
        </div>

        <div className="row">
          <div>
            <p>Student Flow Rate: </p>
          </div>
          <div>
            <select onChange={e => this.handleTimeChange(e, "student")}>
              {
                times.map((time) => {
                  return <option key={time}>{time}</option>
                })
              }
            </select>
          </div>
          <div>
            <p>{`${student.flowRate.toFixed(8)} dai/${student.scale}` }</p>
          </div>
        </div>

        <div className="row">
          <div>
            <p>Lender Flow Rate: </p>
          </div>
          <div>
            <select onChange={e => this.handleTimeChange(e, "lender")}>
              {
                times.map((time) => {
                  return <option key={time}>{time}</option>
                })
              }
            </select>
          </div>
          <div>
            <p>{`${lender.flowRate.toFixed(8)} dai/${lender.scale}` }</p>
          </div>
        </div>      
        
      </div>
    );
  }
}

export default App;
