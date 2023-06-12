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
    if (membershipCheck.data.user.permissions) {
      if (!membershipCheck.data.user.permissions.includes("jcr.member")) {
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
      this.setState({ status: error.response.status, error: error.response.data.error });
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

  render() {
    if (!this.state.loaded) {
      if (this.state.status !== 200 && this.state.status !== 0) {
        return (
          <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      if (!this.state.isMember) {
        return (
          <Redirect to="/membership" />
        )
      }

      return (
        <LoadingHolder />
      );
    }

    if (this.state.changed) {
      return (
        <Redirect to="/events" />
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pt-5 pb-10">JCR Event Terms and Conditions</h1>
          <div className="flex flex-col w-full md:w-3/5 mx-auto text-justify">
            <div>
              <p className="pb-1">Version 1</p>
              <p className="pb-1">Last Updated: May 2023</p>
              <p className="py-1">These are the terms and conditions (the "Terms and Conditions") that apply to each event (an
                "Event") organised by or on behalf of the Grey College Junior College Room (the "JCR"), an
                unincorporated association with charity number 1142887 with its registered address at Grey
                College, South Road, Durham DH1 3LG. JCR members and their guests ("you" or “your") must
                agree to the Terms and Conditions before participating in any Event.</p>
              <p className="py-1">The JCR may update these Terms and Conditions from time to time without prior notice.</p>
              <h2 className="pt-6 pb-2 font-semibold text-xl">1. BOOKING AND PAYMENT SYSTEM</h2>
              <p className="py-1">1.1 The JCR operates an electronic booking and payment system for Events, accessible on its
                website. Once you complete the online Event booking form, you will receive an automated
                booking confirmation email which will provide a web-link prompting you to fulfill payment for the
                ticket.</p>
              <p className="py-1">1.2 Payment for tickets must be made within 24 hours of receipt of the booking confirmation
                email, via the following methods:</p>
              <ul className="list-inside list-disc pb-2 pl-10">
                <li>Credit/Debit Card</li>
                <li>Apple Pay</li>
                <li>Google Pay</li>
                <li>PayPal</li>
              </ul>
              <p className="py-1">1.3 Once payment has been made in full, you will receive an automated payment confirmation
                email which constitutes proof of payment for an Event ticket. Physical Event wristbands (or other
                ticket alternative, depending on the Event) will be available for collection prior to the Event. To
                collect a wristband, you must provide proof of identification and have made payment in full for
                the Event ticket.</p>
              <p className="py-1">1.4 By purchasing a ticket for an Event, you consent to the JCR processing your data for the
                purpose of the Event including contacting you via email for the purpose of the Event. All of your
                data shall be held and utilised in accordance with the JCR's Data Protection Policy.</p>
              <p className="py-1">1.5 To facilitate booking by a group of attendees for certain Events, by purchasing a ticket for
                such an Event you consent to the JCR sharing some or all of the personal data you provide on
                the online booking form with other members of your group and with the relevant JCR
                committees.</p>
              <p className="py-1">1.6 You also consent to the JCR providing search functionality within the booking system to
                allow other members of the JCR to form a group with you. The personal details that will be visible using this functionality will include your full name, your Durham University Computing and
                Information Services username and your year of study.</p>
              <h2 className="pt-6 pb-2 font-semibold text-xl">2. CANCELLATION AND RESCHEDULING OF AN EVENT</h2>
              <p className="py-1">2.1 The JCR reserves the right to cancel or reschedule an Event for any reason.</p>
              <p className="py-1">2.2 You will be notified of the Event cancellation or the rescheduled date by email and the
                respective Event details will be updated on the JCR's website.</p>
              <h2 className="pt-6 pb-2 font-semibold text-xl">3. TRANSFERS AND REFUNDS</h2>
              <p className="py-1">3.1 Event tickets must be purchased with the intention of being used by you only. However, if
                you are unable to attend the Event, you may gift or otherwise sell your ticket to another person
                (of the equivalent membership status) at not more than the advertised Event ticket price. If you
                arrange transfer of your ticket to another JCR member, it is your responsibility to inform the
                Event organising team and the Financial and Commercial Services Officer (the "FACSO") by
                email as soon as possible of the name of the new attendee.</p>
              <p className="py-1">3.2 All sales are final and Event tickets are non-refundable and cannot be exchanged for cash
                or credit, or transferred to a different Event, except that:<br />3.2.1 you may request within 24 hours of receiving the booking confirmation email to cancel
                your ticket and, if payment has been made to request for a full refund;<br />3.2.2 if the Event is canceled by the JCR, you will receive a full refund via the original payment
                method; or<br />3.2.3 If the Event is rescheduled to another date, you may request, within 48 hours of the email
                announcement of the rescheduled Event, to cancel your ticket and receive a full refund.</p>
              <p className="py-1">3.3 Any requests regarding refunds shall be made by email to the FACSO at
                grey.treasurer@durham.ac.uk.</p>
              <p className="py-1">3.4 The circumstances in which an Event ticket purchase can be refunded shall remain within
                the JCR's discretion and can be amended at any time.</p>
              <h2 className="pt-6 pb-2 font-semibold text-xl">4. TERMS OF ADMISSION</h2>
              <p className="py-1">4.1 You will be required to present the Event wristband (or other physical ticket as appropriate)
                to gain admission to the Event.</p>
              <p className="py-1">4.2 The JCR, acting by either the JCR President or the FACSO, and in consultation with the
                JCR Trust Board and Grey College where necessary, reserves the right to refuse you admission
                to any Event, or ask you to leave an Event, for any reason including but not limited to
                unacceptable behaviour.</p>
              <p className="py-1">4.3 If deemed appropriate to ensure the safety and security of attendees, the JCR may arrange
                to staff private security personnel at the Event.</p>
              <p className="py-1">4.4 For Events hosted at external third party venues, additional terms and conditions may apply.</p>
              <p className="py-1">4.5 The JCR accepts no responsibility for any personal property at any Events.</p>
              <h2 className="pt-6 pb-2 font-semibold text-xl">5. USE OF IMAGES</h2>
              <p className="py-1">5.1 Events may be photographed, filmed and/or streamed via live webcast by or on behalf of the
                JCR. By purchasing a ticket to an Event, you consent to the recording and transmission of
                images (both still and moving) of you as an attendee at an Event.</p>
              <p className="py-1">5.2 The JCR shall retain all rights to any images, which can be used for publicity purposes and
                marketing materials in any medium.</p>
              <p className="py-1">5.3 If you would prefer your image not to be used in materials, please contact the FACSO by
                email and identify the specific image(s). If you have any objection to being photographed at an
                Event, please contact a member of the Event organising team or notify the
                photographer/videographer.</p>
            </div>
            {
              this.state.consent ? (
                <div className="flex flex-col w-full">
                  <p className="pt-10 pb-5 text-xl">You have already consented. Please contact the FACSO <a href="mailto:grey.treasurer@durham.ac.uk?subject=Revoke Event Consent" target="_blank" rel="noopener noreferrer" className="font-semibold underline">by clicking here</a> to revoke your consent.</p>
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
