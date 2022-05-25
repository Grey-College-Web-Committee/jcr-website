import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import CommitteeComponent from './CommitteeComponent';
import qs from 'qs';

class ViewCommitteesPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      committees: [],
      selectedCommittee: "",
      cachedCommittees: {},
      disabled: false,
      activeCommittee: null
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), disabled: true }, this.loadCommittee);
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/jcr/committees/basic");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let { committees } = content.data;
    committees = committees.sort((a, b) => {
      return a.name > b.name ? 1 : (b.name > a.name ? -1 : 0)
    });

    const execCommittee = committees.filter(committee => committee.name.toLowerCase().startsWith("executive"));
    let selectedCommittee = "";

    let paramCommittee = undefined;
    const queryParams = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });

    if(queryParams.committee !== undefined && queryParams.committee !== null && typeof queryParams.committee === "string") {
      paramCommittee = queryParams.committee
    }

    if(paramCommittee === undefined) {
      if(execCommittee.length !== 0) {
        selectedCommittee = execCommittee[0].id;
      }
    } else {
      const possibleCommittees = committees.filter(committee => committee.name.toLowerCase().replace(" ", "-").startsWith(paramCommittee));

      if(possibleCommittees.length !== 0) {
        selectedCommittee = possibleCommittees[0].id
      } else {
        if(execCommittee.length !== 0) {
          selectedCommittee = execCommittee[0].id;
        }
      }
    }

    this.setState({ loaded: true, status: 200, committees, selectedCommittee }, this.loadCommittee);
  }

  loadCommittee = async () => {
    const { selectedCommittee } = this.state;
    let { cachedCommittees } = this.state;

    if(Object.keys(cachedCommittees).includes(selectedCommittee)) {
      this.setState({ activeCommittee: cachedCommittees[selectedCommittee], disabled: false });
      return;
    }

    let result;

    try {
      result = await api.get(`/jcr/committee/${selectedCommittee}`);
    } catch (error) {
      alert(error.response.data.error);
      return null;
    }

    cachedCommittees[selectedCommittee] = result.data;
    this.setState({ cachedCommittees, activeCommittee: cachedCommittees[selectedCommittee], disabled: false });
  }

  renderCommittee = () => {
    const { activeCommittee } = this.state;

    if(activeCommittee === null) {
      return null;
    }

    const membersByPosition = activeCommittee.committeeMembers.sort((a, b) => a.position - b.position);

    return (
      <CommitteeComponent
        committee={activeCommittee.committee}
        membersByPosition={membersByPosition}
        disableBodyScroll={this.props.disableBodyScroll}
        clickableRoles={true}
        showDescription={true}
        showName={true}
        key={new Date()}
      />
    );
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
        <div className="relative">
          <img
            src="/images/execs_banner.jpg"
            className="w-full h-auto relative z-0 lg:block hidden lg:h-96 md:object-cover"
            alt="Replace banner with your image"
          ></img>
          <img
            src="/images/execs_banner.jpg"
            className="w-full h-auto relative z-0 block lg:hidden"
            alt="Replace banner with your image"
          ></img>
          <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-full flex-col text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-center flex">
            <div className="flex flex-row align-middle items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold">JCR Committees</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto text-left p-4 md:w-3/5 w-full">
          <p className="py-1">There are many roles in the JCR that any member can run for. They are a great way to get involved in the JCR and most of them are elected in JCR meetings throughout the year. If you are interested in any of the roles please contact the JCR Chair (grey.chair@durham.ac.uk) and they will be happy to provide you more information on a specific role as well as information about running in an election!</p>
          <p className="py-1">As well as the roles, the JCR has lots of committees that help with specific parts of the running of the JCR. Committee positions usually do not require election and instead members can apply to be on them when they are accepting new members (usually annually). They are an excellent way to get involved if you are considering running for an elected role in the future!</p>
          <p className="py-1">You can view all of the JCR committees and see their members. Use the dropdown below to select a committee and the members will appear!</p>
          <div className="py-1 text-lg font-semibold">
            <label htmlFor="selectedCommittee">Selected Committee:</label>
            <select
              value={this.state.selectedCommittee}
              onChange={this.onInputChange}
              name="selectedCommittee"
              className="my-1 md:my-0 md:ml-2 w-auto h-8 border border-gray-400 disabled:opacity-50"
              disabled={this.state.disabled}
            >
              <option value="" disabled={true} hidden={true}>Please Select...</option>
              {
                this.state.committees.map((committee, i) => (
                  <option key={i} value={committee.id}>{committee.name}</option>
                ))
              }
            </select>
          </div>
          { this.renderCommittee() }
        </div>
      </div>
    );
  }
}

ViewCommitteesPage.contextType = authContext;

export default ViewCommitteesPage;
