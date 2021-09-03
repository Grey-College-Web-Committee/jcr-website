import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import LoginForm from '../LoginForm';
import dateFormat from 'dateformat';
import LoadingHolder from '../../common/LoadingHolder';

class RegisterPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stage: "verify",
      username: "",
      firstName: "",
      surname: "",
      year: "1",
      truth: false,
      processing: false,
      date: null
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  verifyLoginDetails = async (username, password) => {
    this.setState({ disabled: true, stage: "loading" });

    try {
      await api.post("/auth/validate", { username, password });
    } catch (error) {
      if(error.response.data) {
        const { stage } = error.response.data;
        this.setState({ stage, date: error.response.data?.date });
        return;
      }

      this.setState({ stage: "error" })
      return;
    }

    this.setState({ username, password, stage: "provide_details", disabled: false });
  }

  checkDetails = () => {
    const { firstName, surname, year, truth, processing } = this.state;
    return firstName && surname && year && truth && processing;
  }

  submitDetails = async () => {
    const { firstName, surname, year, username, password } = this.state;
    this.setState({ disabled: true, stage: "loading" });

    try {
      await api.post("/auth/register", { firstName, surname, year, username, password });
    } catch (error) {
      if(error.response.data) {
        const { stage } = error.response.data;
        this.setState({ stage, date: error.response.data?.date, password: null });
        return;
      }

      this.setState({ stage: "error", password: null })
      return;
    }

    this.setState({ stage: "awaiting_verification", password: null, disabled: false });
  }

  renderStage = () => {
    switch(this.state.stage) {
      case "verify":
        return (
          <React.Fragment>
            <div className="border-red-900 border flex flex-col w-full p-2">
              <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Step 1 / 3 - Verification</h2>
              <p className="py-1 text-left">Welcome to the Grey JCR website! This page will take you through the process of registering for an account.</p>
              <p className="py-1 text-left">Before registering we need to verify your Durham University account. To do this, please enter your CIS login details below. These details are not stored and are sent to the University's servers to verify your identity. When you login to the Grey JCR website you will use these credentials (and they will be handled in the same way).</p>
              <LoginForm
                buttonText="Verify"
                attemptLogin={this.verifyLoginDetails}
              />
            </div>
          </React.Fragment>
        );
      case "awaiting_approval":
        return (
          <div className="border-red-900 border flex flex-col w-full p-2">
            <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Application Awaiting Approval</h2>
            <p className="py-1 text-left">You have already submitted an application for an account. Once your account has been approved you will receive an email to your Durham University email address.</p>
            <p className="pt-1 text-left">Your application was submitted at { dateFormat(this.state.date, "dd/mm/yyyy HH:MM") }. If it has been more than a week since you submitted it please contact grey.website@durham.ac.uk</p>
          </div>
        );
      case "already_have_account":
        return (
          <div className="border-red-900 border flex flex-col w-full p-2">
            <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Already Registered</h2>
            <p className="py-1 text-left">You already have an account registered on this website. <Link to="/accounts/login" className="font-semibold underline">Click here to login.</Link></p>
            <p className="pt-1 text-left">This account was created at { dateFormat(this.state.date, "dd/mm/yyyy HH:MM") }. If you did not register this account please contact grey.website@durham.ac.uk</p>
          </div>
        );
      case "provide_details":
        return (
          <div className="border-red-900 border flex flex-col w-full p-2">
            <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Step 2 / 3 - Enter Details</h2>
            <p className="py-1 text-left">Your credentials have been verified.</p>
            <p className="py-1 text-left">Due to changes to the University's systems we are no longer able to automatically retrieve details about users. In this section we will require you to provide some details that will be stored securely by Grey College Junior Common Room.</p>
            <p className="py-1 text-left">Please ensure the details you provide are correct as they will be used by the JCR to verify your identity before your account is approved.</p>
            <div className="pb-2 border-b-2">
              <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold mb-2">CIS Username</label>
              <input
                type="text"
                value={this.state.username}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-75 focus:ring-gray-400"
                disabled={true}
              />
            </div>
            <div className="pb-2 border-b-2">
              <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold">Preferred First Name</label>
              <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.firstName.length} characters remaining)</span>
              <input
                type="text"
                name="firstName"
                value={this.state.firstName}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete=""
                maxLength={255}
              />
            </div>
            <div className="py-2 border-b-2">
              <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold">Preferred Surname</label>
              <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.surname.length} characters remaining)</span>
              <input
                type="text"
                name="surname"
                value={this.state.surname}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete=""
                maxLength={255}
              />
            </div>
            <div className="py-2 border-b-2">
              <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold mb-2">Year of Study</label>
              <select
                value={this.state.year}
                onChange={this.onInputChange}
                className="border w-full rounded p-1 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                name="year"
              >
                <option value="1">First Year</option>
                <option value="2">Second Year</option>
                <option value="3">Third Year</option>
                <option value="4">Postgraduate / Fourth Year</option>
              </select>
            </div>
            <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
              <label htmlFor="truth" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center">By checking this box I confirm that I am a member of Grey College</label>
              <div className="flex flex-col items-center justify-center ml-2">
                <input
                  type="checkbox"
                  name="truth"
                  checked={this.state.truth}
                  onChange={this.onInputChange}
                  className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.props.disabled}
                  autoComplete=""
                />
              </div>
            </div>
            <div className="pt-2 pb-2 border-b-2 flex flex-col justify-start">
              <h2 className="mb-2 text-xl font-semibold text-left">Data Processing</h2>
              <p className="flex flex-row justify-start flex-1 items-center text-left">To verify your details Grey College Junior Common Room ("the JCR") will cross-reference your personal details provided with data available to all members of the University. By submitting this form you agree to allow the JCR to do this and agree that the JCR may contact you if there are any queries about the information that you have provided. The JCR reserves the right to refuse malicious or intentionally inaccurate applications.</p>
            </div>
            <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
              <label htmlFor="processing" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center">By checking this box I agree to above processing of my data</label>
              <div className="flex flex-col items-center justify-center ml-2">
                <input
                  type="checkbox"
                  name="processing"
                  checked={this.state.processing}
                  onChange={this.onInputChange}
                  className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.props.disabled}
                  autoComplete=""
                />
              </div>
            </div>
            <div className="pt-2 border-b-2">
              <button
                className="px-4 py-2 rounded text-xl bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                disabled={this.state.disabled || !this.checkDetails()}
                onClick={this.submitDetails}
              >Submit Details</button>
            </div>
          </div>
        )
      case "awaiting_verification":
        return (
          <div className="border-red-900 border flex flex-col w-full p-2">
            <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Step 3 / 3 - Await Approval</h2>
            <p className="py-1 text-left">Thank you for registering for an account.</p>
            <p className="pt-1 text-left">We will now review your details to ensure that you are a member of Grey College. You will receive an email once it has been approved! This typically takes less than 24 hours but may take longer during busy periods.</p>
          </div>
        );
      case "loading":
        return (
          <div className="border-red-900 border flex flex-col w-full p-2">
            <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Loading...</h2>
            <LoadingHolder />
          </div>
        )
      case "error":
      default:
        return (
          <div className="border-red-900 border flex flex-col w-full p-2">
            <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Error Occurred</h2>
            <p className="pt-1 text-left">There was an issue submitting your application. Please try again later.</p>
          </div>
        )
    }
  }

  render () {
    return (
      <div className="flex flex-col justify-start">
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Register</h1>
          <div className="flex flex-col justify-center items-center">
            { this.renderStage() }
          </div>
        </div>
      </div>
    );
  }
}

export default RegisterPage;
