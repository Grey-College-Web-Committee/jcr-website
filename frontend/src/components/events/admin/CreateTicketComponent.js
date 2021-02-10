import React from 'react'
import PropTypes from 'prop-types'
import CreateTicketCustomRow from './CreateTicketCustomRow';

class CreateTicketComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      description: "",
      maxOfType: "",
      minPeople: "",
      maxPeople: "",
      maxGuests: "",
      memberPrice: "",
      guestPrice: "",
      firstYearReleaseTime: "",
      secondYearReleaseTime: "",
      thirdYearReleaseTime: "",
      fourthYearReleaseTime: "",
      olderYearsCanOverride: true,
      disabled: false,
      customData: {}
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) }, () => {
      const { name, description, maxOfType, minPeople, maxPeople, maxGuests, memberPrice, guestPrice, firstYearReleaseTime, secondYearReleaseTime, thirdYearReleaseTime, fourthYearReleaseTime, olderYearsCanOverride, customData } = this.state;

      this.props.passUp(this.props.id, { name, description, maxOfType, minPeople, maxPeople, maxGuests, memberPrice, guestPrice, firstYearReleaseTime, secondYearReleaseTime, thirdYearReleaseTime, fourthYearReleaseTime, olderYearsCanOverride, customData });
    });
  }

  passUpCustomData = (id, data) => {
    let { customData } = this.state;
    customData[id] = data;
    this.setState({ customData }, () => {
      const { name, description, maxOfType, minPeople, maxPeople, maxGuests, memberPrice, guestPrice, firstYearReleaseTime, secondYearReleaseTime, thirdYearReleaseTime, fourthYearReleaseTime, olderYearsCanOverride, customData } = this.state;

      this.props.passUp(this.props.id, { name, description, maxOfType, minPeople, maxPeople, maxGuests, memberPrice, guestPrice, firstYearReleaseTime, secondYearReleaseTime, thirdYearReleaseTime, fourthYearReleaseTime, olderYearsCanOverride, customData });
    });
  }

  addCustomDataRow = () => {
    let { customData } = this.state;
    const nextId = Object.keys(this.state.customData).length === 0 ? 0 : Math.max(...Object.keys(this.state.customData)) + 1;
    customData[nextId] = {
      name: "",
      required: true,
      type: "dropdown",
      dropdownValues: {}
    };
    this.setState({ customData }, () => {
      const { name, description, maxOfType, minPeople, maxPeople, maxGuests, memberPrice, guestPrice, firstYearReleaseTime, secondYearReleaseTime, thirdYearReleaseTime, fourthYearReleaseTime, olderYearsCanOverride, customData } = this.state;

      this.props.passUp(this.props.id, { name, description, maxOfType, minPeople, maxPeople, maxGuests, memberPrice, guestPrice, firstYearReleaseTime, secondYearReleaseTime, thirdYearReleaseTime, fourthYearReleaseTime, olderYearsCanOverride, customData });
    });
  }

  deleteCustomDataRow = (id) => {
    let { customData } = this.state;
    delete customData[id];
    this.setState({ customData }, () => {
      const { name, description, maxOfType, minPeople, maxPeople, maxGuests, memberPrice, guestPrice, firstYearReleaseTime, secondYearReleaseTime, thirdYearReleaseTime, fourthYearReleaseTime, olderYearsCanOverride, customData } = this.state;

      this.props.passUp(this.props.id, { name, description, maxOfType, minPeople, maxPeople, maxGuests, memberPrice, guestPrice, firstYearReleaseTime, secondYearReleaseTime, thirdYearReleaseTime, fourthYearReleaseTime, olderYearsCanOverride, customData });
    });
  }

  render () {
    return (
      <div className="border-b-2 border-black p-2">
        <fieldset>
          <div className="pb-2 border-b-2">
            <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Ticket Type Name</label>
            <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.name.length} characters remaining)</span>
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
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="description" className="flex flex-row justify-start text-xl font-semibold">Description</label>
            <span className="flex flex-row justify-start text-sm mb-2">({500 - this.state.description.length} characters remaining)</span>
            <textarea
              name="description"
              value={this.state.description}
              onChange={this.onInputChange}
              className="border w-full rounded my-2 h-24 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              disabled={this.state.disabled}
              autoComplete=""
              maxLength={500}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="maxOfType" className="flex flex-row justify-start text-xl font-semibold">Maximum Available of Ticket Type</label>
            <span className="flex flex-row justify-start text-sm pb-2">Limit the amount of each ticket.</span>
            <input
              type="number"
              name="maxOfType"
              value={this.state.maxOfType}
              className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              min={1}
              step={1}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="minPeople" className="flex flex-row justify-start text-xl font-semibold">Minimum People in Group</label>
            <input
              type="number"
              name="minPeople"
              value={this.state.minPeople}
              className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              min={1}
              step={1}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="maxPeople" className="flex flex-row justify-start text-xl font-semibold">Maximum People in Group</label>
            <input
              type="number"
              name="maxPeople"
              value={this.state.maxPeople}
              className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              min={1}
              step={1}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="maxGuests" className="flex flex-row justify-start text-xl font-semibold">Maximum Guests in Group</label>
            <span className="flex flex-row justify-start text-sm pb-2">They count towards the maximum people in the group as well</span>
            <input
              type="number"
              name="maxGuests"
              value={this.state.maxGuests}
              className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              min={1}
              step={1}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="memberPrice" className="flex flex-row justify-start text-xl font-semibold">JCR Member Price</label>
            <input
              type="number"
              name="memberPrice"
              value={this.state.memberPrice}
              className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              min={1}
              step={0.01}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="guestPrice" className="flex flex-row justify-start text-xl font-semibold">Guest Price</label>
            <input
              type="number"
              name="guestPrice"
              value={this.state.guestPrice}
              className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
              min={1}
              step={0.01}
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="firstYearReleaseTime" className="flex flex-row justify-start text-xl font-semibold">First Year Release Time</label>
            <input
              type="datetime-local"
              name="firstYearReleaseTime"
              value={this.state.firstYearReleaseTime}
              className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="secondYearReleaseTime" className="flex flex-row justify-start text-xl font-semibold">Second Year Release Time</label>
            <input
              type="datetime-local"
              name="secondYearReleaseTime"
              value={this.state.secondYearReleaseTime}
              className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="thirdYearReleaseTime" className="flex flex-row justify-start text-xl font-semibold">Third Year Release Time</label>
            <input
              type="datetime-local"
              name="thirdYearReleaseTime"
              value={this.state.thirdYearReleaseTime}
              className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="fourthYearReleaseTime" className="flex flex-row justify-start text-xl font-semibold">Fourth Year Release Time</label>
            <input
              type="datetime-local"
              name="fourthYearReleaseTime"
              value={this.state.fourthYearReleaseTime}
              className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
              onChange={this.onInputChange}
              autoComplete=""
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <label htmlFor="olderYearsCanOverride" className="flex flex-row justify-start text-xl font-semibold">Older Years Can Override Release Time Conditions</label>
            <span className="flex flex-row justify-start text-sm pb-2">Can those in older years book on younger years if the ticket has been released for the younger year yet?</span>
            <input
              type="checkbox"
              name="olderYearsCanOverride"
              checked={this.state.olderYearsCanOverride}
              className="p-2 h-6 w-6 align-middle rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              onChange={this.onInputChange}
              autoComplete=""
            />
          </div>
          <div className="pt-2 pb-2 border-b-2">
            <span htmlFor="olderYearsCanOverride" className="flex flex-row justify-start text-xl font-semibold">Custom Data</span>
            <span className="flex flex-row justify-start text-sm pb-2">This will create a form (per individual in the group) where they can submit additional information (e.g. dietary requirements)</span>
            <div className="flex flex-row justify-start">
              <button
                className="px-4 py-1 rounded bg-green-900 text-white w-48 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                onClick={this.addCustomDataRow}
              >Add Custom Field</button>
            </div>
            <div>
              {
                Object.keys(this.state.customData).map(id => (
                  <div className="flex flex-col border-2 border-black p-2 mt-2" key={id}>
                    <button
                      className="px-4 py-1 rounded bg-red-900 text-white w-48 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      onClick={() => this.deleteCustomDataRow(id)}
                    >Remove Field</button>
                    <CreateTicketCustomRow
                      key={id}
                      id={id}
                      passUp={this.passUpCustomData}
                      data={this.state.customData[id]}
                    />
                  </div>
                ))
              }
            </div>
          </div>
        </fieldset>
      </div>
    )
  }
}

export default CreateTicketComponent;
