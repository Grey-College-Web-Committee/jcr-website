import React from 'react';
import PropTypes from 'prop-types';
import AddToCartButton from './AddToCartButton';

class GenericCartableItem extends React.Component {
  render () {
    const { name, image, price, description, cartData } = this.props;

    return (
      <div className="flex flex-col w-64 w-64 border-red-900 border-8 m-2">
        <img
          src={image}
          alt={name}
          className="flex border-red-900 border-b-8"
        />
        <div className="flex flex-col justify-betweenh-full">
          <div className="flex flex-col justify-center text-center">
            <span className="text-lg font-semibold">{name}</span>
            <span className="text-lg font-semibold">£{price.toFixed(2)}</span>
            {description ? (<span className="text-lg">{description}</span>) : null}
          </div>
          <div className="p-2">
            <AddToCartButton
              {...cartData}
              disabled={this.props.disabled}
              text={this.props.buttonText}
              disableOnCondition={this.props.disableOnCondition}
              callback={this.props.callback}
            />
          </div>
        </div>
      </div>
    );
  }
}

GenericCartableItem.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  image: PropTypes.string.isRequired,
  cartData: PropTypes.object.isRequired,
  description: PropTypes.string,
  disabled: PropTypes.bool,
  buttonText: PropTypes.string,
  disableOnCondition: PropTypes.func,
  callback: PropTypes.func
}

export default GenericCartableItem;
