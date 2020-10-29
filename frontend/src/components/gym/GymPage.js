import React from 'react';

import api from '../../utils/axiosConfig.js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe("pk_test_51HHsHPKDASE1Hc3S7z0DxdBmHEFhyCxUW0gItUyjdpngmvJlrApgVMw8bEBFRpz3KhbMzMMyPQTzNN8650IGIQo3003jB4idHf");

class GymPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      hasMembership: false,
      membership: {}
    }
  }

  purchaseMembership = async (e) => {
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

    try {
      existing = await api.get("/gym");
    } catch (error) {
      this.setState({ status: error.response.status, message: error.response.data.message, loaded: true });
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
          <h1>Loading...</h1>
        </React.Fragment>
      );
    }

    if(!this.state.hasMembership) {
      return (
        <React.Fragment>
          <h1>Purchase Gym Membership</h1>
          <p>Click the button below to purchase a gym membership. You will be redirected to Stripe for payment.</p>
          <p>Price is £XX.XX and is for a full year of membership.</p>
          <p>Once you have purchased a membership please allow up to Y days for your card to be activated.</p>
          <p>You can check the status of your membership by returning to this page after purchase.</p>
          <button role="link" onClick={this.purchaseMembership}>
            Purchase Gym Membership
          </button>
        </React.Fragment>
      )
    }

    return (
      <React.Fragment>
        <h1>View Gym Membership</h1>
        <p>You already have a membership</p>
        <p>Purchased at {this.state.membership.createdAt}</p>
        <p>Approved: {this.state.membership.approved ? "Yes" : "No"}</p>
      </React.Fragment>
    )
  }
}

export default GymPage;
