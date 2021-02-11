import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';

class EventsInfoPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.match.params.id,
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: []
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

    this.setState({ loaded: true, status: 200, event: content.data.record });
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
          <pre>
            {
              JSON.stringify(this.state.event, null, 2)
            }
          </pre>
        </div>
      </div>
    );
  }
}

EventsInfoPage.contextType = authContext;

export default EventsInfoPage;
