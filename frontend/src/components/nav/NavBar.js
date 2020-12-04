import React from 'react';
import authContext from '../../utils/authContext.js';
import { withRouter } from 'react-router-dom';
import NavBarElement from './NavBarElement';
import HamburgerSelector from './HamburgerSelector';

// Basic navigation bar for all pages
class NavBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeDropdownKey: -1
    };
  }
  
  getMenuOptions = (user) => {
    let baseOptions = [
      {
        displayName: null,
        url: "/",
        requiredPermission: null,
        staticImage: {
          src: "/images/header-crest-232.png",
          alt: "Grey College Logo",
          style: {
            width: "48px"
          }
        },
        dropdown: null,
        alwaysDisplayed: true
      },
      {
        displayName: "Home",
        url: "/",
        requiredPermission: null,
        staticImage: null,
        dropdown: null,
        alwaysDisplayed: false
      }
    ];

    if(user === undefined || user === null) {
      const loggedOutOptions = [
        {
          displayName: "Login",
          url: "/accounts/login",
          requiredPermission: null,
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: false
        }
      ];

      baseOptions = baseOptions.concat(loggedOutOptions);
    } else {
      const loggedInOptions = [
        {
          displayName: "Order Toastie",
          url: "/toasties",
          requiredPermission: null,
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: false
        },
        {
          displayName: `${user.username}`,
          url: null,
          requiredPermission: null,
          staticImage: null,
          dropdown: [
            {
              displayName: "Logout",
              url: "/accounts/logout",
              requiredPermission: null
            }
          ],
          alwaysDisplayed: false
        },
        {
          displayName: "Admin Options",
          url: null,
          requiredPermission: null,
          staticImage: null,
          dropdown: [
            {
              displayName: "Edit Permissions",
              url: "/permissions",
              requiredPermission: "permissions.edit"
            },
            {
              displayName: "Edit Toastie Stock",
              url: "/toasties/stock",
              requiredPermission: "toastie.stock.edit"
            }
          ],
          alwaysDisplayed: false
        }
      ];

      baseOptions = baseOptions.concat(loggedInOptions);
    }

    return baseOptions;
  }

  setActiveDropdown = (id) => {
    this.setState({ activeDropdownKey: id });
  }

  render () {
    const user = this.context;
    const location = this.props.location.pathname;
    const menuOptions = this.getMenuOptions(user);

    return (
      <nav onMouseLeave={() => {this.setActiveDropdown(-1)}}>
        <ul className="flex flex-row bg-red-900 text-white items-center">
          {
            menuOptions.map((item, i) => (
              <NavBarElement
                key={i}
                id={i}
                {...item}
                user={user}
                location={location}
                activeDropdownKey={this.state.activeDropdownKey}
                changeActiveDropdownKey={this.setActiveDropdown}
              />
            ))
          }
          <HamburgerSelector
            menuOptions={menuOptions}
            user={user}
            location={location}
          />
        </ul>
      </nav>
    );
  }
}

NavBar.contextType = authContext;

export default withRouter(NavBar);
