import React from 'react';
import { Prompt } from 'react-router-dom';
import LoadingHolder from '../common/LoadingHolder';
import Cart from '../cart/Cart';
import CheckoutCartItem from './CheckoutCartItem';
import api from '../../utils/axiosConfig';
import CheckoutForm from './CheckoutForm';

class CheckoutPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: Math.random(),
      disabled: false,
      pageState: 0,
      lockedClientSideCart: null,
      errorStatus: -1,
      clientSecret: null,
      totalAmountInPence: -1
    }
  }

  startCheckout = (e) => {
    e.preventDefault();
    this.setState({ disabled: true, pageState: 1, lockedClientSideCart: JSON.parse(JSON.stringify(this.cart.get())) }, this.submitCart);
    this.cart.setLocked(true);
  }

  onPaymentSuccess = () => {
    this.cart.setLocked(false);
    this.cart.clearCart();
    window.removeEventListener("beforeunload", this.unlockHandler);
    this.setState({ pageState: 3 });
  }

  submitCart = async () => {
    // Construct the object to send to the server
    // No checking here of the structure just send it and let the server process that

    let submissionCart = {
      items: []
    };

    const { items } = this.state.lockedClientSideCart;

    items.forEach((item, i) => {
      const globalSubmissionInfo = item.submissionInformation;
      let componentSubmissionInfo = [];

      if(item.hasOwnProperty("components")) {
        const { components } = item;

        if(components !== undefined && components !== null && components.length !== 0) {
          components.forEach((component, i) => {
            componentSubmissionInfo.push(component.submissionInformation);
          });
        }
      }

      // Prices will be determined server side instead
      submissionCart.items.push({
        shop: item.shop,
        quantity: item.quantity,
        globalSubmissionInfo,
        componentSubmissionInfo
      });
    });

    // Now confirm with the server

    let serverResponse;
    let status;

    try {
      serverResponse = await api.post("/cart/process", { submissionCart });
    } catch (error) {
      status = error.response.status;
      this.setState({ pageState: -1, errorStatus: status });
      return;
    }

    const { clientSecret, totalAmountInPence } = serverResponse.data;

    this.setState({ clientSecret, totalAmountInPence, pageState: 2 });
  }

  updateCart = () => {
    // Forces a re-render
    this.setState({ id: Math.random() });
  }

  componentDidMount = () => {
    this.cart = new Cart();
    this.cart.registerCallbackOnSave(this.updateCart);
    this.updateCart();

    window.addEventListener("beforeunload", this.unlockHandler);
  }

  unlockHandler = (ev) => {
    if(this.cart) {
      this.cart.setLocked(false);
    }
  }

  componentWillUnmount = () => {
    this.cart.setLocked(false);
  }

  displayCart = (items, locked) => {
    if(items.length === 0) {
      return (
        <div className="flex flex-row justify-center">
          <div className="text-3xl flex flex-col justify-center align-middle w-max">
            <div>
              <img
                src="/images/cart/basket.png"
                className="w-64 h-64"
                alt="Empty Basket"
              />
            </div>
            <div>
              <p className="flex">Your bag is empty!</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            <CheckoutCartItem
              item={item}
              locked={locked}
            />
          </li>
        ))}
      </ul>
    );
  }

  injectPrompt = () => {
    return (
      <Prompt
        when={this.state.pageState === 1 || this.state.pageState === 2}
        message="You are about to navigate away from the checkout, meaning your payment will not go through. Leave checkout anyway?"
      />
    )
  }

  render () {
    if(!this.cart) {
      return (
        <LoadingHolder />
      );
    }

    const { items } = this.state.pageState <= 0 ? this.cart.get() : this.state.lockedClientSideCart ;

    switch(this.state.pageState) {
      // Confirm the order
      case 0:
        let subtotal = 0;
        const bagEmpty = items.length === 0;

        items.forEach((item, i) => {
          const { basePrice, quantity, components } = item;
          const hasComponents = components !== undefined && components !== null && components.length !== 0;
          let additionalPrice = 0;

          if(hasComponents) {
            additionalPrice = components.map(component => component.price * component.quantity).reduce((sum, price) => sum + price);
          }

          subtotal += (basePrice + additionalPrice) * quantity;
        });

        return (
          <div className="flex flex-col justify-start">
            {this.injectPrompt()}
            <div className="container mx-auto p-4 w-full">
              <h1 className="font-semibold text-5xl pb-4 text-center">Your Bag</h1>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between">
                <div className="sm:w-1/2 sm:mx-auto w-full">
                  {this.displayCart(items, false)}
                </div>
                <div className="w-full sm:w-1/3 mx-auto block sm:flex sm:flex-col text-base py-4 align-middle">
                  <div className="flex flex-row justify-between font-semibold text-3xl mb-4">
                    <span>Total</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <button
                    className="px-2 py-2 rounded bg-red-900 text-white text-2xl w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    onClick={this.startCheckout}
                    disabled={this.state.disabled || bagEmpty}
                  >Pay Now</button>
                </div>
              </div>
            </div>
          </div>
        );
      // Load the checkout form and confirm with the server
      case 1:
        return (
          <div>
            {this.injectPrompt()}
            <LoadingHolder />
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col justify-start">
            {this.injectPrompt()}
            <div className="container mx-auto p-4 w-full">
              <h1 className="font-semibold text-5xl pb-4 text-center">Your Confirmed Order</h1>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between">
                <div className="sm:w-1/2 sm:mx-auto w-full">
                  {this.displayCart(items, true)}
                </div>
                <div className="w-full sm:w-1/3 mx-auto block sm:flex sm:flex-col text-base py-4 align-middle">
                  <CheckoutForm
                    clientSecret={this.state.clientSecret}
                    onSuccess={this.onPaymentSuccess}
                    totalAmountInPence={this.state.totalAmountInPence}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col justify-start">
            <div className="container mx-auto p-4 w-full">
              <h1 className="font-semibold text-5xl pb-4 text-center">Order Placed!</h1>
              <div className="mx-auto text-center">
                <div className="sm:w-1/2 sm:mx-auto w-full">
                  <div className="text-3xl pb-2 font-semibold text-center">
                    <h2>Thank you for your purchase</h2>
                  </div>
                  <div className="text-lg pb-4">
                    <p>A receipt has been emailed to your Durham email address.</p>
                    <p>The payment has been confirmed and the order has been placed.</p>
                  </div>
                  {this.displayCart(items, true)}
                </div>
              </div>
            </div>
          </div>
        )

      case -1:
        return (
          <h1>Error</h1>
        );

      default:
        return null;
    }
  }
}

export default CheckoutPage;
