import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

class DropdownElement extends React.Component {
  getClasses = () => {
    return "h-full p-3 font-medium hover:underline"
  }

  render () {
    const { displayName, url, requiredPermission, user } = this.props;
    const classes = this.getClasses();

    if(requiredPermission !== null) {
      if(user === undefined) {
        return null;
      }

      if(!user.hasOwnProperty("permissions")) {
        return null;
      }

      if(user.permissions === null) {
        return null;
      }

      if(!user.permissions.includes(requiredPermission)) {
        return null;
      }
    }

    if(url === null) {
      return (
        <li className={classes} >
          {displayName}
        </li>
      )
    } else {
      return (
        <li className={classes} >
          <Link to={url}>
            {displayName}
          </Link>
        </li>
      );
    }
  }
}

export default DropdownElement;
