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
            <li
              className={classes}
              onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
            >
              <Link to={url}>
                {displayName}
              </Link>
            </li>
          );
        } else {
          return (
            <li
              className={classes}
              onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
            >
              <Link to={url}>
                <img
                  {...staticImage}
                />
              </Link>
            </li>
          )
        }
      }
    } else {
      return (
        <li
          className={classes}
          onMouseEnter={() => { this.props.changeActiveDropdownKey(this.props.id) }}
        >
          {displayName}▾
          <DropdownMenu
            items={dropdown}
            active={this.props.activeDropdownKey === this.props.id}
          />
        </li>
      );
    }

    return null;
  }
}

export default NavBarElement;
