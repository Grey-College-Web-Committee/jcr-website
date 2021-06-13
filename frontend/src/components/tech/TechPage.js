import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';

class TechPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: []
    };
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

    this.setState({ loaded: true, status: 200, content: content });
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
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Tech</h1>
          <p className="text-left py-1">The Technical Manager is responsible for all of the technical equipment in the JCR (Lighting, Audio, Staging, Power, etc) as well as managing the technical side of JCR events.</p>
          <p className="text-left py-1">The Technical Crew run tech for events throughout the year and any JCR member is welcome to join – whatever their level of technical experience. Crew members are paid for events that they work.</p>
          <div className="py-1 text-left">
            <h2 className="text-2xl font-semibold">Internal Events</h2>
            <p className="py-1">We also offer technical setups for Open Mic Nights & Karaoke evenings after formals. Please give a minimum of 3 weeks notice for such an event so that approval can be obtained with college and a schedule for the technical crew can be arranged. If interested in booking, please contact us at: <a href="mailto:grey.tech@durham.ac.uk" target="_blank" rel="noopener noreferrer" className="font-semibold underline">grey.tech@durham.ac.uk</a></p>
            <p className="py-1"></p>
          </div>
          <div className="py-1 text-left">
            <h2 className="text-2xl font-semibold">Equipment Hire</h2>
            <p className="py-1">We also hire out our equipment! Equipment can be hired for a variety of events, so please get in touch using the form below, or <a href="mailto:grey.tech@durham.ac.uk" target="_blank" rel="noopener noreferrer" className="font-semibold underline">by email</a>, to enquire.</p>
            <p className="py-1 text-center font-semibold underline"><a href="https://durhamtech.org.uk/grey" target="_blank" rel="noopener noreferrer" >A list of the tech available to hire can be found here.</a></p>
            <p className="py-1">Grey JCR sports and societies can hire equipment for free.</p>
            <p className="py-1">Grey JCR events have priority for equipment once the event date and technical requirements have been confirmed with the event organiser, unless a paid hire has already been agreed. It is recommended that you contact us at the earliest opportunity to ensure your event runs smoothly.</p>
            <p className="py-1">If you have any queries, feel free to contact <a href="mailto:grey.tech@durham.ac.uk" target="_blank" rel="noopener noreferrer" className="font-semibold underline">the Tech Manager.</a></p>
          </div>
          <div className="w-full" style={{height: "700px"}}>
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLSdUX8G1jD5k0fKTNdLDGlrcdM99jKeVqBD2Xw881WUzSiAgJQ/viewform?embedded=true"
              className="w-full h-full"
              frameborder={0}
              scrolling="yes"
            ><LoadingHolder /></iframe>
          </div>
        </div>
      </div>
    );
  }
}

TechPage.contextType = authContext;

export default TechPage;
