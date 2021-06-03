import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

class ToastieOrder extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    return (
      <div className={`text-left border mb-2 p-2`}>
        <div className="mb-2">
          <div className="flex flex-row justify-between items-center">
            <p>Order ID: (ID)</p>
          </div>
        </div>
      </div>
    )
  }
}

export default ToastieOrder;
