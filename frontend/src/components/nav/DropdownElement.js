import React from 'react';
import PropTypes from 'prop-types';

class DropdownElement extends React.Component {
  getClasses = () => {
    return "bg-red-900 p-3"
  }

  render () {
    return (
      <li className={this.getClasses()}>
        {this.props.displayName}
      </li>
    )
  }
}

export default DropdownElement;
