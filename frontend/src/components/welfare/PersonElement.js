import React from 'react'
import PropTypes from 'prop-types'

class PersonElement extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bioOpen: false
    }
  }

  render () {
    if(this.state.bioOpen) {
      return (
        <div
          className="w-40 md:w-48 h-auto m-2 border-2 border-red-900 flex flex-col mx-auto p-2 text-left cursor-pointer"
          onClick={() => this.setState({ bioOpen: false })}
        >
          <p>{this.props.bio}</p>
        </div>
      )
    }

    return (
      <div
        className="w-40 md:w-48 h-auto m-2 border-2 border-red-900 flex flex-col mx-auto cursor-pointer"
        onClick={() => this.setState({ bioOpen: true })}
      >
        <div>
          <img
            src={this.props.image}
            alt={this.props.name}
            className="h-auto"
          />
        </div>
        <div className="text-left p-1 text-base md:text-lg">
          <p className="font-semibold">{this.props.role}</p>
          <p>{this.props.name}</p>
        </div>
      </div>
    )
  }
}

export default PersonElement;
