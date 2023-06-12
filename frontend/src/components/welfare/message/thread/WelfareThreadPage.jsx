import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig.js';
import authContext from '../../../../utils/authContext.js';
import LoadingHolder from '../../../common/LoadingHolder';
import dateFormat from 'dateformat';

class WelfareThreadPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      message: "",
      disabled: false,
      id: this.props.match.params.id,
      messages: [],
      thread: {}
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

    const { id } = this.state;

    if(id === undefined || id === null) {
      this.setState({ status: 400, loaded: false });
      return;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get(`/welfare/messages/thread/${id}`);
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let { messages, thread } = content.data;

    // reverse sort
    messages = messages.sort((a, b) => {
      return a.id > b.id ? -1 : (a.id < b.id ? 1 : 0);
    });

    this.setState({ loaded: true, status: 200, messages, thread });
  }

  writeMessage = async () => {
    this.setState({ disabled: true });
    let { message } = this.state;

    if(message === undefined || message === null) {
      alert("You cannot submit an empty message");
      this.setState({ disabled: false });
      return;
    }

    message = message.trim();

    if(message.length === 0) {
      alert("You cannot submit an empty message");
      this.setState({ disabled: false });
      return;
    }

    let result;

    try {
      result = await api.post("/welfare/messages/message", { threadId: this.state.id, message });
    } catch (error) {
      alert("There was an error submitting your message");
      return;
    }

    let { messages } = this.state;
    messages.unshift(result.data.message);

    this.setState({ disabled: false, message: "" });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
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
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Anonymous Thread</h1>
          <div className="text-justify my-2">
            <h2 className="text-left font-semibold text-2xl">Write A Message</h2>
            <fieldset>
              <div className="pb-2 flex flex-col">
                <div className="w-full pb-1">
                  <textarea
                    name="message"
                    value={this.state.message}
                    onChange={this.onInputChange}
                    className="w-full border rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    disabled={this.props.disabled}
                    autoComplete=""
                    maxLength={10000}
                  />
                </div>
                <div className="w-full pb-1 flex flex-row justify-center">
                  <button
                    className="px-4 py-1 rounded bg-green-700 text-white w-64 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.state.disabled}
                    onClick={this.writeMessage}
                  >Write Message</button>
                </div>
              </div>
            </fieldset>
          </div>
          <div className="text-justify my-2">
            <div className="flex-col w-full md:w-3/5 mx-auto">
              { this.state.messages.map((message, i) => {
                const clazz = message.from === "user" ? "justify-end text-left ml-auto" : "justify-start text-left mr-auto border-blue-700";
                const bottomClazz = message.from === "user" ? "text-right" : "text-left";

                return (
                  <div className={`border-2 flex-col rounded w-full p-2 md:w-1/2 mb-2 ${clazz}`} key={i}>
                    <div>
                      { message.content.split("\n").map((line, j) => (
                        <p key={j}>{line}</p>
                      ))}
                    </div>
                    <div className={`text-sm italic ${bottomClazz}`}>
                      <p>Sent {dateFormat(message.createdAt, "dd/mm/yyyy HH:MM")}</p>
                    </div>
                  </div>
                )
              }) }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

WelfareThreadPage.contextType = authContext;

export default WelfareThreadPage;
