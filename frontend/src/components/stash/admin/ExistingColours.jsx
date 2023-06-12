import React from 'react';
import PropTypes from 'prop-types';
import ColoursRow from './ColoursRow';
import AddColourRow from './AddColourRow';

class ExistingColours extends React.Component {

  render () {
    // Should only be displayed once we have data anyway based
    // on the render function in StashStockPage.js
    if(this.props.colours === undefined) {
      return (
        <p>Loading.....</p>
      );
    }

    // Just displays a table with the existing stock
    return (
      <table className="mx-auto border-2 text-left border-red-900">
        <thead className="bg-red-900 text-white">
          <tr>
            <th className="p-2 font-semibold">Selected</th>
            <th className="p-2 font-semibold">Name</th>
            <th className="p-2 font-semibold">Two Tone?</th>
            <th className="p-2 font-semibold">Display Colour(s)</th>
            <th className="p-2 font-semibold hidden sm:table-cell">Last Updated</th>
            <th className="p-2 font-semibold">Save</th>
          </tr>
        </thead>
        <tbody>
          {this.props.colours.map((item, index) => (
              <ColoursRow
                key={index} item={item} selectedColours={this.props.selectedColours} itemColourChanged={this.props.itemColourChanged}
              />
          ))}
          <AddColourRow updateColoursListing={this.props.updateColoursListing}></AddColourRow>
        </tbody>
      </table>
    )
  }
}

ExistingColours.propTypes = {
  colours: PropTypes.array.isRequired,
  selectedColours: PropTypes.object.isRequired,
  itemColourChanged: PropTypes.func.isRequired,
  updateColoursListing: PropTypes.func.isRequired
};

export default ExistingColours;
