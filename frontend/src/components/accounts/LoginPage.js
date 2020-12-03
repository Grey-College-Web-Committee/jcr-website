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
    const showErrors = this.state.message.length === 0 ? "hidden" : "block";

    return (
      <div className="flex flex-col justify-center">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Login</h1>
          <p className="pb-4">You must be a member of Grey College to login</p>
          <LoginForm
            disabled={this.state.disabled}
            updateMessage={this.updateMessage}
            attemptLogin={this.attemptLogin}
          />
          <div className={`mx-auto w-64 pb-4 pt-2 border-t-2 ${showErrors}`}>
            <span>{this.state.message}</span>
          </div>
        </div>
      </div>
    );
  }
}

LoginPage.propTypes = {
  loginUser: PropTypes.func.isRequired
}

export default LoginPage;
