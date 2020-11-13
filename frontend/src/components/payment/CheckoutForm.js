import React from 'react';
import PropTypes from 'prop-types';
import { ElementsConsumer, CardElement } from '@stripe/react-stripe-js';
import authContext from '../../utils/authContext.js';

class CheckoutForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      disabled: false,
      error: ""
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState({ disabled: true, error: "" });
    const { stripe, elements } = this.props;

    if(!stripe || !elements) {
      this.setState({ disabled: false, error: "Stripe is still loading. Please try again in a moment." });
      return;
    }

    if(this.state.name.length === 0) {
      this.setState({ disabled: false, error: "Please enter the cardholder name." });
      return;
    }

    const result = await stripe.confirmCardPayment(this.props.clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: this.state.name
        }
      }
    });

    if(result.error) {
      this.setState({ disabled: false, error: result.error.message });
      return;
    }

    if(result.paymentIntent.status === "succeeded") {
      this.props.onSuccess();
      return;
    }
  }

  render () {
    return (
      <React.Fragment>
        <label>Name on card</label>
        <input
          type="text"
          onChange={this.onInputChange}
          value={this.state.name}
          name="name"
          disabled={this.state.disabled}
        />
        <label>Receipt Email</label>
        <input
          type="text"
          disabled={true}
          value={this.context.email}
        />
        <CardElement />
        <button
          onClick={this.handleSubmit}
          disabled={this.state.disabled}
        >Make Payment</button>
      {this.state.disabled ? <p>Processing payment. Please do not refresh this page.</p> : null}
        <br />
        <p>{this.state.error}</p>
      </React.Fragment>
    );
  }
}

CheckoutForm.contextType = authContext;

export default function InjectedCheckoutForm(props) {
  return (
    <ElementsConsumer>
      {({stripe, elements}) => (
        <CheckoutForm
          stripe={stripe}
          elements={elements}
          clientSecret={props.clientSecret}
          onSuccess={props.onSuccess}
        />
      )}
    </ElementsConsumer>
  );
};
