import React, { Component } from "react";
import ISA from "./contracts/ISA.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import { countdown } from './common';

import SuperfluidSDK from '@superfluid-finance/js-sdk';
import Web3 from 'web3';

import { useParams } from "react-router";
import Refresh from "./Refresh";

import { toast } from 'bulma-toast';

const Mediator = () => {
  const { contractAddress } = useParams();
  
  return <App contractAddress={contractAddress} />;
}

// DaiX Token
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
    currentUser: null,
    currentUserSFDetails: null,
    isRefreshButton: false,
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
      const instance = new web3.eth.Contract(
        ISA.abi,
        this.props.contractAddress,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ 
        web3, 
        sf,
        accounts, 
        contract: instance, 
        cAddresses: [...this.state.cAddresses, this.props.contractAddress] }, 
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
      this.getSfDetails();
      
    }
  }

  renderToast = (msg, type) => {
    toast({
      message: msg,
      type: type,
      dismissible: true,
      pauseOnHover: true,
      closeOnClick: true,
      duration: 2000
    })
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
        }); break;
      default: return;
    }
  }

  convertToLocalTime = (unixTimeStamp) => {
    const date = new Date(unixTimeStamp);
    return date.toLocaleString();
  }

  sendTradeable = async () => {
    const val = document.getElementById("tradeable").value;
    if(val.trim() === "") return;
    const finalVal = val.trim().toLowerCase() === "true" ? true : false; 
    const {
      accounts,
      contract
    } = this.state;

    if(contract){
      try{
        const res = await contract.methods.setTradeable(finalVal).send({from: accounts[0]})
        console.log(res)
        this.renderToast(`Successful Transaction: Txn Hash ${res.transactionHash}`, "is-success")
      } catch (e) {
        this.renderToast(e.message, "is-danger");
      }
    }

  }

  sendPriceSet = async () => {
    const val = document.getElementById("price").value;
    const finalVal = val.trim().toLowerCase(); 
    const {
      accounts,
      contract,
      web3
    } = this.state;

    if(contract){
      try{
        const res = await contract.methods.setTradePrice(web3.utils.toWei(finalVal)).send({from: accounts[0]})
        console.log(res)
        this.renderToast(`Successful Transaction: Txn Hash ${res.transactionHash}`, "is-success")
      } catch (e) {
        this.renderToast(e.message, "is-danger");
      }
    }
  }

  sendLenderChange = async () => {
    const val = document.getElementById("lender").value;
    const finalVal = val.trim().toLowerCase(); 
    const {
      accounts,
      contract,
      web3
    } = this.state;

    if(contract && web3.utils.isAddress(finalVal)){
      try{
        const res = await contract.methods.changeReciever(finalVal).send({from: accounts[0]})
        console.log(res)
        this.renderToast(`Successful Transaction: Txn Hash ${res.transactionHash}`, "is-success");
      } catch (e) {
        this.renderToast(e.message, "is-danger");
      }
    } else {
      this.renderToast("Oh,  ho! Looks like new Address Isn't correct.","is-danger")
    }
  }

  approveInstitute = async () => {
    
    const {
      accounts,
      contract,
    } = this.state;

    if(contract ){
      try{
        const res = await contract.methods.approve().send({from: accounts[0]})
        console.log(res)
        this.renderToast(`Successful Transaction: Txn Hash ${res.transactionHash}`, "is-success");
      } catch (e) {
        this.renderToast(e.message, "is-danger");
      }
    } else {
      this.renderToast("Oh, ho! Contract isn't Loaded Correctly","is-danger")
    }
  }

  withdrawMoney = async () => {
    const {
      accounts,
      contract,
      
    } = this.state;

    if(contract ){
      try{
        const res = await contract.methods.withdraw().send({from: accounts[0]})
        console.log(res)
        this.renderToast(`Successful Transaction: Txn Hash ${res.transactionHash}`, "is-success");
      } catch (e) {
        this.renderToast(e.message || "Some Error Occured", "is-danger");
      }
    } else {
      this.renderToast("Oh ho! Contract isn't Loaded Correctly", "is-danger")
    }
  }

  renderCfa = () => {
    // const times = ["sec", "minute", "hour", "day", "month", "year"];
   
    return (
      <div className="m-5">
        <p>Send a fDAIx flow to this contract.</p>
        <input className="input is-primary m-1" type="text" placeholder="Enter amount in wei/sec to start flow" id="flowRateInput" />
        {/* <div class="select" >
          <select id="timeScale">
            { 
              times.map((time, index) => {
                return <option key={time} value={time} >{time}</option>
              })
            }
          </select>
        </div> */}
        <button className="button is-primary m-1" onClick={() => this.startCfa()}>Start Flow</button>
      </div>
    )
  }

  getSfDetails = async () => {
    const {
      currentUser
    } = this.state;
    if(currentUser) {
      const details = await currentUser.details();
      console.log(details)
      this.setState({
        currentUserSFDetails: details
      })
    } else {
      this.renderToast("Error in loading User Superfluid Account.", "is-danger");
    }
  }

  renderSfDetails = () => {
    const {
      currentUserSFDetails
    } = this.state;
    if(currentUserSFDetails){
      const views = [];

      views.push(
        <p>{`Your Current CFA Netflow is :${currentUserSFDetails.cfa.netFlow} wei/sec`}</p>
      )

      views.push(
        <p className="title is-6">Inflow CFA</p>
      )
      currentUserSFDetails.cfa.flows.inFlows.forEach(flowObj => {
        const { flowRate, receiver, sender} = flowObj;
        views.push(
          <div className="border">
            <p>{`Flowrate: ${flowRate} wei/sec`}</p>
            <p className="has-text-weight-bold">{`Reciever: ${this.formattedAddress(receiver)}`}</p>
            <p className="has-text-weight-bold">{`Sender: ${this.formattedAddress(sender)}`}</p>
            <button className="button is-danger" onClick={() => this.stopCfa(receiver)}>Stop Flow</button>
          </div>
        )
      });

      
      views.push(
        <p className="title is-6">Outflows CFA</p>
      )
      currentUserSFDetails.cfa.flows.outFlows.forEach(flowObj => {
          const { flowRate, receiver, sender} = flowObj;
          views.push(
            <div className="border">
              <p>{`Flowrate: ${flowRate} wei/sec`}</p>
              <p className="has-text-weight-bold">{`Reciever: ${this.formattedAddress(receiver)}`}</p>
              <p className="has-text-weight-bold">{`Sender: ${this.formattedAddress(sender)}`}</p>
              <button className="button is-danger" onClick={() => this.stopCfa(receiver)}>Stop Flow</button>
            </div>
          )
      });

      return views;

    } else {
      this.renderToast("User Superfluid Flows aren't Loaded", "is-danger")
      return [];
    }
  }

  stopCfa = async (receiver) => {
    const {
      currentUser,
    } = this.state;

    if(currentUser){
      try {
        const res = await currentUser.flow({
            recipient: receiver,
            flowRate: "0"
        });
        this.renderToast(`Stream Stopped Successfully. Txn Id: ${res.tx}`, "is-success");
        console.log(res)
      } catch (err) {
        this.renderToast(err.message || "Some Error Occured", "is-danger");
        console.log(err)
      }
    } else {
      this.renderToast("Current User Superfluid Not Loaded", "is-danger")
    }

  }

  startCfa = async () => {
    const {
      currentUser,
      cAddresses,
     
    } = this.state;
    const val = document.getElementById("flowRateInput").value;
    let finalVal = val.trim().toLowerCase(); 
    // finalVal = web3.utils.toWei(finalVal);
    // console.log(finalVal);
    // const scaleElem = document.getElementById("timeScale");
    // const scale = scaleElem.options[scaleElem.selectedIndex].value;
    // console.log(scale);
    // finalVal = web3.utils.BN(finalVal)
    // switch(scale) {
    //   case "sec": finalVal = finalVal;
    //   case "minute": finalVal = finalVal.div60; break;
    //   case "hour":  finalVal = finalVal.div(60*60); break;
    //   case "day": finalVal = finalVal.div(60*60*24); break;
    //   case "month": finalVal = finalVal.div(60*60*24*30); break;
    //   case "year": finalVal = finalVal.div(60*60*24*365); break;
    //   default: finalVal = finalVal;
    // }
    // console.log(finalVal);
    // return
   

    if(currentUser){
      const res = await currentUser.flow({
          recipient: cAddresses[0],
          flowRate: finalVal
      });
      this.renderToast(`Stream Started Successfully. Txn Id: ${res.tx}`, "is-success");
      console.log(res)
      val.innerHtml = ""
    } else {
      this.renderToast("Current User Superfluid Not Loaded", "is-danger")
    }

  }

  formattedAddress = (addr) => {
    return `${addr.substr(0,8)}...${addr.substr(addr.length - 3, addr.length)}`
  }

  renderInteractions = () => {
    const {
      accounts,
      // contract,
      // currentUser,
      contractParties
    } = this.state;

    let views = [];

    views.push(
      <p className="has-text-weight-bold">{`Current Active Account: ${this.formattedAddress(accounts[0])}`}</p>
    )

    if(contractParties){
      switch(accounts[0]){
        case contractParties['student']: 
          views.push(<p> Hi there, student </p>); 
          views.push(<div>
            Things you can do with this contract. 
            <br /> <hr /> Approve Your Institute to Withdraw <br />
            <button className="button is-primary m-1" onClick={() => this.approveInstitute()}>Approve Institute</button>
          </div>)
          break;
        case contractParties['lender']: 
          views.push(<p> Hi there lender.</p>); 
          views.push(<div>
            Things you can do with this contract. 
            <br /> <hr /> Set it Tradeable <br />
            <input class="input is-primary m-1" type="text" placeholder="Enter true or false" id="tradeable" />
            <button className="button is-primary m-1" onClick={() => this.sendTradeable()}>Set Tradeable</button>
            <br /> <hr /> Set a Price for trading <br />
            <input class="input is-primary m-1" type="text" placeholder="Enter Price in Eth" id="price" />
            <button className="button is-primary m-1" onClick={() => this.sendPriceSet()}>Set Trading Price</button>
            <br /> <hr /> Send this contract's lender's right to someone else <br />
            <input class="input is-primary m-1" type="text" placeholder="Enter an Address 0x..." id="lender" />
            <button className="button is-primary m-1" onClick={() => this.sendLenderChange()}>Send Lender's Right</button>
          </div>)
          break;
        case contractParties['institute']: 
          views.push(<p> Hi Institute</p>); 
          views.push(<div>
            Things you can do with this contract. 
            <br /> <hr /> Withdraw Money from this Contract <br />
            <button className="button is-primary m-1" onClick={() => this.withdrawMoney()}>Withdraw 1 Ether</button>
          </div>)
          break;
        default: views.push(<p>Look like you are not any Party in this contract.</p>)
      }
    }

    views.push(this.renderCfa())

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
      contractRates,
      currentUserSFDetails
    } = this.state;

    if (!this.state.web3) {
      
      return (
        <div>
          Loading Web3, accounts, and contract...
          <progress className="progress is-small is-primary" max="100"></progress>
          { <Refresh />}
        </div> 
      );
    }
    // console.log(this.renderSfDetails());
    return (
      <div className="App">
        <div className="columns">
          <div className="column is-four-fifths">
            <h2 className="title">ISA</h2>
            <p className="subtitle">
              Details for Contract Address: 
              {cAddresses.length > 0 ?
                <a href={`https://rinkeby.etherscan.io/address/${cAddresses[0]}`} target="_blank" rel="noopener noreferrer">
                  <strong>{cAddresses[0]}</strong>
                </a> : <p>Contract not Loaded Yet</p>
              } 
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
                      return (
                        <tr key={key}>
                          <td>{key}</td>
                          <td><strong>{currentContractData[key]}</strong></td>
                        </tr>
                      );
                      
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
            <div className="border">
              { currentUserSFDetails && <p className="title is-4"> Your Current Flows Details </p>}
              {
                currentUserSFDetails && this.renderSfDetails().map(element => element)
              }
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
        </div>

       
        
      </div>
    );
  }
}

export default Mediator;
