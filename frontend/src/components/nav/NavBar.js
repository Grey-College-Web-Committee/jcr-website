import React from 'react';
import authContext from '../../utils/authContext.js';
import { withRouter } from 'react-router-dom';
import NavBarElement from './NavBarElement';

// Basic navigation bar for all pages
class NavBar extends React.Component {
  getMenuOptions = (user) => {
    let baseOptions = [
      {
        displayName: null,
        url: "/",
        requiredPermission: null,
        staticImage: {
          src: "/images/header-crest-45.png",
          alt: "Grey College Logo",
          style: {
            width: "45px"
          }
        },
        dropdown: null
      },
      {
        displayName: "Home",
        url: "/",
        requiredPermission: null,
        staticImage: null,
        dropdown: null
      }
    ];

    if(user === null) {
      const loggedOutOptions = [
        {
          displayName: "Login",
          url: "/accounts/login",
          requiredPermission: null,
          staticImage: null,
          dropdown: null
        }
      ];

      baseOptions = baseOptions.concat(loggedOutOptions);
    } else {
      const loggedInOptions = [
        {
          displayName: "Logout",
          url: "/accounts/logout",
          requiredPermission: null,
          staticImage: null,
          dropdown: null
        },
        {
          displayName: "Order Toastie",
          url: "/toasties",
          requiredPermission: null,
          staticImage: null,
          dropdown: null
        },
        {
          displayName: "Toastie Stock",
          url: "/toasties/stock",
          requiredPermission: "toastie.stock.edit",
          staticImage: null,
          dropdown: null
        },
        {
          displayName: "Edit Permissions",
          url: "/permissions",
          requiredPermission: "permissions.edit",
          staticImage: null,
          dropdown: null
        },
        {
          displayName: `${user.username}`,
          url: null,
          requiredPermission: null,
          staticImage: null,
          dropdown: null
        },
        {
          displayName: "Test Dropdown",
          url: null,
          requiredPermission: null,
          staticImage: null,
          dropdown: [
            {
              displayName: "Dropdown #1",
              url: "/test/1",
              requiredPermission: null
            },
            {
              displayName: "Dropdown #2",
              url: "/test/2",
              requiredPermission: null
            },
            {
              displayName: "Dropdown #3",
              url: "/test/3",
              requiredPermission: null
            }
          ]
        }
      ];

      baseOptions = baseOptions.concat(loggedInOptions);
    }

    return baseOptions;
  }

  render () {
    const user = this.context;
    const location = this.props.location.pathname;

    return (
      <nav>
        <ul className="flex flex-row bg-red-900 text-gray-200 items-center">
          {
            this.getMenuOptions(user).map((item, i) => (
              <NavBarElement
                key={i}
                {...item}
                user={user}
                location={location}
              />
            ))
          }
        </ul>
      </nav>
    );
  }
}

NavBar.contextType = authContext;

export default withRouter(NavBar);
