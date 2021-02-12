import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';

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
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const galleryImages = content.data.record.EventImages.filter(img => img.position === "gallery");
    const ticketTypeIds = content.data.record.EventTicketTypes.map(type => type.id);
    this.setState({ loaded: true, status: 200, event: content.data.record, galleryImages, ticketTypeIds }, this.loadTicketTypes);
  }

  changeImage = (direction) => {
    const newImage = this.state.currentGalleryImage + direction;

    if(newImage < 0) {
      return;
    }

    if(newImage >= this.state.galleryImages.length) {
      return;
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
          <p className="pb-2 text-xl">Event starts at {dateFormat(this.state.event.date, "dd/mm/yyyy HH:MM")}</p>
          <p className="pb-4 text-xl">Please check for emails from the Events Manager for details!</p>
          <div>
            <img
              src={`/uploads/images/events/${bannerImage.image}`}
              alt={bannerImage.caption}
              className="w-full hidden md:block"
            />
          </div>
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-2/5 border-2 flex flex-col justify-between">
              <div className="flex flex-row justify-center p-2">
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
                    onClick={() => this.changeImage(-1)}
                    disabled={currentGalleryImage === 0}
                    className="h-full px-12 rounded disabled:bg-gray-400 text-white w-auto font-semibold bg-red-900 disabled:opacity-20"
                  >&lt;</button>
                  <p>{currentGalleryImage + 1}/{galleryImages.length}</p>
                  <button
                    onClick={() => this.changeImage(1)}
                    disabled={currentGalleryImage === galleryImages.length - 1}
                    className="h-full px-12 rounded disabled:bg-gray-400 text-white w-auto font-semibold bg-red-900 disabled:opacity-20"
                  >&gt;</button>
                </div>
              </div>
            </div>
            <div className="w-full md:w-3/5 border-2 p-4 flex flex-col">
              <div>
                {
                  description.split("\n").map((paragraph, i) => {
                    if(paragraph.length === 0) {
                      return null;
                    }

                    return (
                      <p className="pt-1 text-justify" key={i}>{paragraph}</p>
                    );
                  })
                }
              </div>
              <div className="text-justify">
                <h2>Tickets</h2>
                {
                  this.state.ticketTypes.map((type, id) => {
                    let bookingUnavailable = null;

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
                    }

                    const bookButton = type.available ? (
                      <button>Book Now</button>
                    ) : (
                      <p>{bookingUnavailable}</p>
                    );

                    let peopleDescription = "This ticket is for individual booking only.";

                    if(type.record.maxPeople > 1) {
                      const guestNote = type.record.maxGuests === 0 ? "" : ` including up to ${type.record.maxGuests} guest${type.record.maxGuests === 1 ? "" : "s"}`;
                      peopleDescription = `You can book up to (and including) ${type.record.maxPeople} people per group (minimum of ${type.record.minPeople} per group)${guestNote}.`;
                    }

                    return (
                      <div className="border-2 border-black">
                        <h3>{type.record.name}</h3>
                        <p>{type.record.description}</p>
                        <p>{peopleDescription}</p>
                        <p>JCR Member Price: £{type.record.memberPrice}{ type.record.maxGuests === 0 ? null : `, Guest Price: £${type.record.guestPrice}` }</p>
                        {bookButton}
                      </div>
                    )
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
