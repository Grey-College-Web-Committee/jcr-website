import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import LoadingHolder from '../common/LoadingHolder';

class CareersAdminPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      title: "",
      emailSubject: "",
      content: "",
      disabled: false,
      success: false
    };

    // Change this to your permission
    this.requiredPermission = "careers.manage";
  }

  // Load the data once the element is ready
  componentDidMount = async () => {
    let adminCheck;

    try {
      adminCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify admin status" });
      return;
    }

    // Ensure they are an admin
    if(adminCheck.data.user.permissions) {
      if(adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if(!adminCheck.data.user.permissions.includes(this.requiredPermission)) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    // Load any required data for the page here

    this.setState({ loaded: true });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  submitPost = async () => {
    if(!this.canSubmit()) {
      alert("You must fill in all the details in the form first.");
      return;
    }

    this.setState({ disabled: true });

    const { title, emailSubject, content } = this.state;

    try {
      await api.post("/careers/blog", {
        title, emailSubject, content
      });
    } catch (error) {
      alert("There was an error processing your post. Please try again later.");
      return;
    }

    this.setState({ success: true });
  }

  canSubmit = () => {
    const { title, emailSubject, content } = this.state;
    return (
      (title !== undefined && title !== null && title.length !== 0) &&
      (emailSubject !== undefined && emailSubject !== null && emailSubject.length !== 0) &&
      (content !== undefined && content !== null && content.length !== 0)
    );
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

    if(this.state.success) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4 w-full md:w-3/5">
            <h1 className="font-semibold text-5xl pb-4">Post Created</h1>
            <p className="text-justify">Your post has successfully been published to the <Link to="/careers" className="underline font-semibold">Careers page!</Link></p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Create Careers Post</h1>
        </div>
        <div className="w-full md:w-3/5 mx-auto">
          <div>
            <p className="text-justify">You can create a new post by filling in the details below. All fields must be filled in before you can submit it. Each post will automatically have the date and time they were published as well as a link to contact the Careers and Alumni Relations Officer directly via email. The subject of this email will be preset by filling in the email subject field below.</p>
          </div>
          <fieldset>
            <div className="pt-2 pb-2 border-b-2">
              <label htmlFor="title" className="flex flex-row justify-start text-xl font-semibold">Post Title</label>
              <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.title.length} characters remaining)</span>
              <input
                type="text"
                name="title"
                value={this.state.title}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete=""
                maxLength={255}
              />
            </div>
            <div className="pt-2 pb-2 border-b-2">
              <label htmlFor="emailSubject" className="flex flex-row justify-start text-xl font-semibold">Automatic Email Subject</label>
              <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.emailSubject.length} characters remaining)</span>
              <input
                type="text"
                name="emailSubject"
                value={this.state.emailSubject}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete=""
                maxLength={255}
              />
            </div>
            <div className="pt-2 pb-2 border-b-2">
              <label htmlFor="content" className="flex flex-row justify-start text-xl font-semibold">Post Contents</label>
              <span className="flex flex-row justify-start text-sm mb-2">({50000 - this.state.content.length} characters remaining)</span>
              <textarea
                name="content"
                value={this.state.content}
                onChange={this.onInputChange}
                className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete=""
                maxLength={50000}
              />
            </div>
            <div className="pt-2 pb-2 border-b-2">
              <button
                className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                disabled={this.state.disabled || !this.canSubmit()}
                onClick={this.submitPost}
              >Create Post</button>
            </div>
          </fieldset>
        </div>
      </div>
    );
  }
}

export default CareersAdminPage;
