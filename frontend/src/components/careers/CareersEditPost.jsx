import React from 'react';
import { Prompt, Redirect } from 'react-router-dom';
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
      updated: false,
      deleted: false
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

    // Load the details
    try {
      result = await api.get(`/careers/blog/single/${this.state.id}`);
    } catch (error) {
      this.setState({ status: error.response.status, error: error.response.data.error});
      return;
    }

    // Unpack them for easier access
    const { post } = result.data;
    const { title, emailSubject, content } = post;

    this.setState({ loaded: true, post, title, emailSubject, content });
  }

  onInputChange = e => {
    // Standard input change
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), ready: true })
  }

  canSubmit = () => {
    // Checks that all fields are set
    const { title, emailSubject, content } = this.state;
    return (
      (title !== undefined && title !== null && title.length !== 0) &&
      (emailSubject !== undefined && emailSubject !== null && emailSubject.length !== 0) &&
      (content !== undefined && content !== null && content.length !== 0)
    );
  }

  updatePost = async () => {
    // Submits the changes to the post
    // Make sure the fields are all set
    if(!this.canSubmit()) {
      alert("You must fill in all the details in the form first.");
      return;
    }

    this.setState({ disabled: true });

    const { id, title, emailSubject, content } = this.state;

    // Post the contents
    try {
      await api.post("/careers/blog/single", {
        id, title, emailSubject, content
      });
    } catch (error) {
      alert("There was an error processing your post. Please try again later.");
      return;
    }

    // Briefly show a message saying it has been updated
    this.setState({ updated: true, ready: false, disabled: false });

    setTimeout(() => {
      this.setState({
        updated: false
      });
    }, 1000);
  }

  deletePost = async () => {
    // Removes the post
    this.setState({ disabled: true });

    // Use the browser's confirm window to double check
    const certain = window.confirm("Are you sure you want to permanently delete this post?");

    // If they don't want to then abort
    if(!certain) {
      this.setState({ disabled: false });
      return;
    }

    const { id } = this.state;

    // Delete from the server
    try {
      await api.delete(`/careers/blog/single/${id}`);
    } catch (error) {
      alert("There was an error deleting this post. Please try again later.");
      return;
    }

    // Used to changed the page to tell them it was successful
    this.setState({ deleted: true });
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

    // Shown after a successful deletion
    if(this.state.deleted) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-2">Post Deleted</h1>
            <p className="text-center">The post has successfully been deleted.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <Prompt
          when={this.state.ready}
          message="Are you sure you want to leave? You may have unsaved changes. Press 'Cancel' to go back or 'OK' to exit anyway."
        />
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-2">Edit Careers Post</h1>
        </div>
        <div className="w-full md:w-3/5 mx-auto">
          <div className="pb-2">
            <button
              className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              onClick={this.deletePost}
            >Permanently Delete Post</button>
          </div>
          <div>
            <p className="text-justify py-1">You can edit a post that has already been published below. All fields must be filled in before you can submit it. The post will automatically update once you click the button at the bottom.</p>
            <p className="text-justify py-1">If you want to create a link then use the following syntax in the body:</p>
            <pre className="py-1">[Text to display here](url here)</pre>
            <p className="text-justify py-1">The URL must start with https:// otherwise it will be ignored intentionally!</p>
            <p className="text-justify py-1">For example: [Google](https://www.google.com) will produce <a href="https://www.google.com" className="underline font-semibold" target="_blank" rel="noopener noreferrer">Google</a></p>
            <p className="text-justify py-1">Please ensure all links are appropriate as they will be accessible by any JCR member.</p>
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
            { this.state.updated ? (
                <div className="pt-2 pb-2 border-b-2">
                  <p>Post successfully updated!</p>
                </div>
              ) : null
            }
          </fieldset>
        </div>
      </div>
    );
  }
}

export default CareersEditPost;
