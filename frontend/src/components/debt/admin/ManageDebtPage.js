import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../utils/axiosConfig';
import LoadingHolder from '../../common/LoadingHolder';
import DebtRow from './DebtRow';

class ManageDebtPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      debts: null,
      username: "",
      amount: 0,
      description: "",
      addDisabled: false,
      total: 0
    };

    // Change this to your permission
    this.requiredPermission = "debt.manage";
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

    let content;

    // Load all of the debt
    try {
      content = await api.get("/debt/all");
    } catch (error) {
      this.setState({ loaded: true, status: error.response.status, error: error.response.data.error });
      return;
    }

    const { debts } = content.data;
    const total = debts.map(record => Number(record.amount)).reduce((acc, value) => acc + value, 0);

    this.setState({ loaded: true, debts, total });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) });
  }

  canCreateDebt = () => {
    const { username, amount, description } = this.state;

    return (
      (username !== undefined && username !== null && username.length === 6) &&
      (amount !== undefined && amount !== null && amount.length !== 0 && Number(amount) > 0) &&
      (description !== undefined && description !== null && description.length !== 0 && description.length < 10000)
    );
  }

  createDebt = async () => {
    this.setState({ addDisabled: true });
    const { username, amount, description } = this.state;

    if(!this.canCreateDebt()) {
      alert("Please check the data entered");
      return;
    }

    let result;

    try {
      result = await api.post("/debt", {
        username, amount, description
      });
    } catch (error) {
      alert(error.response.data.error)
      this.setState({ addDisabled: false });
      return;
    }

    let { debts } = this.state;

    debts.push(result.data.debt);
    const total = debts.map(record => Number(record.amount)).reduce((acc, value) => acc + value, 0);

    this.setState({ addDisabled: false, username: "", amount: 0, description: "", debts, total });
  }

  onRowDelete = (debt) => {
    const { debtId } = debt;
    let { debts } = this.state;
    debts = debts.filter(debt => debt.debtId !== debtId);
    const total = debts.map(record => Number(record.amount)).reduce((acc, value) => acc + value, 0);
    this.setState({ debts, total });
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
          <h1 className="font-semibold text-5xl pb-4">Manage Debt</h1>
          <div className="mb-4">
            <h2 className="text-left font-semibold text-2xl">Add Debt</h2>
            <div className="pt-2 pb-2 border-b-2">
              <label htmlFor="username" className="flex flex-row justify-start text-xl font-semibold">Username:</label>
              <span className="flex flex-row justify-start text-sm mb-2">(Must be 6 characters)</span>
              <input
                type="text"
                className="w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                value={this.state.username}
                name="username"
                onChange={this.onInputChange}
                maxLength={6}
                autoComplete=""
                disabled={this.state.addDisabled}
              />
            </div>
            <div className="pt-2 pb-2 border-b-2">
              <label htmlFor="amount" className="flex flex-row justify-start text-xl font-semibold">Amount:</label>
              <span className="flex flex-row justify-start text-sm mb-2">(Must be a positive number)</span>
              <input
                type="number"
                className="w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                value={this.state.amount}
                name="amount"
                onChange={this.onInputChange}
                min={0}
                step={0.01}
                autoComplete=""
                disabled={this.state.addDisabled}
              />
            </div>
            <div className="pt-2 pb-2 border-b-2">
              <label htmlFor="description" className="flex flex-row justify-start text-xl font-semibold">Description:</label>
              <span className="flex flex-row justify-start text-sm mb-2">({10000 - this.state.description.length} characters remaining)</span>
              <textarea
                className="border w-full rounded my-2 h-16 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                value={this.state.description}
                name="description"
                onChange={this.onInputChange}
                autoComplete=""
                disabled={this.state.addDisabled}
                maxLength={10000}
              />
            </div>
            <div className="pt-2 pb-2 border-b-2 flex flex-row justify-start">
              <button
                className="px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                disabled={this.state.addDisabled || !this.canCreateDebt()}
                onClick={this.createDebt}
              >Create Debt</button>
            </div>
          </div>
          <div>
            <h2 className="text-left font-semibold text-2xl">Existing Debt</h2>
            <p className="py-1 font-semibold text-lg text-left">Total outstanding: £{this.state.total.toFixed(2)}</p>
            <table className="mx-auto border-2 text-left border-red-900 w-full">
              <thead className="bg-red-900 text-white">
                <tr>
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold">Username</th>
                  <th className="p-2 font-semibold">Email</th>
                  <th className="p-2 font-semibold">Description</th>
                  <th className="p-2 font-semibold">Amount (£)</th>
                  <th className="p-2 font-semibold">Remove</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.debts.map((debt, i) => (
                    <DebtRow
                      debt={debt}
                      key={`${Math.random()}`}
                      onDelete={(debt) => this.onRowDelete(debt)}
                    />
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default ManageDebtPage;
