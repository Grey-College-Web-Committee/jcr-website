import React from 'react';
import PropTypes from 'prop-types';

class SelectableItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    const orderButton = this.props.selected ? (
      <button
        className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        onClick={this.props.remove}
      >Remove</button>
    ) : (
      <button
        className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        onClick={this.props.add}
      >{this.props.exclusive ? "Select" : "Add"}</button>
    );

    const outOfStock = (<button
      className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
      disabled={true}
    >Unavailable</button>);

    return (
      <div className="flex flex-col w-40 w-40 border-red-900 border-8 m-2">
        <img
          src="/images/cart/placeholder.png"
          alt="Placeholder for ingredient"
          className="flex border-red-900 border-b-8"
        />
      <div className="flex flex-col justify-between text-lg font-semibold h-full">
          <div className="flex flex-col justify-center text-center">
            <span>{this.props.name}</span>
            <span>£{Number(this.props.price).toFixed(2)}</span>
          </div>
          <div className="p-2">
            {this.props.available ? orderButton : outOfStock}
          </div>
        </div>
      </div>
    )
  }
}

export default SelectableItem;
