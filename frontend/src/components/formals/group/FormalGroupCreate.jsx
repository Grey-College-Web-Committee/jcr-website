import React from 'react'
import { Redirect } from 'react-router-dom'
import api from '../../../utils/axiosConfig.js'
import authContext from '../../../utils/authContext.js'
import LoadingHolder from '../../common/LoadingHolder.jsx'
import MemberSearch from './MemberSearch';

class FormalsPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      disabled: false,
      error: "",
      name: "",
      attendees: [],
      maxMembers: 15,
      minPeople: 2,
      submitError: '',
      booked: false,
      allowOthers: false
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    let name

    try {
      name = (await api.get(`/formals/${this.props.match.params.id}/details`)).data.formal.name
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status })
      return
    }

    this.setState({ loaded: true, status: 200, name })
  }

  addToGroup = (details) => {
    let { attendees } = this.state
    attendees.push(details)
    this.setState({ attendees })
    return true
  }

  removeFromGroup = (username) => {
    let attendees = this.state.attendees.filter(attendee => attendee.username !== username)
    this.setState({ attendees })
  }

  submitGroup = async () => {
    this.setState({ disabled: true, submitError: "" });

    const { attendees, maxMembers, minPeople } = this.state;
    const totalMembers = attendees.length;

    if (totalMembers < minPeople) {
      this.setState({ disabled: false, submitError: `You must have at least ${minPeople} people in your group` });
      return;
    }

    if (totalMembers > maxMembers) {
      this.setState({ disabled: false, submitError: `You can only have a maximum of ${maxMembers} people in your group` });
      return;
    }

    try {
      await api.post(`/formals/${this.props.match.params.id}/group`, { attendees: this.state.attendees.map(attendee => attendee.email), allowOthers: this.state.allowOthers });
    } catch (error) {
      alert(error.response.data.error);
      return this.setState({ disabled: false });
    }

    this.setState({ disabled: true, booked: true });
  }

  render() {
    if (!this.state.loaded) {
      if (this.state.status !== 200 && this.state.status !== 0) {
        return (
          <Redirect to={`/errors/${this.state.status}`} />
        )
      }

      return (
        <LoadingHolder />
      )
    }

    if (this.state.booked) {
      return (
        <Redirect to={`/formals/${this.props.match.params.id}/details`} />
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">{this.state.name}</h1>
          <div className="border border-gray-500 w-full md:w-3/5 mx-auto p-2 text-justify">
            <h2 className="font-semibold text-2xl pb-2">Create Group</h2>
            <MemberSearch
              title="Add Formal Attendees"
              disabled={this.state.disabled || this.state.attendees.length >= this.state.maxMembers}
              addMember={(details) => this.addToGroup(details)}
              formalId={this.props.match.params.id}
              rejectIf={(details) => {
                return this.state.attendees.filter(attendee => attendee.email === details.email).length > 0;
              }}
              disabledMessage="Your group is full. Please remove a member of the group to add new members."
            />
            <div className="py-1">
              <table className="mx-auto border-2 text-left border-red-900 w-full">
                <thead className="bg-red-900 text-white">
                  <tr>
                    <th className="p-2 font-semibold">Username</th>
                    <th className="p-2 font-semibold">Name</th>
                    <th className="p-2 font-semibold">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    this.state.attendees.map(details => {
                      const { name, username } = details

                      return (
                        <tr
                          className="text-center border-b border-gray-400"
                          key={username}
                        >
                          <td className="p-2 border-r border-gray-400">
                            {username}
                          </td>
                          <td className="p-2 border-r border-gray-400">
                            {name}
                          </td>
                          <td className="p-2 border-r border-gray-400">
                            <button
                              disabled={this.state.disabled}
                              onClick={() => this.removeFromGroup(username)}
                              className="px-4 py-1 rounded bg-red-900 text-white md:w-auto w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                            >Remove</button>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
            <div className="flex flex-row justify-start my-2 items-center">
              <p className="text-lg font-semibold">Allow others to join your group?</p>
              <input
                type="checkbox"
                name="allowOthers"
                onChange={this.onInputChange}
                checked={this.state.allowOthers}
                className="p-2 h-6 w-6 align-middle mx-2 rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              />
            </div>
            <div className="py-1">
              <p className="py-1 font-semibold">Please note that you cannot change your group once you have submitted it so please double check the details are entered correctly!</p>
              <p className="py-1">Each member of your group will receive an email to confirm they wish to join the group.</p>
              {this.state.attendees.length < this.state.minPeople ? (
                <p className="py-1">Groups require a minimum of {this.state.minPeople} people before you can book.</p>
              ) : (
                <button
                  onClick={this.submitGroup}
                  className="px-4 py-2 text-lg rounded bg-red-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  disabled={this.state.disabled}
                >Confirm Booking</button>
              )}
              {
                this.state.submitError.length === 0 ? null : (
                  <p className="py-1 text-red-900 font-semibold">{this.state.submitError}</p>
                )
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

FormalsPage.contextType = authContext

export default FormalsPage
