import React from 'react';
import PropTypes from 'prop-types';

class AddGuest extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      firstName: "",
      surname: "",
      atDurham: true,
      disabled: false,
      error: null,
      result: null
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), error: null, result: null });
  }

  canSubmit = () => {
    const { username, firstName, surname, atDurham } = this.state;

    if(atDurham) {
      if(username === undefined || username === null || username.length !== 6) {
        return false;
      }
    }

    if(firstName === undefined || firstName === null || firstName.length === 0) {
      return false;
    }

    if(surname === undefined || surname === null || surname.length === 0) {
      return false;
    }

    return true;
  }

  submitGuest = () => {
    this.setState({ disabled: true, error: null, result: null });

    if(!this.canSubmit()) {
      this.setState({ disabled: false, error: "Please check the guest details and make sure the username is 6 characters long" });
      return;
    }

    const { username, firstName, surname, atDurham } = this.state;

    if(atDurham) {
      if(this.props.rejectIf(username)) {
        this.setState({ disabled: false, error: "This person is already in your group" });
        return;
      }
    }

    const entry = {
      id: null,
      username: atDurham ? username.toLowerCase() : "N/A",
      firstNames: firstName,
      surname
    };

    const success = this.props.addGuest(entry);

    if(success) {
      this.setState({ disabled: false, result: `Added ${entry.firstNames} ${entry.surname} to your group as a guest`, username: "", firstName: "", surname: "", atDurham: true });
    }
  }

  render () {
    return (
      <div className="border p-2 my-1">
        <p className="font-semibold text-xl">Add Guests</p>
        {
          this.props.disabled ? (
            <p>{this.props.disabledMessage}</p>
          ) : null
        }
        <fieldset>
          <div className="pt-2 pb-2 flex flex-row align-middle">
            <label htmlFor="atDurham" className="flex flex-row justify-start text-lg font-semibold">Current Student at Durham?</label>
            <input
              type="checkbox"
              name="atDurham"
              checked={this.state.atDurham}
              className="border rounded ml-4 py-1 px-2 h-6 w-6 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              maxLength={6}
              disabled={this.props.disabled || this.state.disabled}
            />
          </div>
          { this.state.atDurham ? (<div className="pt-2 pb-2">
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
          </div>) : null }
          <div className="pt-2 pb-2">
            <label htmlFor="firstName" className="flex flex-row justify-start text-lg font-semibold">First Name</label>
            <input
              type="text"
              name="firstName"
              value={this.state.firstName}
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              maxLength={30}
              disabled={this.props.disabled || this.state.disabled}
            />
          </div>
          <div className="pt-2 pb-2">
            <label htmlFor="surname" className="flex flex-row justify-start text-lg font-semibold">Surname</label>
            <input
              type="text"
              name="surname"
              value={this.state.surname}
              className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              maxLength={30}
              disabled={this.props.disabled || this.state.disabled}
            />
          </div>
          <div>
            <button
              disabled={this.props.disabled || this.state.disabled || !this.canSubmit()}
              className="px-4 py-1 rounded bg-grey-900 text-white md:w-auto w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              onClick={this.submitGuest}
            >Add Guest</button>
          </div>
          {
            this.state.error === null ? null : (
              <p className="py-1 text-red-700">{this.state.error}</p>
            )
          }
          {
            this.state.result === null ? null : (
              <p className="py-1">{this.state.result}</p>
            )
          }
        </fieldset>
      </div>
    )
  }
}

AddGuest.propTypes = {
  disabled: PropTypes.bool.isRequired,
  addGuest: PropTypes.func.isRequired,
  rejectIf: PropTypes.func.isRequired,
  disabledMessage: PropTypes.string.isRequired,
}

export default AddGuest;
