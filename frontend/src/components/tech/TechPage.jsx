import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import CommitteeComponent from '../jcr/roles/CommitteeComponent';

class TechPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      content: [],
      selectedContentIndex: 2,
      sections: [
        {title: "Tech Manager",  category: "Who Are We", content() {return(
          <p className="text-left py-1">The Technical Manager is responsible for all of the technical equipment in the JCR (Lighting, Audio, Staging, Power, etc) as well as managing the technical side of JCR events.</p>
        )}},
        {title: "Vice Managers", category: "Who Are We", content() {return(
          <p className="text-left py-1">Vice Technical Manager is a position open to the most experienced members of the Technical Crew. Those appointed to the position will be tasked with overseeing the Technical Crew during smaller-scale events and will have opportunities to gain a lot of experience.</p>
        )}},
        {title: "Tech Crew",     category: "Who Are We", content() {return(
          <div>
            <p className="text-left py-1">The Technical Crew run tech for events throughout the year and any JCR member is welcome to join – whatever their level of technical experience. Crew members are paid for events that they work.</p>
            <p className="text-left py-1">The main application window is usually at the start of the academic year - the Tech Manager will email all JCR members with an invitation to sign up. Applications are also welcome throughout the year, just <a href="mailto:grey.tech@durham.ac.uk" target="_blank" rel="noopener noreferrer" className="font-semibold underline">email the Technical Manager</a>.</p>
          </div>
        )}},
      ],
    };
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/jcr/committee/name/tech");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { committee, committeeMembers } = content.data;

    this.setState({ loaded: true, status: 200, committee, committeeMembers });
  }

  selectSection(id) {
    if (this.state.selectedContentIndex === id){
      this.setState({ selectedContentIndex: null });
    }
    else{
      this.setState({ selectedContentIndex: id });
    }
  }

  render () {
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
      <div className="flex flex-col justify-start">
        <div className="relative">
          <img
            src={"/images/tech_banner.jpg"}
            className="w-full h-auto relative z-0 block md:h-96 md:object-cover"
            onLoad={() => this.setState({ firstImageLoaded: true })}
            alt="Slideshow"
          ></img>
          <div className="absolute p-4 z-20 top-0 left-0 w-full h-full flex-col items-center text-white bg-grey-500 bg-opacity-50 border-b-4 border-red-900 justify-center flex">
            <h1 className="font-bold text-6xl pb-4">Tech</h1>
          </div>
        </div>
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <div className="text-left">
            <CommitteeComponent
              committee={this.state.committee}
              membersByPosition={this.state.committeeMembers}
              disableBodyScroll={() => {}}
              clickableRoles={false}
            />
          </div>
          <div className="flex flex-col justify-center text-center items-center w-full">
            <h2 className="font-semibold text-3xl pt-3 mb-2">What do we do?</h2>
            <div className="w-full flex flex-col md:flex-row flex-wrap justify-center items-center gap-1">
              {this.state.sections.map((section, i) => (
                <button
                  key={i}
                  onClick={() => this.selectSection(i)}
                  className={this.state.selectedContentIndex !== i ?
                    "h-full w-full md:flex-1 mb-3 px-1 pb-1 pt-auto rounded-lg hover:bg-red-900 hover:text-white"
                    :
                    "h-full w-full md:flex-1 mb-3 px-1 pb-1 pt-auto rounded-lg bg-red-900 text-white"
                  }
                >
                  <div className="p-2 pt-auto border-b border-red-900 flex flex-col justify-evenly items-center">
                    <h2 className="w-auto font-light text-2xl">{section.title}</h2>
                  </div>
                </button>
              ))}
            </div>
            {this.state.selectedContentIndex !== null ? this.state.sections[this.state.selectedContentIndex].content() : <></>}
          </div>
          <div className="xl:flex xl:flex-row">
            <div className="rounded-3xl bg-red-900 bg-opacity-90 my-3 py-3 px-5 flex xl:w-1/2 xl:mr-2">
              <div className="text-left">
                <h2 className="text-center self-center font-semibold text-2xl py-3 text-white">Internal Events</h2>
                <p className="text-left self-center w-auto font-light pb-3 pt-1 text-white flex-shrink">
                  We also offer technical setups for Open Mic Nights & Karaoke evenings after formals. Please give a minimum of 3 weeks notice for such an event so that approval can be obtained with college and a schedule for the technical crew can be arranged. If interested in booking, please contact us at: <a href="mailto:grey.tech@durham.ac.uk" target="_blank" rel="noopener noreferrer" className="font-semibold underline">grey.tech@durham.ac.uk</a>.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-red-900 bg-opacity-90 my-3 py-3 px-5 flex xl:w-1/2 xl:ml-2">
              <div className="text-left">
                <h2 className="text-center self-center font-semibold text-2xl py-3 text-white">Equipment Hire</h2>
                <p className="text-left self-center w-auto font-light py-1 text-white flex-shrink">
                  We also hire out our equipment! Equipment can be hired for a variety of events, so please get in touch <a href="mailto:grey.tech@durham.ac.uk" target="_blank" rel="noopener noreferrer" className="font-semibold underline">by email</a> to enquire.
                </p>
                <p className="self-center w-auto py-1 text-white flex-shrink text-center font-semibold underline">
                  <a href="https://durhamtech.org.uk/grey" target="_blank" rel="noopener noreferrer" >A list of the tech available to hire can be found here.</a>
                </p>
                <p className="self-center w-auto font-light py-1 text-white flex-shrink">
                  Grey JCR sports and societies can hire equipment for free.
                </p>
                <p className="text-justify self-center w-auto font-light py-1 text-white flex-shrink">
                  Grey JCR events have priority for equipment once the event date and technical requirements have been confirmed with the event organiser, unless a paid hire has already been agreed. It is recommended that you contact us at the earliest opportunity to ensure your event runs smoothly.
                </p>
                <p className="text-center self-center w-auto font-light pt-4 pb-1 text-white flex-shrink">
                If you have any queries, feel free to contact <a href="mailto:grey.tech@durham.ac.uk" target="_blank" rel="noopener noreferrer" className="font-semibold underline">the Tech Manager.</a>
                </p>
              </div>
            </div>
          </div>
          {/*
          <div className="w-full h-64">
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLSdUX8G1jD5k0fKTNdLDGlrcdM99jKeVqBD2Xw881WUzSiAgJQ/viewform?embedded=true"
              className="w-full h-full"
              frameborder={0}
              scrolling="yes"
              title="Grey Tech Form"
            ><LoadingHolder /></iframe>
          </div>
          */}
        </div>
      </div>
    );
  }
}

TechPage.contextType = authContext;

export default TechPage;
