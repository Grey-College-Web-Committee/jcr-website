import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import ImageUploader from 'react-images-upload';

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
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">My Profile</h1>
          <div className="text-left">
            <h2 className="font-semibold text-2xl">My Details</h2>
            <p>Names: { user.firstNames } { user.surname }</p>
            <p>Email: { user.email }</p>
            <p>Year: { user.year }</p>
            <p>Membership Details: { user.membershipExpiresAt === null ? "Not a member" : `Expires on ${user.membershipExpiresAt}`}</p>
            <p>Honourary Life Member: { user.hlm ? "Yes" : "No" }</p>
            <p>Consented for events: { user.eventConsent ? "Yes" : "No" }</p>
          </div>
          <div className="text-left">>
            <h2 className="font-semibold text-2xl">Profile Picture</h2>
            <p>You can change your profile picture on the website. This will appear on the committees and roles page if you have a role within the JCR. It is limited to a 2MB file and it is advised to upload an image with near equal height and width to prevent it being squashed!</p>
            <p>Current Picture:</p>
            <img
              src={user.profilePicture === null ? "/images/default_avatar.png" : `/uploads/images/profile/${user.profilePicture}`}
              alt="Your Profile Picture"
              className="w-48"
            />
            <ImageUploader
              withIcon={false}
              buttonText={"Choose Image"}
              imgExtension={['.jpg', '.png']}
              singleImage={true}
              onChange={this.onImageDrop}
              disabled={this.state.disabled}
              maxFileSize={2000000}
              label="Max file size: 2mb, accepts jpg or png"
            />
            {
              this.state.imageUpload === null ? (
                <p>No image selected</p>
              ) : (
                <div className="flex flex-col items-center">
                  <p>Selected Image:</p>
                  <img
                    src={this.state.temporaryImageSrc}
                    alt="Uploaded Image"
                    className="h-auto w-48"
                  />
                  <button
                    onClick={this.uploadProfilePicture}
                    disabled={this.state.disabled}
                  >Save Profile Picture</button>
                </div>
              )
            }
          </div>
        </div>
      </div>
    );
  }
}

MyProfile.contextType = authContext;

export default MyProfile;
