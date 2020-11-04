import React from 'react';
import api from '../../../utils/axiosConfig';
import ApprovalButton from './ApprovalButton';

class AdminGymPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      status: 0,
      message: "",
      memberships: []
    };
  }

  componentDidMount = async () => {
    let query;

    try {
      query = await api.get("/gym/all");
    } catch (error) {
      this.setState({ status: error.response.status, message: error.response.data.message, loaded: true });
      return;
    }

    const memberships = query.data.memberships;

    this.setState({ loaded: true, status: query.status, memberships });
  }

  render () {
    if(!this.state.loaded) {
      return (
        <React.Fragment>
          <h1>Loading...</h1>
        </React.Fragment>
      );
    }

    if(this.state.status !== 200) {
      return (
        <React.Fragment>
          <h1>Non-200 Status {this.state.status}</h1>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <h1>View Gym Memberships</h1>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Purchase Time</th>
              <th>Approved</th>
              <th>Approve Membership</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.memberships.map((membership, index) => (
                <tr key={index}>
                  <td>{membership.User.username}</td>
                  <td>{membership.createdAt}</td>
                  <td>{membership.approved ? "Yes" : "No"}</td>
                  <td><ApprovalButton id={membership.id} approved={membership.approved} /></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </React.Fragment>
    )
  }
}

export default AdminGymPage;
