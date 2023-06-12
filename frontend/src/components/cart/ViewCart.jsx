import React from 'react';
import PropTypes from 'prop-types';
import Cart from './Cart';
import CartItem from './CartItem';
import { Link } from 'react-router-dom';

class ViewCart extends React.Component {
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
  }

  render () {
    if(!this.cart) {
      return null;
    }

    const { items } = this.cart.get();
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

    const visibility = this.props.active ? "visible" : "hidden";

    if(Cart.locked) {
      return (
        <div
          className={`w-1/6 absolute z-90 mt-5 right-0 mr-2 text-black border-2 bg-white border-red-900 rounded ${visibility}`} onMouseLeave={this.props.onMouseLeave}
        >
          <div className="w-full border-b-4 border-red-900 p-2 text-white bg-red-900 font-bold text-lg">
            Your Bag
          </div>
          <div>
            <div className="w-full border-b-2 border-red-900 p-2 flex flex-row flex-grow justify-between opacity-50">
              <span className="font-semibold">Subtotal</span>
              <span className="font-semibold">£{subtotal.toFixed(2)}</span>
            </div>
            <div className="w-full p-2 border-b-2 border-red-900">
              <button disabled={true} className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">Checkout</button>
            </div>
            <div className="bg-gray-100">
              <ul className="opacity-25">
                <div className="absolute w-full h-full opacity-100">
                </div>
                {items.map((item, i) => (
                  <li key={i}>
                    <CartItem
                      item={item}
                      disabled={true}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        className={`w-1/6 absolute z-10 mt-5 right-0 mr-2 text-black border-2 border-b-0 bg-white border-red-900 rounded ${visibility}`} onMouseLeave={this.props.onMouseLeave}
      >
        <div className="w-full border-b-4 border-red-900 p-2 text-white bg-red-900 font-bold text-lg">
          Your Bag
        </div>
        <div>
          <div className="w-full border-b-2 border-red-900 p-2 flex flex-row flex-grow justify-between">
            <span className="font-semibold">Subtotal</span>
            <span className="font-semibold">£{subtotal.toFixed(2)}</span>
          </div>
          <div className="w-full p-2 border-b-2 border-red-900">
            <Link to="/checkout">
              <button className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">Checkout</button>
            </Link>
          </div>
          <div>
            <ul>
              {items.map((item, i) => (
                <li key={i}>
                  <CartItem
                    item={item}
                    disabled={false}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

ViewCart.propTypes = {
  active: PropTypes.bool.isRequired,
  onMouseLeave: PropTypes.func.isRequired
};

export default ViewCart;
