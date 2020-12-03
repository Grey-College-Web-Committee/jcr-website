import React from 'react';
import api from '../../utils/axiosConfig.js';
import { Redirect } from 'react-router-dom';

import EditUserPermissions from './EditUserPermissions';

class SelectUser extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      allPermissions: [],
      searchTerm: "",
      results: [],
      loadedUser: null,
      message: ""
    };
  }

  // Loads all of the possible permissions into the state
  componentDidMount = async () => {
    let found;

    try {
      found = await api.get("/permissions/list");
    } catch (error) {
      console.log(error);
      this.setState({ loaded: true, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, allPermissions: found.data.permissions });
  }

  // Find a user based on their username, first name or last name
  searchForUser = async (event) => {
    event.preventDefault();

    if(this.state.searchTerm === null) {
      this.setState({ message: "You must enter a search term." });
      return;
    }

    if(this.state.searchTerm.length === 0) {
      this.setState({ message: "You must enter a search term." });
      return;
    }

    let found;

    try {
      found = await api.post("/permissions/search", { searchTerm: this.state.searchTerm });
    } catch (error) {
      console.log(error);
      return;
    }

    if(found.data.matching.length === 0) {
      this.setState({ message: "No results found." });
      return;
    }

    this.setState({ results: found.data.matching, message: "" });
  }

  // Loads the data about a specific user
  loadUser = async (id) => {
    this.setState({ searchTerm: "", results: [] });

    let found;

    try {
      found = await api.get(`/permissions/search/${id}`);
    } catch (error) {
      console.log(error);
      return;
    }

    this.setState({ loadedUser: found.data });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) });
  }

  // Tidies up their name for displaying
  displayName = (firstNames, surname) => {
    let firstName = firstNames.split(",")[0];
    firstName = firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase();
    const lastName = surname.charAt(0).toUpperCase() + surname.substr(1).toLowerCase();

    return `${firstName} ${lastName}`;
  }

  renderUserSelect = () => {
    if(this.state.results.length === 0) {
      return null;
    }

    const oddRowClass = "bg-white";
    const evenRowClass = "bg-red-100";

    return (
      <div className="border-b-2 py-4">
        <h2 className="font-semibold text-3xl pb-4">Select User</h2>
        <table
          className="mx-auto border-2 text-left border-red-900"
        >
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Username</th>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Select</th>
            </tr>
          </thead>
          <tbody className="">
            {
              this.state.results.map((item, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? evenRowClass : oddRowClass}`}
                >
                  <td className="w-40 p-2 font-semibold border-r border-gray-400">{item.username}</td>
                  <td className="w-48 p-2 border-l border-r border-gray-400">{this.displayName(item.firstNames, item.surname)}</td>
                  <td className="w-40 p-2 border-l border-gray-400">
                    <button
                      onClick={() => this.loadUser(item.id)}
                      className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >Select</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }

  renderUserEdit = () => {
    if(this.state.loadedUser === null) {
      return null;
    }

    return (
      <div className="border-b-2 py-4">
        <h2 className="font-semibold text-3xl pb-4">Editing Permissions for {this.state.loadedUser.user.username}</h2>
        <EditUserPermissions
          user={this.state.loadedUser.user}
          allPermissions={this.state.allPermissions}
          stateUpdateId={this.state.loadedUser.user.id}
        />
    </div>
    )
  }

  render () {
    if(!this.state.loaded) {
      return (
        <h2>Loading...</h2>
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
          <h2 className="font-semibold text-3xl pb-4">Find User</h2>
          <form onSubmit={this.searchForUser}>
            <fieldset>
              <div className="mx-auto w-max pb-4 border-b-2">
                <label
                  htmlFor="searchTerm"
                  className="flex flex-row justify-start pb-2 text-lg font-semibold"
                >Enter Username</label>
                <input
                  type="text"
                  value={this.state.searchTerm}
                  onChange={this.onInputChange}
                  name="searchTerm"
                  className="shadow w-64 border rounded p-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div className="mx-auto w-64 pt-4">
                <input
                  type="submit"
                  value="Search"
                  className="px-4 py-1 rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </fieldset>
            <div className={`mx-auto w-64 pt-4 pt-2 border-t-2 ${showErrors}`}>
              <span>{this.state.message}</span>
            </div>
          </form>
        </div>
        { this.renderUserSelect() }
        { this.renderUserEdit() }
      </React.Fragment>
    )
  }
}

export default SelectUser;
