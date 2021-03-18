import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';

class ConstitutionPage extends React.Component {
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
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Constitution</h1>
          <div className="text-justify grid grid-cols-2">
            <div>
              <h2 className="font-semibold text-2xl">Background</h2>
              <ul className="list-inside" style={{"list-style-type": "upper-latin"}}>
                <li>Grey College Junior Common Room (the “Union”) is a student’ union within the meaning of the Education Act 1994.  The Union is devoted to the educational interests and welfare of its Members.</li>
                <li>
                  The Union will seek at all times to:
                  <ul className="list-inside" style={{"list-style-type": "lower-roman"}}>
                    <li>ensure that the diversity of its membership is recognised and that equal access is available to all Members of whatever origin or orientation</li>
                    <li>pursue its aims and objectives independent of any political party or religious group; and</li>
                    <li>pursue equal opportunities by taking positive action within the law to facilitate participation of groups discriminated against by society.</li>
                  </ul>
                </li>
              </ul>
            </div>
            <div>

            </div>
          </div>
        </div>
      </div>
    );
  }
}

ConstitutionPage.contextType = authContext;

export default ConstitutionPage;
