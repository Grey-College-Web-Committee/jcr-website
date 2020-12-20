import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';
import dateFormat from 'dateformat';

class MemberRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      record: {},
      expiry: "2021-09-01",
      disabled: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) });
  }

  componentDidMount = async () => {
    await this.updateSelf();
  }

  updateSelf = async () => {
    this.setState({ disabled: true });

    let userRecord;

    try {
      userRecord = await api.get(`/memberships/user/single/${this.props.id}`);
    } catch (error) {
      console.log({error})
      this.setState({ loaded: false });
      return;
    }

    this.setState({ loaded: true, record: userRecord.data.user, disabled: false });
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

  render () {
    if(!this.state.loaded) return null;
    if(!this.props.displayCondition(this.state.record)) return null;

    const { username, firstNames, surname, createdAt, lastLogin, membershipExpiresAt } = this.state.record;

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">{username}</td>
        <td className="p-2 border-r border-gray-400 break-all">{firstNames}</td>
        <td className="p-2 border-r border-gray-400">{surname}</td>
        <td className="p-2 border-r border-gray-400">{dateFormat(createdAt, "dd/mm/yyyy hh:MM:ss")}</td>
        <td className="border-r border-gray-400 hidden sm:table-cell">{dateFormat(lastLogin, "dd/mm/yyyy hh:MM:ss")}</td>
        <td className="border-r border-gray-400 hidden sm:table-cell">{membershipExpiresAt === null ? "N/A" : dateFormat(membershipExpiresAt, "dd/mm/yyyy hh:MM:ss")}</td>
        <td className="p-2 border-r border-gray-400">
          {membershipExpiresAt === null ? (
            <div className="flex flex-col">
              <div>
                <label htmlFor="expiry">Expires On:</label>
                <input
                  type="date"
                  value={this.state.expiry}
                  name="expiry"
                  onChange={this.onInputChange}
                />
              </div>
              <button
                onClick={this.grantMembership}
              >Grant</button>
            </div>
          ) : (
            <button
              onClick={this.revokeMembership}
            >Revoke</button>
          )}
        </td>
      </tr>
    );
  }
}

export default MemberRow;
