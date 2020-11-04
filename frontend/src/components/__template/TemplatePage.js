import React from 'react';
import PropTypes from 'prop-types';

import api from '../../utils/axiosConfig.js';

// Change TemplatePage everywhere to whatever you want to call this component
class TemplatePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      content: {}
    };
  }

  // Use this to load data from the backend
  // this.setState automatically triggers a re-render
  componentDidMount = async () => {
    let content;

    try {
      // The syntax is api.<HTTP Method>("/pathgoeshere")
      // All backend stuff is contained within /api, this is automatically filled
      // in by the axiosConfig.js so api.get("/pathgoeshere") will become "/api/pathgoeshere"
      content = await api.get("/pathgoeshere");
    } catch (error) {
      this.setState({ loaded: true, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, content: content });
  }

  // Renders the component
  render () {
    // Render this while we wait for the data from the backend
    if(!this.state.loaded) {
      return (
        <React.Fragment>
          <p>Loading...</p>
        </React.Fragment>
      );
    }

    // Render this when the data has been loaded
    // Will show the status and beautified JSON response
    return (
      <React.Fragment>
        <h1>Template Page</h1>
        <p>Status {this.state.status}</p>
        <pre>
          {JSON.stringify(this.state.content, null, 2)}
        </pre>
      </React.Fragment>
    );
  }
}

// See https://reactjs.org/docs/typechecking-with-proptypes.html for more information
TemplatePage.propTypes = {

};

// Allows you to access this component from another file
export default TemplatePage;
