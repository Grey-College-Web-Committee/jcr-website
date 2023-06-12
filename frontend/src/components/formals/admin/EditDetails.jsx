import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';

class EditDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      name: '',
      disabled: false,
      date: ''
    };

    // Change this to your permission
    this.requiredPermission = "formals.manage";
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  load = async () => {
    // Once the component is ready we can query the API
    let details;

    try {
      details = (await api.get(`/formals/${this.props.id}/details`)).data.formal;
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    let localDate = new Date(details.closeDate)
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset())
    localDate = localDate.toISOString().slice(0, 16)

    this.setState({ loaded: true, status: 200, name: details.name, date: localDate });
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
    if (adminCheck.data.user.permissions) {
      if (adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if (!adminCheck.data.user.permissions.includes(this.requiredPermission)) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    await this.load()
  }

  edit = async () => {
    this.setState({ disabled: true })
    try {
      await api.post(`/formals/${this.props.id}/edit`, { name: this.state.name, closeDate: (new Date(this.state.date)).toJSON() })
      await this.load()
    } catch {
      alert("Database error!")
    }
    alert("Changes saved!")
    this.setState({ disabled: false })
  }

  download = () => {
    window.open(`/api/formals/${this.props.id}/csv`)
  }

  render() {
    if (!this.state.loaded) {
      if (this.state.status !== 200 && this.state.status !== 0) {
        return (
          <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      return (
        <LoadingHolder />
      );
    }

    if (this.state.success) {
      return (
        <Redirect to={`/formals/admin`} />
      )
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">{this.state.name}</h1>
          <div className="border p-2 text-left my-1 flex flex-col">
            <div className="pb-2">
              <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Formal Name</label>
              <input
                type="text"
                name="name"
                value={this.state.name}
                onChange={this.onInputChange}
                className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                disabled={this.state.disabled}
                autoComplete=""
                maxLength={255}
              />
            </div>
            <div className='pb-2'>
              <label htmlFor="date" className="flex flex-row justify-start text-xl font-semibold">Close Date</label>
              <span className="flex flex-row justify-start text-sm mb-2">This is the date after which no more groups can be formed.</span>
              <input
                type="datetime-local"
                name="date"
                value={this.state.date}
                className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                onChange={this.onInputChange}
                disabled={this.state.disabled}
                autoComplete=""
              />
            </div>
            <button
              className="bg-grey-900 p-1 text-white w-auto disabled:opacity-50"
              disabled={this.state.disabled}
              onClick={this.edit}
            >Save Changes</button>
          </div>
          <div className="border p-2 text-left my-1 flex flex-col">
          <div className='pb-2'>
              <label className="flex flex-row justify-start text-xl font-semibold">Get CSV of Groups</label>
              <span className="flex flex-row justify-start text-sm mb-2">After the close date, groups can no longer be edited by attendees. However, verifications can continue to be accepted so this data may vary slightly if re-downloaded.</span>
              </div>
            <button
              className="bg-grey-900 p-1 text-white w-auto disabled:opacity-50"
              disabled={this.state.disabled}
              onClick={this.download}
            >Download Groups</button>
          </div>
        </div>
      </div>
    );
  }
}

export default EditDetails;
