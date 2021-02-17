import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';

class EventsTermsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      consent: false,
      disabled: false,
      changed: false
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
      content = await api.get("/events/consent");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, consent: content.data.consent });
  }

  grantConsent = async () => {
    this.setState({ disabled: true });

    // Update the user record
    try {
      await api.post("/events/consent", {
        consented: true
      });
    } catch (error) {
      alert("An error occurred granting consent. Please try again later.");
      return;
    }

    this.setState({ consent: true, disabled: false, changed: true });
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

    if(this.state.changed) {
      return (
        <Redirect to="/events" />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Event Terms and Conditions</h1>
          <div className="flex flex-col w-full md:w-3/5 mx-auto text-justify">
            <div>
              <p className="pb-1">Last Updated: 12/02/2021</p>
              <p className="py-1">To facilitate a group booking system ("the booking system"), Grey College Junior Common Room ("the JCR") needs to be able to share your personal details with the other members of your group. These personal details will include:</p>
              <ul className="list-inside list-disc py-2">
                <li>Your full name</li>
                <li>Your Durham University Computing and Information Services username</li>
                <li>Your Durham University Email Address</li>
                <li>The status of your payment (this excludes any information about recipients of the JCR's Hardship Fund)</li>
                <li>Your year of study</li>
                <li>If you have outstanding debt owed to the JCR</li>
                <li>Any additional information provided during use of the booking system including, but not limited to, dietary requirements</li>
                <li>The name of any guests you have provided during use of the booking system</li>
                <li>The Durham University Computing and Information Services username of any guests you have provided during use of the booking system</li>
                <li>Any additional information requested about any guests you have provided during use of the booking system including, but not limited to, dietary requirements</li>
                <li>If your guests have outstanding debt owed to the JCR</li>
              </ul>
              <p className="py-1">These details will also be shared confidentially with the relevant JCR committees (including, but not limited to, the JCR's Events Committee, the JCR's Bar Committee and the JCR's Executive Committee) and relevant event providers for the purpose of providing the event that your group has booked on to. They may also be shared with other Grey College Staff for the purposes of providing any catering included with your booking as well as any person providing security for the event.</p>
              <p className="py-1">You also consent to the JCR providing search functionality within the booking system to allow other members of the JCR to form a group with you. The personal details that will be visible using this functionality will include:</p>
              <ul className="list-inside list-disc py-2">
                <li>Your full name</li>
                <li>Your Durham University Computing and Information Services username</li>
                <li>Your year of study</li>
              </ul>
              <p className="py-1">The JCR also reserves to the right to cancel any booking for any reason deemed suitable by the JCR's President or the JCR's Finance and Commercial Services Officer including, but not limited to, bookings that have not been paid in full by all members of your group within 24 hours of the booking being confirmed.</p>
              <p className="py-1">This consent is required for any JCR member to attend events. However, you may withdraw your consent at any time but in doing so you acknowledge that you, and any member in your group(s) within the booking system, are not entitled to any refund for any amount previously paid and that you will not be able to attend any events you have already booked on to.</p>
            </div>
            {
              this.state.consent ? (
                <div className="flex flex-col w-full">
                  <p className="py-1">You have already consented. Please contact the FACSO <a href="mailto:grey.treasurer@durham.ac.uk?subject=Revoke Event Consent" target="_blank" rel="noopener noreferrer" className="font-semibold underline">by clicking here</a> to revoke your consent.</p>
                </div>
              ) : (
                <div className="flex flex-col w-full font-semibold">
                  <p className="py-1">By clicking the button below you fully consent to the processing of your personal data in accordance with the terms and conditions set out above.</p>
                  <button
                    disabled={this.state.disabled}
                    onClick={this.grantConsent}
                    className="mt-1 px-4 py-2 rounded text-lg bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  >Grant Consent</button>
                </div>
              )
            }
          </div>
        </div>
      </div>
    );
  }
}

EventsTermsPage.contextType = authContext;

export default EventsTermsPage;
