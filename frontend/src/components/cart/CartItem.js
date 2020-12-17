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
    let additionalPrice = 0;

    if(hasComponents) {
      additionalPrice = components.map(component => component.price * component.quantity).reduce((sum, price) => sum + price);
    }

    const totalPrice = basePrice + additionalPrice;

    const componentList = hasComponents ? (
      <div className="text-sm break-all">
        <ul>
          {components.map((component, i) => (
            <li key={i} className="text-left">
              <span>- {component.name}</span>
              {component.hasOwnProperty("additionalDisplay") ? <br /> : null}
              {component.hasOwnProperty("additionalDisplay") ? <span>→ "{component.additionalDisplay}"</span> : null}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

    return (
      <div className="flex flex-row p-2 border-red-900 border-solid border-b-2 w-full">
        <div className="pr-4 align-middle flex flex-col justify-between w-1/3">
          <img
            src="/images/cart/placeholder.png"
            alt="Cart Placeholder"
            className="w-full h-auto"
          />
          <div className="flex flex-row pt-2">
            <button
              className="w-4"
              onClick={() => this.adjustQuantity(-1)}
              disabled={this.props.disabled}
            >-</button>
            <span className="flex-grow text-center">Qty: {quantity}</span>
            <button
              className="w-4"
              onClick={() => this.adjustQuantity(1)}
              disabled={this.props.disabled}
            >+</button>
          </div>
        </div>
        <div className="flex flex-col flex-grow w-2/3">
          <span className="font-semibold text-left">{name}</span>
          <div className="flex flex-row justify-between">
            <span>{quantity} x £{totalPrice.toFixed(2)}</span>
            <span>(£{(totalPrice * quantity).toFixed(2)})</span>
          </div>
          {hasComponents ? <span className="text-left">Customisation:</span> : null}
          {componentList}
        </div>
      </div>
    );
  }
}

CartItem.propTypes = {
  item: PropTypes.object.isRequired,
  disabled: PropTypes.bool.isRequired
};

export default CartItem;
