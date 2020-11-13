import React from 'react';
import PropTypes from 'prop-types';
import { ElementsConsumer, CardElement } from '@stripe/react-stripe-js';
import authContext from '../../utils/authContext.js';

class CheckoutForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      disabled: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState({ disabled: true });
    const { stripe, elements } = this.props;

    if(!stripe || !elements) {
      // Not loaded disable stuff
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
      //handle error!!IMPORTANT
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
        {this.state.disabled ? <p>Processing...</p> : null}
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
