import React from 'react';
import PropTypes from 'prop-types';

// Take care with PurgeCSS for this
class CircularSpinner extends React.Component {
  // size must be valid w-{size} from https://tailwindcss.com/docs/width
  // thickness must be valid border-{thickness} from https://tailwindcss.com/docs/border-width
  constructor(props) {
    super(props);

    this.state = {
      colour: this.props.colour ? this.props.colour : "red-900",
      size: this.props.size ? this.props.size : 12,
      thickness: this.props.thickness ? this.props.thickness : 4,
      removeMargin: this.props.removeMargin ? "" : "mx-auto"
    }
  }

  render () {
    const customClasses = `border-${this.state.thickness} border-b-${this.state.colour} h-${this.state.size} w-${this.state.size} ${this.state.removeMargin}`;

    return (
      <div className={`border-collapse animate-spin rounded-full ${customClasses}`}>
      </div>
    )
  }
}

CircularSpinner.propTypes = {
  colour: PropTypes.string,
  size: PropTypes.string,
  thickness: PropTypes.string,
  removeMargin: PropTypes.bool,
}

export default CircularSpinner;
