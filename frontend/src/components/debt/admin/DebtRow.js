import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class DebtRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      deleted: false,
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

    // Set itself to be invisible until the data refreshes
    this.setState({ deleted: true });
    this.props.onDelete(this.state.debt);
  }

  render () {
    const { debt, deleted, disabled } = this.state;

    if(deleted) {
      return null;
    }

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">{debt.firstNames || "Not Signed Up"}</td>
        <td className="p-2 border-r border-gray-400">{debt.username}</td>
        <td className="p-2 border-r border-gray-400">{debt.email || "Not Signed Up"}</td>
        <td className="p-2 border-r border-gray-400">{debt.description}</td>
        <td className="p-2 border-r border-gray-400">{debt.amount}</td>
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
