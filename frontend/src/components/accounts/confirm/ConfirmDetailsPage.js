import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import qs from 'qs';

class ConfirmDetailsPage extends React.Component {
  constructor(props) {
    super(props);

    const queryParams = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });

    let ref = "/";

    if(queryParams.ref !== undefined && queryParams.ref !== null && typeof queryParams.ref === "string") {
      if(queryParams.ref.startsWith("/")) {
        ref = queryParams.ref;
      }
    }

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      confirmed: false,
      disabled: false,
      completed: false,
      ref: ref
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/profile");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { firstNames, surname, year, confirmedDetails, username } = content.data.user;

    if(confirmedDetails) {
      this.setState({ loaded: true, status: 200, completed: true });
      return;
    }

    this.setState({ loaded: true, status: 200, firstNames, surname, year, username });
  }

  makeDisplayName = (firstNames, surname) => {
    const upperCaseFirstName = firstNames.split(",")[0];
    const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();

    const upperCaseLastName = surname;
    const specialCaseList = ["MC", "MAC"];
    const foundSpecialCase = specialCaseList.filter(c => upperCaseLastName.startsWith(c));

    let lastName = upperCaseLastName.substring(0, 1) + upperCaseLastName.substring(1).toLowerCase();

    // Fix special cases like McDonald appearing as Mcdonald
    if(foundSpecialCase.length !== 0) {
      const c = foundSpecialCase[0].substring(0, 1) + foundSpecialCase[0].substring(1).toLowerCase();
      lastName = upperCaseLastName.substring(c.length);
      lastName = c + lastName.substring(0, 1) + lastName.substring(1).toLowerCase();
    }

    // Fix hyphens
    if(lastName.includes("-")) {
      let capNext = false;
      let newLastName = [];

      for(const i in lastName) {
        if(capNext) {
          newLastName.push(lastName[i].toUpperCase());
          capNext = false;
          continue;
        }

        newLastName.push(lastName[i]);
        capNext = lastName[i] === "-";
      }

      lastName = newLastName.join("")
    }

    // Fix apostrophes
    if(lastName.includes("'")) {
      let capNext = false;
      let newLastName = [];

      for(const i in lastName) {
        if(capNext) {
          newLastName.push(lastName[i].toUpperCase());
          capNext = false;
          continue;
        }

        newLastName.push(lastName[i]);
        capNext = lastName[i] === "'";
      }

      lastName = newLastName.join("")
    }

    return `${firstName} ${lastName}`;
  }

  confirmDetails = async () => {
    this.setState({ disabled: true });
    const { year } = this.state;

    try {
      await api.post("/profile/update", { year });
    } catch (error) {
      this.setState({ error: "An error occurred while updating your details" });
      return;
    }

    this.setState({ completed: true });
  }

  render () {
    if(this.state.completed) {
      return (
        <Redirect to={this.state.ref} />
      )
    }

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
      <div className="flex flex-col p-2 md:p-0">
        <div className="flex flex-col my-4 justify-center items-left md:w-3/5 md:mx-auto mx-2">
          <h1 className="font-semibold text-5xl pb-4 mx-auto">Confirm Your Details</h1>
          <p>Please check your details below and ensure that your name and study year are correct. This page will keep appearing until you confirm the details below.</p>
          <p>You can correct your study year on this page. If you want to change your name please email the Website Editor at <span className="font-semibold">grey.website@durham.ac.uk</span></p>
          <div className="flex flex-col mt-2">
            <div className="pb-2 border-b-2">
              <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold">First Names</label>
              <span className="flex flex-row justify-start text-sm mb-2">Please go to '{this.state.username}' -{">"} 'Data Requests' to change this.</span>
              <input
                type="text"
                name="firstNames"
                value={this.state.firstNames}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={true}
              />
            </div>
            <div className="py-2 border-b-2">
              <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold">Surname</label>
              <span className="flex flex-row justify-start text-sm mb-2">Please go to '{this.state.username}' -{">"} 'Data Requests' to change this.</span>
              <input
                type="text"
                name="surname"
                value={this.state.surname}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={true}
              />
            </div>
            <div className="py-2 border-b-2">
              <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold mb-2">Displayed Name</label>
              <span>Your name currently displays as: <span className="font-semibold">{ this.makeDisplayName(this.state.firstNames, this.state.surname) }</span></span>
            </div>
            <div className="py-2 border-b-2">
              <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold">Year of Study</label>
              <span className="flex flex-row justify-start text-sm mb-2">Please ensure this is correct as it affects which events you can book on to</span>
              <select
                value={this.state.year}
                onChange={this.onInputChange}
                className="w-auto border border-black rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                name="year"
              >
                <option value="1">First Year</option>
                <option value="2">Second Year</option>
                <option value="3">Third Year</option>
                <option value="4">Postgraduate / Fourth Year / Alumni / Sabb</option>
              </select>
            </div>
            <div className="pt-2">
              <button
                className="px-4 py-2 rounded text-xl bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                onClick={this.confirmDetails}
                disabled={this.state.disabled}
              >Confirm Details</button>
              {
                this.state.disabled ? (
                  this.state.error ? (
                    <p>{this.state.error}</p>
                  ) : <LoadingHolder />
                ) : (
                  <p>You will be redirected once you're details are updated successfully.</p>
                )
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ConfirmDetailsPage.contextType = authContext;

export default ConfirmDetailsPage;
