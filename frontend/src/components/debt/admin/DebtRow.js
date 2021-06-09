import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';
import dateFormat from 'dateformat';

class DebtRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      debt: this.props.debt,
      disabled: false
    }
  }

  deleteSelf = async () => {
    // Disable the button
    this.setState({ disabled: true });
    const { debtId } = this.state.debt;

    // Delete the record
    try {
      await api.delete(`/debt/${debtId}`);
    } catch (error) {
      alert("An error occurred deleting this record");
      return;
    }

    this.props.onDelete(this.state.debt);
  }

  makeDisplayName = (result) => {
    if(!result.firstNames) {
      return "Not Signed Up";
    }

    // Converts the firstNames and surname into a suitable display format
    const split = result.firstNames.split(",");
    let firstName = split[0];
    firstName = firstName.substring(0, 1).toUpperCase() + firstName.substring(1).toLowerCase();
    let surname = result.surname;
    surname = surname.substring(0, 1).toUpperCase() + surname.substring(1).toLowerCase();

    return `${firstName} ${surname}`;
  }

  render () {
    const { debt, disabled } = this.state;

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">{this.makeDisplayName(debt)}</td>
        <td className="p-2 border-r border-gray-400">{debt.username}</td>
        <td className="p-2 border-r border-gray-400">{debt.email || "Not Signed Up"}</td>
        <td className="p-2 border-r border-gray-400">{debt.lastLogin ? dateFormat(debt.lastLogin, "dd/mm/yyyy HH:MM") : "Not Signed Up"}</td>
        <td className="p-2 border-r border-gray-400">{debt.description}</td>
        <td className="p-2 border-r border-gray-400">{Number(debt.amount).toFixed(2)}</td>
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.deleteSelf}
            disabled={disabled}
            className="px-4 py-1 rounded bg-red-700 text-white w-32 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >Remove</button>
        </td>
      </tr>
    )
  }
}

export default DebtRow;
