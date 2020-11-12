import React from 'react';
import PropTypes from 'prop-types';

class SelectBread extends React.Component {
  constructor(props) {
    super(props);

    const breads = props.stock.filter(item => item.type === "bread");

    this.state = {
      breads,
      choice: -1
    };
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  render () {
    return (
      <select
        value={this.state.choice}
        onChange={this.onInputChange}
        name="choice"
      >
        <option value={-1} disabled={true}>Select an option...</option>
        {this.state.breads.map((bread, index) => (
          <option
            key={index}
            value={bread.id}
          >{bread.name} (£{bread.price})</option>
        ))}
      </select>
    )
  }
}

export default SelectBread;
