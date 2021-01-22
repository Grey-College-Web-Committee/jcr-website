import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import config from '../../../config.json';
import LoadingHolder from '../../common/LoadingHolder';

import WelfareMessageRow from './WelfareMessageRow';

class WelfareMessagingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      content: [],
      title: "",
      disabled: false,
      redirect: false,
      redirectId: null
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
      content = await api.get("/welfare/messages/threadIds");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, threads: content.data.threads });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  makeNewThread = async () => {
    this.setState({ disabled: true });
    let { title } = this.state;

    if(title === null || title === undefined || title.length === 0) {
      title = "(None Set)";
    }

    title = title.trim();

    let result;

    try {
      result = await api.post("/welfare/messages/thread", { title });
    } catch (error) {
      alert("Unable to create a new thread at this time. Try again later.");
      return;
    }

    const { threadId } = result.data;
    this.setState({ redirect: true, redirectId: threadId });
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

    if(this.state.redirect) {
      return (
        <Redirect to={`/welfare/message/thread/${this.state.redirectId}`} />
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Anonymous Messaging</h1>
          <div className="text-justify my-2">
            <p>You can start a new thread to contact the welfare team anonymously. Although you will be able to come back to your conversations, we <span className="underline font-semibold">will never</span> show any personal details to the Welfare team and your messages will be entirely anonymous and only viewable by the Senior Welfare Officers. None of your messages can be linked back to your account and you can delete threads after you have finished with them at which point they will be entirely deleted from the server and will be unrecoverable. The Senior Welfare Officers will be notified when you contact them. You can opt to receive an email when they respond.</p>
          </div>
          <div className="text-justify my-2">
            <h2 className="text-left font-semibold text-2xl">Contact Us</h2>
            <fieldset>
              <div className="pb-2 flex flex-row">
                <div className="flex-shrink-0 flex flex-col justify-center">
                  <label htmlFor="title" className="w-40 inline-block font-semibold">Optional Title:</label>
                </div>
                <div className="flex-grow">
                  <input
                    type="text"
                    name="title"
                    value={this.state.title}
                    onChange={this.onInputChange}
                    className={`w-full rounded border py-1 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50`}
                    placeholder="Title..."
                    disabled={this.state.disabled}
                    maxLength={255}
                    autoComplete=""
                  />
                </div>
              </div>
            </fieldset>
            <button
              className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              onClick={this.makeNewThread}
              disabled={this.state.disabled}
            >Create A New Thread</button>
          </div>
          <div className="text-justify my-2">
            <h2 className="text-left font-semibold text-2xl">My Threads</h2>
            {
              this.state.threads.length === 0 ? (
                <p className="my-1 font-semibold">You have no open threads.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Title</th><th>Last Message Date</th><th>View Thread</th><th>Delete Thread</th>
                    </tr>
                  </thead>
                  <tbody>
                    { this.state.threads.map((thread, i) => (
                      <WelfareMessageRow
                        key={i}
                        threadId={thread.id}
                      />
                    ))}
                  </tbody>
                </table>
              )
            }
            <table>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

WelfareMessagingPage.contextType = authContext;

export default WelfareMessagingPage;
