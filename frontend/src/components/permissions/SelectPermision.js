import React from 'react';
import api from '../../utils/axiosConfig.js';
import { Redirect } from 'react-router-dom';
import dateFormat from 'dateformat';

import LoadingHolder from '../common/LoadingHolder';
import PermissionRow from './PermissionRow';

class SelectPermission extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      allPermissions: [],
      searchTerm: "",
      results: [],
      loadedPermission: null,
      message: "",
      disabled: false
    };
  }

  // Loads all of the possible permissions into the state
  componentDidMount = async () => {
    let found;

    try {
      found = await api.get("/permissions/list");
    } catch (error) {
      this.setState({ loaded: true, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, allPermissions: found.data.permissions });
  }

  // Loads the data about a specific permission
  loadPermission = async (permId) => {
    this.setState({ searchTerm: "", results: [] });

    let found;

    try {
      found = await api.get(`/permissions/userswith/${permId}`);
    } catch (error) {
      return;
    }
    const res = found.data.existing;
    if (res === null || res.length === 0 || res === undefined){
      alert("No users have this permission.");
    }
    else{
      this.setState({ loadedPermission: permId, results: res });
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) });
  }

  // Tidies up their name for displaying
  displayName = (firstNames, surname, username) => {
    let firstName = firstNames.split(",")[0];
    firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
    const lastName = surname.charAt(0).toUpperCase() + surname.substr(1).toLowerCase();

    return `${firstName} ${lastName} (${username})`;
  }

  renderPermissionSelect = () => {
    // Sort them by their IDs so it is consistent each time
    this.state.allPermissions.sort((a, b) => {
      const firstId = a.id;
      const secondId = b.id;

      if(firstId < secondId) return -1;
      if(firstId > secondId) return 1;

      return 0;
    });

    const rows = this.state.allPermissions.map((item, i) => {
      const colour = i % 2 === 0 ? "bg-red-100" : "bg-white";
      return (
        <tr className={colour}>
          <td className="w-40 p-2 font-semibold border-r border-gray-400">{item.name}</td>
          <td className="hidden lg:table-cell w-64 p-2 border-l border-r border-gray-400">{item.description}</td>
          <td className="w-40 p-2 border-l border-gray-400">
            <button
              onClick={()=>this.loadPermission(item.id)}
              className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >View</button>
          </td>
      </tr>
      );
    });

    return (
      <tbody>
        {rows}
      </tbody>
    )
  }

  renderPermissionRows = () => {
    if (this.state.results.length === 0){
      return null;
    }

    const rows = this.state.results.map((item, i) => {
      const colour = i % 2 === 0 ? "bg-red-100" : "bg-white";
      return (
        <tr className={colour}>
        <td className="w-40 p-2 font-semibold border-r border-gray-400">{item.Permission.name}</td>
           <td className="w-48 p-2 border-l border-r border-gray-400 text-center">{this.displayName(item.grantedTo.firstNames, item.grantedTo.surname, item.grantedTo.username)}</td>
           <td className="w-48 p-2 border-l border-r border-gray-400 text-center">{this.displayName(item.grantedBy.firstNames, item.grantedBy.surname, item.grantedBy.username)}</td>
           <td className="hidden lg:table-cell w-48 p-2 border-l border-r border-gray-400 text-center">{dateFormat(item.createdAt, "dd/mm/yyyy HH:MM:ss")}</td>
          <td className="w-40 p-2 border-l border-gray-400">
            <button
              onClick={this.revokePermission}
              value = {item.grantedTo.id}
              disabled = {this.state.disabled}
              className="px-4 py-1 rounded bg-red-700 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >Revoke</button>
          </td>
        </tr>
      );
    });

    return (
      <tbody>
        {rows}
      </tbody>
    )
  }

  // Revoke the permission from the set user
  revokePermission = async (e) => {
    e.preventDefault();
    this.setState({ disabled: true });

    try {
      await api.put(`/permissions/revoke/${e.target.value}/${this.state.loadedPermission}`);
    } catch (error) {
      alert("An error occurred updating this value");
      return;
    }

    this.loadPermission(this.state.loadedPermission);
  }

  getResultsTable = () => {
    if (this.state.results.length === 0){
      return null;
    }
    return(
      <div className="border-b-2 border-t-2 p-4">
          <h2 className="font-semibold text-3xl pb-4">Users With Selected Permission</h2>
          <table className="mx-auto border-2 text-left border-red-900">
            <thead className="bg-red-900 text-white">
              <tr>
                <th className="p-2 font-semibold">Permission</th>
                <th className="p-2 font-semibold">Granted To</th>
                <th className="p-2 font-semibold">Granted By</th>
                <th className="p-2 font-semibold hidden lg:table-cell">Granted At</th>
                <th className="p-2 font-semibold">Revoke</th>
              </tr>
            </thead>
            { this.renderPermissionRows() }
          </table>
      </div>
    );
  }

  render () {
    if(!this.state.loaded) {
      return (
        <LoadingHolder />
      )
    }

    if(this.state.loaded && this.state.status !== 200) {
      return (
       <Redirect to={`/errors/${this.state.status}`} />
      );
    }

    const showErrors = this.state.message.length === 0 ? "hidden" : "block";

    return (
      <React.Fragment>
        <div className="border-b-2 border-t-2 p-4">
          <h2 className="font-semibold text-3xl pb-4">Select Permission</h2>
          <table className="mx-auto border-2 text-left border-red-900">
            <thead className="bg-red-900 text-white">
              <tr>
                <th className="p-2 font-semibold">Permission</th>
                <th className="p-2 font-semibold hidden lg:table-cell">Description</th>
                <th className="p-2 font-semibold">Select</th>
              </tr>
            </thead>
            { this.renderPermissionSelect() }
          </table>
        </div>
        { this.getResultsTable() }
      </React.Fragment>
    )
  }
}

export default SelectPermission;
