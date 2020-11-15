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
      error: "",
      ready: false,
      express: false
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
      this.setState({ disabled: false, error: "An error occurred with Stripe. Please try again later." });
      return;
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

  injectApplePay = async () => {
    const { stripe, elements } = this.props;

    if(!stripe || !elements) {
      return;
    }

    const paymentRequest = stripe.paymentRequest({
      country: "GB",
      currency: "gbp",
      total: {
        label: "Order Total",
        amount: this.props.realCost
      },
      requestPayerName: true,
      requestPayerEmail: true
    });

    const result = await paymentRequest.canMakePayment();
    const prButton = elements.create("paymentRequestButton", {
      paymentRequest
    });

    if(result) {
      this.setState({ ready: true, express: true }, () => {
        prButton.mount("#payment-request-button");
      });
    } else {
      this.setState({ ready: true, express: false });
    }

    prButton.on("click", (ev) => {
      if(this.state.disabled) {
        ev.preventDefault();
        this.setState({ error: "Payment already in progress" });
        return;
      }
    });

    paymentRequest.on("paymentmethod", async (ev) => {
      this.setState({ disabled: true });
      const clientSecret = this.props.clientSecret;

      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
        clientSecret,
        {payment_method: ev.paymentMethod.id},
        {handleActions: false}
      );

      if(confirmError) {
        ev.complete("fail");
      } else {
        ev.complete("success");

        if(paymentIntent.status === "requires_action") {
          const { error } = await stripe.confirmCardPayment(this.props.clientSecret);

          if(error) {
            this.setState({ disabled: false, error: "The payment was unable to be completed. Please try an alternative method." });
          } else {
            this.props.onSuccess();
          }
        } else {
          this.props.onSuccess();
        }
      }
    });
  }

  componentDidMount = async () => {
    this.injectApplePay();
  }

  render () {
    if(!this.state.ready) {
      return (
        <div>
          <p>Checkout is loading, please wait...</p>
        </div>
      );
    }

    // Apple Pay or similar is available
    if(this.state.express) {
      return (
        <React.Fragment>
          <p>You are about to make a payment of <strong>£{Number(this.props.realCost / 100).toFixed(2)}</strong> to the Grey College JCR</p>
          <div className="checkoutType">
            <h2>Express Checkout</h2>
            <p>Your device supports express checkout</p>
            <div id="payment-request-button" className="paymentType"></div>
          </div>
          <div className="checkoutType">
            <h2>Regular Checkout</h2>
            <p>Please enter your card details.</p>
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
            <br />
            <CardElement
              disabled={this.state.disabled}
              className="paymentType"
            />
            <br />
            <button
              onClick={this.handleSubmit}
              disabled={this.state.disabled}
              className="largeButton"
            >Pay £{Number(this.props.realCost / 100).toFixed(2)}</button>
            <br />
            {this.state.disabled ? <p>Processing payment this may take a moment. Please do not refresh this page.</p> : null}
            <p>{this.state.error}</p>
          </div>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <p>You are about to make a payment of <strong>£{Number(this.props.realCost / 100).toFixed(2)}</strong> to the Grey College JCR</p>
        <div>
          <h2>Checkout</h2>
          <p>Please enter your card details.</p>
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
          <CardElement
            disabled={this.state.disabled}
            className="paymentType"
          />
          <br />
          <button
            onClick={this.handleSubmit}
            disabled={this.state.disabled}
            className="largeButton"
          >Pay £{Number(this.props.realCost / 100).toFixed(2)}</button>
          <br />
          {this.state.disabled ? <p>Processing payment this may take a moment. Please do not refresh this page.</p> : null}
          <p>{this.state.error}</p>
        </div>
      </React.Fragment>
    );
  }
}

CheckoutForm.contextType = authContext;
CheckoutForm.propTypes = {
  stripe: PropTypes.object.isRequired,
  elements: PropTypes.object.isRequired,
  clientSecret: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  realCost: PropTypes.number.isRequired
};

export default function InjectedCheckoutForm(props) {
  return (
    <ElementsConsumer>
      {({stripe, elements}) => (
        <CheckoutForm
          stripe={stripe}
          elements={elements}
          clientSecret={props.clientSecret}
          onSuccess={props.onSuccess}
          realCost={props.realCost}
        />
      )}
    </ElementsConsumer>
  );
};
