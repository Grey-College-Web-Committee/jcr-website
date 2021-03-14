import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class TypeRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: this.props.type.name,
      allowsMixer: this.props.type.allowsMixer,
      disabled: false,
      edited: false
    }
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), edited: true })
  }

  saveRow = async () => {
    this.setState({ disabled: true });

    const { name, allowsMixer } = this.state;

    try {
      await api.post("/bar/type/update", {
        id: this.props.type.id,
        name,
        allowsMixer
      });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.setState({ disabled: false, edited: false });
  }

  render () {
    const { type } = this.props;

    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">
          <input
            type="text"
            name="name"
            value={this.state.name}
            className="w-full border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
            onChange={this.onInputChange}
            autoComplete=""
            maxLength={255}
          />
        </td>
        <td className="p-2 border-r border-gray-400">
          <input
            type="checkbox"
            name="allowsMixer"
            checked={this.state.allowsMixer}
            onChange={this.onInputChange}
            className="p-2 h-8 w-8 align-middle mx-auto rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          />
        </td>
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.saveRow}
            className="px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            disabled={this.state.disabled || !this.state.edited}
          >Save</button>
        </td>
      </tr>
    )
  }
}

export default TypeRow;
