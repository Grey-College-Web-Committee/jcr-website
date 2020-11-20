import React from 'react';
import PropTypes from 'prop-types';

class LoginForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      password: ""
    };
  }

  // Basic function to change the state for any text-based input
  onInputChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  }

  // When the user submits the form we validate the details
  // then use the prop passed function to login with
  onFormSubmission = e => {
    e.preventDefault();
    const { username, password } = this.state;

    if(username.length === 0) {
      this.updateMessage("You must enter a username");
      return;
    }

    if(password.length === 0) {
      this.updateMessage("You must enter a password");
      return;
    }

    this.props.attemptLogin(username, password);
  }

  render () {
    return (
      <React.Fragment>
        <form onSubmit={this.onFormSubmission}>
          <table className="table_center">
            <tbody>
              <tr>
                <td>Username</td>
                <td>
                  <input type="text" name="username" value={this.state.username} onChange={this.onInputChange} />
                </td>
              </tr>
              <tr>
                <td>Password</td>
                <td>
                  <input type="password" name="password" value={this.state.password} onChange={this.onInputChange} />
                </td>
              </tr>
              <tr>
                <td colSpan="2">
                  <input type="submit" value="Login" disabled={this.props.disabled} />
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </React.Fragment>
    );
  }
}

LoginForm.propTypes = {
  disabled: PropTypes.bool.isRequired,
  updateMessage: PropTypes.func.isRequired,
  attemptLogin: PropTypes.func.isRequired
}

export default LoginForm;
