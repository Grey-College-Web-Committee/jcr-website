import React from 'react';
import PropTypes from 'prop-types';
import ViewCart from './ViewCart';

class CartNavBarElement extends React.Component {
  render () {
    return (
      <li
        className="h-full p-3"
        onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
      >
        <img
          src="/images/cart/placeholder.png"
          alt="Shopping Cart Icon"
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

export default CartNavBarElement;
