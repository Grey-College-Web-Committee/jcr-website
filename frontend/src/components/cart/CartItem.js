import React from 'react';
import PropTypes from 'prop-types';
import Cart from './Cart';

class CartItem extends React.Component {
  constructor(props) {
    super(props);
    this.cart = new Cart();
  }

  adjustQuantity = (amount) => {
    const duplicateHash = this.props.item.duplicateHash;
    this.cart.adjustQuantity(duplicateHash, amount);
  }

  render () {
    if(this.props.item === null) {
      return null;
    }

    const { name, basePrice, quantity, components } = this.props.item;
    const hasComponents = components !== undefined && components !== null && components.length !== 0;
    let additionalPrice;

    if(hasComponents) {
      additionalPrice = components.map(component => component.price * component.quantity).reduce((sum, price) => sum + price);
    }

    const totalPrice = basePrice + additionalPrice;

    const componentList = hasComponents ? (
      <div className="text-sm">
        <ul>
          {components.map((component, i) => (
            <li key={i}>
              <span>- {component.name}</span>
              {component.hasOwnProperty("additionalDisplay") ? <br /> : null}
              {component.hasOwnProperty("additionalDisplay") ? <span>>> {component.additionalDisplay} </span> : null}
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <div>
        <span>None Selected</span>
      </div>
    )

    return (
      <div className="flex flex-row p-2 border-red-700 border-solid border-b-2 w-full">
        <div className="pr-4 align-middle flex flex-col justify-between">
          <img
            src="/images/cart/placeholder.png"
            alt="Cart Placeholder Image"
            className="w-24 h-24"
          />
          <div className="flex flex-row pt-2">
            <button
              className="w-4"
              onClick={() => this.adjustQuantity(-1)}
            >-</button>
            <span className="flex-grow text-center">Qty: {quantity}</span>
            <button
              className="w-4"
              onClick={() => this.adjustQuantity(1)}
            >+</button>
          </div>
        </div>
        <div className="flex flex-col flex-grow">
          <span className="font-semibold">{name}</span>
          <div className="flex flex-row justify-between">
            <span>{quantity} x £{totalPrice.toFixed(2)}</span>
            <span>(£{(totalPrice * quantity).toFixed(2)})</span>
          </div>
          <span>Customisation:</span>
          {componentList}
        </div>
      </div>
    );
  }
}

export default CartItem;
