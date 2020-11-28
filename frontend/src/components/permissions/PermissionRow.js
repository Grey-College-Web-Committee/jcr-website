import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import api from '../../utils/axiosConfig.js';

class PermissionRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasPermission: false,
      grantedDetails: null,
      disabled: true,
    };
  }

  componentDidMount = async () => {
    await this.updateSelf();
  }

  renderWithPermission() {
    return (
      <tr>
        <td>{this.props.permissionInformation.name}</td>
        <td>{this.props.permissionInformation.description}</td>
        <td>Yes</td>
        <td>{this.state.grantedDetails.grantedBy.username}</td>
        <td>{dateFormat(this.state.grantedDetails.createdAt, "dd/mm/yyyy HH:MM:ss")}</td>
        <td>
          <button
            onClick={this.revokePermission}
            disabled={this.state.disabled}
          >Revoke</button>
        </td>
      </tr>
    );
  }

  renderWithoutPermission() {
    return (
      <tr>
        <td>{this.props.permissionInformation.name}</td>
        <td>{this.props.permissionInformation.description}</td>
        <td>No</td>
        <td>N/A</td>
        <td>N/A</td>
        <td>
          <button
            onClick={this.grantPermission}
            disabled={this.state.disabled}
          >Grant</button>
        </td>
      </tr>
    );
  }

  grantPermission = async (e) => {
    e.preventDefault();
    this.setState({ disabled: true });

    try {
      await api.put(`/permissions/grant/${this.props.user.id}/${this.props.permissionInformation.id}`);
    } catch (error) {
      alert("An error occurred updating this value");
      return;
    }

    await this.updateSelf();
  }

  revokePermission = async (e) => {
    e.preventDefault();
    this.setState({ disabled: true });

    try {
      await api.put(`/permissions/revoke/${this.props.user.id}/${this.props.permissionInformation.id}`);
    } catch (error) {
      alert("An error occurred updating this value");
      return;
    }

    await this.updateSelf();
  }

  updateSelf = async () => {
    this.setState({ disabled: true });

    let query;

    try {
      query = await api.get(`/permissions/single/${this.props.user.id}/${this.props.permissionInformation.id}`);
    } catch (error) {
      alert("An error occurred updating this value");
      return;
    }

    this.setState({
      hasPermission: query.data.hasPermission,
      grantedDetails: query.data.grantedDetails,
      disabled: false
    });
  }

  render () {
    if(this.state.hasPermission) {
      return this.renderWithPermission();
    } else {
      return this.renderWithoutPermission();
    }
  }
}

export default PermissionRow;
