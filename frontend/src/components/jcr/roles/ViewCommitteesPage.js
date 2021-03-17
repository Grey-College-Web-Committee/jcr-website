import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import RoleComponent from './RoleComponent';

class ViewCommitteesPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
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
      content = await api.get("/jcr/committees/basic");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { committees } = content.data;

    const execCommittee = committees.filter(committee => committee.name.toLowerCase().startsWith("executive"));
    let selectedCommittee = "";

    if(execCommittee.length !== 0) {
      selectedCommittee = execCommittee[0].id;
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

    console.log(membersByPosition);

    return (
      <div>
        <h2 className="font-semibold text-2xl">{ activeCommittee.committee.name }</h2>
        {
          activeCommittee.committee.description.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))
        }
        <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 2xl:gap-4 auto-rows-fr">
          {
            membersByPosition.map((entry, i) => (
              <React.Fragment>
                {entry.JCRRole.JCRRoleUserLinks.map((link, j) => (
                  <RoleComponent
                    key={`${i}-${j}`}
                    role={entry.JCRRole}
                    user={link.User}
                  />
                ))}
              </React.Fragment>
            ))
          }
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
        <div className="container mx-auto text-left p-4 md:w-3/5 w-full">
          <h1 className="font-semibold text-5xl pb-4 text-center">JCR Committees</h1>
          <p>The JCR consists of many roles and committees that any member can hold. Some roles are by application (usually committee members) and some roles and elected in the JCR meetings that are held throughout the term.</p>
          <p>You can view all of the JCR committees and see their members. Use the dropdown below to select a committee and the members will appear!</p>
          <div className="py-2">
            <label htmlFor="selectedCommittee">Selected Committee:</label>
            <select
              value={this.state.selectedCommittee}
              onChange={this.onInputChange}
              name="selectedCommittee"
              className="ml-2 w-auto h-8 border border-gray-400 disabled:opacity-50"
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
