import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import CheckoutForm from '../checkout/CheckoutForm';
import dateFormat from 'dateformat';
import socketIOClient from 'socket.io-client';
import TableLayout from './TableLayout';

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
      ready: false,
      refresh: new Date(),
      pairs: [],
      firstPair: -1,
      secondPair: -1,
      users: 0,
      swappingError: "",
      flipFirst: false,
      flipSecond: false
    };

    this.socket = undefined;
  }

  // Loading and unloading

  componentWillUnmount = () => {
    // Want to end the connection when it unmounts
    this.socket.disconnect();
  }

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
    this.socket = socketIOClient(`${protocol}://${window.location.host}`, { transports: [ "websocket" ]});
    this.socket.emit("subscribeToSwap", {});

    // Called when swapInitialPositions is received on initial connection
    this.socket.on("swapInitialPositions", this.setupInitialPositions);
    // Called when the user count updates
    this.socket.on("updateUserCount", ({ users }) => this.setState({ users }));
    // Called when there is an error with the swap
    this.socket.on("swappingError", this.onSwapError);
    // Called when there is an update to the positions
    this.socket.on("swappingUpdate", this.onPositionUpdate);
    // Called when the swap is successful
    this.socket.on("swappingSuccess", this.onSwapSuccess);
    // Called when the status of swapping changes
    this.socket.on("swappingOpenClose", this.onSwappingToggled);

    this.setState({ loaded: true, status: 200, credit, history: sortedHistory });
  }

  // Socket events

  setupInitialPositions = (data) => {
    const { positions, open, users } = data;

    const pairs = positions.map(pos => {
      return {
        id: pos.id,
        names: `${pos.first} & ${pos.second}`,
        count: pos.count
      }
    });

    this.setState({ positions, open, pairs, users, ready: true });
  }

  onSwapError = (data) => {
    const { error } = data;
    this.setState({ swappingError: error, disabled: false });
  }

  onPositionUpdate = (data) => {
    const { positions } = data;
    const pairs = positions.map(pos => {
      return {
        id: pos.id,
        names: `${pos.first} & ${pos.second}`,
        count: pos.count
      }
    });

    this.setState({ positions, pairs, refresh: new Date() });
  }

  onSwapSuccess = (data) => {
    const { history, credit } = data;
    this.setState({ disabled: false, history, credit, firstPair: -1, secondPair: -1, flipFirst: false, flipSecond: false });
  }

  onSwappingToggled = (data) => {
    const { open } = data;
    this.setState({ open });
  }

  // Actions

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

  performSwap = async () => {
    this.setState({ disabled: true, swappingError: "" });
    const { firstPair, secondPair, credit, flipFirst, flipSecond } = this.state;

    // Only a basic check we will check this again server side
    const totalPriceInPence = this.calculateTotalPrice() * 100;

    if(totalPriceInPence > credit) {
      this.setState({ swappingError: "You cannot complete this swap as you do not have enough credit.", disabled: false });
      return;
    }

    this.socket.emit("performSwap", { firstPairId: firstPair, secondPairId: secondPair, flipFirst, flipSecond });
  }

  onPaymentSuccess = () => {
    let { credit, totalAmountInPence } = this.state;

    credit = Number(credit) + Number(totalAmountInPence);

    this.setState({ awaitingConfirmation: true, processingDonation: false, donationAmount: 5, totalAmountInPence: 0, clientSecret: null, disabled: false, credit })
  }

  // Helpers

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
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

  resolveType = (type) => {
    switch(type) {
      case "donation": return "Donated"
      case "swap": return "Made a swap costing"
      default: return "Something"
    }
  }

  calculatePairPrice = (pairDetails) => {
    let price = 0.5 * 2 ** pairDetails.count;

    if(price > 8) {
      price = 8;
    }

    return price;
  }

  calculateTotalPrice = () => {
    const { firstPair, secondPair, pairs } = this.state;
    const firstPairDetails = pairs.filter(p => `${p.id}` === `${firstPair}`)[0];
    const secondPairDetails = pairs.filter(p => `${p.id}` === `${secondPair}`)[0];

    const firstPairPrice = this.calculatePairPrice(firstPairDetails);
    const secondPairPrice = this.calculatePairPrice(secondPairDetails);

    return firstPairPrice > secondPairPrice ? firstPairPrice : secondPairPrice;
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
        <div className="xl:w-full md:mx-2 text-center p-4">
          <h1 className="font-semibold text-5xl pb-2">Valentine's Swapping</h1>
          {
            !this.state.open ? (
              <p className="py-1 font-semibold text-2xl text-red-900 underline">Swapping is currently closed.</p>
            ) : null
          }
          <p className="md:hidden py-1 font-semibold text-lg">This webpage was designed for use on a computer, it still works on mobile devices but the layout of the tables may be distorted!</p>
          <div className="text-left mb-2 md:w-4/5 mx-auto">
            <h2 className="font-semibold text-3xl">What is this?</h2>
            <p className="pt-1">For certain events or formals throughout the year (e.g. Valentine{"'"}s Formal) you get to determine the seating plan for the meal! Pairs sign on to the event and they can then be swapped with other pairs on the formal. The price for swapping is determined by the number of times that the specific pair has already been swapped. The price for the swap is the highest value of the two pairs that you wish to swap. Swapping starts at £0.50 and doubles each time (up to £8). The money spent on swapping (minus transaction fees) is donated to charity.</p>
            <p className="pt-1"><span className="font-semibold">Hot Seats:</span> The two lucky pairs in the hot seats (the ones in <span className="text-yellow-700">orange</span>) will have a fun little challenge or forfeit to do that will be told to them on the night!</p>
          </div>
          <div className="text-left md:w-4/5 mx-auto">
            <h2 className="font-semibold text-3xl">Swapping Credit</h2>
            <p className="pt-1">To get started with swapping you need to make a donation via the JCR. The amount you donate will then be given to you as credit to spend on swapping. You can add credit to your account below. <span className="font-semibold">Please note donations are final and any excess credit will not be refunded during or after the swapping period concludes.</span></p>
            <div className="flex flex-col md:flex-row py-2 overflow-hidden">
              <div className="md:w-1/2 w-full md:mb-0 mb-2 md:mr-2 mr-0 h-full">
                <p className="text-xl font-semibold">Current Credit: £{ (Number(this.state.credit) / 100).toFixed(2) }</p>
                <h3 className="font-semibold md:block hidden">History</h3>
                <div className="overflow-y-auto flex flex-col justify-start md:block hidden h-56">
                  {
                    this.state.history.map((record, i) => (
                      <div key={i}>{dateFormat(record.createdAt, "dd/mm/yyyy HH:MM")}: {this.resolveType(record.type)} £{(Number(record.amount) / 100).toFixed(2)}</div>
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
                          disabled={!this.state.donationAmount || Number(this.state.donationAmount) > 100 || Number(this.state.donationAmount) < 2 || this.state.disabled || !this.state.open}
                          onClick={this.makeDonation}
                        >Make Donation</button>
                      </div>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
          <div className="flex-col">
            <div className="text-left md:w-4/5 mx-auto mb-2 border border-black p-1">
              <h3 className="font-semibold text-2xl pb-1">Make a Swap</h3>
              <p>There {this.state.users === 1 ? "is" : "are"} currently {this.state.users} {this.state.users === 1 ? "person" : "people"} here.</p>
              <div className="flex flex-col mt-2">
                <div className="flex flex-col md:flex-row items-center mb-1">
                  <span>Swap</span>
                  <select
                    className="mx-1 w-64 border border-gray-400 disabled:opacity-50"
                    value={this.state.firstPair}
                    onChange={this.onInputChange}
                    name="firstPair"
                    disabled={this.state.disabled || !this.state.open}
                  >
                    <option
                      value={-1}
                      disabled={true}
                      className="hidden"
                    >Please select...</option>
                    {
                      this.state.pairs.map((pair, i) => (
                        <option
                          value={pair.id}
                          key={i}
                          disabled={`${this.state.secondPair}` === `${pair.id}`}
                        >{pair.names} (£{(this.calculatePairPrice(pair)).toFixed(2)})</option>
                      ))
                    }
                  </select>
                  <span>with</span>
                  <select
                    className="mx-1 w-64 border border-gray-400 disabled:opacity-50"
                    value={this.state.secondPair}
                    onChange={this.onInputChange}
                    name="secondPair"
                    disabled={this.state.disabled || !this.state.open}
                  >
                    <option
                      value={-1}
                      disabled={true}
                      className="hidden"
                    >Please select...</option>
                    {
                      this.state.pairs.map((pair, i) => (
                        <option
                          value={pair.id}
                          key={i}
                          disabled={`${this.state.firstPair}` === `${pair.id}`}
                        >{pair.names} (£{this.calculatePairPrice(pair).toFixed(2)})</option>
                      ))
                    }
                  </select>
                  <div className="flex flex-row">
                    <span>Flip First Pair?</span>
                    <input
                      type="checkbox"
                      name="flipFirst"
                      className="h-6 w-6 ml-1"
                      disabled={this.state.disabled || !this.state.open}
                      checked={this.state.flipFirst}
                      onChange={this.onInputChange}
                    />
                  </div>
                  <div className="flex flex-row md:ml-1">
                    <span>Flip Second Pair?</span>
                    <input
                      type="checkbox"
                      name="flipSecond"
                      className="h-6 w-6 ml-1"
                      disabled={this.state.disabled || !this.state.open}
                      checked={this.state.flipSecond}
                      onChange={this.onInputChange}
                    />
                  </div>
                </div>
                {
                  this.state.firstPair !== -1 && this.state.secondPair !== -1 ? (
                    <div className="md:mx-auto flex flex-row items-center my-2">
                      <span>Total Swap Cost: £{this.calculateTotalPrice().toFixed(2)}</span>
                      <button
                        className="ml-2 bg-red-900 text-white p-1 rounded disabled:opacity-50"
                        onClick={this.performSwap}
                        disabled={this.state.disabled || !this.state.open}
                      >Confirm Swap</button>
                    </div>
                  ) : null
                }
                {
                  this.state.swappingError ? (
                    <p className="mb-2 text-red-900 font-semibold">{this.state.swappingError}</p>
                  ) : null
                }
              </div>
            </div>
            <TableLayout
              refreshKey={this.state.refresh}
              positions={this.state.positions}
            />
          </div>
        </div>
      </div>
    );
  }
}

SwappingPage.contextType = authContext;

export default SwappingPage;
