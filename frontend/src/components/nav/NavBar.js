import React from 'react';
import authContext from '../../utils/authContext.js';
import { withRouter } from 'react-router-dom';
import NavBarElement from './NavBarElement';
import HamburgerSelector from './HamburgerSelector';
import CartDesktopNavBarElement from '../cart/CartDesktopNavBarElement';
import CartMobileNavBarElement from '../cart/CartMobileNavBarElement';

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
      // use a bit of a trick to hide the JCR membership tab if they have a membership
      let permissions = [];

      if(!user.hasOwnProperty("permissions")) {
        permissions = [];
      } else {
        permissions = user.permissions;
      }

      if(permissions === null) {
        permissions = [];
      }

      const loggedInOptions = [
        {
          displayName: "JCR Membership",
          url: "/memberships/join",
          requiredPermission: permissions.includes("jcr.member") ? "no-one-has-this-perm" : null,
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: false
        },
        {
          displayName: "Toasties",
          url: "/toasties",
          requiredPermission: "jcr.member",
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: false
        },
        {
          displayName: "Stash",
          url: "/stash",
          requiredPermission: "jcr.member",
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: false
        },
        {
          displayName: "Gym",
          url: "/gym",
          requiredPermission: null,
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: false
        },
        {
          displayName: "Elections",
          url: "/elections",
          requiredPermission: "jcr.member",
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: false
        },
        {
          displayName: "Media",
          url: "/media",
          requiredPermission: "jcr.member",
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: null
        },
        {
          displayName: "Welfare",
          url: null,
          requiredPermission: "jcr.member",
          staticImage: null,
          dropdown: [
            {
              displayName: "About",
              url: "/welfare",
              requiredPermission: "jcr.member"
            },
            {
              displayName: "Anonymous Messaging",
              url: "/welfare/message",
              requiredPermission: "jcr.member"
            }
          ],
          alwaysDisplayed: false
        },
        {
          displayName: "Events",
          url: "/events",
          requiredPermission: "jcr.member",
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: null
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
            },
            {
              displayName: "Edit Available Stash",
              url: "/stash/stock",
              requiredPermission: "stash.stock.edit"
            },
            {
              displayName: "Export Stash",
              url: "/stash/export",
              requiredPermission: "stash.export"
            },
            {
              displayName: "Export Gym Members",
              url: "/gym/admin",
              requiredPermission: "gym.export"
            },
            {
              displayName: "Export JCR Members",
              url: "/memberships/export",
              requiredPermission: "jcr.export"
            },
            {
              displayName: "Manage JCR Members",
              url: "/memberships/manage",
              requiredPermission: "jcr.manage"
            },
            {
              displayName: "Manage Elections",
              url: "/elections/admin",
              requiredPermission: "elections.manage"
            },
            {
              displayName: "Manage Media",
              url: "/media/admin",
              requiredPermission: "media.manage"
            },
            {
              displayName: "Welfare Messages",
              url: "/welfare/message/admin",
              requiredPermission: "welfare.anonymous"
            },
            {
              displayName: "Manage Events",
              url: "/events/admin/create",
              requiredPermission: "events.manage"
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

    const loggedIn = !(user === undefined || user === null);

    return (
      <nav
        onMouseLeave={() => {
          if(this.state.activeDropdownKey !== menuOptions.length) {
            this.setActiveDropdown(-1);
          }
        }}
        className="flex flex-row justify-between bg-red-900 text-white items-center flex-shrink-0"
      >
        <ul className="flex flex-row items-center">
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
        </ul>
        <ul className="flex flex-row items-center">
          {loggedIn ? (<CartDesktopNavBarElement
            id={menuOptions.length}
            activeDropdownKey={this.state.activeDropdownKey}
            changeActiveDropdownKey={this.setActiveDropdown}
          />) : null}
          {loggedIn ? (<CartMobileNavBarElement
            hideBody={this.props.hideBody}
          />) : null}
          <HamburgerSelector
            menuOptions={menuOptions}
            user={user}
            location={location}
            hideBody={this.props.hideBody}
          />
        </ul>
      </nav>
    );
  }
}

NavBar.contextType = authContext;

export default withRouter(NavBar);
