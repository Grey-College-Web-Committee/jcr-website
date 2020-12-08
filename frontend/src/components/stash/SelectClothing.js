import React from 'react';
import PropTypes from 'prop-types';

class SelectClothing extends React.Component {
  constructor(props) {
    super(props);

    // Only used for breads. Could be abstracted for any type though (like SelectMany)
    const clothing = props.stock.filter(item => item.type === "clothing");

    this.state = {
      clothing,
      choice: -1
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) }, () => { this.props.passUp(this.state.choice) });
  }

  render () {
    return (
      <select
        value={this.state.choice}
        onChange={this.onInputChange}
        name="choice"
      >
        <option value={-1} disabled={true}>Select an option...</option>
        {this.state.clothing.map((clothing, index) => (
          <option
            key={index}
            value={clothing.id}
            disabled={!clothing.available}
          >{clothing.name} (£{clothing.price})</option>
        ))}
      </select>
    )
  }
}

SelectClothing.propTypes = {
  stock: PropTypes.array.isRequired,
  passUp: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired
}

export default SelectClothing;
