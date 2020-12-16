import React from 'react';
import PropTypes from 'prop-types';
import { ElementsConsumer, CardElement } from '@stripe/react-stripe-js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';

// Use this for any checkout
// Requires the user to be signed in
// Does not contact our server in any way and is completely encapsulated (hopefully)
class CheckoutForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      disabled: false,
      error: null,
      ready: false,
      express: false,
      cardholderError: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), cardholderError: false, error: null })
  }

  // This is used to complete a regular checkout
  handleSubmit = async (event) => {
    // Prevent page refresh
    event.preventDefault();
    // Disable the forms
    this.setState({ disabled: true, error: null });
    const { stripe, elements } = this.props;

    if(!stripe || !elements) {
      this.setState({ disabled: false, error: "Stripe is still loading. Please try again in a moment." });
      return;
    }

    // This is the element that gets card details
    const cardElement = elements.getElement(CardElement);
    cardElement.update({ disabled: true });

    // Require the card holder's name to reduce transaction failures
    if(this.state.name.length === 0) {
      this.setState({ disabled: false, error: "Please enter the cardholder's name.", cardholderError: true });
      cardElement.update({ disabled: false });
      return;
    }

    // If we get a lot of failures we could get the email address too

    let result;

    // Process the payment via Stripe
    // This will also deal with things like 3D Secure
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

    // If we have an error tell the user and allow them to change details
    // Stripe provides readable error messages in their error responses
    if(result.error) {
      this.setState({ disabled: false, error: result.error.message });
      cardElement.update({ disabled: false });
      return;
    }

    // Payment succeeded so let the parent know and let them handle it
    // Don't re-enable the form so we can avoid duplicated payments
    if(result.paymentIntent.status === "succeeded") {
      this.props.onSuccess();
      return;
    }
  }

  // Will inject the Express Checkout if it is available
  injectExpressCheckout = async () => {
    const { stripe, elements } = this.props;

    if(!stripe || !elements) {
      return;
    }

    // Payment Request API is used for this
    const paymentRequest = stripe.paymentRequest({
      country: "GB",
      currency: "gbp",
      total: {
        label: "Order Total",
        amount: Math.round(this.props.totalAmountInPence)
      },
      requestPayerName: true,
      requestPayerEmail: true
    });

    // Let Stripe figure out if we can accept these payments
    const result = await paymentRequest.canMakePayment();

    // This will be the button displayed to the user
    let prButton = elements.getElement("paymentRequestButton");

    // This prevents an issue that arises if the user
    // leaves the page and then navigates back
    // as a result of single page routing Stripe will error
    // as we have too many instances of the button so destroy it if it exists
    if(prButton) {
      prButton.destroy();
    }

    // Create the actual button to display and bind it to the request object
    prButton = elements.create("paymentRequestButton", {
      paymentRequest
    });

    // If we can accept these payments then update the state with this info
    // we use a callback on the state update to then mount the button
    if(result) {
      this.setState({ ready: true, express: true }, () => {
        prButton.mount("#payment-request-button");
      });
    } else {
      this.setState({ ready: true, express: false });
    }

    // This prevents the user submitting a Regular Checkout
    // payment and then clicking the Express Checkout payment
    // Stripe recommends this method instead of disabling the button
    prButton.on("click", (ev) => {
      if(this.state.disabled) {
        ev.preventDefault();
        this.setState({ error: "Payment already in progress" });
        return;
      }
    });

    // This is called once they have verified their details by some means
    // and agreed to pay the amount
    paymentRequest.on("paymentmethod", async (ev) => {
      this.setState({ disabled: true });
      const clientSecret = this.props.clientSecret;

      // Confirm their payment with Stripe
      // handleActions: false means it won't deal with 3D Secure but we
      // handle this in a moment
      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
        clientSecret,
        {payment_method: ev.paymentMethod.id},
        {handleActions: false}
      );

      // If it fails let the Apple Pay/Google Pay etc know
      // Once the payment succeeds we let the parent deal with it
      if(confirmError) {
        ev.complete("fail");
      } else {
        ev.complete("success");

        // If we have additional actions such as 3D Secure let Stripe deal with that now
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

  // Once the component has mounted we try to put the Express Checkout in
  // this is since we need to mount the button so require it to be loaded
  componentDidMount = async () => {
    this.injectExpressCheckout();
  }

  render () {
    if(!this.state.ready) {
      return (
        <LoadingHolder />
      );
    }

    const displayPrice = Number(this.props.totalAmountInPence / 100).toFixed(2);
    const expressDiv = (
      <div className="mx-auto w-auto pt-2">
        <div id="payment-request-button"></div>
        <div className="w-full text-center">-- or --</div>
      </div>
    );
    const errorDiv = (
      <div className="mx-auto w-auto pb-4 pt-2 border-t-2 border-gray-200 text-lg text-center">
        <p className="underline">{this.state.error}</p>
      </div>
    );

    const cardholderBorder = this.state.cardholderError ? "border-red-700" : "border-gray-400";

    return (
      <div className="w-full">
        <div className="border-b-2 border-gray-200 flex flex-row justify-between font-semibold text-3xl">
          <span>Total</span>
          <span>£{displayPrice}</span>
        </div>
        {this.state.express ? expressDiv : null}
        <div>
          <div className="mx-auto w-auto pb-4 pt-2 border-b-2">
            <label htmlFor="name" className="flex flex-row justify-start pb-2 text-lg font-semibold">Name on Card</label>
            <input
              type="text"
              name="name"
              value={this.state.name}
              onChange={this.onInputChange}
              className={`shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400 ${cardholderBorder}`}
              placeholder="Cardholder name..."
              disabled={this.state.disabled}
            />
          </div>
          <div className="mx-auto w-auto py-2 border-b-2">
            <CardElement
              disabled={this.state.disabled}
              className="border-2 border-gray-200 p-4"
            />
          </div>
          <div className="mx-auto w-auto pb-4 pt-4">
            <button
              onClick={this.handleSubmit}
              disabled={this.state.disabled}
              className="px-2 py-2 rounded bg-red-900 text-white text-2xl w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >Pay £{displayPrice}</button>
          </div>
          {this.state.error !== null ? errorDiv : null}
        </div>
      </div>
    );
  }
}

CheckoutForm.contextType = authContext;
CheckoutForm.propTypes = {
  stripe: PropTypes.object.isRequired,
  elements: PropTypes.object.isRequired,
  clientSecret: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  totalAmountInPence: PropTypes.number.isRequired
};

// Export a slightly different version so we can use Stripe correctly
export default function InjectedCheckoutForm(props) {
  return (
    <ElementsConsumer>
      {({stripe, elements}) => (
        <CheckoutForm
          stripe={stripe}
          elements={elements}
          clientSecret={props.clientSecret}
          onSuccess={props.onSuccess}
          totalAmountInPence={props.totalAmountInPence}
        />
      )}
    </ElementsConsumer>
  );
};
