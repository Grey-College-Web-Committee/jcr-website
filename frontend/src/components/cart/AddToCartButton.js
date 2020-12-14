import React from 'react';
import PropTypes from 'prop-types';
import Cart from './Cart';

class AddToCartButton extends React.Component {
  constructor(props) {
    super(props);
    this.cart = new Cart();
  }

  addItemToCart = () => {
    const duplicateHash = this.props.duplicateHash ? this.props.duplicateHash : null;

    const success = this.cart.addToCart(
      this.props.shop,
      this.props.name,
      this.props.basePrice,
      this.props.quantity,
      this.props.submissionInformation,
      this.props.components,
      duplicateHash
    );

    if(this.props.callback) {
      this.props.callback(success);
    }
  }

  render () {
    return (
      <button
        onClick={this.addItemToCart}
        className={
          this.props.overrideClasses ? this.props.overrideClasses : "w-32"
        }
      >
        {this.props.text ? this.props.text : "Add To Cart"}
      </button>
    );
  }
}

AddToCartButton.propTypes = {
  shop: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  basePrice: PropTypes.number.isRequired,
  quantity: PropTypes.number.isRequired,
  submissionInformation: PropTypes.object.isRequired,
  components: PropTypes.array.isRequired,
  duplicateHash: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  text: PropTypes.string,
  overrideClasses: PropTypes.string,
  callback: PropTypes.func
}

export default AddToCartButton;
