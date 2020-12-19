import React from 'react';
import PropTypes from 'prop-types';
import Cart from './Cart';

class AddToCartButton extends React.Component {
  constructor(props) {
    super(props);
    this.cart = new Cart();

    this.state = {
      defaultText: this.props.text ? this.props.text : "Add To Bag",
      currentText: this.props.text ? this.props.text : "Add To Bag",
      disabled: false,
      disableOnCondition: this.props.disableOnCondition ? this.props.disableOnCondition : null
    }
  }

  updateCart = () => {
    // Forces a re-render
    this.setState({ id: Math.random() });
  }

  componentDidMount = () => {
    this.cart = new Cart();
    this.cart.registerCallbackOnSave(this.updateCart);
  }

  addItemToCart = () => {
    this.setState({ disabled: true });
    this.cart.get();
    const duplicateHash = this.props.duplicateHash ? this.props.duplicateHash : null;

    const success = this.cart.addToCart(
      this.props.shop,
      this.props.name,
      this.props.basePrice,
      this.props.quantity,
      this.props.submissionInformation,
      this.props.components,
      duplicateHash,
      this.props.image,
      this.props.upperLimit
    );

    if(success) {
      this.setState({ currentText: "Added  ✓" });
    }

    if(this.props.callback) {
      this.props.callback(success);
    }

    setTimeout(() => {
      this.setState({
        disabled: false
      });
    }, 800);

    setTimeout(() => {
      this.setState({
        currentText: this.state.defaultText
      });
    }, 1200);
  }

  render () {
    const cart = this.cart.get();

    let disabledByCondition = false;

    if(this.state.disableOnCondition) {
      disabledByCondition = this.state.disableOnCondition(cart.items);
    }

    return (
      <button
        onClick={this.addItemToCart}
        className={
          this.props.overrideClasses ? this.props.overrideClasses :
          "px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        }
        disabled={this.state.disabled || this.props.disabled || disabledByCondition}
      >
        {this.state.currentText}
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
  callback: PropTypes.func,
  disabled: PropTypes.bool,
  disableOnCondition: PropTypes.func
}

export default AddToCartButton;
