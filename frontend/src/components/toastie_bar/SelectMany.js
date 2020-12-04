import React from 'react'
import PropTypes from 'prop-types'

class SelectMany extends React.Component {
  constructor(props) {
    super(props);

    // Only want those that are of the correct type to be visible
    const items = props.stock.filter(item => item.type === props.type);

    this.state = {
      items,
      choices: []
    };
  }

  // When they want to add/remove on this is called
  // it also updates the state of the parent element
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
            <tr key={item.id} data-available={item.available ? 1 : 0}>
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

SelectMany.propTypes = {
  stock: PropTypes.array.isRequired,
  passUp: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired
}

export default SelectMany;
