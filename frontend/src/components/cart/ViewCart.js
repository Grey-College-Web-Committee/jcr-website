import React from 'react';
import PropTypes from 'prop-types';
import Cart from './Cart';

class ViewCart extends React.Component {
  constructor(props) {
    super(props);
  }

  updateCart = () => {
    console.log("Outputs on change");
  }

  componentDidMount = () => {
    this.cart = new Cart();
    this.cart.registerCallbackOnSave(this.updateCart);
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
