import React from 'react';
import PropTypes from 'prop-types';
import StockRow from './StockRow';

class ExistingStock extends React.Component {
  render () {
    // Should only be displayed once we have data anyway based
    // on the render function in ToastieBarStockPage.js
    if(this.props.stock === undefined) {
      return (
        <p>Loading...</p>
      );
    }

    // Just displays a table with the existing stock
    return (
      <table
        className="mx-auto border-2 text-left border-red-900"
      >
        <thead className="bg-red-900 text-white">
          <tr>
            <th className="p-2 font-semibold">Name</th>
            <th className="p-2 font-semibold hidden sm:table-cell">Type</th>
            <th className="p-2 font-semibold hidden sm:table-cell">Price (£)</th>
            <th className="p-2 font-semibold">Available</th>
            <th className="p-2 font-semibold hidden sm:table-cell">Last Updated</th>
            <th className="p-2 font-semibold">Save</th>
          </tr>
        </thead>
        <tbody>
          {this.props.stock.map((item, index) => (
            <StockRow
              key={index}
              item={item}
              rowId={index}
            />
          ))}
        </tbody>
      </table>
    )
  }
}

ExistingStock.propTypes = {
  stock: PropTypes.array.isRequired
};

export default ExistingStock;
