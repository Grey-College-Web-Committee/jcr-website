import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import FileDirectory from './FileDirectory';

class JCRFileListingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      structure: {}
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    let membershipCheck;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status", isMember: false });
      return;
    }

    // Ensure they are an admin
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not a JCR member", isMember: false });
      return;
    }

    let result;

    try {
      result = await api.get("/jcr/structure");
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return;
    }

    const { structure } = result.data;

    this.setState({ loaded: true, status: 200, structure });
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if(!this.state.isMember) {
        return (
          <Redirect to="/membership" />
        )
      }

      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4 w-full md:w-3/5">
          <h1 className="font-semibold text-5xl pb-4">JCR Documents</h1>
          <p className="py-1 text-left">You can find all documents relating to the goverence and running of the JCR. The core documents governing the JCR are the Constitution and Byelaws but you'll also find plenty of other important documents here such as budgets, meeting minutes, and procedures.</p>
          <div className="flex flex-row justify-start text-left text-lg mt-2">
            <FileDirectory
              {...this.state.structure}
              parentOpen={true}
              topLevel={true}
            />
          </div>
        </div>
      </div>
    );
  }
}

JCRFileListingPage.contextType = authContext;

export default JCRFileListingPage;
