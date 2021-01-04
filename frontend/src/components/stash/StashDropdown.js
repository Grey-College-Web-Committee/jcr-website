import React from 'react';
import PropTypes from 'prop-types';
import StashSelectable from './StashSelectable';

class StashDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      selected: []
    };
  }

  render () {
    const visibility = this.state.open ? "visible" : "hidden";

    return (
      <div className="w-full mb-4 border-4 border-red-900 text-left">
        <div className="bg-red-900 text-white cursor-pointer" onClick={() => {this.setState({ open: !this.state.open })}}>
          <p className="p-2 text-2xl">{this.state.open ? "▾" : "▸"} {this.props.title}</p>
        </div>
        <div className={`flex flex-row flex-wrap ${visibility}`}>
          {
            this.props.groupItems.map((item, i) => (
              <div className="flex-1 flex flex-row justify-center" key={i}>
                <StashSelectable
                  {...item}
                />
              </div>
            ))
          }
        </div>
      </div>
    )
  }
}

StashDropdown.propTypes = {
  title: PropTypes.string.isRequired,
  groupItems: PropTypes.array.isRequired
};

export default StashDropdown;
