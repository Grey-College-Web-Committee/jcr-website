import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';

class ViewImagesPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      eventName: "",
      options: {},
      imageNames: [],
      loadAmount: 12,
      loadIncrement: 12
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  onSelectedEventChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), disabled: true }, this.loadImages);
  }

  loadImages = async () => {
    let result;

    try {
      result = await api.get(`/media/images/list/${this.state.eventName}`);
    } catch (error) {
      alert("Error loading images");
      return;
    }

    this.setState({ disabled: false, imageNames: result.data.files });
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
      content = await api.get("/media/images/options");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, options: content.data.options });
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
        <div className="md:w-4/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-2">Event Photos</h1>
          <p className="text-left">Select an event from the dropdown and the photos will automatically load. The thumbnail images are heavily compressed so please click the 'Download' button to download the original quality image! To load more photos, click the text at the bottom of the photos.</p>
          <div>
            <div className="flex flex-row items-center justify-center md:justify-start mt-2">
              <p className="mr-1">Event:</p>
              <select
                name="eventName"
                onChange={this.onSelectedEventChange}
                value={this.state.eventName}
                disabled={this.state.disabled}
                className="md:w-auto w-full h-8 border border-gray-400 disabled:opacity-50"
              >
                <option value="" disabled={true} hidden={true}>Please select an event...</option>
                {
                  Object.keys(this.state.options).map((key, i) => (
                    <option key={i} value={this.state.options[key]}>{key}</option>
                  ))
                }
              </select>
            </div>
            <div className="mx-auto grid gap-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 2xl:gap-4 auto-rows-fr w-full mt-2">
              {
                this.state.imageNames.slice(0, this.state.loadAmount).map((imageFile, i) => (
                  <div className="h-auto flex flex-col" key={i}>
                    <img
                      src={`/api/media/images/image/thumb/${this.state.eventName}/${imageFile}`}
                    />
                    <p className="mt-1 font-semibold">{imageFile}</p>
                    <a
                      download={imageFile}
                      href={`/api/media/images/image/fullres/${this.state.eventName}/${imageFile}`}
                    >
                      <button
                        className="bg-red-900 text-white p-1 mt-1 w-full"
                      >Download</button>
                    </a>
                  </div>
                ))
              }
            </div>
            <div className="mt-2 text-lg">
              {
                this.state.imageNames.length ? (
                  <React.Fragment>
                    {
                      this.state.imageNames.length > this.state.loadAmount ? (
                        <p
                          onClick={() => {
                            this.setState({ loadAmount: this.state.loadAmount + this.state.loadIncrement })
                          }}
                          className="cursor-pointer underline font-semibold"
                        >Click to load more images (currently displaying {this.state.loadAmount > this.state.imageNames.length ? this.state.imageNames.length : this.state.loadAmount} / {this.state.imageNames.length})</p>
                      ) : (
                        <p className="font-semibold">No more images to display</p>
                      )
                    }
                  </React.Fragment>
                ) : null
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ViewImagesPage.contextType = authContext;

export default ViewImagesPage;
