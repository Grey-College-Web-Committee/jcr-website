import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';

import ElectionCandidates from './ElectionCandidates';
import ElectionDetails from './ElectionDetails';

class CreateElectionPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      election: null,
      candidates: []
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

    // Load any required data for the page here

    this.setState({ loaded: true });
  }

  onElectionCreated = (election) => {
    this.setState({ election });
  }

  addCandidate = (candidate) => {
    let { candidates } = this.state;
    candidates.push(candidate);
    this.setState({ candidates });
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
          <h1 className="font-semibold text-5xl pb-4">Create New Election</h1>
          <div className="flex flex-col md:w-3/5 mx-auto w-full">
            <div className="border-red-900 border-b-2">
              <h2 className="font-semibold text-2xl pb-4">Election Details</h2>
              <ElectionDetails
                confirmed={this.state.election !== null}
                onElectionCreated={this.onElectionCreated}
                electionDetails={this.state.election}
              />
            </div>
            <div className="border-red-900 border-b-2 mt-4">
              <h2 className="font-semibold text-2xl pb-4">Election Candidates</h2>
              <ElectionCandidates
                disabled={this.state.election === null}
                electionId={this.state.election === null ? null : this.state.election.id}
                addCandidate={this.addCandidate}
              />
            </div>
            <div>
              <table>
                <thead>
                  <tr><th>Name</th><th>Manifesto</th><th>Remove</th></tr>
                </thead>
              </table>
              <pre>
                { JSON.stringify(this.state.candidates, null, 2) }
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateElectionPage;
