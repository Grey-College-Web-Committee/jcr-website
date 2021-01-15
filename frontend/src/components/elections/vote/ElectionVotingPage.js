import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import config from '../../../config.json';
import LoadingHolder from '../../common/LoadingHolder';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';

const SortableItem = sortableElement(({candidate, position}) => (
  <li
    className="border p-4 mr-4 text-xl w-full cursor-move my-2"
  >
    <span>{position + 1}. {candidate.name}</span>
  </li>
));

const SortableContainer = sortableContainer(({children}) => (
  <ul
    className="w-auto border-red-900 border inline-block list-none px-2 my-4"
  >{children}</ul>
));

// Source: https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
function array_move(arr, old_index, new_index) {
  while (old_index < 0) {
    old_index += arr.length;
  }
  while (new_index < 0) {
    new_index += arr.length;
  }
  if (new_index >= arr.length) {
    let k = new_index - arr.length + 1;
    while (k--) {
        arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr; // for testing purposes
};

class ElectionVotingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      election: null,
      preferences: [],
      disabled: false,
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
      content = await api.get(`/elections/election/${this.props.match.params.id}`);
    } catch (error) {
      // Intercept if they have already voted
      if(error.response.data.hasOwnProperty("election")) {
        this.setState({ loaded: true, status: error.response.status, election: error.response.data.election });
        return;
      }

      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { election } = content.data;
    let preferences = election.ElectionCandidates;

    preferences.sort((a, b) => {
      return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
    });

    this.setState({ loaded: true, status: 200, election, preferences });
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    let { preferences } = this.state;
    array_move(preferences, oldIndex, newIndex);
    this.setState({ preferences });
  }

  submitVote = async () => {
    this.setState({ disabled: true });
    const candidates = this.state.preferences;
    let preferences = candidates.map((candidate, position) => { return { id: candidate.id, preference: position } });

    try {
      await api.post("/elections/vote", { preferences, electionId: this.state.election.id });
    } catch (error) {
      if(error.response.status === 400) {
        alert(error.response.data.error);
      }

      return;
    }

    alert("Vote cast!");
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

    const { name } = this.state.election;
    const { preferences } = this.state;

    if(this.state.status === 403) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Vote: {name}</h1>
            <p>You have already voted in this election!</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col justify-start text-lg">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Vote: {name}</h1>
          <p>The JCR uses Single Transferable Vote for elections.</p>
          <p>Drag the candidates in to the order that you wish to vote for them.</p>
          <p>Your first preference for the role should be at the top and your last preference at the bottom.</p>
          <div>
            <SortableContainer onSortEnd={this.onSortEnd} helperClass="list-none" shouldCancelStart={() => this.state.disabled}>
              {preferences.map((candidate, i) => (
                <SortableItem key={i} index={i} candidate={candidate} position={i} helperClass="text-semibold" />
              ))}
            </SortableContainer>
          </div>
          <div>
            <p className="mb-2">Once you have ordered the candidates, press the button below to cast your vote.</p>
            <p className="mb-2">You will not be able to alter or revoke your vote after casting it.</p>
            <button
              onClick={this.submitVote}
              className="px-4 py-1 text-xl rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >Cast Vote</button>
          </div>
        </div>
      </div>
    );
  }
}

ElectionVotingPage.contextType = authContext;

export default ElectionVotingPage;
