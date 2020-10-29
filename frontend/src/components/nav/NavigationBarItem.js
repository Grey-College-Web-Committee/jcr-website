import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

class NavigationBarItem extends React.Component {
  render () {
    if(!this.props.hasOwnProperty("alive")) {
      return (
        <Link to={this.props.url}><li>{this.props.title}</li></Link>
      );
    }

    return (
      <li>{this.props.title}</li>
    );
  }
}

NavigationBarItem.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  alive: PropTypes.bool
}

export default NavigationBarItem;
