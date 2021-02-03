import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import config from '../../config.json';
import LoadingHolder from '../common/LoadingHolder';
import dateFormat from 'dateformat';
import SignaturePad  from 'react-signature-canvas';

class ComplaintsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      name: "",
      complainingAbout: "",
      subject: "",
      reason: "",
      truth: false,
      date: dateFormat(new Date(), "yyyy-mm-dd")
    };

    this.sigPad = {};
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
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
      content = await api.get("/some/path");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, content: content, name: this.context.displayName.substring(0, 254) });
  }

  canSubmit = () => {
    const { name, complainingAbout, subject, reason, truth } = this.state;
    return (
      (name !== undefined && name !== null && name.length !== 0) &&
      (complainingAbout !== undefined && complainingAbout !== null && complainingAbout.length !== 0) &&
      (subject !== undefined && subject !== null && subject.length !== 0) &&
      (reason !== undefined && reason !== null && reason.length !== 0) &&
      truth
    );
  }

  submitComplaint = () => {
    if(!this.canSubmit()) {
      alert("You must fill in all the details in the form first.");
      return;
    }

    if(this.sigPad.isEmpty()) {
      alert("You must sign the complaint.");
      return;
    }

    const signature = this.sigPad.toDataURL();
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
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Submit a Complaint</h1>
          <div>
            Info about complaining...
          </div>
          <div className="w-full md:w-3/5 mx-auto">
            <fieldset>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="name" className="flex flex-row justify-start text-lg font-semibold">Your Name</label>
                <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.name.length} characters remaining)</span>
                <input
                  type="text"
                  name="name"
                  value={this.state.name}
                  onChange={this.onInputChange}
                  className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled}
                  autoComplete=""
                />
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="complainingAbout" className="flex flex-row justify-start text-lg font-semibold">Who is the complaint about?</label>
                <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.complainingAbout.length} characters remaining)</span>
                <input
                  type="text"
                  name="complainingAbout"
                  value={this.state.complainingAbout}
                  onChange={this.onInputChange}
                  className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled}
                  autoComplete=""
                />
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="date" className="flex flex-row justify-start text-lg font-semibold">Date of Complaint</label>
                <input
                  type="date"
                  name="date"
                  value={this.state.date}
                  className="border w-full rounded py-1 px-2 opacity-50"
                  readOnly={true}
                  autoComplete=""
                />
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="subject" className="flex flex-row justify-start text-lg font-semibold">Subject of the complaint </label>
                <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.subject.length} characters remaining)</span>
                <input
                  type="text"
                  name="subject"
                  value={this.state.subject}
                  onChange={this.onInputChange}
                  className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled}
                  autoComplete=""
                  maxLength={255}
                />
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="reason" className="flex flex-row justify-start text-lg font-semibold">Complaint details</label>
                <span className="flex flex-row justify-start text-sm mb-2">({30000 - this.state.reason.length} characters remaining)</span>
                <textarea
                  name="reason"
                  value={this.state.reason}
                  onChange={this.onInputChange}
                  className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled}
                  autoComplete=""
                  maxLength={30000}
                />
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="signature" className="flex flex-row justify-start pb-2 text-lg font-semibold">Signature</label>
                <div>
                  <SignaturePad
                    canvasProps={{ className: "bg-gray-100 border-black border w-full" }}
                    ref={(ref) => { this.sigPad = ref }}
                  />
                </div>
                <div className="pt-2 flex flex-row">
                  <button
                    className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.state.disabled}
                    onClick={() => { this.sigPad.clear() }}
                  >Clear</button>

                    <button
                      className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      disabled={this.state.disabled}
                      onClick={() => {
                        console.log(this.sigPad.toData())
                        console.log(this.sigPad.toDataURL())
                      }}
                    >Test</button>
                </div>
              </div>
              <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
                <label htmlFor="truth" className="flex flex-row justify-start text-lg font-semibold flex-1 items-center">By checking this box I confirm that the complaint is true to my knowledge</label>
                <div className="flex flex-col items-center justify-center ml-2">
                  <input
                    type="checkbox"
                    name="truth"
                    value={this.state.truth}
                    onChange={this.onInputChange}
                    className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.props.disabled}
                    autoComplete=""
                  />
                </div>
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <button
                  className="px-4 py-2 rounded text-lg bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.disabled || !this.canSubmit()}
                  onClick={this.submitComplaint}
                >Submit Complaint</button>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    );
  }
}

ComplaintsPage.contextType = authContext;

export default ComplaintsPage;
