import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';

class DetailChangeRequest extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",

      details: {},
      requestType: "",
      accurate: false,
      furtherInformation: "",
      submitted: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  makeDisplayName = (user) => {
    const upperCaseFirstName = user.firstNames.split(",")[0];
    const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();

    const upperCaseLastName = user.surname;
    const specialCaseList = ["MC", "MAC"];
    const foundSpecialCase = specialCaseList.filter(c => upperCaseLastName.startsWith(c));

    let lastName = upperCaseLastName.substring(0, 1) + upperCaseLastName.substring(1).toLowerCase();

    if(foundSpecialCase.length !== 0) {
      const c = foundSpecialCase[0].substring(0, 1) + foundSpecialCase[0].substring(1).toLowerCase();
      lastName = upperCaseLastName.substring(c.length);
      lastName = c + lastName.substring(0, 1) + lastName.substring(1).toLowerCase();
    }

    return `${firstName} ${lastName}`;
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

    this.setState({ loaded: true, status: 200, details: content.data.user });
  }

  canSubmit = () => {
    return (
        (
            (this.state.requestType === "sar" || this.state.requestType === "deletion") || 
            (this.state.requestType === "personalDataChange" && this.state.furtherInformation.length > 0)
        ) && this.state.accurate
    )
  }

  submitRequest = async () => {
    if(!this.canSubmit()) {
        alert("You must fill in the necessary information");
        return;
    }

    const { requestType, furtherInformation, accurate } = this.state;

    this.setState({ disabled: true, waiting: true });

    try {
        await api.post("/profile/request", { requestType, furtherInformation, accurate });
    } catch (error) {
        alert("Unable to submit request");
        return;
    }

    this.setState({ submitted: true, waiting: false });
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

    const { details, submitted, waiting } = this.state;

    if(waiting) {
        return (
            <div className="flex flex-col">
                <div className="flex flex-col my-4 justify-center items-left md:w-3/5 md:mx-auto mx-2">
                    <h1 className="font-semibold text-5xl pb-4 mx-auto">Data Request</h1>
                    <p>Your request is being processed. This may take a moment, please wait...</p>
                    <LoadingHolder />
                </div>
            </div>
        )
    }

    if(submitted) {
        return (
            <div className="flex flex-col">
                <div className="flex flex-col my-4 justify-center items-left md:w-3/5 md:mx-auto mx-2">
                    <h1 className="font-semibold text-5xl pb-4 mx-auto">Data Request</h1>
                    <p>Your request has been submitted. You should receive an email confirming this shortly. The JCR will respond as soon as possible within the legal limits.</p>
                </div>
            </div>
        )
    }
    
    return (
      <div className="flex flex-col">
        <div className="flex flex-col my-4 justify-center items-left md:w-3/5 md:mx-auto mx-2">
            <h1 className="font-semibold text-5xl pb-4 mx-auto">Data Request</h1>
            <div className="mb-2">
                <p className="mb-1">Under UK law you have rights over your personal data, these include (but are not limited to):</p>
                <ul className="ml-2 list-inside list-disc mb-1">
                    <li>Right to access - you have the right to request a copy of your personal data via a Subject Access Request</li>
                    <li>Right to rectification - you have the right to have inaccurate personal data rectified</li>
                    <li>Right to erasure - you have the right to have your personal data erased</li>
                </ul>
                <p>
                    On this page you can submit a request for action to be taken. Please note that 'excessive' or 'manifestly unfounded' requests can be challenged, more information can 
                    be found on the Information Commissioner's Office website which is linked here: <a 
                        href="https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/individual-rights/"
                        className="font-semibold underline"
                        target="_blank"
                        rel="noreferrer"
                    >Information Commissioner's Office: Individual Rights</a>.
                </p>
            </div>
            <div className="flex flex-col">
                <h2 className="font-semibold text-2xl mb-1">Existing Details</h2>
                <p className="mb-1">Your existing personal data was either provided by the University or set manually when you registered to the website. Please review it below:</p>
                <p><span className="font-semibold">Username:</span> {details.username}</p>
                <p><span className="font-semibold">Email:</span> {details.email}</p>
                <p><span className="font-semibold">First Names:</span> {details.firstNames}</p>
                <p><span className="font-semibold">Surname:</span> {details.surname}</p>
                <p><span className="font-semibold">Displayed Name*:</span> {this.makeDisplayName(details)} (*this is generated from First Names and Surname)</p>
                <p><span className="font-semibold">Year:</span> {details.year}</p>
                <p><span className="font-semibold">Membership Expiry Date:</span> {details.membershipExpiryDate}</p>
                <p><span className="font-semibold">Honorary Life Member:</span> {details.hlm ? "Yes": "No"}</p>
                <p><span className="font-semibold">Consented for Events:</span> {details.eventConsent ? "Yes" : "No"}</p>
            </div>
            <fieldset>
                <div className="pt-2 pb-2 border-b-2">
                    <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Request Type</label>
                    <span className="flex flex-row justify-start text-sm mb-2"></span>
                    <div className="flex flex-row items-center">
                        <input 
                            type="radio" 
                            name="requestType"
                            onChange={this.onInputChange}
                            className="mr-2 h-4 w-4"
                            disabled={this.state.disabled}
                            value="sar"
                            checked={this.state.requestType === "sar"}
                        />Subject Access Request
                    </div>
                    <div className="flex flex-row items-center">
                        <input 
                            type="radio" 
                            name="requestType"
                            onChange={this.onInputChange}
                            className="mr-2 h-4 w-4"
                            disabled={this.state.disabled}
                            value="deletion"
                            checked={this.state.requestType === "deletion"}
                        />Account Deletion
                    </div>
                    <div className="flex flex-row items-center">
                        <input 
                            type="radio" 
                            name="requestType"
                            onChange={this.onInputChange}
                            className="mr-2 h-4 w-4"
                            disabled={this.state.disabled}
                            value="personalDataChange"
                            checked={this.state.requestType === "personalDataChange"}
                        />Personal Data Change
                    </div>
                </div>
            </fieldset>
            {
                this.state.requestType === "" ? null : (
                    <div className="pt-2 pb-2 border-b-2">
                        <label htmlFor="furtherInformation" className="flex flex-row justify-start text-xl font-semibold">Further Information</label>
                        <span className="flex flex-row justify-start text-sm mb-1">
                            { this.state.requestType === "personalDataChange" ? "Please state the changes you want made to your data" : "Please provide any further information if necessary" }
                        </span>
                        <textarea
                            name="furtherInformation"
                            value={this.state.furtherInformation}
                            onChange={this.onInputChange}
                            className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                            disabled={this.state.disabled}
                            autoComplete=""
                            maxLength={30000}
                        />
                    </div>
                )
            }
            <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
                <label htmlFor="truth" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center">By checking this box I confirm that the request is accurate, reasonable, and not manifestly unfounded.</label>
                <div className="flex flex-col items-center justify-center ml-2">
                  <input
                    type="checkbox"
                    name="accurate"
                    checked={this.state.accurate}
                    onChange={this.onInputChange}
                    className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.state.disabled}
                    autoComplete=""
                  />
                </div>
            </div>
            <div className="pt-2 pb-2 border-b-2">
                <button
                    className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.state.disabled || !this.canSubmit()}
                    onClick={this.submitRequest}
                >Submit Request</button>
            </div>
        </div>
      </div>
    );
  }
}

DetailChangeRequest.contextType = authContext;

export default DetailChangeRequest;
