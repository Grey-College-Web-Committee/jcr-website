import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';

import ElectionRow from './ElectionRow';

class ElectionAdminPortal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: ""
    };

    // Change this to your permission
    this.requiredPermission = "elections.manage";
  }

  // Load the data once the element is ready
  componentDidMount = async () => {
    let adminCheck;

    try {
      adminCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify admin status" });
      return;
    }

    // Ensure they are an admin
    if(adminCheck.data.user.permissions) {
      if(adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if(!adminCheck.data.user.permissions.includes(this.requiredPermission)) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    let content;

    try {
      content = await api.get("/elections/list/admin");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let elections = content.data.elections;

    elections.sort((a, b) => {
      return a.votingCloseTime > b.votingCloseTime ? -1 : (a.votingCloseTime < b.votingCloseTime ? 1 : 0);
    })

    this.setState({ loaded: true, status: 200, elections });
  }

  getElectionsDiv = () => {
    return (
      <div>
        <h2 className="text-left text-3xl font-semibold">All Elections</h2>
        <table className="mx-auto border-2 text-left border-red-900 w-full">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Candidates</th>
              <th className="p-2 font-semibold">Status</th>
              <th className="p-2 font-semibold">Manifestos Release</th>
              <th className="p-2 font-semibold">Voting Opens</th>
              <th className="p-2 font-semibold">Voting Closes</th>
              <th className="p-2 font-semibold">Winner</th>
              <th className="p-2 font-semibold">View In-Depth Results</th>
              <th className="p-2 font-semibold">Delete</th>
            </tr>
          </thead>
          <tbody>
            {this.state.elections.map((election, i) => (
              <ElectionRow
                key={i}
                election={election}
              />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      return (
        <LoadingHolder />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Manage Elections</h1>
          <div className="flex flex-col items-start mb-2">
            <h2 className="text-left text-3xl font-semibold">Create Election</h2>
            <Link to="/elections/create">
              <button
                className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 my-2"
              >Create New Election</button>
            </Link>
          </div>
          { this.getElectionsDiv() }
        </div>
      </div>
    );
  }
}

export default ElectionAdminPortal;
