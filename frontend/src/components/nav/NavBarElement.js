import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

class NavBarElement extends React.Component {
  getClasses = () => {
    return "p-3 font-medium hover:underline";
  }

  render () {
    const { displayName, url, requiredPermission, staticImage, dropdown, user } = this.props;
    const classes = this.getClasses();

    if(requiredPermission !== null) {
      if(user === null) {
        return null;
      }

      if(user.permissions === null) {
        return null;
      }

      if(!user.permissions.includes(requiredPermission)) {
        return null;
      }
    }

    console.log(this.props);

    if(dropdown === null) {
      if(url === null) {
        if(staticImage === null) {
          return (
            <li className={classes}>{displayName}</li>
          );
        } else {
          return (
            <li className={classes}>
              <img
                {...staticImage}
              />
            </li>
          )
        }
      } else {
        if(staticImage === null) {
          return (
            <Link to={url}>
              <li className={classes}>{displayName}</li>
            </Link>
          );
        } else {
          return (
            <Link to={url}>
              <li className={classes}>
                <img
                  {...staticImage}
                />
              </li>
            </Link>
          )
        }
      }
    } else {
      if(url === null) {

      } else {

      }
    }

    return null;
  }
}

export default NavBarElement;
