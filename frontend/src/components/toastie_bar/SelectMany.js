import React from 'react'
import PropTypes from 'prop-types'

class SelectMany extends React.Component {
  constructor(props) {
    super(props);

    const items = props.stock.filter(item => item.type === props.type);

    this.state = {
      items,
      choices: []
    };
  }

  updateChoices = id => {
    if(!this.state.choices.includes(id)) {
      let { choices } = this.state;
      choices.push(id);
      this.setState({ choices }, () => { this.props.passUp(this.state.choices) });
    } else {
      this.setState({ choices: this.state.choices.filter(choice => choice !== id) }, () => { this.props.passUp(this.state.choices) });
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
          {this.state.items.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.price}</td>
              <td>
                <input
                  type="checkbox"
                  selected={this.state.choices.includes(item.id)}
                  onChange={() => { this.updateChoices(item.id) }}
                  disabled={!item.available || this.props.disabled}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}

export default SelectMany;
