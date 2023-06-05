import React from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import LoginForm from './LoginForm';

class LoginPage extends React.Component {
  constructor(props) {
    super(props);

    const queryParams = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });

    let ref = "/";

    if (queryParams.ref !== undefined && queryParams.ref !== null && typeof queryParams.ref === "string") {
      if (queryParams.ref.startsWith("/")) {
        ref = queryParams.ref;
      }
    }

    let success = false;

    if (queryParams.success) {
      if (queryParams.success === "true") {
        success = true;
      }
    }

    this.state = {
      message: "",
      disabled: success,
      success,
      ref
    };
  }

  componentDidMount = async () => {
    if (this.state.success) {
      try {
        const user = (await api.get('/auth/fullverify')).data.user
        this.setState({ message: "Logged in" });
        this.props.loginUser(user, this.state.ref);
      } catch {
        this.setState({ disabled: false, success: false })
      }
    }
  }

  // Will be passed as a prop to LoginForm to allow it to change the message
  updateMessage = message => {
    this.setState({ message });
  }

  // Query the server and attempt to login to the account
  attemptLogin = async (username, password) => {
    this.setState({ disabled: true });

    let response;

    try {
      response = await api.post('/auth/login', { username, password });
    } catch (error) {
      // axios will error if we do not get a 2XX code
      let message;

      switch (error.response.status) {
        case 400:
          message = "Please enter a username and password.";
          break;
        case 401:
          if (error.response.data.requiresRegister) {
            message = "You must register for an account first.";
            break;
          }

          message = "Login failed. Please check your username and password.";
          break;
        default:
          // Use the error response message for more consistent debugging
          message = error.response.data.message;
          break;
      }

      this.setState({ message, disabled: false });
      return;
    }

    this.setState({ message: "Logged in" });
    this.props.loginUser(response.data.user, this.state.ref);
  }

  render() {
    const showErrors = this.state.message.length === 0 ? "hidden" : "block";

    return (
      <div className="flex flex-col justify-center">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Login</h1>
          {this.state.ref !== "/" && <div className="mx-auto md:w-max w-4/5 pb-4 pt-4">
            <input
              type="submit"
              value={"Student Login"}
              className="px-4 py-1 rounded bg-red-900 text-white md:w-80 w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              onClick={() => {window.location.replace('/api/auth/sso?ref='+this.state.ref)}}
            />
          </div>}
          <p className="pb-2">You must be a Grey College alumnus to login below.</p>
          {/* <Link to="/accounts/register">
            <p className="pb-2 font-semibold underline">Don't have an account? Click here to register!</p>
          </Link> */}
          <LoginForm
            disabled={this.state.disabled}
            updateMessage={this.updateMessage}
            attemptLogin={this.attemptLogin}
          />
          <div className={`mx-auto md:w-80 w-4/5 pb-4 pt-2 border-t-2 ${showErrors}`}>
            <span>{this.state.message}</span>
          </div>
          <Link to="/alumni/register">
            <p className="pb-2 font-semibold underline">To setup an alumni account, please click here.</p>
          </Link>
        </div>
      </div>
    );
  }
}

LoginPage.propTypes = {
  loginUser: PropTypes.func.isRequired
}

export default LoginPage;
