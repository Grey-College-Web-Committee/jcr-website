import React from 'react'
import { Redirect, Link } from 'react-router-dom'
import api from '../../utils/axiosConfig.js'
import authContext from '../../utils/authContext.js'
import LoadingHolder from '../common/LoadingHolder'

class FormalsPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      group: null,
      groups: [],
      name: "",
      disabled: false
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  load = async () => {
    let group
    let groups
    let name

    try {
      group = (await api.get(`/formals/${this.props.match.params.id}/group`)).data.group
      groups = (await api.get(`/formals/${this.props.match.params.id}/groups`)).data.groups.map(group => {
        group.final = false
        return group
      })
      name = (await api.get(`/formals/${this.props.match.params.id}/details`)).data.formal.name
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status, disabled: false })
      return
    }

    this.setState({ loaded: true, status: 200, group, groups, name, disabled: false })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    await this.load()
  }

  final = (record, val) => {
    record.final = val
    const { groups } = this.state
    this.setState({ groups })
  }

  consent = async () => {
    this.setState({ disabled: true })
    try {
      await api.post(`/formals/${this.props.match.params.id}/verify`)
      let { group } = this.state
      group.consented = true
      return this.setState({ disabled: false, group })
    } catch {
      alert("Database error!")
      return this.setState({ disabled: false })
    }
  }

  join = async (id) => {
    this.setState({ disabled: true })
    try {
      await api.post(`/formals/${this.props.match.params.id}/group/${id}/join`)
      await this.load()
    } catch {
      alert("Database error!")
      return this.setState({ disabled: false })
    }
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

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
          <h1 className="font-semibold text-5xl pb-4">{this.state.name}</h1>
          {(!this.state.group) ? <>
            <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
              <p>You are not currently in a group.</p>
            </div>
            <Link to={`/formals/${this.props.match.params.id}/groups/create`} className="w-full md:w-auto">
              <button
                className="px-4 py-1 rounded text-lg bg-grey-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >Create Group</button>
            </Link>
            {this.state.groups.length === 0 && <>
              <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
                <p>No groups to join found.</p>
              </div>
            </>}
            {
              this.state.groups.map((record, i) => (
                <div key={i} className="border-2 border-grey-300 p-2 text-left mt-4">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex flex-col justify-between mt-2 md:ml-2 md:mt-0 flex-grow">
                      <div>
                        <p className="pb-2 text-lg text-center md:text-left">Group led by {record.lead}</p>
                      </div>
                      <div className="flex flex-row justify-start my-2 items-center">
                        <p className="text-lg font-semibold">I confirm that this group is my final choice: </p>
                        <input
                          type="checkbox"
                          onChange={(e) => this.final(record, e.target.checked)}
                          checked={record.final}
                          className="p-2 h-6 w-6 align-middle mx-2 rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        />
                      </div>
                      <div className="flex flex-row justify-start">
                        <button
                          onClick={() => this.join(record.id)}
                          className="px-4 py-1 rounded text-lg bg-grey-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                          disabled={this.state.disabled || !record.final}
                        >Join Group</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </> : <>
            <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
              <p>You are currently in a group with lead booker {this.state.group.lead}.</p>
              <p className='mt-5'>You {(this.state.group.consented) ? "have" : "have not yet"} consented to this group assignment.</p>
              <p className='mt-5 mb-2'>Your other group members are:</p>
              <ul className='list-disc list-inside'>
                {this.state.group.members.map((member, i) => <li key={i}>{member}</li>)}
              </ul>
              {!this.state.group.consented && <button
                className="mt-5 px-4 py-1 rounded text-lg bg-grey-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                onClick={this.consent}
                disabled={this.state.disabled}
              >Consent To Group</button>}
            </div>
          </>}
        </div>
      </div>
    )
  }
}

FormalsPage.contextType = authContext

export default FormalsPage
