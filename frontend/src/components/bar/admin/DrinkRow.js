import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../utils/axiosConfig';

class DrinkRow extends React.Component {
  constructor(props) {
    super(props);

    let prices = {};

    this.props.baseDrink.BarDrinks.forEach((item, i) => {
      prices[item.sizeId] = item.price;
    });

    this.state = {
      available: this.props.baseDrink.available,
      disabled: false,
      deleted: false,
      name: this.props.baseDrink.name,
      description: this.props.baseDrink.description,
      typeId: this.props.baseDrink.typeId,
      edited: false,
      prices
    }
  }

  saveRow = async () => {
    this.setState({ disabled: true });

    const { name, description, typeId, available, prices } = this.state;

    const formData = new FormData();

    formData.append("id", this.props.baseDrink.id);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("prices", JSON.stringify(prices));
    formData.append("typeId", typeId);
    formData.append("available", available);

    try {
      await api.post("/bar/drink/update", formData, {
        headers: { "content-type": "multipart/form-data" }
      });
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    this.setState({ disabled: false, edited: false });
  }

  deleteRow = async () => {
    this.setState({ disabled: true });
    const confirmed = window.confirm("Are you sure you want to fully delete this drink and any corresponding orders?");

    if(!confirmed) {
      this.setState({ disabled: false });
      return;
    }

    try {
      await api.delete(`/bar/drink/${this.props.baseDrink.id}`);
    } catch (error) {
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return
    }

    this.setState({ deleted: true });
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), edited: true })
  }

  onPriceChange = (e, i) => {
    let { prices } = this.state;
    prices[i] = e.target.value;
    this.setState({ prices, edited: true });
  }

  render () {
    const { baseDrink } = this.props;

    if(this.state.deleted) {
      return null;
    }

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
          <textarea
            name="description"
            value={this.state.description}
            onChange={this.onInputChange}
            className="border w-auto rounded my-2 h-auto py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
            disabled={this.state.disabled}
            autoComplete=""
            maxLength={1500}
          />
        </td>
        <td className="p-2 border-r border-gray-400">
          <select
            onChange={this.onInputChange}
            name="typeId"
            className="w-full h-8 border border-gray-400 disabled:opacity-50"
            value={this.state.typeId}
            disabled={this.state.disabled}
          >
            <option value="" disabled={true} hidden={true}>Choose type...</option>
            {this.props.types.map((type, id) => (
              <option value={type.id}>{type.name}</option>
            ))}
          </select>
        </td>
        <td className="p-2 border-r border-gray-400">
          <ul className="list-inside list-disc text-left">
            {
              baseDrink.BarDrinks.map((drink, i) => (
                <li key={i} className="my-1">
                  {drink.BarDrinkSize.name}:
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      name="price"
                      value={this.state.prices[drink.BarDrinkSize.id]}
                      className="ml-2 w-auto border border-grey-500 rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                      onChange={e => this.onPriceChange(e, drink.BarDrinkSize.id)}
                      autoComplete=""
                    />
                </li>
              ))
            }
          </ul>
        </td>
        <td className="p-2 border-r border-gray-400">
          <input
            type="checkbox"
            name="available"
            checked={this.state.available}
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
        <td className="p-2 border-r border-gray-400">
          <button
            onClick={this.deleteRow}
            className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            disabled={this.state.disabled}
          >Delete</button>
        </td>
      </tr>
    );
  }
}

DrinkRow.propTypes = {
  baseDrink: PropTypes.object.isRequired,
  types: PropTypes.array.isRequired,
  sizes: PropTypes.array.isRequired
}

export default DrinkRow;
