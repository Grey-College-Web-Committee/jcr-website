import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import MemberRow from './MemberRow';

const ITEM_PAGE_LIMIT = 200;

class ManageMembershipsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",

      rows: [],

      usernameSearch: "",
      firstNameSearch: "",
      surnameSearch: "",
      hasMembership: "any",
      isHLM: "any",
      yearSearch: "",

      page: 1,
      maxPage: 1,
      changingPage: 1,
      count: 0
    };

    // Change this to your permission
    this.requiredPermission = "jcr.manage";
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) });
  }

  fetchPage = async () => {
    this.setState({ disabled: true });
    const { usernameSearch, firstNameSearch, surnameSearch, hasMembership, isHLM, yearSearch, page } = this.state;

    let content;

    try {
      content = await api.post("/memberships/users/page", {
        usernameSearch, firstNameSearch, surnameSearch, yearSearch, page,
        hasMembership: hasMembership === "any" ? "any" : (hasMembership === "yes" ? true : false), 
        isHLM: isHLM === "any" ? "any" : (isHLM === "yes" ? true : false),
      });
    } catch (error) {
      alert("An error occurred loading the data")
      return;
    }

    const { count, rows } = content.data.users;
    this.setState({ rows, maxPage: Math.ceil(count / ITEM_PAGE_LIMIT), disabled: false, changingPage: page, count })
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

    await this.fetchPage();

    this.setState({ loaded: true });
  }

  changePage = (val) => {
    this.setState({ page: this.state.page + val }, this.fetchPage)
  }

  customChangePage = (e) => {
    let { value } = e.target;

    if(value >= 1 && value <= this.state.maxPage) {
      this.setState({ page: value, changingPage: value }, this.fetchPage);
      return;
    }

    this.setState({ changingPage: value })
  }

  clearCriteria = () => {
    this.setState({
      usernameSearch: "",
      firstNameSearch: "",
      surnameSearch: "",
      hasMembership: "any",
      isHLM: "any",
      yearSearch: "",
      page: 1
    }, this.fetchPage);
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
          <h1 className="font-semibold text-5xl pb-4">Manage JCR Memberships</h1>
          <div>
            <div className="mb-2">
              <h2 className="text-left font-semibold text-2xl">Filters</h2>
              <table>
                <tbody>
                  <tr>
                    <td className="text-left">Username Contains:</td>
                    <td>
                      <input
                        type="text"
                        className="w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                        value={this.state.usernameSearch}
                        name="usernameSearch"
                        onChange={this.onInputChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">First Names Contains:</td>
                    <td>
                      <input
                        type="text"
                        className="w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                        value={this.state.firstNameSearch}
                        name="firstNameSearch"
                        onChange={this.onInputChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">Surname Contains:</td>
                    <td>
                      <input
                        type="text"
                        className="w-64 border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                        value={this.state.surnameSearch}
                        name="surnameSearch"
                        onChange={this.onInputChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">Has Membership:</td>
                    <td>
                      <select
                        value={this.state.hasMembership}
                        name="hasMembership"
                        className="w-64 border rounded py-1 px-1 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                        onChange={this.onInputChange}
                      >
                        <option value="any">Any</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">Is Honourary Life Member:</td>
                    <td>
                      <select
                        value={this.state.isHLM}
                        name="isHLM"
                        className="w-64 border rounded py-1 px-1 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                        onChange={this.onInputChange}
                      >
                        <option value="any">Any</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">Year:</td>
                    <td>
                      <select
                        value={this.state.yearSearch}
                        name="yearSearch"
                        className="w-64 border rounded py-1 px-1 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                        onChange={this.onInputChange}
                      >
                        <option value="">Any</option>
                        <option value="1">First</option>
                        <option value="2">Second</option>
                        <option value="3">Third</option>
                        <option value="4">Fourth / Postgrad</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="flex flex-row justify-start mt-2">
                <button
                  onClick={this.fetchPage}
                  className="px-4 py-1 rounded w-32 bg-blue-900 font-semibold text-white"
                  disabled={this.state.disabled}
                >Search</button>
                <button
                  onClick={this.clearCriteria}
                  className="ml-2 px-4 py-1 rounded w-32 bg-red-900 font-semibold text-white"
                  disabled={this.state.disabled}
                >Clear</button>
              </div>
            </div>
            <div className="font-semibold p-2 border-2 border-red-900 my-2 flex flex-row justify-between items-center">
              <span>Displaying {this.state.rows.length} records out of {this.state.count} total</span>
              <div className="flex flex-row items-center">
                <span>Page 
                  <input 
                    type="number" 
                    className="w-12 border border-gray-900 p-1 mx-1 text-center appearance-none"
                    value={this.state.changingPage}
                    onChange={this.customChangePage}
                    disabled={this.state.disabled}
                  /> 
                / {this.state.maxPage}</span>
                <button
                  onClick={() => this.changePage(-1)}
                  className="ml-2 px-4 py-1 rounded bg-blue-900 font-semibold text-white disabled:bg-gray-500"
                  disabled={this.state.page <= 1 || this.state.disabled}
                >Prev Page</button>
                <button
                  onClick={() => this.changePage(1)}
                  className="ml-2 px-4 py-1 rounded bg-blue-900 font-semibold text-white disabled:bg-gray-500"
                  disabled={this.state.page >= this.state.maxPage || this.state.disabled}
                >Next Page</button>
              </div>
            </div>
            <div>
              <table className="mx-auto border-2 text-left border-red-900 w-full">
                <thead className="bg-red-900 text-white">
                  <tr>
                    <th className="p-2 font-semibold">Username</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">First Names</th>
                    <th className="p-2 font-semibold">Surname</th>
                    <th className="p-2 font-semibold">Year</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">Registered On</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">Last Login</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">HLM?</th>
                    <th className="p-2 font-semibold">Membership Expires On</th>
                    <th className="p-2 font-semibold">Grant/Revoke Membership</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    this.state.rows.map(row => (
                      <MemberRow
                        key={row.id}
                        record={row}
                      />
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ManageMembershipsPage;
