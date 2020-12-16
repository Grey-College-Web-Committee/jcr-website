import React from 'react';
import PropTypes from 'prop-types';
import Cart from './Cart';
import CartItem from './CartItem';
import { Link } from 'react-router-dom';

class ViewCartMobile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: Math.random()
    }

    this.cart = new Cart();
    this.cart.registerCallbackOnSave(this.updateCart);
  }

  updateCart = () => {
    // Forces a re-render
    this.setState({ id: Math.random() });
  }

  render () {
    console.log("time", this.props.active, this.cart);
    if(!this.props.active || !this.cart) {
      return null;
    }

    const { items, discountCodes } = this.cart.get();
    let subtotal = 0;

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
      <div className="w-screen h-screen top-0 left-0 absolute bg-white text-black block z-10">
        <ul className="flex flex-col text-center justify-center">
          <li className="flex justify-center border-b border-gray-200 pt-4 pb-4 bg-red-900 text-white">
            <img
              src="/images/header-crest-232.png"
              alt="Grey College Logo"
              style={{
                width: "48px",
                height: "48px"
              }}
            />
          </li>
          <li className="border-b border-gray-200 pt-4 pb-4 cursor-pointer font-medium bg-red-900 text-white" onClick={this.props.hideSelf}>
            ← Back
          </li>
        </ul>
        <div className="w-full border-b-2 border-red-900 p-2 flex flex-row flex-grow justify-between text-lg">
          <span className="font-semibold">Subtotal</span>
          <span className="font-semibold">£{subtotal.toFixed(2)}</span>
        </div>
        <div className="w-full p-2 border-b-2 border-red-900 text-lg">
          <Link to="/checkout">
            <button disabled={Cart.locked} className="px-4 py-2 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50" onClick={this.props.hideSelf}>Checkout</button>
          </Link>
        </div>
        <ul className="flex flex-col text-center justify-center">
          {items.map((item, i) => (
            <li
              key={i}
            >
              <CartItem
                item={item}
                disabled={Cart.locked}
              />
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

export default ViewCartMobile;
