import React from 'react';
import { Redirect, Link } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
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
              <div className="flex flex-col flex-wrap border border-red-900 p-2 items-center">
                {
                  this.context.hlm ? (
                    <p className="text-lg my-2">Honourary Life Members cannot vote in elections</p>
                  ) :
                  (
                    election.ElectionVotes.length === 0 ?
                    (
                      <Link to={`/elections/vote/${election.id}`}>
                        <button
                        className="text-3xl px-4 py-2 rounded bg-blue-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 my-2"
                        >Click Here to Vote!</button>
                      </Link>
                    ) :
                    (
                      <p className="font-semibold text-xl">You have already voted in this election</p>
                    )
                  )
                }
                <p className="text-lg my-2">Voting closes at {dateFormat(election.votingCloseTime, "dd/mm/yyyy HH:MM:ss")}</p>
                <table className="mx-auto border-2 text-left text-xl border-red-900 w-auto my-2">
                  <tbody>
                    {
                      election.ElectionCandidates.sort((a, b) => {
                        return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)
                      }).map((candidate, j) => (
                        <tr key={j} className="text-center border-b border-gray-400 w-auto">
                          <td className="p-2 border-r border-gray-400 w-auto">{candidate.name}</td>
                          <td className="p-2 border-r border-gray-400 w-auto">
                            <a href={`/elections/manifesto/${candidate.manifestoLink}`} target="_blank" rel="noopener noreferrer">
                              <button
                                className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
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
              <div className="flex flex-col flex-wrap border border-red-900 p-2 items-center">
                <p className="text-xl my-2">Voting opens at {dateFormat(election.votingOpenTime, "dd/mm/yyyy HH:MM:ss")}</p>
                <table className="mx-auto border-2 text-left text-xl border-red-900 w-auto my-2">
                  <tbody>
                    {
                      election.ElectionCandidates.sort((a, b) => {
                        return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)
                      }).map((candidate, j) => (
                        <tr key={j} className="text-center border-b border-gray-400 w-auto">
                          <td className="p-2 border-r border-gray-400 w-auto">{candidate.name}</td>
                          <td className="p-2 border-r border-gray-400 w-auto">
                            <a href={`/elections/manifesto/${candidate.manifestoLink}`} target="_blank" rel="noopener noreferrer">
                              <button
                                className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
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

  getPreviousElectionDiv = () => {
    const { previousElections } = this.state;

    if(previousElections.length === 0) {
      return (
        <div className="border-b-2 border-red-900 p-4">
          <h2 className="font-semibold text-2xl pb-4">Previous Elections</h2>
          <p>No previous elections</p>
        </div>
      )
    }

    return (
      <div className="border-b-2 border-red-900">
        <h2 className="font-semibold text-2xl py-4">Previous Elections</h2>
        <div>
          { previousElections.sort((a, b) => {
            const aDate = new Date(a.votingCloseTime);
            const bDate = new Date(b.votingCloseTime);
            return -(aDate < bDate ? -1 : (aDate > bDate ? 1 : 0));
          }).map((election, i) => (
            <div className="w-full mb-4 border border-red-900 text-left" key={i}>
              <div className="bg-red-900 text-white">
                <p className="p-2 text-2xl">{election.name}</p>
              </div>
              <div className="flex flex-col flex-wrap border border-red-900 p-2 items-center">
                <p className="text-lg my-2">Voting closed at {dateFormat(election.votingCloseTime, "dd/mm/yyyy HH:MM:ss")}</p>
                <p className="font-semibold text-lg my-2">Result: {election.winner === null ? "Awaiting Publication" : (election.winner === "draw" ? "Under review" : `${election.winner} achieves quota and is duly elected.` )}</p>
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
          { this.getPreviousElectionDiv() }
        </div>
      </div>
    );
  }
}

ElectionOverviewPage.contextType = authContext;

export default ElectionOverviewPage;
