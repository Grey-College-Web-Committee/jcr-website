import React from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
import authContext from './utils/authContext.js';

import NavigationBar from './components/nav/NavigationBar';

import LoginPage from './components/accounts/LoginPage';
import LogoutPage from './components/accounts/LogoutPage';
import GymPage from './components/gym/GymPage';
import PaymentFinishedPage from './components/payment/PaymentFinishedPage';
import ErrorPage from './components/errors/ErrorPage';
import HalloweenPage from './components/halloween/HalloweenPage';

import AdminGymPage from './components/gym/admin/AdminGymPage';

import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    // We store the authContext user in local storage
    // Retrieve it and parse it
    const storedUserState = localStorage.getItem("user");
    let user = null;

    if(storedUserState !== null) {
      try {
        user = JSON.parse(storedUserState);
      } catch (error) {
        user = null;
      }
    }

    this.state = {
      user
    };
  }

  /*
  * Important to note that all of these functions are client side
  * hence local storage etc are able to be modified. These functions
  * should solely be used to alter things like the navigation bar
  * rather than relied on to check if the user really has permission to
  * access data!
  *
  * Instead the server MUST check on every request (via the session stored
  * server side) whether the user has the correct permissions.
  */

  componentDidUpdate = (oldProps, oldState) => {
    // Updates the local storage with the user info when it is changed
    if(this.state.user !== oldState.user) {
      if(this.state.user === null) {
        localStorage.setItem("user", null);
        return;
      }

      localStorage.setItem("user", JSON.stringify(this.state.user));
    }
  }

  hasLoginExpired = () => {
    // Check if the login session has expired
    if(this.state.user === null) {
      return false;
    }

    const currentDate = new Date().getTime();
    const expires = new Date(this.state.user.expires).getTime();

    return currentDate > expires;
  }

  isLoggedIn = () => {
    // Check if the user is logged in
    // Perform basic checks on the user if it is clearly modified
    if(this.state.user === null) {
      return false;
    }

    if(!this.state.user.hasOwnProperty("expires")) {
      return false;
    }

    if(!this.state.user.hasOwnProperty("username")) {
      return false;
    }

    if(this.hasLoginExpired()) {
      return false;
    }

    return true;
  }

  isAdmin = () => {
    if(!this.isLoggedIn()) {
      return false;
    }

    if(!this.state.user.hasOwnProperty("admin")) {
      return false;
    }

    return this.state.user.admin;
  }

  loginUser = (user) => {
    this.setState({ user });
  }

  logoutUser = () => {
    this.setState({ user: null });
  }

  componentDidMount = () => {
    if(!this.isLoggedIn() && this.state.user !== null) {
      this.logoutUser();
    }
  }

  render () {
    return (
      <authContext.Provider value={this.state.user}>
        <Router>
          <div className="App">
            <NavigationBar />
            <div className="content">
              <Switch>
                <Route exact path="/" render={() => (
                  <h1>Homepage</h1>
                )} />
                <Route exact path="/payments/:result/:jwt" render={(props) => (
                  <PaymentFinishedPage {...props} />
                )} />
                <Route exact path="/admin/gym" render={() => (
                  this.isAdmin() ? ( <AdminGymPage /> ) : ( <Redirect to="/errors/403" /> )
                )} />
                <Route exact path="/accounts/login" render={() => (
                  this.isLoggedIn() ? ( <Redirect to="/" /> ) : ( <LoginPage loginUser={this.loginUser} /> )
                )} />
                <Route exact path="/accounts/logout" render={() => ( <LogoutPage logoutUser={this.logoutUser} /> )} />
                <Route exact path="/gym" render={() => (
                  this.isLoggedIn() ? ( <Redirect to="/halloween" /> ) : ( <Redirect to="/accounts/login" /> )
                )} />
                <Route exact path="/halloween" render={() => (
                  this.isLoggedIn() ? ( <HalloweenPage /> ) : ( <Redirect to="/accounts/login" /> )
                )} />
                <Route exact path="/errors/:code" render={(props) => (
                  <ErrorPage {...props} />
                )} />
                <Route render={() => (
                  <ErrorPage code="404" />
                )} />
              </Switch>
            </div>
          </div>
        </Router>
      </authContext.Provider>
    );
  }
}

export default App;
