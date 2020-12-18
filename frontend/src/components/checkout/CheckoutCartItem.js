import React from 'react';
import PropTypes from 'prop-types';
import Cart from '../cart/Cart';

class CheckoutCartItem extends React.Component {
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

    const { name, basePrice, quantity, components, image } = this.props.item;
    const hasComponents = components !== undefined && components !== null && components.length !== 0;
    let additionalPrice = 0;

    if(hasComponents) {
      additionalPrice = components.map(component => component.price * component.quantity).reduce((sum, price) => sum + price);
    }

    const totalPrice = basePrice + additionalPrice;

    const componentList = hasComponents ? (
      <div className="text-lg">
        <ul>
          {components.map((component, i) => (
            <li key={i}>
              <span>- {component.name}</span>
              {component.hasOwnProperty("additionalDisplay") ? <br /> : null}
              {component.hasOwnProperty("additionalDisplay") ? <span>→ "{component.additionalDisplay}"</span> : null}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

    return (
      <div className="flex flex-row p-2 border-red-700 border-solid border-b-2 w-auto text-xl">
        <div className="pr-4 align-middle flex flex-col justify-between w-1/3">
          <img
            src={image}
            alt={name}
            className="w-full h-auto"
          />
          <div className="flex flex-row pt-2">
            {!this.props.locked ? (<button
              className="w-4"
              onClick={() => this.adjustQuantity(-1)}
            >-</button>) : null}
            <span className="flex-grow text-center">Qty: {quantity}</span>
            {!this.props.locked ? (<button
              className="w-4"
              onClick={() => this.adjustQuantity(1)}
            >+</button>) : null}
          </div>
        </div>
        <div className="flex flex-col flex-grow text-left w-2/3">
          <span className="text-left text-3xl font-semibold">{name}</span>
          <div className="flex flex-row justify-between">
            <span>{quantity} x £{totalPrice.toFixed(2)}</span>
            <span>(£{(totalPrice * quantity).toFixed(2)})</span>
          </div>
          {hasComponents ? <span>Customisation:</span> : null}
          {componentList}
        </div>
      </div>
    );
  }
}

CheckoutCartItem.propTypes = {
  item: PropTypes.object.isRequired,
  locked: PropTypes.bool.isRequired
}

export default CheckoutCartItem;
