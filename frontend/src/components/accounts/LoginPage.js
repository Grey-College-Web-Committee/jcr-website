import React from 'react';
import PropTypes from 'prop-types';

import api from '../../utils/axiosConfig';
import LoginForm from './LoginForm';

class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: "",
      disabled: false
    };
  }

  // Will be passed as a prop to LoginForm to allow it to change the message
  updateMessage = message => {
    this.setState({ message });
  }

  // Query the server and attempt to login to the account
  attemptLogin = async (username, password) => {
    this.setState({ disabled: true });

    try {
      const response = await api.post('/auth/login', { username, password });
      this.setState({ message: "Logged in" });
      this.props.loginUser(response.data.user);
    } catch (error) {
      // axios will error if we do not get a 2XX code
      let message;

      switch(error.response.status) {
        case 400:
          message = "Please enter a username and password.";
          break;
        case 401:
          message = "Login failed. Please check your username and password."
          break;
        default:
          // Use the error response message for more consistent debugging
          message = error.response.data.message;
          break;
      }

      this.setState({ message, disabled: false });
    }
  }

  render () {
    return (
      <React.Fragment>
        <h1>Login Page</h1>
        <p>Please sign in using your Durham CIS details!</p>
        <p>You must be a member of Grey College to login.</p>
        <LoginForm
          disabled={this.state.disabled}
          updateMessage={this.updateMessage}
          attemptLogin={this.attemptLogin}
        />
        <p>{this.state.message}</p>
      </React.Fragment>
    );
  }
}

LoginPage.propTypes = {
  loginUser: PropTypes.func.isRequired
}

export default LoginPage;
