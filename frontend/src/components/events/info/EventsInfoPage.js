import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';
import CountdownClock from '../../common/CountdownClock';

class EventsInfoPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.match.params.id,
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      event: null,
      galleryImages: null,
      currentGalleryImage: 0,
      ticketTypes: []
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
      content = await api.get(`/events/single/${this.state.id}`);
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error });
      return;
    }

    const galleryImages = content.data.record.EventImages.filter(img => img.position === "gallery");
    const ticketTypeIds = content.data.record.EventTicketTypes.map(type => type.id);

    // Change displayed image every 6 seconds
    this.interval = setInterval(() => {
      this.changeImage(1);
    }, 6000);

    this.setState({ loaded: true, status: 200, event: content.data.record, galleryImages, ticketTypeIds }, this.loadTicketTypes);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  changeImage = (direction) => {
    let newImage = this.state.currentGalleryImage + direction;

    if(newImage < 0) {
      newImage = this.state.galleryImages.length - 1;
    } else if(newImage >= this.state.galleryImages.length) {
      newImage = 0;
    }

    this.setState({ currentGalleryImage: newImage });
  }

  loadTicketTypes = async () => {
    const { ticketTypeIds } = this.state;
    let ticketTypes = [];

    for(const type of ticketTypeIds) {
      let ticketType;

      try {
        ticketType = await api.get(`/events/ticketType/${type}`);
      } catch (error) {
        alert("An error occurred loading the ticket types");
        return;
      }

      ticketTypes.push(ticketType.data);
    }

    this.setState({ ticketTypes });
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

    if(this.state.event.EventImages.length === 0) {
      return (
       <Redirect to="/errors/400" />
      );
    }

    const { galleryImages, currentGalleryImage } = this.state;
    const { name, description, date } = this.state.event;
    const bannerImages = this.state.event.EventImages.filter(img => img.position === "banner");

    if(bannerImages.length === 0) {
      return (
       <Redirect to="/errors/400" />
      );
    }

    const bannerImage = bannerImages[0];

    return (
      <div className="flex flex-col justify-start">
        <div className="text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">{name}</h1>
          <div>
            <img
              src={`/uploads/images/events/${bannerImage.image}`}
              alt={bannerImage.caption}
              className="w-full hidden md:block"
            />
          </div>
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-2/5">
              <div className="flex flex-col h-auto justify-between p-2">
                <div className="flex flex-row justify-center md:p-2 h-96">
                  <img
                    src={`/uploads/images/events/${galleryImages[currentGalleryImage].image}`}
                    alt={galleryImages[currentGalleryImage].caption}
                    className="h-full"
                  />
                </div>
                <div>
                  <p className="py-2 text-lg">{galleryImages[currentGalleryImage].caption}</p>
                  <div className="flex flex-row justify-between text-2xl align-middle">
                    <button
                      onClick={() => {
                        this.changeImage(-1);
                        clearInterval(this.interval);
                      }}
                      className="h-full px-8 md:pb-1 rounded disabled:bg-gray-400 text-white w-auto font-semibold bg-red-900 disabled:opacity-20"
                    >←</button>
                    <p>{currentGalleryImage + 1}/{galleryImages.length}</p>
                    <button
                      onClick={() => {
                        this.changeImage(1);
                        clearInterval(this.interval);
                      }}
                      className="h-full px-8 md:pb-1 rounded disabled:bg-gray-400 text-white w-auto font-semibold bg-red-900 disabled:opacity-20"
                    >→</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full mt-4 md:mt-0 md:w-3/5 md:p-4 flex flex-col">
              <div className="text-left">
                <p className="pb-2">The event is scheduled to start at {dateFormat(this.state.event.date, "dd/mm/yyyy HH:MM")} but please check for emails from the Events Manager for details!</p>
                <p className="pb-2">Booking for all tickets closes at {dateFormat(this.state.event.bookingCloseTime, "dd/mm/yyyy HH:MM")}.</p>
                <h2 className="text-3xl font-semibold">Tickets</h2>
                <p>You can only book one type of ticket.</p>
                {
                  this.state.ticketTypes.length === 0 ? ( <LoadingHolder /> ) :
                  this.state.ticketTypes.map((type, i) => {
                    let bookingUnavailable = null;

                    if(!type.available) {
                      if(type.reason === "closed") {
                        bookingUnavailable = "Booking has already closed!";
                      } else if (type.reason === "unreleased") {
                        bookingUnavailable = `These tickets are not available yet! They release at ${dateFormat(type.release, "dd/mm/yyyy HH:MM")}`;
                      } else if (type.reason === "full:all") {
                        bookingUnavailable = "The event is fully booked!";
                      } else if (type.reason === "full:limited") {
                        bookingUnavailable = "There is limited capacity left for the event. Other tickets may be available.";
                      } else if (type.reason === "full:type") {
                        bookingUnavailable = "There are no more tickets of this type available!";
                      } else if (type.reason === "already_booked") {
                        bookingUnavailable = "You already have a ticket to this event.";
                      } else if (type.reason === "in_debt") {
                        bookingUnavailable = "You have debt owed to the JCR.";
                      } else if (type.reason === "not_consented") {
                        bookingUnavailable = "You have not consented to the event terms and conditions";
                      } else if (type.reason === "invite_only") {
                        bookingUnavailable = "This event is invite only";
                      } else {
                        bookingUnavailable = "Unavailable";
                      }
                    }

                    // Countdown clock will trigger the button to appear
                    // it takes 5 seconds after the real release time
                    // this is to prevent them trying to get a ticket dead on the time
                    // and it not working
                    const bookingIssue = type.reason === "unreleased" ? (
                      <CountdownClock
                        until={new Date(new Date(type.release).getTime() + 5000)}
                        onFinish={() => {
                          let { ticketTypes } = this.state;
                          ticketTypes[i].available = true;
                          this.setState({ ticketTypes });
                        }}
                        aboveText="Tickets release in"
                        verb="Booking opens"
                        sameLine={true}
                      />
                    ) : (<p>{bookingUnavailable}</p>);

                    const bookButton = type.available ? (
                      <Link to={`/events/event/${type.record.eventId}/book/${type.record.id}`}>
                        <button
                          className="px-4 py-1 rounded text-lg bg-grey-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 mt-2"
                        >Book Now</button>
                      </Link>
                    ) : bookingIssue;

                    let peopleDescription = "This ticket is for individual booking only.";

                    if(type.record.maxPeople > 1) {
                      const guestNote = type.record.maxGuests === 0 ? "" : ` including up to ${type.record.maxGuests} guest${type.record.maxGuests === 1 ? "" : "s"}`;
                      const minNote = type.record.minPeople === 1 ? "person" : "people";
                      peopleDescription = `You can book up to (and including) ${type.record.maxPeople} people per group (minimum of ${type.record.minPeople} ${minNote} per group)${guestNote}.`;
                    }

                    return (
                      <div className="p-2 my-1 border border-black" key={i}>
                        <h3 className="font-semibold text-xl">{type.record.name}</h3>
                        <p className="py-1">{type.record.description}</p>
                        <p className="py-1">{peopleDescription}</p>
                        <p className="py-1">JCR Member Price: £{type.record.memberPrice}{ type.record.maxGuests === 0 ? null : `, Guest Price: £${type.record.guestPrice}` } (per ticket)</p>
                        {bookButton}
                      </div>
                    )
                  })
                }
              </div>
              <div className="mt-1">
                <h2 className="text-3xl text-left font-semibold">Details</h2>
                {
                  description.split("\n").map((paragraph, i) => {
                    if(paragraph.length === 0) {
                      return null;
                    }

                    return (
                      <p className="pt-1 text-left" key={i}>{paragraph}</p>
                    );
                  })
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

EventsInfoPage.contextType = authContext;

export default EventsInfoPage;
