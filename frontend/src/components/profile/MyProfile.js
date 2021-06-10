import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import ImageUploader from 'react-images-upload';
import dateFormat from 'dateformat';

class MyProfile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      user: null,
      imageUpload: null,
      temporaryImageSrc: null,
      disabled: false
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

    let isMember = true;

    // Ensure they are an admin
    if(membershipCheck.data.user.permissions) {
      if(!membershipCheck.data.user.permissions.includes("jcr.member")) {
        isMember = false;
      }
    } else {
      isMember = false;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/profile");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, isMember, user: content.data.user });
  }

  onImageDrop = (image) => {
    if(image.length === 0) {
      return;
    }

    // Set the current image when they select one
    this.setState({ imageUpload: image });

    // Use FileReader to generate the base64 data source
    const reader = new FileReader();

    // Problem is it is async and we don't want to wait for it load before rendering the page
    // So we just re-render once it is ready
    reader.onloadend = () => {
      const temporaryImageSrc = [reader.result];
      this.setState({ temporaryImageSrc });
    }

    // Read the image
    reader.readAsDataURL(image[0]);
  }

  uploadProfilePicture = async () => {
    this.setState({ disabled: true });

    const formData = new FormData();

    let { user, imageUpload } = this.state;

    if(user.id === null) {
      alert("Invalid user ID");
      return;
    }

    if(imageUpload.length === 0) {
      alert("You must upload an image first");
      return;
    }

    formData.append("id", user.id);
    formData.append("image", imageUpload[0]);

    let result;

    try {
      result = await api.post("/profile/picture", formData, {
        headers: { "content-type": "multipart/form-data" }
      });
    } catch (error) {
      alert(error.response.data.error);
      return;
    }

    const { profilePicture } = result.data;
    user.profilePicture = profilePicture;
    this.setState({ disabled: false, user, imageUpload: null, temporaryImageSrc: null });
  }

  makeDisplayName = (user) => {
    const upperCaseFirstName = user.firstNames.split(",")[0];
    const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();

    const upperCaseLastName = user.surname;
    const specialCaseList = ["MC", "MAC"];
    const foundSpecialCase = specialCaseList.filter(c => upperCaseLastName.startsWith(c));

    let lastName = upperCaseLastName.substring(0, 1) + upperCaseLastName.substring(1).toLowerCase();

    if(foundSpecialCase.length !== 0) {
      const c = foundSpecialCase[0].substring(0, 1) + foundSpecialCase[0].substring(1).toLowerCase();
      lastName = upperCaseLastName.substring(c.length);
      lastName = c + lastName.substring(0, 1) + lastName.substring(1).toLowerCase();
    }

    return `${firstName} ${lastName}`;
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

    const { user, isMember } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
          <h1 className="font-semibold text-5xl pb-4">My Profile</h1>
          <div className="text-left mb-2">
            <h2 className="font-semibold text-2xl">My Details</h2>
            <p><span className="font-semibold">Names:</span> { user.firstNames } { user.surname } (Displays as: { this.makeDisplayName(user) })</p>
            <p><span className="font-semibold">Email:</span> { user.email }</p>
            <p><span className="font-semibold">Year:</span> { user.year }</p>
            <p><span className="font-semibold">Membership Details:</span> { user.membershipExpiresAt === null ? "Not a member" : `Expires at ${dateFormat(user.membershipExpiresAt, "dd/mm/yyyy HH:MM")}`}</p>
            <p><span className="font-semibold">Honourary Life Member:</span> { user.hlm ? "Yes" : "No" }</p>
            <p><span className="font-semibold">Consented for events:</span> { user.eventConsent ? "Yes" : "No" }</p>
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-2xl">Profile Picture</h2>
            <p className="py-1">You can change your profile picture on the website. This will appear on the committees and roles page if you have a role within the JCR. It is limited to a 4MB file (which will be compressed on upload). You should upload an image with near equal height and width to prevent it being squashed!</p>
            <div className="w-48">
              <h3 className="py-1 text-xl">Current Picture:</h3>
              <img
                src={user.profilePicture === null ? "/images/default_avatar.png" : `/uploads/images/profile/${user.profilePicture}`}
                alt="Your Profile Picture"
                className="h-auto w-48 border-red-900 border-2"
              />
              <h3 className="py-1 text-xl">Change Picture:</h3>
              <div className="pb-1">
                <ImageUploader
                  withIcon={false}
                  buttonText={"Choose Image"}
                  imgExtension={['.jpg', '.png', '.jpeg']}
                  singleImage={true}
                  onChange={this.onImageDrop}
                  disabled={this.state.disabled}
                  maxFileSize={4194304}
                  label="Max file size: 4mb, accepts jpg, jpeg or png"
                />
              </div>
              {
                this.state.imageUpload === null ? null : (
                  <div className="flex flex-col items-center">
                    <p>Selected Image:</p>
                    <img
                      src={this.state.temporaryImageSrc}
                      alt="Uploaded Image"
                    />
                    <button
                      className="px-4 py-1 mt-2 rounded text-lg bg-grey-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      onClick={this.uploadProfilePicture}
                      disabled={this.state.disabled}
                    >Save Profile Picture</button>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

MyProfile.contextType = authContext;

export default MyProfile;
