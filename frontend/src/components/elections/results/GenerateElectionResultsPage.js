import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';

class GenerateElectionResultsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      id: this.props.match.params.id,
      visibleRoundLogs: []
    };

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

    let content;

    try {
      content = await api.get(`/elections/result/${this.state.id}`);
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, result: content.data });
  }

  addToVisibleLog = (e, data) => {
    e.preventDefault()
    const { visibleRoundLogs } = this.state;
    visibleRoundLogs.push(data.round);
    this.setState({ visibleRoundLogs });
  }

  loadRoundLog = (data) => {
    if(!this.state.visibleRoundLogs.includes(data.round)) {
      return (
        <button
          onClick={(e) => { this.addToVisibleLog(e, data) }}
          className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        >Load Round</button>
      );
    }

    return (
      <div className="my-2">
        {data.roundLog.map((row, i) => (
          <p key={i}>{row}</p>
        ))}
      </div>
    );
  }

  readRoundResult = (data) => {
    if(data.winner !== null) {
      if(data.winner === "draw") {
        return (
          <p className="font-semibold">Nobody achieves quota, the result is a draw.</p>
        );
      } else {
        return (
          <p className="font-semibold">{data.winner} achieves quota and is duly elected.</p>
        )
      }
    }

    switch(data.tiebreakerDepth) {
      case 0:
      case "0":
        return (<p className="font-semibold">No one achieves quota and {data.eliminated} is eliminated.</p>);
      case 1:
      case "1":
        return (<p className="font-semibold">No one achieves quota and {data.eliminated} is eliminated by 2nd preference tiebreaker.</p>);
      default:
        return (<p className="font-semibold">No one achieves quota and {data.eliminated} is eliminated by random draw (double tiebreaker).</p>);
    }
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

    const { election, fresh, overallDraw, overallWinner } = this.state.result;
    let { roundSummaries, deepLog } = this.state.result;

    roundSummaries.sort((a, b) => {
      return a.round > b.round ? 1 : (a.round < b.round ? -1 : 0);
    });

    deepLog.sort((a, b) => {
      return a.round > b.round ? 1 : (a.round < b.round ? -1 : 0);
    });

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Results: {election.name}</h1>
          <div className="my-2">
            <h2 className="font-semibold text-3xl">Summary</h2>
            <div>
              {
                roundSummaries.map((summary, i) => (
                  <div key={i} className="mb-2">
                    <p className="text-lg">Round {summary.round + 1}</p>
                    <p>There are {summary.roundSummaryData.totalVotes} valid votes giving a quota of {summary.roundSummaryData.quota}.</p>
                    <ol className="my-2">
                      {Object.keys(summary.roundSummaryData.votes).map((candidate, j) => (
                        <li key={j}>
                          {candidate}: {summary.roundSummaryData.votes[candidate]}
                        </li>
                      ))}
                    </ol>
                    { this.readRoundResult(summary.roundSummaryData) }
                  </div>
                ))
              }
            </div>
          </div>
          <div className="my-2">
            <h2 className="font-semibold text-3xl">Detailed Log</h2>
            <div>
              {deepLog.map((round, i) => (
                <div className="mb-2">
                  <h3 className="font-semibold text-xl">Round {round.round + 1}</h3>
                  { this.loadRoundLog(round) }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GenerateElectionResultsPage;
