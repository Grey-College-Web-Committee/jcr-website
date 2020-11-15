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

    const cardElement = elements.getElement(CardElement);
    cardElement.update({ disabled: true });

    if(this.state.name.length === 0) {
      this.setState({ disabled: false, error: "Please enter the cardholder name." });
      cardElement.update({ disabled: false });
      return;
    }

    let result;

    try {
      result = await stripe.confirmCardPayment(this.props.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: this.state.name
          }
        }
      });
    } catch (error) {
      console.log(error);
      this.setState({ disabled: false, error: "An error occurred with Stripe. Please try again later." });
    }

    if(result.error) {
      this.setState({ disabled: false, error: result.error.message });
      cardElement.update({ disabled: false });
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
        <table className="stockTable">
          <tbody>
            <tr>
              <td>Cardholder Name</td>
              <td>
                <input
                  type="text"
                  onChange={this.onInputChange}
                  value={this.state.name}
                  name="name"
                  disabled={this.state.disabled}
                />
              </td>
            </tr>
            <tr>
              <td>Receipt Email</td>
              <td>
                <input
                  type="text"
                  disabled={true}
                  value={this.context.email}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <p>Please enter your card number, expiry date, CVV and postcode.</p>
        <CardElement
          disabled={this.state.disabled}
        />
        <br />
        <button
          onClick={this.handleSubmit}
          disabled={this.state.disabled}
          className="largeButton"
        >Make Payment</button>
        <br />
        {this.state.disabled ? <p>Processing payment this may take a moment. Please do not refresh this page.</p> : null}
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
