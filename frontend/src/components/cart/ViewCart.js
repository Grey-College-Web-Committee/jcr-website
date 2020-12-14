import React from 'react';
import PropTypes from 'prop-types';
import Cart from './Cart';
import CartItem from './CartItem';

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
      <div className="w-1/6">
        <div>
          <ul>
            {items.map((item, i) => (
              <li key={i}>
                <CartItem
                  item={item}
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full border-b-2 border-black p-2 flex flex-row flex-grow justify-between">
          <span className="font-semibold">Subtotal</span>
          <span className="font-semibold">£{subtotal.toFixed(2)}</span>
        </div>
        <div className="w-full border-b-2 border-black p-2">
          <button className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">Checkout</button>
        </div>
      </div>
    );
  }
}

export default ViewCart;
