import React from 'react';
import PropTypes from 'prop-types';
import ViewCartMobile from './ViewCartMobile';
import Cart from './Cart';

class CartMobileNavBarElement extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showMenu: false,
      parentActive: true,
      quantity: 0
    }
  }

  updateCart = () => {
    // Calculates items in the basket
    this.setState({ quantity: this.cart.get().items.reduce((sum, obj) => sum + obj.quantity, 0) });
  }

  componentDidMount = () => {
    this.cart = new Cart();
    this.cart.registerCallbackOnSave(this.updateCart);
  }

  setShowMenu = (choice) => {
    this.setState({ showMenu: choice, parentActive: !choice });
  }

  render () {
    return (
      <li
        className="h-full p-3 w-20 inline-block lg:hidden"
        onClick={() => {
          if(this.state.parentActive) {
            this.props.hideBody(true);
            this.setShowMenu(true);
          }
        }}
      >
        <div className="w-full relative">
          <img
            src="/images/cart/basket.png"
            alt="Shopping Basket"
          />
          <span className="z-10 font-bold absolute" style={{top: "36px"}}>{this.state.quantity}</span>
        </div>
        <ViewCartMobile
          active={this.state.showMenu}
          hideSelf={() => {
            this.props.hideBody(false);
            this.setShowMenu(false);
          }}
        />
      </li>
    )
  }
}

CartMobileNavBarElement.propTypes = {
  hideBody: PropTypes.func.isRequired
};

export default CartMobileNavBarElement;
