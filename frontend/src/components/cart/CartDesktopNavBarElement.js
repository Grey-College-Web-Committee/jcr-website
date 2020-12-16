import React from 'react';
import PropTypes from 'prop-types';
import ViewCart from './ViewCart';

class CartDesktopNavBarElement extends React.Component {
  render () {
    return (
      <li
        className="h-full p-3 hidden sm:inline-block"
        onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
      >
        <img
          src="/images/cart/basket.png"
          alt="Shopping Basket"
          style={{width: 48}}
        />
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

export default CartDesktopNavBarElement;
