import React from 'react';
import PropTypes from 'prop-types';
import LoadingHolder from '../common/LoadingHolder';
import Cart from './Cart';
import CheckoutCartItem from './CheckoutCartItem';
import api from '../../utils/axiosConfig';

class CheckoutPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: Math.random(),
      disabled: false,
      pageState: 0,
      lockedClientSideCart: null,
      errorStatus: -1
    }
  }

  startCheckout = (e) => {
    e.preventDefault();
    this.setState({ disabled: true, pageState: 1, lockedClientSideCart: this.cart.get() }, this.submitCart);
    this.cart.setLocked(true);
  }

  submitCart = async () => {
    // Construct the object to send to the server
    // No checking here of the structure just send it and let the server process that

    let submissionCart = {
      items: [],
      discountCodes: []
    };

    const { items, discountCodes } = this.state.lockedClientSideCart;

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
  }

  updateCart = () => {
    // Forces a re-render
    this.setState({ id: Math.random() });
  }

  componentDidMount = () => {
    this.cart = new Cart();
    this.cart.registerCallbackOnSave(this.updateCart);
    this.updateCart();
  }

  render () {
    switch(this.state.pageState) {
      // Confirm the order
      case 0:
        if(!this.cart) {
          return (
            <LoadingHolder />
          );
        }

        const { items, discountCodes } = this.cart.get();
        let subtotal = 0;

        items.forEach((item, i) => {
          const { basePrice, quantity, components } = item;
          const hasComponents = components !== undefined && components !== null && components.length !== 0;
          let additionalPrice;

          if(hasComponents) {
            additionalPrice = components.map(component => component.price * component.quantity).reduce((sum, price) => sum + price);
          }

          subtotal += (basePrice + additionalPrice) * quantity;
        });

        return (
          <div className="flex flex-col justify-start">
            <div className="container mx-auto p-4 w-full">
              <h1 className="font-semibold text-5xl pb-4 text-center">Your Bag</h1>
              <div className="sm:flex sm:flex-row sm:justify-between">
                <div className="sm:w-1/2 sm:mx-auto w-full">
                  <ul>
                    {items.map((item, i) => (
                      <li key={i}>
                        <CheckoutCartItem
                          item={item}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-full sm:w-1/4 mx-auto block sm:flex sm:flex-col text-base pt-4 align-middle">
                  <div className="flex flex-row justify-between text-3xl pb-2">
                    <span>Total:</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <button
                    className="px-2 py-2 rounded bg-red-900 text-white text-2xl w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    onClick={this.startCheckout}
                    disabled={this.state.disabled}
                  >Pay Now</button>
                <br />
                  <button
                    className="px-2 py-2 rounded bg-red-900 text-white text-2xl w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    onClick={() => {this.cart.setLocked(!Cart.locked)}}
                    disabled={this.state.disabled}
                  >LOCK/UNLOCK CART</button>
                </div>
              </div>
            </div>
          </div>
        );
      // Load the checkout form and confirm with the server
      case 1:
        return (
          <LoadingHolder />
        );

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
