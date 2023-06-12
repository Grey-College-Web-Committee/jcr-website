import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';

class ElectionGuidePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: []
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

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/some/path");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, content: content });
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
      <div className="flex flex-col">
        <div className="relative">
          <img
            src="/images/tech_banner.jpg"
            className="w-full h-auto relative z-0 lg:block hidden lg:h-96 md:object-cover"
            alt="Replace banner"
          ></img>
          <img
            src="/images/tech_banner.jpg"
            className="w-full h-auto relative z-0 block lg:hidden"
            alt="Replace banner"
          />
          <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-full flex-col text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-center flex">
            <div className="flex flex-row align-middle items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold">Election Guide</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col my-4 justify-center items-left md:w-3/5 md:mx-auto mx-2">
          <p>
            Running for a role can be a bit confusing if you don't know where to find things. This page is intended to an overview of everything you need to do to run for a JCR role.
            If you have any questions about how to run for a role, email the JCR Chair at grey.chair@durham.ac.uk and they'll be happy to help!
          </p>
          <div>
            <h2 className="font-semibold text-2xl">First Steps</h2>
            <p>
              The first thing to do is to make sure you have a good understanding of what the role you want to run for entails. You can find full descriptions of every role in the Byelaws
              at [link]. For reps roles, get in touch with the Representatives Officer at [email] and they can give you more information about each role!
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-2xl">Husted vs Non-Husted Elections</h2>
          </div>
          <div>
            <h2 className="font-semibold text-2xl">Creating a Manifesto</h2>
          </div>
          <div>
            <h2 className="font-semibold text-2xl">Submitting your Nomination</h2>
          </div>
          <div>
            <h2 className="font-semibold text-2xl">Election Rules</h2>
          </div>
        </div>
      </div>
    );
  }
}

ElectionGuidePage.contextType = authContext;

export default ElectionGuidePage;
