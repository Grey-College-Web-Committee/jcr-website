import React from 'react';
import { Redirect, Link } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import config from '../../../config.json';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';

class ElectionOverviewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      liveElections: [],
      upcomingElections: [],
      previousElections: []
    };
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
      content = await api.get("/elections/list");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { data } = content;

    this.setState({ loaded: true, status: 200, ...data });
  }

  getLiveElectionsDiv = () => {
    const { liveElections } = this.state;

    if(liveElections.length === 0) {
      return (
        <div className="border-b-2 border-red-900 p-4">
          <h2 className="font-semibold text-2xl pb-4">Live Elections</h2>
          <p>No live elections</p>
        </div>
      )
    }

    return (
      <div className="border-b-2 border-red-900">
        <h2 className="font-semibold text-2xl py-4">Live Elections</h2>
        <div>
          { liveElections.sort((a, b) => {
            const aDate = new Date(a.votingCloseTime);
            const bDate = new Date(b.votingCloseTime);
            return aDate < bDate ? -1 : (aDate > bDate ? 1 : 0);
          }).map((election, i) => (
            <div className="w-full mb-4 border border-red-900 text-left" key={i}>
              <div className="bg-red-900 text-white">
                <p className="p-2 text-2xl">{election.name}</p>
              </div>
              <div className="flex flex-col flex-wrap border border-red-900 p-2">
                <Link to={`/elections/vote/${election.id}`}><button>VOTE NOW!</button></Link>
                <p>Voting closes at {dateFormat(election.votingCloseTime, "dd/mm/yyyy HH:MM:ss")}</p>
                <table>
                  <thead>
                    <tr>
                      <td>Name</td>
                      <td>View manifesto</td>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      election.ElectionCandidates.sort((a, b) => {
                        return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)
                      }).map((candidate, j) => (
                        <tr key={j}>
                          <td>{candidate.name}</td>
                          <td>
                            <a href={`/elections/manifesto/${candidate.manifestoLink}`} target="_blank">
                              <button
                              >View Manifesto</button>
                            </a>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  getUpcomingElectionsDiv = () => {
    const { upcomingElections } = this.state;

    if(upcomingElections.length === 0) {
      return (
        <div className="border-b-2 border-red-900 p-4">
          <h2 className="font-semibold text-2xl pb-4">Upcoming Elections</h2>
          <p>No upcoming elections</p>
        </div>
      )
    }

    return (
      <div className="border-b-2 border-red-900">
        <h2 className="font-semibold text-2xl py-4">Upcoming Elections</h2>
        <div>
          { upcomingElections.sort((a, b) => {
            const aDate = new Date(a.votingOpenTime);
            const bDate = new Date(b.votingOpenTime);
            return aDate < bDate ? -1 : (aDate > bDate ? 1 : 0);
          }).map((election, i) => (
            <div className="w-full mb-4 border border-red-900 text-left" key={i}>
              <div className="bg-red-900 text-white">
                <p className="p-2 text-2xl">{election.name}</p>
              </div>
              <div className="flex flex-col flex-wrap border border-red-900 p-2">
                <p>Voting opens at {dateFormat(election.votingOpenTime, "dd/mm/yyyy HH:MM:ss")}</p>
                <table>
                  <thead>
                    <tr>
                      <td>Name</td>
                      <td>View manifesto</td>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      election.ElectionCandidates.sort((a, b) => {
                        return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)
                      }).map((candidate, j) => (
                        <tr key={j}>
                          <td>{candidate.name}</td>
                          <td>
                            <a href={`/elections/manifesto/${candidate.manifestoLink}`} target="_blank">
                              <button
                              >View Manifesto</button>
                            </a>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
        <div className="container mx-auto text-center p-4 md:w-3/4">
          <h1 className="font-semibold text-5xl pb-4">JCR Elections</h1>
          { this.getLiveElectionsDiv() }
          { this.getUpcomingElectionsDiv() }
          <div className="border-b-2 border-red-900 p-4">
            <h2 className="font-semibold text-2xl pb-4">Previous Elections</h2>
            <p>Not implemented</p>
          </div>
        </div>
      </div>
    );
  }
}

ElectionOverviewPage.contextType = authContext;

export default ElectionOverviewPage;
