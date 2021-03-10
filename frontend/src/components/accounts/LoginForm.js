import React from 'react';
import PropTypes from 'prop-types';
import Cart from '../cart/Cart';

class LoginForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      password: "",
      usernameError: false,
      passwordError: false
    };
  }

  // Basic function to change the state for any text-based input
  onInputChange = e => {
    this.setState({ [e.target.name]: e.target.value, usernameError: false, passwordError: false });
  }

  componentDidMount = () => {
    const cart = new Cart();
    cart.clearCart();
    cart.setLocked(false);
  }

  // When the user submits the form we validate the details
  // then use the prop passed function to login with
  onFormSubmission = e => {
    e.preventDefault();
    const { username, password } = this.state;

    if(username.length === 0) {
      this.setState({ usernameError: true });
      this.props.updateMessage("Please enter your username.");
      return;
    }

    if(password.length === 0) {
      this.setState({ passwordError: true });
      this.props.updateMessage("Please enter your password.");
      return;
    }

    this.props.attemptLogin(username, password);
  }

  render () {
    const usernameBorder = this.state.usernameError ? "border-red-700" : "border-gray-400";
    const passwordBorder = this.state.passwordError ? "border-red-700" : "border-gray-400";

    return (
      <form onSubmit={this.onFormSubmission}>
        <fieldset>
          <div className="mx-auto md:w-max w-4/5 pb-4 border-b-2">
            <label htmlFor="username" className="flex flex-row justify-start pb-2 text-lg font-semibold">Durham Username</label>
            <input
              type="text"
              name="username"
              value={this.state.username}
              onChange={this.onInputChange}
              className={`shadow w-full md:w-80 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400 ${usernameBorder}`}
              placeholder="Please enter your username..."
              disabled={this.props.disabled}
              autoComplete="username"
            />
          </div>
          <div className="mx-auto md:w-max w-4/5 pb-4 pt-2 border-b-2">
            <label htmlFor="password" className="flex flex-row justify-start pb-2 text-lg font-semibold">Durham Password</label>
            <input
              type="password"
              name="password"
              value={this.state.password}
              onChange={this.onInputChange}
              className={`shadow w-full md:w-80 rounded border py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 ${passwordBorder}`}
              placeholder="Please enter your password..."
              disabled={this.props.disabled}
              autoComplete="current-password"
            />
          </div>
          <div className="mx-auto md:w-max w-4/5 pb-4 pt-4">
            <input
              type="submit"
              value="Login"
              className="px-4 py-1 rounded bg-red-900 text-white md:w-64 w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              disabled={this.props.disabled}
            />
          </div>
        </fieldset>
      </form>
    );
  }
}

LoginForm.propTypes = {
  disabled: PropTypes.bool.isRequired,
  updateMessage: PropTypes.func.isRequired,
  attemptLogin: PropTypes.func.isRequired
}

export default LoginForm;
