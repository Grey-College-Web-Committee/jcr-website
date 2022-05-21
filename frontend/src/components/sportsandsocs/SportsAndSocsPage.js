import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import LoadingHolder from '../common/LoadingHolder';
import SportsAndSocsItem from './SportsAndSocsItem';

class SportsAndSocsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      content: [],
      sportsAndSocs: [],
      typeFilter: "any",
      nameFilter: ""
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Call the API here initially and then use this.setState to render the content
  componentDidMount = async () => {
    // Once the component is ready we can query the API
    let content;

    try {
      content = await api.get("/sportsandsocs");
    } catch (error) {
      this.setState({ loaded: false, status: error.response.status });
      return;
    }

    const { sportsAndSocs } = content.data;

    let sortedSaSs = sportsAndSocs.sort((a, b) => {
      return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0)
    })

    this.setState({ loaded: true, status: 200, sportsAndSocs: sortedSaSs });
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

    const { nameFilter, typeFilter } = this.state;

    console.log(this.context)

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Sports and Societies</h1>
          <div className="text-left mb-2">
            <p className="mb-2">At Grey, we offer one of the widest range of Sports and Societies (more commonly referred to as 'Sport and Socs') out of any other colleges in Durham. From the mainstream, to the downright bizarre, we are confident that there will be at least one to suit your taste! If you want to start your own society or sports team then you just need to register it with the JCR.
              {
                this.context?.username ? (
                  <span>To do this, please <a href="mailto:grey.sportssocieties@durham.ac.uk?subject=New%20Sport%20or%20Society" target="_blank" className="font-semibold underline" rel="noopener noreferrer">email the Sports and Socs Officer by clicking here.</a></span>
                ) : null
              }
            </p>
            <p>If you want your sport, society or committee added to this page or want to update the details about it please
              {
                this.context?.username ? (
                  <span> <a href="mailto:grey.website@durham.ac.uk" target="_blank" className="font-semibold underline" rel="noopener noreferrer">contact the Website Editor by clicking here.</a></span>
                ) : (
                  <span> contact the Website Editor.</span>
                )
              }

            </p>
          </div>
          <div className="text-left mb-2">
            <h2 className="font-semibold text-2xl">Filter</h2>
            <p>You can filter the sports, societies and committees below by changing the filter options. Changes will automatically take effect.</p>
            <div className="py-1">
              <label forName="nameFilter" className="w-12 inline-block mr-1">Name:</label>
              <input
                className={`w-full md:w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400`}
                type="text"
                name="nameFilter"
                value={this.state.nameFilter}
                onChange={this.onInputChange}
              />
            </div>
            <div className="py-1">
              <label forName="typeFilter" className="w-12 inline-block mr-1">Type: </label>
              <select
                className={`w-full md:w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400`}
                name="typeFilter"
                value={this.state.typeFilter}
                onChange={this.onInputChange}
              >
                <option value="any">Any</option>
                <option value="Sport">Sport</option>
                <option value="Society">Society</option>
                <option value="Committee">Committee</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3 2xl:gap-4 auto-rows-auto">
            {
              this.state.sportsAndSocs.filter(entry => {
                return entry.name.toLowerCase().includes(nameFilter.toLowerCase()) && (typeFilter === "any" || entry.type === typeFilter)
              }).map((entry, i) => (
                <SportsAndSocsItem
                  {...entry}
                />
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}

SportsAndSocsPage.contextType = authContext;

export default SportsAndSocsPage;
