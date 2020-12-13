import React from 'react';
import PropTypes from 'prop-types';
import Cart from './Cart';

class ViewCart extends React.Component {
  constructor(props) {
    super(props);
    this.cart = new Cart();
    this.cart.clearCart();
    this.cart.addToCart("toastie", "test", 0.7, 1, {}, []);
  }

  render () {
    return (
      <React.Fragment>
        <pre>
          {
            JSON.stringify(this.cart, null, 2)
          }
        </pre>
      </React.Fragment>
    )
  }
}

export default ViewCart;
