import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import CheckoutForm from '../checkout/CheckoutForm';

class SpecialPhoenixEventPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      ticketType: "def",
      guestName: "",
      disabled: false,
      paymentSt: 0,
      myDiet: "select",
      guestDiet: "select"
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
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
        this.setState({ isMember: false });
      }
    } else {
      this.setState({ isMember: false });
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/phoenix");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { booked } = content.data;

    this.setState({ loaded: true, status: 200, booked });
  }

  renderNonGuest = () => {
    return (
      <div className="w-full">
        <p className="py-1 text-xl font-semibold text-left">Ticket Price: {this.state.isMember ? "£55" : "£65"}</p>
        <div className="pt-2 pb-2 border-b-2">
          <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Your Dietary Requirements</label>
          <span className="flex flex-row justify-start text-sm mb-2">Please fill in your dietary requirements</span>
          <select
            onChange={this.onInputChange}
            name="myDiet"
            value={this.state.myDiet}
            className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
          >
            <option value="select" disabled={true} hidden={true}>Please select an option...</option>
            <option value="meat">Meat Option</option>
            <option value="vegetarian">Vegetarian Option</option>
            <option value="vegan">Vegan Option</option>
          </select>
        </div>
      </div>
    )
  }

  renderGuest = () => {
    if(!this.state.isMember) {
      return (
        <div className="w-full">
          <p className="text-left">You must be a JCR member to book a guest ticket</p>
        </div>
      );
    }

    return (
      <div className="w-full">
        <p className="py-1 text-xl font-semibold text-left">Total Price: £120</p>
        <div className="pt-2 pb-2 border-b-2">
          <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Your Dietary Requirements</label>
          <span className="flex flex-row justify-start text-sm mb-2">Please fill in your dietary requirements</span>
          <select
            onChange={this.onInputChange}
            name="myDiet"
            value={this.state.myDiet}
            className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
          >
            <option value="select" disabled={true} hidden={true}>Please select an option...</option>
            <option value="meat">Meat Option</option>
            <option value="vegetarian">Vegetarian Option</option>
            <option value="vegan">Vegan Option</option>
          </select>
        </div>
        <div className="pt-2 pb-2 border-b-2">
          <label htmlFor="guestName" className="flex flex-row justify-start text-xl font-semibold">Guest Name</label>
          <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.guestName.length} characters remaining)</span>
          <input
            type="text"
            name="guestName"
            value={this.state.guestName}
            onChange={this.onInputChange}
            className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
            disabled={this.state.disabled}
            autoComplete=""
            maxLength={255}
          />
        </div>
        <div className="pt-2 pb-2 border-b-2">
          <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Guest Dietary Requirements</label>
          <span className="flex flex-row justify-start text-sm mb-2">Please fill in your guest's dietary requirements</span>
          <select
            onChange={this.onInputChange}
            name="guestDiet"
            value={this.state.guestDiet}
            className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
          >
            <option value="select" disabled={true} hidden={true}>Please select an option...</option>
            <option value="meat">Meat Option</option>
            <option value="vegetarian">Vegetarian Option</option>
            <option value="vegan">Vegan Option</option>
          </select>
        </div>
      </div>
    )
  }

  confirmBooking = async () => {
    this.setState({ disabled: true });
    let { ticketType, guestName, myDiet, guestDiet } = this.state;

    let result;

    if(ticketType === "non-guest") {
      guestName = null;
      guestDiet = null;
    }

    try {
      result = await api.post("/phoenix/create", { guestName, myDiet, guestDiet });
    } catch (error) {
      alert(error.response.data.error);
      return;
    }

    const { totalCost, clientSecret } = result.data;

    this.setState({ disabled: false, totalCost, clientSecret, paymentSt: 1 });
  }

  onPaymentSuccess = () => {
    this.setState({ paymentSt: 2 });
  }

  canSubmit = () => {
    if(this.state.ticketType === "def") {
      return false;
    }

    if(this.state.ticketType === "non-guest") {
      return this.state.myDiet !== null && this.state.myDiet !== "select";
    }

    if(this.state.ticketType === "guest") {
      return (this.state.myDiet !== null && this.state.myDiet !== "select") &&
             (this.state.guestName !== null && this.state.guestName !== "") &&
             (this.state.guestDiet !== null && this.state.guestDiet !== "select")
    }

    return true;
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      return (
        <LoadingHolder />
      );
    }

    if(this.state.booked) {
      return (
        <div className="flex flex-col justify-start">
          <div className="md:w-3/5 container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Phoenix Festival</h1>
            <p>You have already booked a ticket for this event. Please check your email for confirmation.</p>
            <p>If you believe this is an error please contact grey.website@durham.ac.uk</p>
          </div>
        </div>
      )
    }

    if(this.state.paymentSt === 1) {
      return (
        <div className="flex flex-col justify-start">
          <div className="md:w-3/5 container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Payment</h1>
            <p className="text-left">To finish the booking process please pay for your ticket immediately. If you leave this page without paying your booking will not be recorded and you will need to rebook.</p>
            <div className="flex-1 mr-0 md:mr-2 p-2 text-left border border-red-900 mt-2">
              <p className="py-1">This will take payment from your card for the amount of £{(this.state.totalCost / 100).toFixed(2)}.</p>
              <div className="w-full text-base py-4 align-middle">
                <CheckoutForm
                  clientSecret={this.state.clientSecret}
                  onSuccess={this.onPaymentSuccess}
                  totalAmountInPence={this.state.totalCost}
                />
              </div>
            </div>
          </div>
        </div>
      )
    }

    if(this.state.paymentSt === 2) {
      return (
        <div className="flex flex-col justify-start">
          <div className="md:w-3/5 container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Payment Completed</h1>
            <p className="text-center">Your payment has successfully been processed. You should receive an email confirming this shortly.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Phoenix Festival</h1>
          <p className="text-left py-1">Phoenix Festival is a special event taking place this year at Hardwick Hall Hotel. Please check your emails for more details!</p>
          <p className="text-left py-1 font-semibold">Tickets for this event are non-refundable once purchased, which includes, but is not limited to, if you are unable to attend due to COVID-19 isolation requirements.</p>
          <p className="text-left py-1">Tickets are subsidised for JCR members and cost £55. If you are a JCR member you can also book a guest on to the event with you. You must do this at the same time that you purchase your ticket. Guest tickets cost £65 and are limited to one per JCR member.</p>
          <p className="text-left py-1">If you are not a JCR member but are a member of the college you can book on to the event as well for £65. Guest tickets are not available for non-JCR members.</p>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Ticket Type</label>
            <span className="flex flex-row justify-start text-sm mb-2">You must select a ticket type to continue</span>
            <select
              value={this.state.ticketType}
              onChange={this.onInputChange}
              name="ticketType"
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
            >
              <option value="def" disabled={true} hidden={true}>Please select a ticket type...</option>
              <option value="non-guest">Individual Ticket without a Guest</option>
              <option value="guest" disabled={!this.state.isMember}>Individual Ticket with a Guest</option>
            </select>
          </div>
          {
            this.state.ticketType === "def" ? null : (
              <React.Fragment>
                {
                  this.state.ticketType === "non-guest" ? this.renderNonGuest() : this.renderGuest()
                }
                <button
                  onClick={this.confirmBooking}
                  className="px-4 py-2 rounded text-xl bg-grey-500 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.disabled || !this.canSubmit()}
                >Confirm Booking and Pay</button>
            </React.Fragment>
            )
          }
        </div>
      </div>
    );
  }
}

SpecialPhoenixEventPage.contextType = authContext;

export default SpecialPhoenixEventPage;
