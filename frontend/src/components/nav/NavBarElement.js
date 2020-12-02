import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import DropdownMenu from './DropdownMenu';

class NavBarElement extends React.Component {
  constructor(props) {
    super(props);
  }

  getClasses = () => {
    return "h-full p-3 font-medium hover:underline";
  }

  render () {
    const { displayName, url, requiredPermission, staticImage, dropdown, user } = this.props;
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

    if(dropdown === null) {
      if(url === null) {
        if(staticImage === null) {
          return (
            <li
              className={classes}
              onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
            >
              {displayName}
            </li>
          );
        } else {
          return (
            <li
              className={classes}
              onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
            >
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
              <li
                className={classes}
                onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
              >
                  {displayName}
              </li>
            </Link>
          );
        } else {
          return (
            <Link to={url}>
              <li
                className={classes}
                onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
              >
                  <img
                    {...staticImage}
                  />
              </li>
            </Link>
          )
        }
      }
    } else {
      // No point displaying if they don't have a single option available
      const internalPermissions = dropdown.map(item => item.requiredPermission);
      const nullPermissions = internalPermissions.filter(permission => permission === null);

      if(internalPermissions.length !== 0 && nullPermissions.length === 0) {
        if(user === undefined) {
          return null;
        }

        if(!user.hasOwnProperty("permissions")) {
          return null;
        }

        if(user.permissions === null) {
          return null;
        }

        const validPermissions = internalPermissions.filter(permission => user.permissions.includes(permission));

        if(validPermissions.length === 0) {
          return null;
        }
      }

      return (
        <li
          className={classes}
          onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
        >
          {displayName}▾
          <DropdownMenu
            items={dropdown}
            active={this.props.activeDropdownKey === this.props.id}
            user={user}
          />
        </li>
      );
    }

    return null;
  }
}

export default NavBarElement;
