import React from 'react';
import PropTypes from 'prop-types';
import ViewCart from './ViewCart';
import Cart from './Cart';

class CartDesktopNavBarElement extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      quantity: 0
    };
  }
  updateCart = () => {
    // Calculates items in the basket
    this.setState({ quantity: this.cart.get().items.reduce((sum, obj) => sum + obj.quantity, 0) });
  }

  componentDidMount = () => {
    this.cart = new Cart();
    this.cart.registerCallbackOnSave(this.updateCart);
  }

  render () {
    return (
      <li
        className="h-full p-3 hidden w-20 sm:inline-block"
        onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
      >
        <div className="w-full">
          <img
            src="/images/cart/basket.png"
            alt="Shopping Basket"
            className="w-full"
          />
        <span className="absolute z-10 font-bold" style={{top: "48px"}}>{this.state.quantity}</span>
        </div>
        <ViewCart
          active={this.props.activeDropdownKey === this.props.id}
          onMouseLeave={() => {
            this.props.changeActiveDropdownKey(-1);
          }}
        />
      </li>
    )
  }
}

CartDesktopNavBarElement.propTypes = {
  id: PropTypes.number.isRequired,
  activeDropdownKey: PropTypes.number.isRequired,
  changeActiveDropdownKey: PropTypes.func.isRequired
};

export default CartDesktopNavBarElement;
