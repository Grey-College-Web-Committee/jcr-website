import React from 'react';
import PropTypes from 'prop-types';
import StashSelectable from './StashSelectable';

class StashDropdown extends React.Component {
  constructor(props) {
    super(props);

    let open = false;

    if(localStorage.getItem(`stash_${this.props.identifier}`) !== undefined && localStorage.getItem(`stash_${this.props.identifier}`) !== null) {
      open = JSON.parse(localStorage.getItem(`stash_${this.props.identifier}`));

      if(open !== true && open !== false) {
        open = false;
        localStorage.setItem(`stash_${this.props.identifier}`, false);
      }
    } else {
      localStorage.setItem(`stash_${this.props.identifier}`, false);
    }

    this.state = {
      open,
      selected: []
    };
  }

  toggleOpen = () => {
    const open = !this.state.open;
    localStorage.setItem(`stash_${this.props.identifier}`, open);
    this.setState({ open });
  }

  render () {
    const visibility = this.state.open ? "visible" : "hidden";

    return (
      <div className="w-full mb-4 border-4 border-red-900 text-left">
        <div className="bg-red-900 text-white cursor-pointer" onClick={this.toggleOpen}>
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
