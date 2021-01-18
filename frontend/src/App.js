import React from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
import authContext from './utils/authContext.js';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import config from './config.json';
import Cart from './components/cart/Cart'

import NavBar from './components/nav/NavBar';
import CommonFooter from './components/common/CommonFooter';
import CookieAccept from './components/legal/CookieAccept';

import LoginPage from './components/accounts/LoginPage';
import LogoutPage from './components/accounts/LogoutPage';
import ErrorPage from './components/errors/ErrorPage';
import HomePage from './components/home/HomePage';
import OrderToastiePage from './components/toastie_bar/OrderToastiePage';
import CheckoutPage from './components/checkout/CheckoutPage';
import OrderStashPage from './components/stash/OrderStashPage';
import ViewStashItemPage from './components/stash/view/ViewStashItemPage';
import DebtorPage from './components/debtors/DebtorPage';
import GymInformationPage from './components/gym/GymInformationPage';
import GymTermsPage from './components/gym/GymTermsPage';
import PurchaseMembershipPage from './components/membership/PurchaseMembershipPage';

import ElectionOverviewPage from './components/elections/overview/ElectionOverviewPage';
import ElectionVotingPage from './components/elections/vote/ElectionVotingPage';

import ContributorsPage from './components/legal/ContributorsPage';
import CookiesPage from './components/legal/CookiesPage';

import SpinnerTestPage from './components/common/SpinnerTestPage';

// To add a new page import it like above

import ToastieBarStockPage from './components/toastie_bar/admin/ToastieBarStockPage';
import ToastiesImagesPage from './components/toastie_bar/admin/ImagesPage';
import StashStockPage from './components/stash/admin/StashStockPage';
import StashImagesPage from './components/stash/admin/ImagesPage';
import EditPermissionsPage from './components/permissions/EditPermissionsPage';
import StashExportPage from './components/stash/export/StashExportPage';
import GymAdminPage from './components/gym/admin/GymAdminPage';
import ExportMembershipsPage from './components/membership/export/ExportMembershipsPage';
import ManageMembershipsPage from './components/membership/manage/ManageMembershipsPage';
import ElectionAdminPortal from './components/elections/portal/ElectionAdminPortal';
import CreateElectionPage from './components/elections/create/CreateElectionPage';
import GenerateElectionResultsPage from './components/elections/results/GenerateElectionResultsPage';

const stripePromise = loadStripe(config.stripe.publicKey);

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

    if(!this.validateLocalSession(user)) {
      user = null;
    }

    this.cart = new Cart();

    this.state = {
      user,
      hideBody: false
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

    if(this.isLoggedIn() === 1) {
      this.logoutUser();
    }
  }

  componentDidMount = () => {
    if(this.isLoggedIn() === 1) {
      this.logoutUser();
    }
  }

  hasLoginExpired = (user) => {
    // Check if the login session has expired
    if(user === null) {
      return false;
    }

    const currentDate = new Date().getTime();
    const expires = new Date(user.expires).getTime();

    return currentDate > expires;
  }

  validateLocalSession = (user) => {
    if(user === null) {
      return false;
    }

    if(!user.hasOwnProperty("permissions")) {
      return false;
    }

    if(!user.hasOwnProperty("email")) {
      return false;
    }

    if(!user.hasOwnProperty("expires")) {
      return false;
    }

    if(!user.hasOwnProperty("username")) {
      return false;
    }

    if(this.hasLoginExpired(user)) {
      return false;
    }

    return true;
  }

  isLoggedIn = () => {
    // Check if the user is logged in
    // Perform basic checks on the user if it is clearly modified
    if(this.state.user === null) {
      return 0;
    }

    if(!this.validateLocalSession(this.state.user)) {
      return 1;
    }

    return 2;
  }

  hasPermission = (permission) => {
    if(!this.isLoggedIn()) {
      return false;
    }

    if(!this.state.user.permissions) {
      return false;
    }

    if(this.state.user.permissions.length === 0) {
      return false;
    }

    return this.state.user.permissions.includes(permission.toLowerCase());
  }

  loginUser = (user) => {
    this.setState({ user });
  }

  logoutUser = () => {
    this.cart.get();
    this.cart.setLocked(false);
    this.cart.clearCart();

    let cookiesApproved = false;
    const lsCookies = localStorage.getItem("cookiesApproved");

    if(lsCookies !== undefined && lsCookies !== null) {
      const boolLsCookies = JSON.parse(lsCookies);
      if(boolLsCookies === true) {
        cookiesApproved = true;
      }
    }

    localStorage.clear();

    if(cookiesApproved === true) {
      localStorage.setItem("cookiesApproved", cookiesApproved);
    }

    this.setState({ user: null });
  }

  componentDidMount = () => {
    if(!this.isLoggedIn() && this.state.user !== null) {
      this.logoutUser();
    }
  }

  hideBody = (show) => {
    this.setState({ hideBody: show });
  }

  render () {
    const bodyHidden = this.state.hideBody ? "hidden" : "";

    return (
      <Elements stripe={stripePromise}>
        <authContext.Provider value={this.state.user}>
          <Router>
            <div className="min-h-full h-full flex flex-col">
              <CookieAccept />
              <NavBar
                hideBody={this.hideBody}
              />
              <div className={`${bodyHidden} flex-grow flex flex-col`}>
                <div className="flex-grow">
                  <Switch>
                    <Route exact path="/" render={() => (
                      <HomePage />
                    )} />
                    <Route exact path="/contributors" render={() => (
                      <ContributorsPage />
                    )} />
                    <Route exact path="/cookies" render={() => (
                      <CookiesPage />
                    )} />
                    <Route exact path="/accounts/login" render={() => (
                      this.isLoggedIn() ? ( <Redirect to="/" /> ) : ( <LoginPage loginUser={this.loginUser} /> )
                    )} />
                    <Route exact path="/accounts/logout" render={() => ( <LogoutPage logoutUser={this.logoutUser} /> )} />
                    <Route exact path="/memberships/join" render={() => (
                      this.isLoggedIn() ? ( <PurchaseMembershipPage /> ) : ( <LoginPage loginUser={this.loginUser} /> )
                    )} />
                    <Route exact path="/toasties/stock" render={() => (
                      this.hasPermission("toastie.stock.edit") ? ( <ToastieBarStockPage /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/toasties/images" render={() => (
                      this.hasPermission("toastie.stock.edit") ? ( <ToastiesImagesPage /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/stash/stock" render={() => (
                      this.hasPermission("stash.stock.edit") ? ( <StashStockPage /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/stash/images" render={() => (
                      this.hasPermission("stash.stock.edit") ? ( <StashImagesPage /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/stash/export" render={() => (
                      this.hasPermission("stash.export") ? ( <StashExportPage /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/permissions" render={() => (
                      this.hasPermission("permissions.edit") ? ( <EditPermissionsPage /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/toasties/" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <OrderToastiePage /> : <Redirect to="/memberships/join" /> ) : ( <Redirect to="/accounts/login" /> )
                    )} />
                    <Route exact path="/debtors" render={() => (
                      this.isLoggedIn() ? ( <DebtorPage /> ) : ( <Redirect to="/accounts/login" /> )
                    )} />
                    <Route exact path="/gym" render={() => (
                      this.isLoggedIn() ? ( <GymInformationPage /> ) : ( <Redirect to="/accounts/login" /> )
                    )} />
                    <Route exact path="/gym/terms" render={() => (
                      this.isLoggedIn() ? ( <GymTermsPage /> ) : ( <Redirect to="/accounts/login" /> )
                    )} />
                    <Route exact path="/gym/admin" render={() => (
                      this.hasPermission("gym.export") ? ( <GymAdminPage /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/memberships/export" render={() => (
                      this.hasPermission("jcr.export") ? ( <ExportMembershipsPage /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/memberships/manage" render={() => (
                      this.hasPermission("jcr.manage") ? ( <ManageMembershipsPage /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/elections/" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <ElectionOverviewPage /> : <Redirect to="/memberships/join" /> ) : ( <Redirect to="/accounts/login" /> )
                    )} />
                    <Route exact path="/elections/vote/:id" render={(props) => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <ElectionVotingPage {...props} /> : <Redirect to="/memberships/join" /> ) : ( <Redirect to="/accounts/login" /> )
                    )} />
                    <Route exact path="/elections/admin" render={() => (
                      this.hasPermission("elections.manage") ? ( <ElectionAdminPortal /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/elections/create" render={() => (
                      this.hasPermission("elections.manage") ? ( <CreateElectionPage /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/elections/results/:id" render={(props) => (
                      this.hasPermission("elections.manage") ? ( <GenerateElectionResultsPage {...props} /> ) : ( <Redirect to="/errors/403" /> )
                    )} />
                    <Route exact path="/stash/" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <OrderStashPage /> : <Redirect to="/memberships/join" /> ) : ( <Redirect to="/accounts/login" /> )
                    )} />
                    <Route exact path="/stash/view/:id" render={(props) => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <ViewStashItemPage {...props} /> : <Redirect to="/memberships/join" /> ) : ( <Redirect to="/accounts/login" /> )
                    )} />
                    <Route exact path="/spinner/" render={() => (
                      this.isLoggedIn() ? ( <SpinnerTestPage /> ) : ( <Redirect to="/accounts/login" /> )
                    )} />
                    <Route exact path="/checkout/" render={() => (
                      this.isLoggedIn() ? ( <CheckoutPage /> ) : ( <Redirect to="/accounts/login" /> )
                    )} />
                    <Route exact path="/errors/:code" render={(props) => (
                      <ErrorPage {...props} />
                    )} />
                    <Route render={() => (
                      <ErrorPage code="404" />
                    )} />
                  </Switch>
                </div>
                <CommonFooter />
              </div>
            </div>
          </Router>
        </authContext.Provider>
      </Elements>
    );
  }
}

export default App;
