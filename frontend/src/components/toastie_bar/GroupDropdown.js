import React from 'react';
import PropTypes from 'prop-types';
import SelectableItem from './SelectableItem';

class GroupDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      selected: [],
      refreshId: this.props.refreshId
    };
  }

  // Used to force a re-render on deep object change
  static getDerivedStateFromProps = (props, currentState) => {
    if (props.refreshId !== currentState.refreshId) {
      return {
        open: currentState.open,
        selected: [],
        refreshId: props.refreshId
      };
    }

    return null;
  }

  addItemToSelected = (id) => {
    let { selected } = this.state;

    if(!selected.includes(id)) {
      if(this.props.exclusive) {
        selected = [id];
      } else {
        selected.push(id);
      }

      this.setState({ selected }, () => { this.props.updateParent(selected) });
    }
  }

  removeItemFromSelected = (id) => {
    let { selected } = this.state;

    if(selected.includes(id)) {
      selected = selected.filter(item => item !== id);
      this.setState({ selected }, () => { this.props.updateParent(selected) });
    }
  }

  render () {
    const visibility = this.state.open ? "visible" : "hidden";

    return (
      <div className="w-full mb-4 border-4 border-red-900">
        <div className="bg-red-900 text-white" onClick={() => {this.setState({ open: !this.state.open })}}>
          <p className="p-2 text-2xl">{this.state.open ? "▾" : "▸"} {this.props.title}</p>
        </div>
        <div className={`flex flex-row flex-wrap ${visibility}`}>
          {
            this.props.groupItems.sort((a, b) => {
              const aName = a.name.toLowerCase();
              const bName = b.name.toLowerCase();

              return aName > bName ? 1 : (aName < bName ? -1 : 0);
            }).map((item, i) => (
              <div className="flex-1 flex flex-row justify-center">
                <SelectableItem
                  key={i}
                  {...item}
                  selected={this.state.selected.includes(item.id)}
                  add={() => this.addItemToSelected(item.id)}
                  remove={() => this.removeItemFromSelected(item.id)}
                  exclusive={this.props.exclusive}
                />
              </div>
            ))
          }
        </div>
      </div>
    )
  }
}

export default GroupDropdown;
