import React from 'react';
import PropTypes from 'prop-types';
import DropdownElement from './DropdownElement';

class DropdownMenu extends React.Component {
  render () {
    const visibility = this.props.active ? "visible" : "invisible";

    return (
      <div className={`absolute z-10 mt-4 ${visibility}`}>
        <ul className="flex flex-col bg-red-900 text-white">
          {this.props.items.map((item, i) => (
            <DropdownElement
              key={i}
              {...item}
              user={this.props.user}
            />
          ))}
        </ul>
      </div>
    )
  }
}

DropdownMenu.propTypes = {
  items: PropTypes.array.isRequired,
  active: PropTypes.bool.isRequired,
  user: PropTypes.object
}

export default DropdownMenu;
