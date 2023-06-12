import React from 'react';
import PropTypes from 'prop-types';
import api from '../../utils/axiosConfig.js';
import { Redirect } from 'react-router';

class LogoutPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: false
    }
  }

  // Once the component has loaded we log the user out
  componentDidMount = async () => {
    // Call to the server to destroy their session
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.log(error);
      return;
    }

    // Amends their authContext to reflect their login state
    this.props.logoutUser();
    this.setState({ redirect: true });
  }

  render () {
    // Redirect once they have been logged out
    if(this.state.redirect) {
      return (
        <Redirect to="/" />
      )
    }

    return (
      <React.Fragment />
    )
  }
}

LogoutPage.propTypes = {
  logoutUser: PropTypes.func.isRequired
}

export default LogoutPage;
