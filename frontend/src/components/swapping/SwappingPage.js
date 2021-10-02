import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import CheckoutForm from '../checkout/CheckoutForm';
import DoubleTable from './DoubleTable';
import dateFormat from 'dateformat';
import socketIOClient from 'socket.io-client';

class SwappingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      donationAmount: 5,
      processingDonation: false,
      disabled: false,
      totalAmountInPence: 0,
      clientSecret: null,
      credit: 0,
      history: [],
      positions: [],
      open: false,
      ready: false
    };

    this.socket = undefined;
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  componentWillUnmount = () => {
    // Want to end the connection when it unmounts
    this.socket.disconnect();
  }

  makeDonation = async () => {
    const { donationAmount } = this.state;

    if(!donationAmount || Number(donationAmount) < 2 || Number(donationAmount) > 100) {
      alert("Invalid amount");
      return;
    }

    this.setState({ disabled: true });

    // Now get the payment intent
    let result;

    try {
      result = await api.post("/swapping/donate", { amount: donationAmount });
    } catch (error) {
      alert(error.response.data.error);
      return;
    }

    const { totalAmountInPence, clientSecret } = result.data;
    this.setState({ totalAmountInPence, clientSecret, processingDonation: true });
  }

  setupInitialPositions = (data) => {
    const { positions, open } = data;
    this.setState({ positions, open, ready: true });
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status", isMember: false });
      return;
    }

    // Ensure they are an admin
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
      return;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/swapping/credit");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { credit, history } = content.data;
    const sortedHistory = history.sort((a, b) => {
      const ad = new Date(a.updatedAt);
      const bd = new Date(b.updatedAt);
      return -(ad > bd  ? 1 : (ad < bd ? -1 : 0));
    })

    const protocol = window.location.protocol.toLowerCase() === "https:" ? "wss" : "ws";
    this.socket = socketIOClient(`${protocol}://${window.location.host}`);//, { transports: [ "websocket" ]});
    this.socket.emit("subscribeToSwap", {});

    // Called when swapInitialPositions is received on initial connection
    this.socket.on("swapInitialPositions", this.setupInitialPositions);

    this.setState({ loaded: true, status: 200, credit, history: sortedHistory });
  }

  displayTrueDonation = () => {
    const { donationAmount } = this.state;
    const amount = Number(donationAmount);

    if(!donationAmount || Number.isNaN(amount) || amount > 100 || amount < 2) {
      return null;
    }

    const net = Math.round(amount * 100 - ((0.014 * amount * 100) + 20)) / 100

    return (
      <p className="pt-2 text-sm">A donation of £{net.toFixed(2)} will be made to charity. Thank you.</p>
    )
  }

  onPaymentSuccess = () => {
    let { credit, totalAmountInPence } = this.state;

    credit = Number(credit) + Number(totalAmountInPence);

    this.setState({ awaitingConfirmation: true, processingDonation: false, donationAmount: 5, totalAmountInPence: 0, clientSecret: null, disabled: false, credit })
  }

  resolveType = (type) => {
    switch(type) {
      case "donation": return "Donated"
      default: return "Something"
    }
  }

  render () {
    if(!this.state.loaded || !this.state.ready) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if(!this.state.isMember) {
          return (
            <Redirect to="/membership" />
          )
      }

      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-2">Formal Swapping</h1>
          <p className="md:hidden py-1 font-semibold text-lg">This webpage was designed for use on a computer, it may still work on mobile devices but functionality is not guaranteed.</p>
          <div className="text-left mb-2">
            <h2 className="font-semibold text-3xl">What is this?</h2>
            <p className="pt-1">For certain events or formals throughout the year (e.g. Valentine{"'"}s Formal) it is possible for members of the JCR to determine the seating plan for the meal! Pairs of people sign on to the formal and they can then be swapped with other pairs on the formal. The price for swapping is determined by the number of times that the specific pair has already been swapped. The price for the swap is the highest value of the two pairs that you wish to swap. Swapping starts at £0.20 and doubles each time. The money spent on swapping (minus transaction fees) is donated to charity.</p>
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-3xl">Swapping Credit</h2>
            <p className="pt-1">To get started with swapping you need to make a donation via the JCR. The amount you donate will then be given to you as credit to spend on swapping. You can add credit to your account below. <span className="font-semibold">Please note donations are final and any excess credit will not be refunded during or after the swapping period concludes.</span></p>
            <div className="flex flex-col md:flex-row py-2 overflow-hidden md:h-48">
              <div className="md:w-1/2 w-full md:mb-0 mb-2 md:mr-2 mr-0">
                <p className="text-xl font-semibold">Current Credit: £{ (Number(this.state.credit) / 100).toFixed(2) }</p>
                <h3 className="font-semibold md:block hidden">History</h3>
                <div className="overflow-y-auto flex flex-col justify-start h-full md:block hidden">
                  {
                    this.state.history.map((record, i) => (
                      <div>{dateFormat(record.createdAt, "dd/mm/yyyy HH:MM")}: {this.resolveType(record.type)} £{(Number(record.amount) / 100).toFixed(2)}</div>
                    ))
                  }
                </div>
              </div>
              <div className="md:ml-2 pb-2 md:w-1/2 w-full flex flex-col">
                {
                  this.state.processingDonation ? (
                    <CheckoutForm
                      clientSecret={this.state.clientSecret}
                      onSuccess={this.onPaymentSuccess}
                      totalAmountInPence={this.state.totalAmountInPence}
                    />
                  ) : (
                    <div>
                      <div className="border-b-2 pb-2">
                        <label htmlFor="date" className="flex flex-row justify-start text-xl font-semibold">Donate</label>
                        <span className="flex flex-row justify-start text-sm mb-2">Donations must be at least £2.00 and up to £100.00</span>
                        <div className="flex flex-row items-center">
                          <span className="mr-1">£</span>
                          <input
                            type="number"
                            name="donationAmount"
                            value={this.state.donationAmount}
                            className="border w-full rounded py-1 px-2 opacity-50"
                            onChange={this.onInputChange}
                            className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                            step={0.01}
                            min={2}
                            max={100}
                            disabled={this.state.disabled}
                          />
                        </div>
                        { this.displayTrueDonation() }
                      </div>
                      <div className="pt-2">
                        <button
                          className="px-4 py-2 rounded bg-grey-500 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                          disabled={!this.state.donationAmount || Number(this.state.donationAmount) > 100 || Number(this.state.donationAmount) < 2 || this.state.disabled}
                          onClick={this.makeDonation}
                        >Make Donation</button>
                      </div>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
          <div className="pt-2 flex-col">
            <h2 className="font-semibold text-3xl text-left pb-2">Current Arrangement</h2>
            <div className="text-left">
              <h3 className="font-semibold text-2xl pb-1">Make a Swap</h3>
              <div className="flex flex-row items-center">
                <span>Swap</span>
                <select
                  className="mx-1 w-64 border border-gray-400 disabled:opacity-50"
                />
                <span>with</span>
                <select
                  className="mx-1 w-64 border border-gray-400 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <DoubleTable />
              <DoubleTable />
              <DoubleTable />
              <DoubleTable />
              <DoubleTable />
              <DoubleTable />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

SwappingPage.contextType = authContext;

export default SwappingPage;
