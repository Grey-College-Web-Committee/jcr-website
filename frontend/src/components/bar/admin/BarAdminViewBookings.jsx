import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';

class BarAdminViewBookings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      date: dateFormat(new Date(), "yyyy-mm-dd"),
      tables: null
    };

    // Change this to your permission
    this.requiredPermission = "bar.manage";
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
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

    // Load any required data for the page here

    this.setState({ loaded: true });
  }

  loadDate = async () => {
    const { date } = this.state;

    if(date === null) {
      alert("You must select a date");
      return;
    }

    let result;

    try {
      result = await api.post("/bar/book/admin/view", { date });
    } catch (error) {
      alert(error.response.data.error);
      return;
    }

    this.setState({ tables: result.data.bookings });
  }

  makeDisplayName = (user) => {
    const upperCaseFirstName = user.firstNames.split(",")[0];
    const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();

    const upperCaseLastName = user.surname;
    const specialCaseList = ["MC", "MAC"];
    const foundSpecialCase = specialCaseList.filter(c => upperCaseLastName.startsWith(c));

    let lastName = upperCaseLastName.substring(0, 1) + upperCaseLastName.substring(1).toLowerCase();

    // Fix special cases like McDonald appearing as Mcdonald
    if(foundSpecialCase.length !== 0) {
      const c = foundSpecialCase[0].substring(0, 1) + foundSpecialCase[0].substring(1).toLowerCase();
      lastName = upperCaseLastName.substring(c.length);
      lastName = c + lastName.substring(0, 1) + lastName.substring(1).toLowerCase();
    }

    // Fix hyphens
    if(lastName.includes("-")) {
      let capNext = false;
      let newLastName = [];

      for(const i in lastName) {
        if(capNext) {
          newLastName.push(lastName[i].toUpperCase());
          capNext = false;
          continue;
        }

        newLastName.push(lastName[i]);
        capNext = lastName[i] === "-";
      }

      lastName = newLastName.join("")
    }

    return `${firstName} ${lastName}`;
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

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">View Bookings</h1>
          <div className="flex flex-col">
            <div className="my-1">
              <label className="mr-2 text-lg">Date:</label>
              <input
                type="date"
                className="shadow w-auto border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                name="date"
                onChange={this.onInputChange}
                value={this.state.date}
              />
            </div>
            <div className="my-1">
              <button
                className="mt-2 px-4 py-1 rounded bg-red-900 text-white md:w-auto w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 text-lg"
                onClick={this.loadDate}
              >Find Bookings</button>
            </div>
          </div>
          {this.state.tables !== null ? (
            <div className="mt-2">
              {
                this.state.tables.length === 0 ? (
                  <p>No tables for this date have been booked.</p>
                ) : (
                  <table className="mx-auto border-2 text-left border-red-900 w-full">
                    <thead className="bg-red-900 text-white">
                      <tr>
                        <th className="p-2 font-semibold">Booker Username</th>
                        <th className="p-2 font-semibold">Guests</th>
                        <th className="p-2 font-semibold">Booked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        this.state.tables.map((row, i) => (
                          <tr className="text-center border-b border-gray-400" key={i}>
                            <td className="p-2 border-r border-gray-400">{row.User.username}</td>
                            <td className="p-2 border-r border-gray-400 text-left">
                              <ul className="list-inside list-disc">
                                <li>{this.makeDisplayName(row.User)} (Lead Booker)</li>
                                {
                                  row.BarBookingGuests.map((guest, j) => (
                                    <li key={j}>{guest.name}</li>
                                  ))
                                }
                              </ul>
                            </td>
                            <td className="p-2 border-r border-gray-400">{dateFormat(row.createdAt, "dd/mm/yyyy HH:MM:ss")}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                )
              }
            </div>
          ) : (
            <p>Please select a date</p>
          )}
        </div>
      </div>
    );
  }
}

export default BarAdminViewBookings;
