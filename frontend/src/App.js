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
import DebtPage from './components/debt/DebtPage';
import GymInformationPage from './components/gym/GymInformationPage';
import GymTermsPage from './components/gym/GymTermsPage';
import PurchaseMembershipPage from './components/membership/PurchaseMembershipPage';
import WelfarePage from './components/welfare/WelfarePage';
import WelfareMessagingPage from './components/welfare/message/WelfareMessagingPage';
import WelfareThreadPage from './components/welfare/message/thread/WelfareThreadPage';

import CareersPage from './components/careers/CareersPage';

import ElectionOverviewPage from './components/elections/overview/ElectionOverviewPage';
import ElectionVotingPage from './components/elections/vote/ElectionVotingPage';

import ContributorsPage from './components/legal/ContributorsPage';
import CookiesPage from './components/legal/CookiesPage';


import EventsOverviewPage from './components/events/overview/EventsOverviewPage';
import EventsInfoPage from './components/events/info/EventsInfoPage';
import EventsTermsPage from './components/events/disclaimer/EventsTermsPage';
import EventsGroupBookingPage from './components/events/book/EventsGroupBookingPage';
import EventsPaymentPage from './components/events/payment/EventsPaymentPage';
import EventsMyBookingsOverview from './components/events/my/EventsMyBookingsOverview';
import EventsMyBookingPage from './components/events/my/EventsMyBookingPage';

import FeedbackPage from './components/feedback/FeedbackPage';

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
import ElectionEditPage from './components/elections/portal/ElectionEditPage';
import WelfareAdminOverviewPage from './components/welfare/message/admin/WelfareAdminOverviewPage';
import WelfareAdminThreadPage from './components/welfare/message/admin/WelfareAdminThreadPage';
import MediaPage from './components/media/MediaViewPage';
import MediaAdminPage from './components/media/MediaAdminPage';
import CareersAdminPage from './components/careers/CareersAdminPage';
import CareersEditPost from './components/careers/CareersEditPost';
import FeedbackAdminOverview from './components/feedback/FeedbackAdminOverview';
import FeedbackViewPage from './components/feedback/FeedbackViewPage';

import ManageDebtPage from './components/debt/admin/ManageDebtPage';
import CreateNewEventPage from './components/events/admin/create/CreateNewEventPage';
import EventsGroupManagePage from './components/events/admin/groups/EventsGroupManagePage';
import EventsExportPage from './components/events/admin/export/EventsExportPage';
import EventsExportOverview from './components/events/admin/export/EventsExportOverview';
import EventsManagePage from './components/events/admin/overview/EventsManagePage';
import EditEventDetails from './components/events/admin/edit/EditEventDetails';
import EventsAdminBookingPage from './components/events/admin/book/EventsAdminBookingPage';

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
      hideBody: false,
      ref: "/"
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

  loginUser = (user, ref) => {
    this.setState({ user, ref });
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

  loginRef = (ref) => {
    return (
      <Redirect to={`/accounts/login?ref=${ref}`} />
    );
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
                    <Route exact path="/accounts/login" render={(props) => (
                      this.isLoggedIn() ? ( <Redirect to={this.state.ref} /> ) : ( <LoginPage {...props} loginUser={this.loginUser} /> )
                    )} />
                    <Route exact path="/accounts/logout" render={() => ( <LogoutPage logoutUser={this.logoutUser} /> )} />
                    <Route exact path="/memberships/join" render={() => (
                      this.isLoggedIn() ? ( <PurchaseMembershipPage /> ) : ( <Redirect to="/accounts/login?ref=/memberships/join" /> )
                    )} />
                    <Route exact path="/toasties/stock" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("toastie.stock.edit") ? ( <ToastieBarStockPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/toasties/stock") )
                    )} />
                    <Route exact path="/toasties/images" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("toastie.stock.edit") ? ( <ToastiesImagesPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/toasties/images") )
                    )} />
                    <Route exact path="/stash/stock" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("stash.stock.edit") ? ( <StashStockPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/stash/stock") )
                    )} />
                    <Route exact path="/stash/images" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("stash.stock.edit") ? ( <StashImagesPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/stash/images") )
                    )} />
                    <Route exact path="/stash/export" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("stash.export") ? ( <StashExportPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/stash/export") )
                    )} />
                    <Route exact path="/permissions" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("permissions.edit") ? ( <EditPermissionsPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/permissions") )
                    )} />
                    <Route exact path="/toasties" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <OrderToastiePage /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/toasties") )
                    )} />
                    <Route exact path="/media" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <MediaPage /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/media") )
                    )} />
                    <Route exact path="/media/admin" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("media.manage") ? ( <MediaAdminPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/media/admin") )
                    )} />
                    <Route exact path="/debt" render={(props) => (
                      this.isLoggedIn() ? ( <DebtPage {...props} /> ) : ( this.loginRef("/debt") )
                    )} />
                    <Route exact path="/debt/manage" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("debt.manage") ? ( <ManageDebtPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/debt/manage") )
                    )} />
                    <Route exact path="/gym" render={() => (
                      this.isLoggedIn() ? ( <GymInformationPage /> ) : ( this.loginRef("/gym") )
                    )} />
                    <Route exact path="/gym/terms" render={() => (
                      this.isLoggedIn() ? ( <GymTermsPage /> ) : ( this.loginRef("/gym/terms") )
                    )} />
                    <Route exact path="/gym/admin" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("gym.export") ? ( <GymAdminPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/gym/admin") )
                    )} />
                    <Route exact path="/memberships/export" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("jcr.export") ? ( <ExportMembershipsPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/memberships/export") )
                    )} />
                    <Route exact path="/memberships/manage" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("jcr.manage") ? ( <ManageMembershipsPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/memberships/manage") )
                    )} />
                    <Route exact path="/elections" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <ElectionOverviewPage /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/elections") )
                    )} />
                    <Route exact path="/elections/vote/:id" render={(props) => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <ElectionVotingPage {...props} /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/elections") )
                    )} />
                    <Route exact path="/elections/admin" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("elections.manage") ? ( <ElectionAdminPortal /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/elections/admin") )
                    )} />
                    <Route exact path="/elections/create" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("elections.manage") ? ( <CreateElectionPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/elections/create") )
                    )} />
                    <Route exact path="/elections/results/:id" render={(props) => (
                      this.isLoggedIn() ? (this.hasPermission("elections.manage") ? ( <GenerateElectionResultsPage {...props} /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/elections/admin") )
                    )} />
                    <Route exact path="/elections/edit/:id" render={(props) => (
                      this.isLoggedIn() ? (this.hasPermission("elections.manage") ? ( <ElectionEditPage {...props} /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/elections/admin") )
                    )} />
                    <Route exact path="/welfare/" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <WelfarePage /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/welfare") )
                    )} />
                    <Route exact path="/welfare/message" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <WelfareMessagingPage /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/welfare/message") )
                    )} />
                    <Route exact path="/welfare/message/thread/:id" render={(props) => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <WelfareThreadPage {...props} /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/welfare") )
                    )} />
                    <Route exact path="/welfare/message/admin" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("welfare.anonymous") ? ( <WelfareAdminOverviewPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/welfare/message/admin") )
                    )} />
                    <Route exact path="/welfare/message/admin/thread/:id" render={(props) => (
                      this.isLoggedIn() ? (this.hasPermission("welfare.anonymous") ? ( <WelfareAdminThreadPage {...props} /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/welfare/message/admin") )
                    )} />
                    <Route exact path="/stash/" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <OrderStashPage /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/stash") )
                    )} />
                    <Route exact path="/stash/view/:id" render={(props) => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <ViewStashItemPage {...props} /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/stash") )
                    )} />
                    <Route exact path="/careers/" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <CareersPage /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/careers") )
                    )} />
                    <Route exact path="/careers/admin" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("careers.manage") ? <CareersAdminPage /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/careers/admin") )
                    )} />
                    <Route exact path="/careers/edit/:id" render={(props) => (
                      this.isLoggedIn() ? ( this.hasPermission("careers.manage") ? <CareersEditPost {...props} /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/careers") )
                    )} />
                    <Route exact path="/spinner/" render={() => (
                      this.isLoggedIn() ? ( <SpinnerTestPage /> ) : ( this.loginRef("/spinner") )
                    )} />
                    <Route exact path="/events/admin" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("events.manage") ? ( <EventsManagePage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/events/admin") )
                    )} />
                    <Route exact path="/events/admin/create" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("events.manage") ? ( <CreateNewEventPage /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/events/admin/create") )
                    )} />
                    <Route exact path="/events/admin/edit/:eventId" render={(props) => (
                      this.isLoggedIn() ? (this.hasPermission("events.manage") ? ( <EditEventDetails {...props} /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef(`/events/admin/edit/${props.match.params.eventId}`) )
                    )} />
                    <Route exact path="/events/admin/groups/:eventId" render={(props) => (
                      this.isLoggedIn() ? (this.hasPermission("events.manage") ? ( <EventsGroupManagePage {...props} /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef(`/events/admin/groups/${props.match.params.eventId}`) )
                    )} />
                    <Route exact path="/events/admin/export" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("events.export") ? ( <EventsExportOverview /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/events/admin/export") )
                    )} />
                    <Route exact path="/events/admin/export/:eventId" render={(props) => (
                      this.isLoggedIn() ? (this.hasPermission("events.export") ? ( <EventsExportPage {...props} /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef(`/events/admin/export/${props.match.params.eventId}`) )
                    )} />
                    <Route exact path="/events/admin/groups/:eventId/create/:ticketTypeId" render={(props) => (
                      this.isLoggedIn() ? (this.hasPermission("events.manage") ? ( <EventsAdminBookingPage {...props} /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef(`/events/admin/groups/${props.match.params.eventId}/create/${props.match.params.ticketTypeId}`) )
                    )} />
                    <Route exact path="/events/" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <EventsOverviewPage /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/events") )
                    )} />
                    <Route exact path="/my/bookings" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <EventsMyBookingsOverview /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/my/bookings") )
                    )} />
                    <Route exact path="/my/ticket/:ticketId" render={(props) => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <EventsMyBookingPage {...props} /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef(`/my/ticket/${props.ticketId}`) )
                    )} />
                    <Route exact path="/events/terms" render={() => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <EventsTermsPage /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef("/events/terms") )
                    )} />
                    <Route exact path="/events/event/:id/book/:type" render={(props) => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <EventsGroupBookingPage {...props} /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef(`/events/event/${props.match.params.id}`) )
                    )} />
                    <Route exact path="/events/event/:id" render={(props) => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <EventsInfoPage {...props} /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef(`/events/event/${props.match.params.id}`) )
                    )} />
                    <Route exact path="/events/bookings/payment/:id" render={(props) => (
                      this.isLoggedIn() ? ( this.hasPermission("jcr.member") ? <EventsPaymentPage {...props} /> : <Redirect to="/memberships/join" /> ) : ( this.loginRef(`/events/bookings/payment/${props.match.params.id}`) )
                    )} />
                    <Route exact path="/checkout/" render={() => (
                      this.isLoggedIn() ? ( <CheckoutPage /> ) : ( this.loginRef("/checkout") )
                    )} />
                    <Route exact path="/feedback" render={() => (
                      this.isLoggedIn() ? ( <FeedbackPage /> ) : ( this.loginRef("/feedback") )
                    )} />
                    <Route exact path="/feedback/admin" render={() => (
                      this.isLoggedIn() ? (this.hasPermission("feedback.manage") ? ( <FeedbackAdminOverview /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef("/feedback/admin") )
                    )} />
                    <Route exact path="/feedback/view/:id" render={(props) => (
                      this.isLoggedIn() ? (this.hasPermission("feedback.manage") ? ( <FeedbackViewPage {...props} /> ) : ( <Redirect to="/errors/403" /> )) : ( this.loginRef(`/feedback/view/${props.id}`) )
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
