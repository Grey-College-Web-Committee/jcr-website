import React from 'react';
import PropTypes from 'prop-types';
import DropdownElement from './DropdownElement';

class DropdownMenu extends React.Component {
  render () {
    const visibility = this.props.active ? "visible" : "invisible";

    return (
      <div className={`absolute z-10 mt-4 ${visibility}`}>
        <ul className="flex flex-col bg-red-900 text-gray-200 items-center">
          {this.props.items.map((item, i) => (
            <DropdownElement
              key={i}
              {...item}
            />
          ))}
        </ul>
      </div>
    )
  }
}

export default DropdownMenu;
