import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

class StashSelectable extends React.Component {
  render () {
    const viewButton = this.props.available ? (
      <Link to={`/stash/view/${this.props.id}`}>
        <button
          className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        >View</button>
      </Link>
    ) : (
      <button
        className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        disabled={true}
      >Unavailable</button>
    );

    const imageUrl = `/uploads/images/stash/${this.props.StashStockImages[0].productId}/${this.props.StashStockImages[0].name}`;

    return (
      <div className="flex flex-col w-64 w-64 border-red-900 border-8 m-2">
        <img
          src={imageUrl}
          alt={this.props.name}
          className="flex border-red-900 border-b-8"
        />
        <div className="flex flex-col justify-between text-lg font-semibold h-full">
          <div className="flex flex-col justify-center text-center">
            <span>{this.props.name}</span>
            <span>£{Number(this.props.price).toFixed(2)}</span>
          </div>
          <div className="p-2">
            {viewButton}
          </div>
        </div>
      </div>
    );
  }
}

StashSelectable.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
}

export default StashSelectable;
