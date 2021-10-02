import React from 'react';
import PropTypes from 'prop-types';

class SingleTable extends React.Component {
  render () {
    return (
      <div className={`w-full md:w-1/2 flex flex-col ${this.props.left ? "md:mr-2" : "md:ml-2"}`}>
        <div className="flex flex-row justify-between mx-2 my-1 items-end">
          {
            this.props.pairs.map((pair, i) => (
              <div className="w-16 h-16 mb-1 pb-1 border-b border-red-900 overflow-auto flex flex-col justify-end">
                <span className="h-full">{pair.first}</span>
              </div>
            ))
          }
        </div>
        <div className="border border-black h-16 w-full"></div>
        <div className="flex flex-row justify-between mx-2 my-1 items-start">
          {
            this.props.pairs.map((pair, i) => (
              <div className="w-16 h-16 mt-1 pt-1 border-t border-red-900 overflow-auto flex flex-col justify-start">
                <span className="h-full">{pair.second}</span>
              </div>
            ))
          }
        </div>
      </div>
    )
  }
}

export default SingleTable;
