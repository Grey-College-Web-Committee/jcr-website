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
      loadedUser: null
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
      return;
    }

    if(this.state.searchTerm.length === 0) {
      return;
    }

    let found;

    try {
      found = await api.post("/permissions/search", { searchTerm: this.state.searchTerm });
    } catch (error) {
      console.log(error);
      return;
    }

    this.setState({ results: found.data.matching });
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

    return (
      <React.Fragment>
        <h1>Found Users</h1>
        <table className="stockTable">
          <thead>
            <tr>
              <th>Username</th><th>Name</th><th>Select</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.results.map((item, index) => (
                <tr key={index}>
                  <td>{item.username}</td>
                  <td>{this.displayName(item.firstNames, item.surname)}</td>
                  <td>
                    <button
                      onClick={() => this.loadUser(item.id)}
                    >Select</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </React.Fragment>
    );
  }

  renderUserEdit = () => {
    if(this.state.loadedUser === null) {
      return null;
    }

    return (
      <React.Fragment>
        <h2>Editing Permissions for {this.state.loadedUser.user.username}</h2>
        <EditUserPermissions
          user={this.state.loadedUser.user}
          allPermissions={this.state.allPermissions}
          stateUpdateId={this.state.loadedUser.user.id}
        />
      </React.Fragment>
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

    return (
      <React.Fragment>
        <form onSubmit={this.searchForUser}>
          <label>Enter Username or Name: </label>
          <input
            type="text"
            value={this.state.searchTerm}
            onChange={this.onInputChange}
            name="searchTerm"
          />
          <input
            type="submit"
            value="Search"
          />
        </form>
        <p>This is limited to 10 results. If you can't find a user please try entering their username instead.</p>
        { this.renderUserSelect() }
        { this.renderUserEdit() }
      </React.Fragment>
    )
  }
}

export default SelectUser;
