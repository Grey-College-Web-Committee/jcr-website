import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

class EditUserPermissions extends React.Component {
  constructor(props) {
    super(props);

    const { grantedPermissions, allPermissions } = this.props;

    this.state = { grantedPermissions, allPermissions };
  }

  revokePermission = (permissionId) => {

  }

  grantPermission = (permissionId) => {

  }

  renderPermissionRows = () => {
    let grantedPermissions = [];

    console.log(this.props);

    this.state.grantedPermissions.forEach((item, i) => {
      grantedPermissions.push(item.permissionId);
    });

    this.state.allPermissions.sort((a, b) => {
      const firstId = a.id;
      const secondId = b.id;

      if(firstId < secondId) return -1;
      if(firstId > secondId) return 1;

      return 0;
    });

    const rows = this.state.allPermissions.map((item, i) => {
      let perm = grantedPermissions.includes(item.id) ? this.state.grantedPermissions.filter(p => p.Permission.id === item.id)[0] : null;

      console.log(perm);

      return (
        <tr key={i}>
          <td>{item.name}</td>
          <td>{item.description}</td>
          <td>{perm ? "Yes" : "No"}</td>
          <td>{perm ? perm.grantedBy.username : "N/A"}</td>
          <td>{perm ? dateFormat(perm.createdAt, "dd/mm/yyyy HH:MM:ss") : "N/A"}</td>
          <td>
            {perm ?
              <button onClick={() => this.revokePermission(item.id)}>Revoke</button> :
              <button onClick={() => this.grantPermission(item.id)}>Grant</button>
            }
          </td>
        </tr>
      )
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
