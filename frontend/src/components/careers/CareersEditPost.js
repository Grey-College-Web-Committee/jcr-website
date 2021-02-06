import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import LoadingHolder from '../common/LoadingHolder';

class CareersEditPost extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      id: this.props.match.params.id,
      title: "",
      emailSubject: "",
      content: "",
      disabled: false,
      ready: false,
      updated: false
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

    let result;

    try {
      result = await api.get(`/careers/blog/single/${this.state.id}`);
    } catch (error) {
      alert("An error occurred loading the post.");
      this.setState({ status: 500, error: "Error loading data" });
      return;
    }

    const { post } = result.data;
    const { title, emailSubject, content } = post;

    this.setState({ loaded: true, post, title, emailSubject, content });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), ready: true })
  }

  canSubmit = () => {
    const { title, emailSubject, content } = this.state;
    return (
      (title !== undefined && title !== null && title.length !== 0) &&
      (emailSubject !== undefined && emailSubject !== null && emailSubject.length !== 0) &&
      (content !== undefined && content !== null && content.length !== 0)
    );
  }

  updatePost = async () => {
    if(!this.canSubmit()) {
      alert("You must fill in all the details in the form first.");
      return;
    }

    this.setState({ disabled: true });

    const { id, title, emailSubject, content } = this.state;

    try {
      await api.post("/careers/blog/single", {
        id, title, emailSubject, content
      });
    } catch (error) {
      alert("There was an error processing your post. Please try again later.");
      return;
    }

    this.setState({ updated: true, ready: false, disabled: false });

    setTimeout(() => {
      this.setState({
        updated: false
      });
    }, 1000);
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
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Edit Careers Post</h1>
        </div>
        <div className="w-full md:w-3/5 mx-auto">
          <div>
            <p className="text-justify">You can edit a post that has already been published below. All fields must be filled in before you can submit it. The post will automatically update once you click the button at the bottom.</p>
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
                className="border w-full rounded my-2 h-96 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete=""
                maxLength={50000}
              />
            </div>
            <div className="pt-2 pb-2 border-b-2">
              <button
                className="px-4 py-2 rounded text-xl bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                disabled={this.state.disabled || !this.canSubmit() || !this.state.ready}
                onClick={this.updatePost}
              >{ this.state.updated ? "Updated ✓" : "Update Post" }</button>
            </div>
          </fieldset>
        </div>
      </div>
    );
  }
}

export default CareersEditPost;
