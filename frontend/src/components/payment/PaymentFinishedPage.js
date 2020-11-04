import React from 'react';
import { Redirect, Link } from 'react-router-dom';

import api from '../../utils/axiosConfig.js';

class PaymentFinishedPage extends React.Component {
  constructor(props) {
    super(props);

    const { jwt, result } = this.props.match.params;
    const invalidResult = !(result.toLowerCase() === "success" || result.toLowerCase() === "failure");

    this.state = {
      errors: {
        invalidResult
      },
      jwt,
      result: result.toLowerCase(),
      loaded: false,
      status: 0,
      message: "",
      type: -1
    };
  }

  componentDidMount = async () => {
    let query;

    try {
      query = await api.post(`/payments/${this.state.result}`, { transactionJWT: this.state.jwt });
    } catch (error) {
      this.setState({ status: error.response.status, message: error.response.data.message, loaded: true });
      return;
    }

    this.setState({ status: query.status, message: query.data.message, type: query.data.type, loaded: true });
  }

  lookupType = (type) => {
    switch(type) {
      case 0:
        return "1 Year Gym Membership";
      case 1:
        return "Saturday Halloween Film Booking (6 Spaces)";
      case 2:
        return "Sunday Halloween Film Booking (6 Spaces)";
      case -1:
      default:
        return "Unknown";
    }
  }

  render () {
    if(this.state.errors.invalidResult) {
      return (
        <Redirect to="/errors/400" />
      );
    }

    if(!this.state.loaded) {
      return (
        <React.Fragment>
          <h1>Loading...</h1>
        </React.Fragment>
      );
    }

    if(this.state.status !== 200) {
      switch(this.state.status) {
        case 400:
          return (
            <React.Fragment>
              <h1>Transaction Completed</h1>
              <p>This transaction has already been completed.</p>
              <Link to="/">Click here to return to the home page</Link>
            </React.Fragment>
          );
        case 500:
        default:
          return (
            <Redirect to="/errors/500" />
          );
      }
    }

    if(this.state.result === "failure") {
      return (
        <React.Fragment>
          <h1>Payment Failed</h1>
          <p>The transaction was cancelled. Please try again. Payment was not taken.</p>
        </React.Fragment>
      )
    } else if (this.state.result === "success") {
      return (
        <React.Fragment>
          <h1>Payment Successful</h1>
          <p>You have successfully purchased a {this.lookupType(this.state.type)}!</p>
        </React.Fragment>
      )
    }
  }
}

export default PaymentFinishedPage;
