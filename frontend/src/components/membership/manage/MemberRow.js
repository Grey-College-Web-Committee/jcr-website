import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';
import dateFormat from 'dateformat';

class MemberRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      expiry: "2023-08-01",
      disabled: false,
      hlm: this.props.record.hlm ? "yes" : "no",
      record: this.props.record
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) });
  }

  onInputChangeHLM = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) }, this.updateHLMStatus);
  }

  updateSelf = async () => {
    this.setState({ disabled: true });

    let userRecord;

    try {
      userRecord = await api.get(`/memberships/user/single/${this.state.record.id}`);
    } catch (error) {
      this.setState({ loaded: false });
      return;
    }

    this.setState({ loaded: true, record: userRecord.data.user, disabled: false, hlm: (userRecord.data.user.hlm ? "yes" : "no") });
  }

  revokeMembership = async (e) => {
    e.preventDefault();
    const confirmation = window.confirm(`You are about to revoke ${this.state.record.username}'s JCR membership. Click OK to confirm.`);

    if(!confirmation) {
      return;
    }

    const { id } = this.state.record;

    try {
      await api.post("/memberships/revoke", { userId: id });
    } catch (error) {
      alert("An error occurred revoking the membership");
      return;
    }

    await this.updateSelf();
  }

  grantMembership = async (e) => {
    e.preventDefault();

    const { expiry } = this.state;

    if(expiry === null || expiry.length === 0) {
      alert("You must set an expiry date");
      return;
    }

    if(new Date(expiry) < new Date()) {
      alert("The expiry date must be in the future");
      return;
    }

    const { id } = this.state.record;

    try {
      await api.post("/memberships/grant", { userId: id, expiry });
    } catch (error) {
      alert("An error occurred granting the membership");
      return;
    }

    await this.updateSelf();
  }

  updateHLMStatus = async () => {
    this.setState({ disabled: true });
    const hlm = this.state.hlm === "yes";
    const { id } = this.state.record;

    try {
      await api.post("/memberships/hlm", { userId: id, hlm });
    } catch (error) {
      alert("An error occurred granting HLM");
      return;
    }

    await this.updateSelf();
  }

  render () {
    const { username, firstNames, surname, year, createdAt, lastLogin, membershipExpiresAt } = this.state.record;

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">{username}</td>
        <td className="p-2 border-r border-gray-400 break-all hidden lg:table-cell">{firstNames}</td>
        <td className="p-2 border-r border-gray-400">{surname}</td>
        <td className="p-2 border-r border-gray-400">{year}</td>
        <td className="p-2 border-r border-gray-400 hidden lg:table-cell">{dateFormat(createdAt, "dd/mm/yyyy HH:MM:ss")}</td>
        <td className="border-r border-gray-400 hidden lg:table-cell">{dateFormat(lastLogin, "dd/mm/yyyy HH:MM:ss")}</td>
        <td className="border-r border-gray-400 hidden lg:table-cell">
          {
            <select
              name="hlm"
              className="md:w-auto w-full h-8 border border-gray-400 disabled:opacity-50"
              onChange={this.onInputChangeHLM}
              value={this.state.hlm}
              disabled={this.state.disabled}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          }
        </td>
        <td className="border-r border-gray-400">{membershipExpiresAt === null ? "N/A" : dateFormat(membershipExpiresAt, "dd/mm/yyyy HH:MM:ss")}</td>
        <td className="p-2 border-r border-gray-400">
          {membershipExpiresAt === null ? (
            <div className="flex flex-col">
              <div>
                <label htmlFor="expiry" className="mr-2">Expires On:</label>
                <input
                  type="date"
                  value={this.state.expiry}
                  name="expiry"
                  onChange={this.onInputChange}
                  className="w-48 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                />
              </div>
              <div className="flex flex-row justify-center mt-2">
                <button
                  className="px-4 py-1 rounded bg-green-700 text-white w-32 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                  onClick={this.grantMembership}
                >Grant</button>
              </div>
            </div>
          ) : (
            <button
              className="px-4 py-1 rounded bg-red-700 text-white w-32 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              onClick={this.revokeMembership}
            >Revoke</button>
          )}
        </td>
      </tr>
    );
  }
}

MemberRow.propTypes = {
  id: PropTypes.number.isRequired,
  displayCondition: PropTypes.func.isRequired
};

export default MemberRow;
