import React from 'react'
import PropTypes from 'prop-types'

class SelectFillings extends React.Component {
  constructor(props) {
    super(props);

    const fillings = props.stock.filter(item => item.type === "filling");

    this.state = {
      fillings,
      choices: []
    };
  }

  updateChoices = id => {
    if(!this.state.choices.includes(id)) {
      let { choices } = this.state;
      choices.push(id)
      this.setState({ choices });
    } else {
      this.setState({ choices: this.state.choices.filter(choice => choice !== id) });
    }
  }

  render () {
    return (
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price (£)</th>
            <th>Selected</th>
          </tr>
        </thead>
        <tbody>
          {this.state.fillings.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.price}</td>
              <td>
                <input
                  type="checkbox"
                  selected={this.state.choices.includes(item.id)}
                  onChange={() => { this.updateChoices(item.id) }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}

export default SelectFillings;
