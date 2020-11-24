import React from 'react'
import PropTypes from 'prop-types'

class EditUserPermissions extends React.Component {
  renderPermissionRows = () => {
    let grantedPermissions = [];

    console.log(this.props);

    this.props.grantedPermissions.forEach((item, i) => {
      grantedPermissions.push(item.permissionId);
    });

    this.props.allPermissions.sort((a, b) => {
      const firstId = a.id;
      const secondId = b.id;

      if(firstId < secondId) return -1;
      if(firstId > secondId) return 1;

      return 0;
    });

    console.log(grantedPermissions);

    return (
      <tbody>
      {
        this.props.allPermissions.map((item, i) => (
          <tr key={i}>
            <td>{item.name}</td>
            <td>{item.description}</td>
            <td>{grantedPermissions.includes(item.id) ? "Yes" : "No"}</td>
            <td>A</td>
            <td>B</td>
            <td>TODO</td>
          </tr>
        ))
      }
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
