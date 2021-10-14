import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';

// https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

class AlumniRegisterPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      stage: "enter_details",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      processing: false,
      issue: "Please enter your details to proceed"
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) }, () => {
      const res = this.checkDetails();

      if(res[0]) {
        this.setState({ issue: null });
      } else {
        this.setState({ issue: res[1] });
      }
    })
  }

  checkDetails = () => {
    const { username, email, password, confirmPassword, processing } = this.state;

    if(!username) {
      return [false, "Please enter your CIS username"];
    }

    if(username.length !== 6) {
      return [false, "Your CIS username must be 6 characters long"];
    }

    if(!email) {
      return [false, "Please enter your email address"];
    }

    if(!emailRegex.test(email)) {
      return [false, "Please enter a valid email address"];
    }

    if(!password) {
      return [false, "Please enter a password"];
    }

    if(password.length < 8) {
      return [false, "Please ensure your password is at least 8 characters long"];
    }

    if(password !== confirmPassword) {
      return [false, "Your passwords do not match"];
    }

    if(!processing) {
      return [false, "You must agree to allow the JCR to process your data"];
    }

    return [true, ""];
  }

  submitDetails = async () => {
    const checks = this.checkDetails();

    if(!checks[0]) {
      this.setState({ issue: checks[1] });
      return;
    }

    this.setState({ disabled: true });
    const { username, email, password } = this.state;

    try {
      await api.post("/alumni/register", { username, email, password });
    } catch (error) {
      this.setState({ stage: "error", detailError: error.response.data.error });
      return;
    }

    this.setStage({ stage: "awaiting_verification", disabled: false });
  }

  renderStage = () => {
    switch(this.state.stage) {
      case "information":
        return (
          <div className="border-red-900 border flex flex-col w-full p-2">
            <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Pre-Registration Information</h2>
            <p className="py-1 text-left">This page will take you through the process of registering for an alumni account. Please only use this form if you are a former member of the JCR. This is currently only open to Honorary Life Members who have recently graduated. If you have a HLM and are still a student at the university please continue to use your regular account.</p>
            <p className="py-1 text-left">You will need your former CIS username to allow you to login to the website once your account has been approved.</p>
            <button
              className="p-1 bg-red-900 text-white text-lg"
              onClick={() => this.setState({ stage: "enter_details" })}
            >Start</button>
          </div>
        )
      case "enter_details":
        return (
          <div className="border-red-900 border flex flex-col w-full p-2">
            <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Step 1 - Provide Details</h2>
            <p className="py-1 text-left">Please fill in the form below. Your email and password will be stored securely.</p>
            <div className="pb-2 border-b-2">
              <label htmlFor="username" className="flex flex-row justify-start text-xl font-semibold mb-2">Former CIS Username</label>
              <input
                type="text"
                value={this.state.username}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-75 focus:ring-gray-400"
                disabled={this.state.disabled}
                maxLength={6}
                onChange={this.onInputChange}
                name="username"
                autoComplete=""
              />
            </div>
            <div className="pb-2 border-b-2">
              <label htmlFor="password" className="flex flex-row justify-start text-xl font-semibold">Email Address</label>
              <span className="flex flex-row justify-start text-sm mb-2">You will be need to verify your email address. Please ensure it is entered correctly!</span>
              <input
                type="email"
                name="email"
                value={this.state.email}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete="email"
              />
            </div>
            <div className="pb-2 border-b-2">
              <label htmlFor="password" className="flex flex-row justify-start text-xl font-semibold">Password</label>
              <span className="flex flex-row justify-start text-sm mb-2">Your password must be a minimum of 8 characters. You should always use a unique password for each account you make. If you wish to generate one <a href="https://www.lastpass.com/features/password-generator" className="ml-1 font-semibold underline" target="_blank" rel="noopener noreferrer">click here.</a></span>
              <input
                type="password"
                name="password"
                value={this.state.password}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete="new-password"
              />
            </div>
            <div className="pb-2 border-b-2">
              <label htmlFor="confirmPassword" className="flex flex-row justify-start text-xl font-semibold">Confirm Password</label>
              <span className="flex flex-row justify-start text-sm mb-2">Please re-enter your password to make sure it matches.</span>
              <input
                type="password"
                name="confirmPassword"
                value={this.state.confirmPassword}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete="new-password"
              />
            </div>
            <div className="pt-2 pb-2 border-b-2 flex flex-col justify-start">
              <h2 className="mb-2 text-xl font-semibold text-left">Data Processing</h2>
              <p className="flex flex-row justify-start flex-1 items-center text-left">To verify your details Grey College Junior Common Room ("the JCR") will cross-reference your personal details provided with data available to the JCR. By submitting this form you agree to allow the JCR to do this and agree that the JCR may contact you if there are any queries about the information that you have provided. The JCR reserves the right to refuse malicious or intentionally inaccurate applications.</p>
            </div>
            <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
              <label htmlFor="processing" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center">By checking this box I agree to the above processing of my data</label>
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
            <div className="py-2 border-b-2">
              {
                this.state.issue ? (
                  <p className="flex flex-row justify-start text-red-900 text-lg font-semibold">{this.state.issue}</p>
                ) : (
                  <button
                    className="px-4 py-2 rounded text-xl bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.state.disabled || this.state.issue}
                    onClick={this.submitDetails}
                  >Submit Details</button>
                )
              }
            </div>
          </div>
        )
      case "awaiting_verification":
        return (
          <div className="border-red-900 border flex flex-col w-full p-2">
            <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Step 2 - Verify Email</h2>
            <p className="text-left py-1">Your application has been submitted. Before it can be processed please verify your email address. You should shortly receive an email with a link to verify your email. If this does not appear within 30 minutes please contact grey.website@durham.ac.uk</p>
          </div>
        )
      case "error":
        return (
          <div className="border-red-900 border flex flex-col w-full p-2">
            <h2 className="text-2xl text-center md:text-left py-1 border-b border-grey-500">Error</h2>
            <p className="text-left py-1">{this.state.detailError}</p>
          </div>
        )
      default:
        return null;
    }
  }

  render () {
    return (
      <div className="flex flex-col justify-start">
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Alumni Registeration</h1>
          { this.renderStage() }
        </div>
      </div>
    );
  }
}

AlumniRegisterPage.contextType = authContext;

export default AlumniRegisterPage;
