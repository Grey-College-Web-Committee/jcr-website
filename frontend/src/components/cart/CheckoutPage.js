import React from 'react';
import PropTypes from 'prop-types';
import LoadingHolder from '../common/LoadingHolder';
import Cart from './Cart';
import CheckoutCartItem from './CheckoutCartItem';

class CheckoutPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: Math.random()
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
              <button className="px-2 py-2 rounded bg-red-900 text-white text-2xl w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">Pay Now</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CheckoutPage;
