import React from 'react';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';

class VerifyAlumniPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      token: this.props.match.params.token,
      error: ""
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  componentDidMount = async () => {
    try {
      await api.post("/alumni/verify", { token: this.state.token });
    } catch (error) {
      this.setState({ error: error.response.data.error });
      return;
    }

    this.setState({ loaded: true });
  }

  render () {
    if(!this.state.loaded) {
      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Email Verified</h1>
          <p className="py-1">Thank you, your email has been verified. Your account will be approved shortly once it has been reviewed. You will receive an email upon approval.</p>
        </div>
      </div>
    );
  }
}

VerifyAlumniPage.contextType = authContext;

export default VerifyAlumniPage;
