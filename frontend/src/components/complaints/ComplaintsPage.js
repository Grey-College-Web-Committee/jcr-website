import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import dateFormat from 'dateformat';
import SignaturePad  from 'react-signature-canvas';

class ComplaintsPage extends React.Component {
  constructor(props) {
    super(props);

    // Default values for the complaints form
    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      name: "",
      subject: "",
      reason: "",
      truth: false,
      date: dateFormat(new Date(), "yyyy-mm-dd"),
      success: false,
      disabled: false
    };

    // Ref for the signature pad
    this.sigPad = {};
  }

  onInputChange = e => {
    // Standard input change
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

    this.setState({ loaded: true, status: 200, name: this.context.displayName.substring(0, 254) });
  }

  canSubmit = () => {
    // Validates the submission
    const { name, subject, reason, truth, date } = this.state;
    return (
      (name !== undefined && name !== null && name.length !== 0) &&
      (subject !== undefined && subject !== null && subject.length !== 0) &&
      (reason !== undefined && reason !== null && reason.length !== 0) &&
      (date !== undefined && date !== null && date.length !== 0) &&
      truth
    );
  }

  submitComplaint = async () => {
    if(!this.canSubmit()) {
      alert("You must fill in all the details in the form first.");
      return;
    }

    // Makes sure it has been signed
    if(this.sigPad.isEmpty()) {
      alert("You must sign the complaint.");
      return;
    }

    this.setState({ disabled: true });

    // Convert the signature to a string to be transmitted to the server
    const signature = this.sigPad.toDataURL();
    const { name, subject, reason } = this.state;

    // Send it all to the server
    try {
      await api.post("/complaints", {
        name, subject, reason, signature
      });
    } catch (error) {
      alert("There was an error processing your complaint. Please try again later.");
      return;
    }

    // We'll change the content once it has been successfully sent
    this.setState({ success: true });
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

    if(this.state.success) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4 w-full md:w-3/5">
            <h1 className="font-semibold text-5xl pb-4">Complaint Recorded</h1>
            <p className="text-justify">Your complaint has successfully been recorded. You will receive an email momentarily confirming your complaint. The JCR Chair has been notified and will respond in due course in accordance with the JCR's Complaints Procedure.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Submit a Complaint</h1>
          <div className="w-full md:w-3/5 mx-auto">
            <div>
              <p className="text-justify">The details of the complaint will be sent to the JCR Chair who will deal with the complaint confidentially in line with the <a href="/uploads/complaints/procedure" className="font-semibold underline" target="_blank">complaints procedure</a>. The JCR will take all complaints seriously, and view them as opportunities to learn and improve from feedback. Please refer to the <a href="/uploads/complaints/procedure" className="font-semibold underline" target="_blank">complaints procedure</a> for exact details.</p>
              <p className="text-justify pt-1">Individuals making a complaint are expected to identify themselves; as complaints raised anonymously can be significantly more difficult to address effectively. The JCR will not normally consider anonymous complaints. This form will identify you to the JCR Chair.</p>
              <p className="text-justify pt-1">Upon submitting this form you will automatically be sent an email (to your Durham University email address) confirming the details you have submitted.</p>
            </div>
            <fieldset>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Your Name</label>
                <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.name.length} characters remaining)</span>
                <input
                  type="text"
                  name="name"
                  value={this.state.name}
                  onChange={this.onInputChange}
                  className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled}
                  autoComplete=""
                  maxLength={255}
                />
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="date" className="flex flex-row justify-start text-xl font-semibold">Date of Complaint</label>
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
                <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold">Subject of the complaint </label>
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
                <label htmlFor="reason" className="flex flex-row justify-start text-xl font-semibold">Complaint details</label>
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
                <label htmlFor="signature" className="flex flex-row justify-start pb-2 text-xl font-semibold">Signature</label>
                <div>
                  <SignaturePad
                    canvasProps={{ className: "bg-gray-100 border-black border w-full h-48" }}
                    ref={(ref) => { this.sigPad = ref }}
                  />
                </div>
                <div className="pt-2 flex flex-row">
                  <button
                    className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.state.disabled}
                    onClick={() => { this.sigPad.clear() }}
                  >Clear</button>
                </div>
              </div>
              <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
                <label htmlFor="truth" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center">By checking this box I confirm that the complaint is true to my knowledge</label>
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
                  className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
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
