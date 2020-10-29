import React from 'react'
import PropTypes from 'prop-types'

import api from '../../utils/axiosConfig.js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe("pk_live_51HHsHPKDASE1Hc3SBwvmTIC1anmLIc0YCArbDAnZIehcCcEtzojC4V4GYHifQSWUfOmS3vqHLw7uDgs6BiuECfEV00lHoBcPPu");

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

  render () {
    const dev = false;

    if(Date.now() < new Date("2020-10-29T18:30:00") && dev) {
      return (
        <React.Fragment>
          <h1>Halloween Bookings</h1>
          <h2>Booking opens at 6:30pm on 29/10/2020!</h2>
        </React.Fragment>
      );
    }

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
          <p>This booking is for 6 people.</p>
          <p>Enjoy!</p>
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
        <p>The cost of this event is £23.70 for a group of 6 people.</p>
        <p>Only one person from the group needs to book!</p>
        <p>You have 5 minutes from clicking the purchase button to complete the transaction.</p>
        <p>You will be purchasing a ticket valid for 6 people to attend. By purchasing this ticket, you are agreeing to ensure that the 6 attendees are all living in college and are all in the same household. If you turn up with more than 6 people or with people from different households you may be refused entry and may not be refunded your money.</p>
        <div>
          <h2>Saturday Booking (31/10/2020)</h2>
          <p>Remaining spaces: <strong>{6 - saturdayCount}</strong></p>
          {saturdayCount >= 6 ? (
            <p><strong>Fully booked!</strong> Check back to see if more are available later!</p>
          ) : (
            <button role="link" onClick={(e) => this.purchaseBooking(e, true)}>
              Book Saturday
            </button>
          )}
        </div>
        <div>
          <h2>Sunday Booking (01/11/2020)</h2>
          <p>Remaining spaces: <strong>{6 - sundayCount}</strong></p>
          {sundayCount >= 6 ? (
            <p><strong>Fully booked!</strong> Check back to see if more are available later!</p>
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
