import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig.js';

class MemberSearch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false,
      username: "",
      error: null,
      result: null
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), error: null, result: null });
  }

  searchForUser = async () => {
    this.setState({ disabled: true, error: null, result: null });
    const { username } = this.state;

    if(username === undefined || username === null || username.length !== 6) {
      this.setState({ error: "You must enter a username consisting of 6 characters", disabled: false });
      return;
    }

    if(this.props.rejectIf(username.toLowerCase())) {
      this.setState({ error: "This person is already part of your group.", disabled: false });
      return;
    }

    let result;

    try {
      result = await api.get(`/events/search/member/${this.props.ticketTypeId}/${this.state.username}`);
    } catch (error) {
      this.setState({ error: error.response.data.error, disabled: false });
      return;
    }

    const success = this.props.addMember(result.data.member);

    if(success) {
      this.setState({ username: "", result: result.data.member, disabled: false });
    }
  }

  makeDisplayName = (result) => {
    const split = result.firstNames.split(",");
    let firstName = split[0];
    firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1).toLowerCase();
    let surname = result.surname;
    surname = surname.substring(0, 1).toUpperCase() + surname.substring(1).toLowerCase();

    return `${firstName} ${surname}`;
  }

  render () {
    return (
      <div className="border p-2 my-1">
        <p className="font-semibold text-xl">{this.props.title}</p>
        {
          this.props.disabled ? (
            <p>{this.props.disabledMessage}</p>
          ) : (
            <div>
              <p>Members will only show up in this search if they have consented to the terms and conditions for events.</p>
              <p>You must enter exact usernames to add the user.</p>
            </div>
          )
        }
        <fieldset>
          <div className="pt-2 pb-2">
            <label htmlFor="username" className="flex flex-row justify-start text-lg font-semibold">Username</label>
            <input
              type="text"
              name="username"
              value={this.state.username}
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              maxLength={6}
              disabled={this.props.disabled || this.state.disabled}
            />
          </div>
          <div>
            <button
              onClick={this.searchForUser}
              disabled={this.props.disabled || this.state.disabled || this.state.username.length !== 6}
              className="px-4 py-1 rounded bg-grey-500 text-white md:w-auto w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >Add User</button>
          </div>
          {
            this.state.error === null ? null : (
              <p className="py-1 text-red-700">{this.state.error}</p>
            )
          }
          {
            this.state.result === null ? null : (
              <p className="py-1">Added {this.makeDisplayName(this.state.result)} to your group!</p>
            )
          }
        </fieldset>
      </div>
    )
  }
}

export default MemberSearch;
