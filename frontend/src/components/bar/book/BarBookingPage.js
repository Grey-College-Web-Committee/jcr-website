import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import authContext from '../../../utils/authContext.js';
import LoadingHolder from '../../common/LoadingHolder';
import dateFormat from 'dateformat';

class BarBookingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      availableInfo: {},
      disabled: false
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    try {
      await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify membership status" });
      return;
    }

    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/bar/book/available");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, availableInfo: content.data.availableInfo });
  }

  bookTable = async (date) => {
    this.setState({ disabled: true });

    let result;

    try {
      result = await api.post("/bar/book", { date });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    let { availableInfo } = this.state;
    availableInfo[date].bookingId = result.data.bookingId;
    availableInfo[date].availableCount -= 1;

    this.setState({ disabled: false, availableInfo });
  }

  cancelBooking = async (date, id) => {
    this.setState({ disabled: true });

    let result;

    try {
      result = await api.post("/bar/book/cancel", { id });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    let { availableInfo } = this.state;
    availableInfo[date].bookingId = null;
    availableInfo[date].availableCount += 1;

    this.setState({ disabled: false, availableInfo });
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

    const { availableInfo } = this.state;

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Book a Table</h1>
          <p className="text-left">The college bar will be reopening at the start of Easter term! You must book a table in advance. They release 3 days in advance at midnight. There are 20 tables available each night with 6 seats each. <span className="font-semibold">You must follow COVID-19 regulations at all times.</span> This includes maintaining social distancing and wearing a mask when you are not seated at your table.</p>
          <p className="text-left">When you are at the bar, please <Link to="/bar" className="underline font-semibold">use this website to order your drinks</Link> and a member of staff will collect payment from your table and bring your drinks to you.</p>
          <div className="flex-col flex w-full md:w-3/5 mx-auto">
            {
              Object.keys(availableInfo).map(date => (
                <div className="border mt-4 p-2 w-full text-left text-lg">
                  <p className="text-left text-2xl font-semibold">Book for {dateFormat(date, "dd/mm/yyyy")}</p>
                  {
                    availableInfo[date].bookingId === null ? (
                      <div>
                        {
                          availableInfo[date].availableCount === 0 ? (
                            <p>There are no more tables available for this night.</p>
                          ) : (
                            <div>
                              <p>Available Tables: {availableInfo[date].availableCount}</p>
                              <button
                                disabled={this.state.disabled}
                                onClick={() => this.bookTable(date)}
                                className="mt-2 px-4 py-1 rounded bg-grey-900 text-white md:w-auto w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                              >Book Now</button>
                            </div>
                          )
                        }
                      </div>
                    ) : (
                      <div>
                        <p>You already have a booking for this night.</p>
                        <button
                          disabled={this.state.disabled}
                          className="mt-2 px-4 py-1 rounded bg-red-900 text-white md:w-auto w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                          onClick={() => this.cancelBooking(date, availableInfo[date].bookingId)}
                        >Cancel</button>
                      </div>
                    )
                  }
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}

BarBookingPage.contextType = authContext;

export default BarBookingPage;
