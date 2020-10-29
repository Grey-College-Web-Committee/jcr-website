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
      hasBooking: false
    }
  }

  purchaseBooking = async (e) => {
    const stripe = await stripePromise;
    const response = await api.post("/gym/create_stripe_checkout");
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

    return;

    try {
      existing = await api.get("/gym");
    } catch (error) {
      this.setState({ status: error.response.status, message: error.response.data.message, queried: true });
      return;
    }

    if(!existing.data.hasMembership) {
      this.setState({ loaded: true, hasMembership: false });
      return;
    }

    this.setState({ loaded: true, hasMembership: true, membership: existing.data.membership });
  }

  render () {
    if(!this.state.loaded) {
      return (
        <React.Fragment>
          <h1>Halloween Bookings</h1>
          <h2>Loading...</h2>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <h1>Halloween Bookings</h1>
        <p>£23.70, 6 people per booking. 1 person must pay the £23.70.</p>
        <p>You have 5 minutes from clicking the purchase button to complete the transaction.</p>
        <div>
          <h2>Saturday Booking (31/10/2020)</h2>
          <p>Available slots:</p>
          <button>Book Now!</button>
        </div>
        <div>
          <h2>Sunday Booking (01/11/2020)</h2>
          <p>Available slots:</p>
          <button>Book Now!</button>
        </div>
      </React.Fragment>
    )
  }
}

export default HalloweenPage;
