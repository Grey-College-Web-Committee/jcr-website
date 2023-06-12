import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import dateFormat from 'dateformat';

class FormalsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isMember: true,
      loaded: false,
      status: 0,
      error: "",
      formals: []
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    let formals;

    try {
      formals = (await api.get("/formals")).data.formals;
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    this.setState({ loaded: true, status: 200, formals });
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

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
          <h1 className="font-semibold text-5xl pb-4">Formals</h1>
          <p className="text-left pb-2">If you have booked onto a formal with college, you will see it in the list below. For each formal, you are able to create or join a seating group to guarantee who you will be sitting with at the formal.</p>
          {this.state.formals.length === 0 && <div className="container mx-auto text-center p-4 md:w-3/5 w-full">
            <p>No formals found.</p>
          </div>}
          <div className="flex flex-col">
            {
              this.state.formals.sort((a, b) => a.closeDate > b.closeDate ? 1 : (a.closeDate < b.closeDate ? -1 : 0)).map((record, i) => (
                <div key={i} className="border-2 border-grey-300 p-2 text-left mt-4">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex flex-col justify-between mt-2 md:ml-2 md:mt-0 flex-grow">
                      <div>
                        <h2 className="font-semibold text-3xl text-center md:text-left">{record.name}</h2>
                        <p className="pb-2 text-lg text-center md:text-left">Seating selection closes: {dateFormat(record.closeDate, "dd/mm/yyyy HH:MM")}</p>
                      </div>
                      <div className="flex flex-row justify-start">
                        <Link to={`/formals/${record.id}/details`} className="w-full md:w-auto">
                          <button
                            className="px-4 py-1 rounded text-lg bg-grey-500 text-white w-full md:w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                          >More Details</button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}

FormalsPage.contextType = authContext;

export default FormalsPage;
