import React from 'react';
import PropTypes from 'prop-types';
import PermissionRow from './PermissionRow';

class EditUserPermissions extends React.Component {
  renderPermissionRows = () => {
    this.props.allPermissions.sort((a, b) => {
      const firstId = a.id;
      const secondId = b.id;

      if(firstId < secondId) return -1;
      if(firstId > secondId) return 1;

      return 0;
    });

    const rows = this.props.allPermissions.map((item, i) => {
      return (
        <React.Fragment key={i}>
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

export default EditUserPermissions;
