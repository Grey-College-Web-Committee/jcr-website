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

    // React Fragment is used to here to handle the key property
    const rows = this.props.allPermissions.map((item, i) => {
      return (
        <React.Fragment key={this.state.lastRandom + i}>
          <PermissionRow
            user={this.props.user}
            permissionInformation={item}
          />
        </React.Fragment>
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
      <table>
        <thead>
          <tr>
            <th>Permission</th>
            <th>Description</th>
            <th>Granted</th>
            <th>Granted By</th>
            <th>Granted At</th>
            <th>Grant/Revoke</th>
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
