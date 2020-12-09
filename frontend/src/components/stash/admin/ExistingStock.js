import React from 'react';
import PropTypes from 'prop-types';
import StockRow from './StockRow';

class ExistingStock extends React.Component {
    constructor(props) {
    super(props);

    this.state = {
      simpleView: true
    }
  }
  
  onInputChange = e => {
    if(this.state.simpleView){ this.setState({simpleView: false}); }
    else{ this.setState({simpleView:true}); }
  }

  buttonText(){
      if (this.state.simpleView){ return "Full View" }
      else{ return "Simplified View" }
  }

  getFields(){
    if (!this.state.simpleView)
    { 
      return (
        <React.Fragment>
          <th className="p-2 font-semibold hidden lg:table-cell">Customisation Description</th>
          <th className="p-2 font-semibold hidden lg:table-cell">Customisation Cost</th>
          <th className="p-2 font-semibold hidden sm:table-cell">Options Available</th>
          <th className="hidden sm:table-cell p-2 font-semibold hidden lg:table-cell">Last Updated</th>
        </React.Fragment>
      ) 
    }
  }

  render () {
    // Should only be displayed once we have data anyway based
    // on the render function in ToastieBarStockPage.js
    if((this.props.stock === undefined)||(this.props.sizes === undefined)) {
      return (
        <p>Loading...</p>
      );
    }

    // Just displays a table with the existing stock
    return (
      <div>
        <button
          style={{ margin: "5px" }} 
          className="px-3 py-1 rounded bg-red-900 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400"
          value={this.state.simpleView}
            onClick={this.onInputChange}
          >Switch to {this.buttonText()}
        </button>
        <table className="mx-auto border-2 content-evenly text-left border-red-900">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold hidden md:table-cell">Description</th>
              <th className="p-2 font-semibold">Price (£)</th>
              <th className="p-2 font-semibold hidden sm:table-cell">Type</th>
              {this.getFields()}
              <th className="p-2 font-semibold">Available</th>
              <th className="p-2 font-semibold">Save Changes / Delete</th>
            </tr>
          </thead>
          <tbody>
            {this.props.stock.map((item, index) => (
              <StockRow
                 item={item} 
                simpleView={this.state.simpleView} 
                colours={this.props.colours} 
                selectedColours={this.props.selectedColours} 
                updateItemColours={this.props.updateItemColours} 
                updateAll={this.props.updateAll}
                sizesAvailable={this.props.sizes[item.sizeChartId-1]}
                key={index}
              />
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}

ExistingStock.propTypes = {
  stock: PropTypes.array.isRequired,
  selectedColours: PropTypes.object.isRequired,
  colours: PropTypes.array.isRequired,
  updateItemColours: PropTypes.func.isRequired,
  updateAll: PropTypes.func.isRequired,
  sizes: PropTypes.array.isRequired
};

export default ExistingStock;
