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
import About from './About';
  
export class Main extends Component {
    render() {
        return (
            <Router>
                <div className="container">
                    <h2 className="title mt-5">Welcome to ISA Factory</h2>
                    <p>Powered by Superfluid in creating future streams</p>
                    <p className="subtitle">Here you can create ISA on Blockchain and stream lended money back on agreed Rate</p>
                    <small>Feel free to refresh whenever things don't work. Still in development 😅😅</small>
                    <nav class="navbar" role="navigation" aria-label="main navigation">
                        <p class="navbar-item" >
                            <Link to="/">Home</Link>
                        </p>
                        <p class="navbar-item" >
                            <Link to="/contract">New ISA Contract</Link>
                        </p>
                        <p class="navbar-item" >
                            <Link to="/about">About</Link>
                        </p>
                    </nav>
            
                    <Switch>
                        <Route exact path={`/contract/:contractAddress`}>
                            <Contract/>
                        </Route>
                        <Route exact path={`/contract`}>
                            <NewContract/>
                        </Route>
                        <Route path="/about">
                            <About />
                        </Route>
                        <Route path="/">
                            <Home />
                        </Route>

                    </Switch>
                    <footer class="footer">
                        <div class="content has-text-centered">
                            <p>
                            <strong>ISAs</strong> on Superfluid by <a href="https://prix.vercel.app">Prince Anuragi</a>.
                            
                            </p>
                        </div>
                    </footer>
                </div>
          </Router>
        )
    }
}

export default Main
