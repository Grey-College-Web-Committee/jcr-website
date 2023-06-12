import React from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch, Link } from 'react-router-dom';
import authContext from './utils/authContext.js';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import config from './config.json';
import Cart from './components/cart/Cart';

import NavBar from './components/nav/NavBar';
import CommonFooter from './components/common/CommonFooter';
import CookieAccept from './components/legal/CookieAccept';
import LoadingHolder from './components/common/LoadingHolder.jsx';

const LoginPage = React.lazy(() => import('./components/accounts/LoginPage'));
const LogoutPage = React.lazy(() => import('./components/accounts/LogoutPage'));

const RegisterPage = React.lazy(() => import('./components/accounts/register/RegisterPage'));
const AdminApprovePage = React.lazy(() => import('./components/accounts/register/AdminApprovePage'));

const AlumniRegisterPage = React.lazy(() => import('./components/accounts/alumni/AlumniRegisterPage'));
const VerifyAlumniPage = React.lazy(() => import('./components/accounts/alumni/VerifyAlumniPage'));
const AdminApproveAlumniPage = React.lazy(() => import('./components/accounts/alumni/AdminApproveAlumniPage'))

import ErrorPage from './components/errors/ErrorPage';
import HomePage from './components/home/HomePage';

const CheckoutPage = React.lazy(() => import('./components/checkout/CheckoutPage'));
// import OrderStashPage from './components/stash/OrderStashPage';
// import ViewStashItemPage from './components/stash/view/ViewStashItemPage';
const DebtPage = React.lazy(() => import('./components/debt/DebtPage'));
const GymInformationPage = React.lazy(() => import('./components/gym/GymInformationPage'));
const GymTermsPage = React.lazy(() => import('./components/gym/GymTermsPage'));
const GymInductionPage = React.lazy(() => import('./components/gym/GymInductionPage'));
const PurchaseMembershipPage = React.lazy(() => import('./components/membership/PurchaseMembershipPage'));
const WelfarePage = React.lazy(() => import('./components/welfare/WelfarePage'));
const WelfareMessagingPage = React.lazy(() => import('./components/welfare/message/WelfareMessagingPage'));
const WelfareThreadPage = React.lazy(() => import('./components/welfare/message/thread/WelfareThreadPage'));
const ComplaintsPage = React.lazy(() => import('./components/complaints/ComplaintsPage'));

const CareersPage = React.lazy(() => import('./components/careers/CareersPage'));

const ElectionOverviewPage = React.lazy(() => import('./components/elections/overview/ElectionOverviewPage'));
const ElectionVotingPage = React.lazy(() => import('./components/elections/vote/ElectionVotingPage'));

const ContributorsPage = React.lazy(() => import('./components/legal/ContributorsPage'));
const CookiesPage = React.lazy(() => import('./components/legal/CookiesPage'));

const EventsOverviewPage = React.lazy(() => import('./components/events/overview/EventsOverviewPage'));
const EventsInfoPage = React.lazy(() => import('./components/events/info/EventsInfoPage'));
const EventsTermsPage = React.lazy(() => import('./components/events/disclaimer/EventsTermsPage'));
const EventsGroupBookingPage = React.lazy(() => import('./components/events/book/EventsGroupBookingPage'));
const EventsPaymentPage = React.lazy(() => import('./components/events/payment/EventsPaymentPage'));
const EventsMyBookingsOverview = React.lazy(() => import('./components/events/my/EventsMyBookingsOverview'));
const EventsMyBookingPage = React.lazy(() => import('./components/events/my/EventsMyBookingPage'));
const EventsFreeReqPage = React.lazy(() => import('./components/events/free/EventsFreeReqPage'));
const SwappingPage = React.lazy(() => import('./components/swapping/SwappingPage'));
const SwappingAdminPage = React.lazy(() => import('./components/swapping/SwappingAdminPage'));

const FeedbackPage = React.lazy(() => import('./components/feedback/FeedbackPage'));
const ApplicantsPage = React.lazy(() => import('./components/applicants/ApplicantsPage'));

// import BarOrderingPage from './components/bar/BarOrderingPage';
// import ViewBarItemPage from './components/bar/ViewBarItemPage';
// import BarBookingPage from './components/bar/book/BarBookingPage';

// To add a new page import it like above

// import BarAdminManageDrinks from './components/bar/admin/BarAdminManageDrinks';
// import BarAdminManageMixers from './components/bar/admin/BarAdminManageMixers';
// import BarAdminManageSizes from './components/bar/admin/BarAdminManageSizes';
// import BarAdminManageTypes from './components/bar/admin/BarAdminManageTypes';
// import BarAdminOverview from './components/bar/admin/BarAdminOverview';
// import BarAdminLive from './components/bar/admin/live/BarAdminLive';
// import BarAdminViewBookings from './components/bar/admin/BarAdminViewBookings';
// import BarAdminManageCordials from './components/bar/admin/BarAdminManageCordials';

// import ToastieBarStockPage from './components/toastie_bar/admin/ToastieBarStockPage';
// import ToastiesImagesPage from './components/toastie_bar/admin/ImagesPage';
// import ToastieAdminLive from './components/toastie_bar/admin/live/ToastieAdminLive';
// import ToastieBarOverview from './components/toastie_bar/admin/ToastieBarOverview';

const StashStockPage = React.lazy(() => import('./components/stash/admin/StashStockPage'));
const StashImagesPage = React.lazy(() => import('./components/stash/admin/ImagesPage'));
const EditPermissionsPage = React.lazy(() => import('./components/permissions/EditPermissionsPage'));
const StashExportPage = React.lazy(() => import('./components/stash/export/StashExportPage'));
const GymAdminPage = React.lazy(() => import('./components/gym/admin/GymAdminPage'));
const ExportMembershipsPage = React.lazy(() => import('./components/membership/export/ExportMembershipsPage'));
const ManageMembershipsPage = React.lazy(() => import('./components/membership/manage/ManageMembershipsPage'));
const ElectionAdminPortal = React.lazy(() => import('./components/elections/portal/ElectionAdminPortal'));
const CreateElectionPage = React.lazy(() => import('./components/elections/create/CreateElectionPage'));
const GenerateElectionResultsPage = React.lazy(() => import('./components/elections/results/GenerateElectionResultsPage'));
const ElectionEditPage = React.lazy(() => import('./components/elections/portal/ElectionEditPage'));
const WelfareAdminOverviewPage = React.lazy(() => import('./components/welfare/message/admin/WelfareAdminOverviewPage'));
const WelfareAdminThreadPage = React.lazy(() => import('./components/welfare/message/admin/WelfareAdminThreadPage'));
const MediaPage = React.lazy(() => import('./components/media/MediaViewPage'));
const ViewImagesPage = React.lazy(() => import('./components/media/ViewImagesPage'));
const MediaAdminPage = React.lazy(() => import('./components/media/MediaAdminPage'));

const ComplaintsAdminOverview = React.lazy(() => import('./components/complaints/ComplaintsAdminOverview'));
const ComplaintViewPage = React.lazy(() => import('./components/complaints/ComplaintViewPage'));

const CareersAdminPage = React.lazy(() => import('./components/careers/CareersAdminPage'));
const CareersEditPost = React.lazy(() => import('./components/careers/CareersEditPost'));
const FeedbackAdminOverview = React.lazy(() => import('./components/feedback/FeedbackAdminOverview'));
const FeedbackViewPage = React.lazy(() => import('./components/feedback/FeedbackViewPage'));

const ManageDebtPage = React.lazy(() => import('./components/debt/admin/ManageDebtPage'));
const CreateNewEventPage = React.lazy(() => import('./components/events/admin/create/CreateNewEventPage'));
const EventsGroupManagePage = React.lazy(() => import('./components/events/admin/groups/EventsGroupManagePage'));
const EventsExportPage = React.lazy(() => import('./components/events/admin/export/EventsExportPage'));
const EventsExportOverview = React.lazy(() => import('./components/events/admin/export/EventsExportOverview'));
const EventsManagePage = React.lazy(() => import('./components/events/admin/overview/EventsManagePage'));
const EditEventDetails = React.lazy(() => import('./components/events/admin/edit/EditEventDetails'));
const EventsAdminBookingPage = React.lazy(() => import('./components/events/admin/book/EventsAdminBookingPage'));

const MyProfile = React.lazy(() => import('./components/profile/MyProfile'));
const DetailChangeRequest = React.lazy(() => import('./components/profile/DetailChangeRequest'));
const ConfirmDetailsPage = React.lazy(() => import('./components/accounts/confirm/ConfirmDetailsPage'));

const ViewCommitteesPage = React.lazy(() => import('./components/jcr/roles/ViewCommitteesPage'));
const JCRFileListingPage = React.lazy(() => import('./components/jcr/files/JCRFileListingPage'));
const JCRTrustPage = React.lazy(() => import('./components/jcr/trust/JCRTrustPage'));
const ExecsAndAwardsPage = React.lazy(() => import('./components/jcr/roles/ExecsAndAwardsPage'));
const FinancialSupportPage = React.lazy(() => import('./components/jcr/finance/FinancialSupportPage'));

const CreateNewCommitteePage = React.lazy(() => import('./components/jcr/roles/admin/CreateNewCommitteePage'));
const CreateNewRolePage = React.lazy(() => import('./components/jcr/roles/admin/CreateNewRolePage'));
const ManageJCRFilesPage = React.lazy(() => import('./components/jcr/files/admin/ManageJCRFilesPage'));

const SportsAndSocsPage = React.lazy(() => import('./components/sportsandsocs/SportsAndSocsPage'));
const SportsAndSocsAdminPage = React.lazy(() => import('./components/sportsandsocs/admin/SportsAndSocsAdminPage'));

const TechPage = React.lazy(() => import('./components/tech/TechPage'));
const FacilitiesPage = React.lazy(() => import('./components/facilities/FacilitiesPage'));

const ToastieAdminLive = React.lazy(() => import('./components/toasties/admin/live/ToastieAdminLive'));
const ToastieOrderVerification = React.lazy(() => import('./components/toasties/verify/ToastieOrderVerification'));
const ToastieAdminPortal = React.lazy(() => import('./components/toasties/admin/ToastieAdminPortal'));
const ToastieAdminStock = React.lazy(() => import('./components/toasties/admin/stock/ToastieAdminStock'));
const ToastieOrderingPage = React.lazy(() => import('./components/toasties/order/ToastieOrderingPage'));
const ElectionGuidePage = React.lazy(() => import('./components/elections/guide/ElectionsGuidePage'));

const FormalsPage = React.lazy(() => import('./components/formals/FormalsPage'))
const FormalDetails = React.lazy(() => import('./components/formals/FormalDetails'))
const FormalGroupCreate = React.lazy(() => import('./components/formals/group/FormalGroupCreate'))
const GroupConfirm = React.lazy(() => import('./components/formals/group/GroupConfirm'))
const FormalAdmin = React.lazy(() => import('./components/formals/admin/FormalAdmin'))
const NewFormal = React.lazy(() => import('./components/formals/admin/NewFormal'))
const EditDetails = React.lazy(() => import('./components/formals/admin/EditDetails'))

const stripePromise = loadStripe(config.stripe.publicKey);

class App extends React.Component {
  constructor(props) {
    super(props);
    // We store the authContext user in local storage
    // Retrieve it and parse it
    const storedUserState = localStorage.getItem("user");
    let user = null;

    if (storedUserState !== null) {
      try {
        user = JSON.parse(storedUserState);
      } catch (error) {
        user = null;
      }
    }

    if (!this.validateLocalSession(user)) {
      user = null;
    }

    this.cart = new Cart();

    this.state = {
      user,
      hideBody: false,
      ref: "/",
      disableScrollBody: false,
      debtPopupActive: false,
      lastPage: null,
      confirmedDetails: false
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
    if (this.state.user !== oldState.user) {
      if (this.state.user === null) {
        localStorage.setItem("user", null);
        return;
      }

      localStorage.setItem("user", JSON.stringify(this.state.user));
    }

    if (this.isLoggedIn() === 1) {
      this.logoutUser();
    }
  }

  hasLoginExpired = (user) => {
    // Check if the login session has expired
    if (user === null) {
      return false;
    }

    const currentDate = new Date().getTime();
    const expires = new Date(user.expires).getTime();

    return currentDate > expires;
  }

  validateLocalSession = (user) => {
    if (user === null) {
      return false;
    }

    if (!user.hasOwnProperty("permissions")) {
      return false;
    }

    if (!user.hasOwnProperty("email")) {
      return false;
    }

    if (!user.hasOwnProperty("expires")) {
      return false;
    }

    if (!user.hasOwnProperty("username")) {
      return false;
    }

    if (this.hasLoginExpired(user)) {
      return false;
    }

    return true;
  }

  isLoggedIn = () => {
    // Check if the user is logged in
    // Perform basic checks on the user if it is clearly modified
    if (this.state.user === null) {
      return 0;
    }

    if (!this.validateLocalSession(this.state.user)) {
      return 1;
    }

    return 2;
  }

  hasPermission = (permission) => {
    if (!this.isLoggedIn()) {
      return false;
    }

    if (!this.state.user.permissions) {
      return false;
    }

    if (this.state.user.permissions.length === 0) {
      return false;
    }

    return this.state.user.permissions.includes(permission.toLowerCase());
  }

  closeDebtPopup = () => {
    if (!this.state.user.permissions.includes("debt.has")) {
      return;
    }

    this.setState({ debtPopupActive: false });

    setTimeout(() => {
      if (this.state.user === undefined || this.state.user === null) {
        return;
      }

      const location = window.location.pathname;
      const ignoredLocs = ["/debt", "/checkout", "/elections", "/election", "/feedback", "/complaints", "/accounts/confirm"]
      let dontBlock = false;

      for (const loc of ignoredLocs) {
        if (location.startsWith(loc)) {
          dontBlock = true;
          break;
        }
      }

      if (dontBlock) {
        this.setState({ debtPopupActive: false });

        setTimeout(() => {
          this.closeDebtPopup();
        }, 10000);

        return;
      }

      this.setState({ debtPopupActive: true });
    }, 5000);
  }

  loginUser = (user, ref) => {
    this.setState({ user, ref, confirmedDetails: user.confirmedDetails, debtPopupActive: user.permissions.includes("debt.has") });
  }

  logoutUser = () => {
    this.cart.get();
    this.cart.setLocked(false);
    this.cart.clearCart();

    let cookiesApproved = false;
    const lsCookies = localStorage.getItem("cookiesApproved");

    if (lsCookies !== undefined && lsCookies !== null) {
      const boolLsCookies = JSON.parse(lsCookies);
      if (boolLsCookies === true) {
        cookiesApproved = true;
      }
    }

    localStorage.clear();

    if (cookiesApproved === true) {
      localStorage.setItem("cookiesApproved", cookiesApproved);
    }

    this.setState({ user: null });
  }

  componentDidMount = () => {
    if (!this.isLoggedIn() && this.state.user !== null) {
      this.logoutUser();
    }
  }

  hideBody = (show) => {
    this.setState({ hideBody: show });
  }

  disableBodyScroll = (show) => {
    this.setState({ disableScrollBody: show });
  }

  loginRef = (ref) => {
    return (
      <Redirect to={`/accounts/login?ref=${ref}`} />
    );
  }

  render() {
    const bodyHidden = this.state.hideBody ? "hidden" : "";
    const bodyScrollDisabled = this.state.disableScrollBody ? "overflow-hidden" : "";

    return (
      <Elements stripe={stripePromise}>
        <authContext.Provider value={this.state.user}>
          <Router>
            <div className="min-h-full h-full flex flex-col">
              {
                this.state.debtPopupActive ? (
                  <div className={`w-screen p-4 h-screen top-0 left-0 fixed overflow-y-auto overflow-x-hidden bg-red-900 white block z-20 ${Math.random()}`}>
                    <div className="mx-auto flex flex-column items-center justify-center">
                      <div className="my-auto bg-white p-4">
                        <h1 className="my-1 font-semibold text-2xl">Outstanding Debt</h1>
                        <p className="my-1">You currently have an outstanding debt. Until this has been cleared your access to JCR services is limited.</p>
                        <p className="my-1">The JCR has contacted you on multiple occasions. You must clear your debt as soon as possible.</p>
                        <p className="my-1">(If you have just cleared your debt please logout and back in!)</p>
                        <p className="my-1 font-semibold">Please clear your debt!</p>
                        <Link to="/debt">
                          <button
                            className="my-1 px-4 py-1 rounded bg-grey-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                            onClick={this.closeDebtPopup}
                          >Click here to clear your debt</button>
                        </Link>
                      </div>
                    </div>
                    <div className="mx-auto w-auto">
                      <button
                        onClick={this.closeDebtPopup}
                        className="text-xl text-red-500"
                      >X</button>
                    </div>
                  </div>
                ) : null
              }
              <CookieAccept />
              <NavBar
                hideBody={this.hideBody}
              />
              <div className={`${bodyHidden} ${bodyScrollDisabled} flex-grow flex flex-col`}>
                <div className="flex-grow">
                  <React.Suspense fallback={<LoadingHolder />}>
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
                      <Route exact path="/accounts/register" render={(props) => (
                        this.isLoggedIn() ? (<Redirect to="/" />) : (<RegisterPage {...props} />)
                      )} />
                      <Route exact path="/alumni/register" render={(props) => (
                        this.isLoggedIn() ? (<Redirect to="/" />) : (<AlumniRegisterPage {...props} />)
                      )} />
                      <Route exact path="/alumni/verify/:token" render={(props) => (
                        this.isLoggedIn() ? (<Redirect to="/" />) : (<VerifyAlumniPage {...props} />)
                      )} />
                      <Route exact path="/alumni/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("users.manage") ? (<AdminApproveAlumniPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/alumni/admin"))
                      )} />
                      <Route exact path="/formals" render={() => (
                        this.isLoggedIn() ? (<FormalsPage />) : (this.loginRef("/formals"))
                      )} />
                      <Route exact path="/formals/:id/details" render={(props) => (
                        this.isLoggedIn() ? (<FormalDetails {...props} />) : (this.loginRef("/formals/" + props.match.params.id))
                      )} />
                      <Route exact path="/formals/:id/groups/create" render={(props) => (
                        this.isLoggedIn() ? (<FormalGroupCreate {...props} />) : (this.loginRef("/formals/" + props.match.params.id + "/groups/create"))
                      )} />
                      <Route exact path="/formals/verify/:token" render={(props) => (
                        <GroupConfirm token={props.match.params.token} />
                      )} />
                      <Route exact path="/formals/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("formals.manage") ? (<FormalAdmin />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/formals/admin"))
                      )} />
                      <Route exact path="/formals/admin/new" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("formals.manage") ? (<NewFormal />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/formals/admin/new"))
                      )} />
                      <Route exact path="/formals/admin/:id/details" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("formals.manage") ? (<EditDetails id={props.match.params.id} />) : (<Redirect to="/errors/403" />)) : (this.loginRef(`/formals/admin/${props.match.params.id}/details`))
                      )} />
                      <Route exact path="/accounts/login" render={(props) => (
                        this.isLoggedIn() ? (<Redirect to={this.state.confirmedDetails ? this.state.ref : `/accounts/confirm?ref=${this.state.ref}`} />) : (<LoginPage {...props} loginUser={this.loginUser} />)
                      )} />
                      <Route exact path="/accounts/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("users.manage") ? (<AdminApprovePage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/accounts/admin"))
                      )} />
                      <Route exact path="/accounts/logout" render={() => (<LogoutPage logoutUser={this.logoutUser} />)} />
                      <Route exact path="/membership" render={() => (
                        this.isLoggedIn() ? (<PurchaseMembershipPage />) : (<Redirect to="/accounts/login?ref=/memberships/join" />)
                      )} />
                      <Route exact path="/memberships/join" render={() => (
                        this.isLoggedIn() ? (<PurchaseMembershipPage />) : (<Redirect to="/accounts/login?ref=/memberships/join" />)
                      )} />
                      <Route exact path="/toasties/live" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("toasties.manage") ? (<ToastieAdminLive />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/toasties/live"))
                      )} />
                      <Route exact path="/stash/stock" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("stash.stock.edit") ? (<StashStockPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/stash/stock"))
                      )} />
                      <Route exact path="/stash/images" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("stash.stock.edit") ? (<StashImagesPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/stash/images"))
                      )} />
                      <Route exact path="/stash/export" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("stash.export") ? (<StashExportPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/stash/export"))
                      )} />
                      <Route exact path="/permissions" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("permissions.edit") ? (<EditPermissionsPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/permissions"))
                      )} />
                      <Route exact path="/media" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <MediaPage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/media"))
                      )} />
                      <Route exact path="/jcr/financial-support" render={() => (
                        <FinancialSupportPage />
                      )} />
                      <Route exact path="/hardship" render={() => (
                        <FinancialSupportPage />
                      )} />
                      <Route exact path="/media/images/:eventName?" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <ViewImagesPage {...props} /> : <Redirect to="/memberships/join" />) : (this.loginRef(`/media/images${props.match.params.eventName ? "/" + props.match.params.eventName : ""}`))
                      )} />
                      <Route exact path="/media/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("media.manage") ? (<MediaAdminPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/media/admin"))
                      )} />
                      <Route exact path="/debt" render={(props) => (
                        this.isLoggedIn() ? (<DebtPage {...props} />) : (this.loginRef("/debt"))
                      )} />
                      <Route exact path="/debt/manage" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("debt.manage") ? (<ManageDebtPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/debt/manage"))
                      )} />
                      <Route exact path="/gym" render={() => (
                        this.isLoggedIn() ? (<GymInformationPage />) : (this.loginRef("/gym"))
                      )} />
                      <Route exact path="/gym/induction" render={() => (
                        this.isLoggedIn() ? (<GymInductionPage />) : (this.loginRef("/gym/induction"))
                      )} />
                      <Route exact path="/gym/terms" render={() => (
                        this.isLoggedIn() ? (<GymTermsPage />) : (this.loginRef("/gym/terms"))
                      )} />
                      <Route exact path="/gym/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("gym.export") ? (<GymAdminPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/gym/admin"))
                      )} />
                      <Route exact path="/memberships/export" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.export") ? (<ExportMembershipsPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/memberships/export"))
                      )} />
                      <Route exact path="/memberships/manage" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.manage") ? (<ManageMembershipsPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/memberships/manage"))
                      )} />
                      <Route exact path="/elections" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <ElectionOverviewPage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/elections"))
                      )} />
                      <Route exact path="/elections/guide" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <ElectionGuidePage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/elections/guide"))
                      )} />
                      <Route exact path="/services/elections" render={() => (
                        <Redirect to="/elections" />
                      )} />
                      <Route exact path="/elections/vote/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <ElectionVotingPage {...props} /> : <Redirect to="/memberships/join" />) : (this.loginRef("/elections"))
                      )} />
                      <Route exact path="/elections/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("elections.manage") ? (<ElectionAdminPortal />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/elections/admin"))
                      )} />
                      <Route exact path="/elections/create" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("elections.manage") ? (<CreateElectionPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/elections/create"))
                      )} />
                      <Route exact path="/elections/results/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("elections.manage") ? (<GenerateElectionResultsPage {...props} />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/elections/admin"))
                      )} />
                      <Route exact path="/elections/edit/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("elections.manage") ? (<ElectionEditPage {...props} />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/elections/admin"))
                      )} />
                      <Route exact path="/welfare/" render={() => (
                        <WelfarePage />
                      )} />
                      <Route exact path="/applicants/" render={() => (
                        <ApplicantsPage />
                      )} />
                      <Route exact path="/welfare/message" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <WelfareMessagingPage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/welfare/message"))
                      )} />
                      <Route exact path="/welfare/message/thread/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <WelfareThreadPage {...props} /> : <Redirect to="/memberships/join" />) : (this.loginRef("/welfare"))
                      )} />
                      <Route exact path="/welfare/message/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("welfare.anonymous") ? (<WelfareAdminOverviewPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/welfare/message/admin"))
                      )} />
                      <Route exact path="/welfare/message/admin/thread/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("welfare.anonymous") ? (<WelfareAdminThreadPage {...props} />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/welfare/message/admin"))
                      )} />
                      <Route exact path="/stash" component={() => {
                        window.location.replace("https://www.redbirdsupplyuk.com/grey-college-durham");
                        return null;
                      }} />
                      <Route exact path="/careers/" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <CareersPage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/careers"))
                      )} />
                      <Route exact path="/careers/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("careers.manage") ? <CareersAdminPage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/careers/admin"))
                      )} />
                      <Route exact path="/careers/edit/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("careers.manage") ? <CareersEditPost {...props} /> : <Redirect to="/memberships/join" />) : (this.loginRef("/careers"))
                      )} />
                      <Route exact path="/complaints" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <ComplaintsPage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/complaints"))
                      )} />
                      <Route exact path="/complaints/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("complaints.manage") ? (<ComplaintsAdminOverview />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/complaints/admin"))
                      )} />
                      <Route exact path="/complaints/view/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("complaints.manage") ? (<ComplaintViewPage {...props} />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/complaints/admin"))
                      )} />
                      <Route exact path="/events/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("events.manage") ? (<EventsManagePage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/events/admin"))
                      )} />
                      <Route exact path="/events/admin/create" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("events.manage") ? (<CreateNewEventPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/events/admin/create"))
                      )} />
                      <Route exact path="/events/admin/edit/:eventId" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("events.manage") ? (<EditEventDetails {...props} />) : (<Redirect to="/errors/403" />)) : (this.loginRef(`/events/admin/edit/${props.match.params.eventId}`))
                      )} />
                      <Route exact path="/events/admin/groups/:eventId" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("events.manage") ? (<EventsGroupManagePage {...props} />) : (<Redirect to="/errors/403" />)) : (this.loginRef(`/events/admin/groups/${props.match.params.eventId}`))
                      )} />
                      <Route exact path="/events/admin/export" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("events.export") ? (<EventsExportOverview />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/events/admin/export"))
                      )} />
                      <Route exact path="/events/admin/export/:eventId" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("events.export") ? (<EventsExportPage {...props} />) : (<Redirect to="/errors/403" />)) : (this.loginRef(`/events/admin/export/${props.match.params.eventId}`))
                      )} />
                      <Route exact path="/events/admin/groups/:eventId/create/:ticketTypeId" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("events.manage") ? (<EventsAdminBookingPage {...props} />) : (<Redirect to="/errors/403" />)) : (this.loginRef(`/events/admin/groups/${props.match.params.eventId}/create/${props.match.params.ticketTypeId}`))
                      )} />
                      <Route exact path="/events/" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <EventsOverviewPage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/events"))
                      )} />
                      <Route exact path="/my/bookings" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <EventsMyBookingsOverview /> : <Redirect to="/memberships/join" />) : (this.loginRef("/my/bookings"))
                      )} />
                      <Route exact path="/my/ticket/:ticketId" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <EventsMyBookingPage {...props} /> : <Redirect to="/memberships/join" />) : (this.loginRef(`/my/ticket/${props.match.params.ticketId}`))
                      )} />
                      <Route exact path="/events/swapping" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <SwappingPage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/events/swapping"))
                      )} />
                      <Route exact path="/events/swapping/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("events.swapping") ? <SwappingAdminPage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/events/swapping/admin"))
                      )} />
                      <Route exact path="/events/terms" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <EventsTermsPage /> : <Redirect to="/memberships/join" />) : (this.loginRef("/events/terms"))
                      )} />
                      <Route exact path="/events/event/:id/book/:type" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <EventsGroupBookingPage {...props} /> : <Redirect to="/memberships/join" />) : (this.loginRef(`/events/event/${props.match.params.id}`))
                      )} />
                      <Route exact path="/events/event/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <EventsInfoPage {...props} /> : <Redirect to="/memberships/join" />) : (this.loginRef(`/events/event/${props.match.params.id}`))
                      )} />
                      <Route exact path="/events/bookings/payment/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <EventsPaymentPage {...props} /> : <Redirect to="/memberships/join" />) : (this.loginRef(`/events/bookings/payment/${props.match.params.id}`))
                      )} />
                      <Route exact path="/events/bookings/free/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.member") ? <EventsFreeReqPage {...props} /> : <Redirect to="/memberships/join" />) : (this.loginRef(`/events/bookings/free/${props.match.params.id}`))
                      )} />
                      <Route exact path="/checkout/" render={() => (
                        this.isLoggedIn() ? (<CheckoutPage />) : (this.loginRef("/checkout"))
                      )} />
                      <Route exact path="/feedback" render={() => (
                        this.isLoggedIn() ? (<FeedbackPage />) : (this.loginRef("/feedback"))
                      )} />
                      <Route exact path="/feedback/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("feedback.manage") ? (<FeedbackAdminOverview />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/feedback/admin"))
                      )} />
                      <Route exact path="/feedback/view/:id" render={(props) => (
                        this.isLoggedIn() ? (this.hasPermission("feedback.manage") ? (<FeedbackViewPage {...props} />) : (<Redirect to="/errors/403" />)) : (this.loginRef(`/feedback/view/${props.id}`))
                      )} />
                      <Route exact path="/jcr/committees" render={(props) => (
                        <ViewCommitteesPage {...props} disableBodyScroll={this.disableBodyScroll} />
                      )} />
                      <Route exact path="/jcr/committees/manage" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.manage") ? (<CreateNewCommitteePage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/jcr/committees/manage"))
                      )} />
                      <Route exact path="/jcr/roles/manage" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.manage") ? (<CreateNewRolePage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/jcr/roles/manage"))
                      )} />
                      <Route exact path="/jcr/files" render={() => (
                        <JCRFileListingPage />
                      )} />
                      <Route exact path="/jcr/execs-and-awards" render={() => (
                        <ExecsAndAwardsPage />
                      )} />
                      <Route exact path="/jcr/files/manage" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("jcr.files") ? (<ManageJCRFilesPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/jcr/files/manage"))
                      )} />
                      <Route exact path="/jcr/trust" render={() => (
                        <JCRTrustPage />
                      )} />
                      <Route exact path="/my/profile" render={() => (
                        this.isLoggedIn() ? (<MyProfile />) : (this.loginRef("/my/profile"))
                      )} />
                      <Route exact path="/my/profile/request" render={() => (
                        this.isLoggedIn() ? (<DetailChangeRequest />) : (this.loginRef("/my/profile/request"))
                      )} />
                      <Route exact path="/accounts/confirm" render={(props) => (
                        this.isLoggedIn() ? (<ConfirmDetailsPage {...props} />) : (<Redirect to="/" />)
                      )} />
                      <Route exact path="/bookings" component={() => {
                        window.location.replace("https://outlook.office365.com/owa/calendar/GreyCollegeRoomBookings@durhamuniversity.onmicrosoft.com/bookings/");
                        return null;
                      }} />
                      <Route exact path="/sportsandsocs" render={() => (
                        <SportsAndSocsPage />
                      )} />
                      <Route exact path="/sportsandsocs/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("sportsandsocs.manage") ? (<SportsAndSocsAdminPage />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/sportsandsocs/admin"))
                      )} />
                      <Route exact path="/toasties" render={() => (
                        <ToastieOrderingPage />
                      )} />
                      <Route exact path="/toasties/admin" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("toasties.manage") ? (<ToastieAdminPortal />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/toasties/admin"))
                      )} />
                      <Route exact path="/toasties/admin/stock" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("toasties.manage") ? (<ToastieAdminStock />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/toasties/admin/stock"))
                      )} />
                      <Route exact path="/toasties/admin/live" render={() => (
                        this.isLoggedIn() ? (this.hasPermission("toasties.manage") ? (<ToastieAdminLive />) : (<Redirect to="/errors/403" />)) : (this.loginRef("/toasties/admin/live"))
                      )} />
                      <Route exact path="/toasties/verify/:verificationCode" render={(props) => (
                        <ToastieOrderVerification {...props} />
                      )} />
                      <Route exact path="/mcr" component={() => {
                        window.location.replace("https://community.dur.ac.uk/grey.mcr/");
                        return null;
                      }} />
                      <Route exact path="/tech" render={() => (
                        <TechPage />
                      )} />
                      <Route exact path="/facilities" render={() => (
                        <FacilitiesPage />
                      )} />
                      <Route exact path="/errors/:code" render={(props) => (
                        <ErrorPage {...props} />
                      )} />
                      <Route render={() => (
                        <ErrorPage code="404" />
                      )} />
                    </Switch>
                  </React.Suspense>
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
