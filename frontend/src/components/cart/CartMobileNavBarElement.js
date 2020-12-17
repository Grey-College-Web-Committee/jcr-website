import React from 'react';
import PropTypes from 'prop-types';
import ViewCartMobile from './ViewCartMobile';

class CartMobileNavBarElement extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showMenu: false,
      parentActive: true
    }
  }

  setShowMenu = (choice) => {
    this.setState({ showMenu: choice, parentActive: !choice });
  }

  render () {
    return (
      <li
        className="h-full p-3 inline-block sm:hidden"
        onClick={() => {
          if(this.state.parentActive) {
            this.props.hideBody(true);
            this.setShowMenu(true);
          }
        }}
      >
        <img
          src="/images/cart/basket.png"
          alt="Shopping Basket"
          style={{width: 48}}
        />
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
