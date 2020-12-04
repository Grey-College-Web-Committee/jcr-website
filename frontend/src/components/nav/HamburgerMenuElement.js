import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import HamburgerSubMenu from './HamburgerSubMenu';

class HamburgerMenuElement extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      parentActive: true,
      dropdownActive: false
    };
  }

  getClasses = (url) => {
    // optionally can make selected items stand out more here
    const selected = url === this.props.location ? "" : "";
    return `h-full font-medium hover:underline border-b border-gray-200 pt-4 pb-4 ${selected}`;
  }

  render () {
    const { displayName, url, requiredPermission, staticImage, dropdown, alwaysDisplayed, id, user } = this.props;
    const classes = `${this.getClasses(url)}`;

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

    if(dropdown === undefined || dropdown === null) {
      if(url === null) {
        if(staticImage === undefined || staticImage === null) {
          return (
            <li
              className={classes}
            >
              {displayName}
            </li>
          );
        } else {
          return (
            <li
              className={classes}
            >
              <img
                {...staticImage}
              />
            </li>
          )
        }
      } else {
        if(staticImage === undefined || staticImage === null) {
          return (
            <Link to={url} onClick={this.props.hideWholeMenu}>
              <li
                className={classes}
              >
                  {displayName}
              </li>
            </Link>
          );
        } else {
          return (
            <Link to={url} onClick={this.props.hideWholeMenu}>
              <li
                className={classes}
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
          onClick={() => {
            if(this.state.parentActive) {
              this.setState({ dropdownActive: true, parentActive: false });
            }
          }}
        >
          {displayName}▾
          <HamburgerSubMenu
            contents={dropdown}
            active={this.state.dropdownActive}
            hideSelf={() => {
              this.setState({ dropdownActive: false, parentActive: true });
            }}
            hideWholeMenu={this.props.hideWholeMenu}
            user={user}
            location={this.props.location}
          />
        </li>
      );
    }

    return null;
  }
}

export default HamburgerMenuElement;
