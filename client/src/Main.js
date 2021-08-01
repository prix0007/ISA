import React, { Component } from 'react'
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
  } from "react-router-dom";

import Contract from './Contract';
import Home from './Home';
import NewContract from './NewContract';
  
export class Main extends Component {
    render() {
        return (
            <Router>
                <div className="container">
                    <h2 className="title mt-5">Welcome to ISA Factory</h2>
                    <p>Powered by Superfluid in creating future streams</p>
                    <p className="subtitle">Here you can create ISA on Blockchain and stream lended money back on agreed Rate</p>
                    <nav class="navbar" role="navigation" aria-label="main navigation">
                        <a class="navbar-item">
                            <Link to="/">Home</Link>
                        </a>
                        <a class="navbar-item">
                            <Link to="/contract">New ISA Contract</Link>
                        </a>
                    </nav>
            
                    <Switch>
                        <Route exact path={`/contract/:contractAddress`}>
                            <Contract/>
                        </Route>
                        <Route exact path={`/contract`}>
                            <NewContract/>
                        </Route>
                        <Route path="/">
                            <Home />
                        </Route>
                    </Switch>
                </div>
          </Router>
        )
    }
}

export default Main
