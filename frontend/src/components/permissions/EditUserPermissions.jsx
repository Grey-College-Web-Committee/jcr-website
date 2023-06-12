import React from 'react';
import PropTypes from 'prop-types';
import PermissionRow from './PermissionRow';

class EditUserPermissions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stateUpdateId: this.props.stateUpdateId,
      lastRandom: Math.random()
    }
  }

  // Used to force a re-render on deep object change
  static getDerivedStateFromProps = (props, currentState) => {
    if (props.stateUpdateId !== currentState.stateUpdateId) {
      return {
        lastRandom: Math.random(),
        stateUpdateId: props.stateUpdateId
      };
    }

    return null;
  }

  renderPermissionRows = () => {
    // Sort them by their IDs so it is consistent each time
    this.props.allPermissions.sort((a, b) => {
      const firstId = a.id;
      const secondId = b.id;

      if(firstId < secondId) return -1;
      if(firstId > secondId) return 1;

      return 0;
    });

    const rows = this.props.allPermissions.map((item, i) => {
      return (
        <PermissionRow
          key={this.state.lastRandom + i}
          rowId={i}
          user={this.props.user}
          permissionInformation={item}
        />
      );
    });

    return (
      <tbody>
        {rows}
      </tbody>
    )
  }

  render () {
    return (
      <table className="mx-auto border-2 text-left border-red-900">
        <thead className="bg-red-900 text-white">
          <tr>
            <th className="p-2 font-semibold">Permission</th>
            <th className="p-2 font-semibold hidden lg:table-cell">Description</th>
            <th className="p-2 font-semibold">Granted</th>
            <th className="p-2 font-semibold">Granted By</th>
            <th className="p-2 font-semibold hidden lg:table-cell">Granted At</th>
            <th className="p-2 font-semibold">Grant/Revoke</th>
          </tr>
        </thead>
        { this.renderPermissionRows() }
      </table>
    )
  }
}

EditUserPermissions.propTypes = {
  user: PropTypes.object.isRequired,
  allPermissions: PropTypes.array.isRequired,
  stateUpdateId: PropTypes.number.isRequired
};

export default EditUserPermissions;
