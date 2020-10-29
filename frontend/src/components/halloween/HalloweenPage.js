import React from 'react'
import PropTypes from 'prop-types'

import api from '../../utils/axiosConfig.js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe("pk_test_51HHsHPKDASE1Hc3S7z0DxdBmHEFhyCxUW0gItUyjdpngmvJlrApgVMw8bEBFRpz3KhbMzMMyPQTzNN8650IGIQo3003jB4idHf");

class HalloweenPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      existing: {}
    }
  }

  purchaseBooking = async (e, saturday) => {
    const stripe = await stripePromise;
    const response = await api.post("/halloween/create_stripe_checkout", { saturday });
    const session = await response.data;

    const result = await stripe.redirectToCheckout({
      sessionId: session.id
    });

    if(result.error) {
      console.log("Handle this error!", result.error);
    }
  }

  componentDidMount = async () => {
    let existing;

    try {
      existing = await api.get("/halloween");
    } catch (error) {
      this.setState({ status: error.response.status, message: error.response.data.message, loaded: true });
      return;
    }

    this.setState({ loaded: true, existing: existing.data });
  }


  /*

    hasBooking: false,
    inTransaction: false,
    saturdayCount,
    sundayCount
  */

  render () {
    if(!this.state.loaded) {
      return (
        <React.Fragment>
          <h1>Halloween Bookings</h1>
          <h2>Loading...</h2>
        </React.Fragment>
      );
    }

    console.log(this.state.existing);

    if(this.state.existing.hasBooking) {
      const { booking } = this.state.existing;
      return (
        <React.Fragment>
          <h1>Halloween Bookings</h1>
          <p>You have successfully made a booking!</p>
          <p>Booked for {booking.type === 1 ? "Saturday (31/11/2020)" : "Sunday (01/11/2020)"}</p>
          <p>This booking is for 6 people</p>
        </React.Fragment>
      );
    }

    if(this.state.existing.inTransaction) {
      return (
        <React.Fragment>
          <h1>Halloween Bookings</h1>
          <p>You exited out of your transaction. You are not able to book for the next few minutes.</p>
        </React.Fragment>
      );
    }

    const saturdayCount = parseInt(this.state.existing.saturdayCount);
    const sundayCount = parseInt(this.state.existing.sundayCount);

    return (
      <React.Fragment>
        <h1>Halloween Bookings</h1>
        <p>£23.70, 6 people per booking. 1 person must pay the £23.70.</p>
        <p>You have 5 minutes from clicking the purchase button to complete the transaction.</p>
        <div>
          <h2>Saturday Booking (31/10/2020)</h2>
          <p>Remaining spaces: {6 - saturdayCount}</p>
          {saturdayCount >= 6 ? (
            <p>Fully booked!</p>
          ) : (
            <button role="link" onClick={(e) => this.purchaseBooking(e, true)}>
              Book Saturday
            </button>
          )}
        </div>
        <div>
          <h2>Sunday Booking (01/11/2020)</h2>
          <p>Remaining spaces: {6 - sundayCount}</p>
          {sundayCount >= 6 ? (
            <p>Fully booked!</p>
          ) : (
            <button role="link" onClick={(e) => this.purchaseBooking(e, false)}>
              Book Sunday
            </button>
          )}
        </div>
      </React.Fragment>
    )
  }
}

export default HalloweenPage;
