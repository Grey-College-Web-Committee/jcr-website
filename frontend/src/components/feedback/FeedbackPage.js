import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import dateFormat from 'dateformat';

class FeedbackPage extends React.Component {
  constructor(props) {
    super(props);

    // Default values for the feedback form
    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      type: "placeholder",
      subject: "",
      details: "",
      anonymous: false,
      agreement: false,
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
    let isMember = true;

    try {
      membershipCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    // Ensure they are a member
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        isMember = false;
      }
    } else {
      isMember = false;
    }

    this.setState({ loaded: true, status: 200 });
  }

  canSubmit = () => {
    // Validates the submission
    const { type, subject, details, anonymous, agreement } = this.state;
    return (
      (type !== undefined && type !== null && type !== "placeholder") &&
      (subject !== undefined && subject !== null && subject.length !== 0) &&
      (details !== undefined && details !== null && details.length !== 0) &&
      (!anonymous || (anonymous && agreement))
    );
  }

  submitFeedback = async () => {
    if(!this.canSubmit()) {
      alert("You must fill in all the details in the form first.");
      return;
    }

    this.setState({ disabled: true });

    // Convert the signature to a string to be transmitted to the server
    const { type, subject, details, anonymous, agreement } = this.state;

    // Send it all to the server
    try {
      await api.post("/feedback", {
        type, subject, details, anonymous, agreement
      });
    } catch (error) {
      alert("There was an error processing your feedback. Please try again later.");
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
            <h1 className="font-semibold text-5xl pb-4">Feedback Recorded</h1>
            <p className="text-justify">Your feedback has successfully been recorded. You will receive an email momentarily confirming your feedback. The JCR Vice President has been notified and will review your feedback.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Feedback</h1>
          <div className="w-full md:w-3/5 mx-auto">
            <div>
              <p className="text-justify py-1">You can submit feedback about anything related to the JCR or College. The feedback will initially be reviewed by the Vice President of the JCR and is also visible to the President and FACSO. They will act on your feedback and may contact you if you do not chose to remain anonymous.</p>
              <p className="text-justify py-1">Please do not submit complaints about JCR conduct using this form as that must be handled impartially by the JCR Chair instead.</p>
              <p className="text-justify py-1">You have the option to remain anonymous but if the content of your feedback is deemed offensive, abusive or discriminatory then you will no longer remain anonymous.</p>
            </div>
            <fieldset>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="type" className="flex flex-row justify-start text-xl font-semibold">Type</label>
                <select
                  name="type"
                  className="w-auto h-8 border border-gray-400 disabled:opacity-50 flex flex-row justify-start my-1"
                  onChange={this.onInputChange}
                  value={this.state.type}
                  disabled={this.state.disabled}
                >
                  <option value="placeholder" disabled={true} className="hidden">Please select an option...</option>
                  <option value="jcr">General JCR Feedback</option>
                  <option value="website">Website Feedback</option>
                  <option value="events">Events Feedback</option>
                </select>
              </div>
              <div className="pt-2 pb-2 border-b-2">
                <label htmlFor="subject" className="flex flex-row justify-start text-xl font-semibold">Subject</label>
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
                <label htmlFor="details" className="flex flex-row justify-start text-xl font-semibold">Feedback</label>
                <span className="flex flex-row justify-start text-sm mb-2">({30000 - this.state.details.length} characters remaining)</span>
                <textarea
                  name="details"
                  value={this.state.reason}
                  onChange={this.onInputChange}
                  className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                  disabled={this.state.disabled}
                  autoComplete=""
                  maxLength={30000}
                />
              </div>
              <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
                <label htmlFor="anonymous" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center">I want to stay anonymous</label>
                <div className="flex flex-col items-center justify-center ml-2">
                  <input
                    type="checkbox"
                    name="anonymous"
                    value={this.state.agreement}
                    onChange={this.onInputChange}
                    className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.props.disabled}
                    autoComplete=""
                  />
                </div>
              </div>
              {
                this.state.anonymous ? (
                  <div className="pt-2 pb-2 border-b-2 flex flex-row items-center">
                    <label htmlFor="agreement" className="flex flex-row justify-start text-xl font-semibold flex-1 items-center text-justify">I understand that any comments that are deemed offensive, abusive or discriminatory will no longer remain anonymous</label>
                    <div className="flex flex-col items-center justify-center ml-2">
                      <input
                        type="checkbox"
                        name="agreement"
                        value={this.state.agreement}
                        onChange={this.onInputChange}
                        className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        disabled={this.props.disabled}
                        autoComplete=""
                      />
                    </div>
                  </div>
                ) : null
              }
              <div className="pt-2 pb-2 border-b-2">
                <button
                  className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.disabled || !this.canSubmit()}
                  onClick={this.submitFeedback}
                >Submit Feedback</button>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    );
  }
}

FeedbackPage.contextType = authContext;

export default FeedbackPage;
