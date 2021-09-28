import React from 'react';
import PropTypes from 'prop-types';

class DoubleTable extends React.Component {
  render () {
    return (
      <div className="flex flex-col md:flex-row justify-between">
        <div className="w-full md:w-1/2 md:mr-4 flex flex-col">
          <div className="flex flex-row justify-between mx-2 my-1">
            <div>A</div>
            <div>B</div>
          </div>
          <div className="border border-black h-16 w-full"></div>
          <div className="flex flex-row justify-between mx-2 my-1">
            <div>C</div>
            <div>D</div>
          </div>
        </div>
        <div className="w-full md:w-1/2 md:mr-4 flex flex-col">
          <div className="flex flex-row justify-between mx-2 my-1">
            <div>A</div>
            <div>B</div>
          </div>
          <div className="border border-black h-16 w-full"></div>
          <div className="flex flex-row justify-between mx-2 my-1">
            <div>C</div>
            <div>D</div>
          </div>
        </div>
      </div>
    )
  }
}

export default DoubleTable;
