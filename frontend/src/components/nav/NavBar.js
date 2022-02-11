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
          displayName: "JCR",
          url: null,
          requiredPermission: null,
          staticImage: null,
          dropdown: [
            {
              displayName: "Roles and Committees",
              url: "/jcr/committees",
              requiredPermission: null
            },
            {
              displayName: "Core Documents",
              url: "/jcr/files",
              requiredPermission: null
            },
            {
              displayName: "Sports And Socs",
              url: "/sportsandsocs",
              requiredPermission: null
            },
            {
              displayName: "Trust",
              url: "/jcr/trust",
              requiredPermission: null
            },
            {
              displayName: "Tech",
              url: "/tech",
              requiredPermission: null
            },
            {
              displayName: "MCR",
              url: "/mcr",
              requiredPermission: null
            },
            {
              displayName: "Execs and Awards",
              url: "/jcr/execs-and-awards",
              requiredPermission: null
            }
          ],
        },
        {
          displayName: "Welfare",
          url: "/welfare",
          requiredPermission: null,
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: false
        },
        {
          displayName: "Facilities",
          url: "/facilities",
          requiredPermission: null,
          staticImage: null,
          dropdown: null,
          alwaysDisplayed: false
        },
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
          displayName: "JCR",
          url: null,
          requiredPermission: null,
          staticImage: null,
          dropdown: [
            {
              displayName: "Roles and Committees",
              url: "/jcr/committees",
              requiredPermission: null
            },
            {
              displayName: "Core Documents",
              url: "/jcr/files",
              requiredPermission: null
            },
            {
              displayName: "Sports And Socs",
              url: "/sportsandsocs",
              requiredPermission: null
            },
            {
              displayName: "Trust",
              url: "/jcr/trust",
              requiredPermission: "jcr.member"
            },
            {
              displayName: "Tech",
              url: "/tech",
              requiredPermission: "jcr.member"
            },
            {
              displayName: "MCR",
              url: "/mcr",
              requiredPermission: null
            },
            {
              displayName: "Execs and Awards",
              url: "/jcr/execs-and-awards",
              requiredPermission: null
            },
            {
              displayName: "Media",
              url: "/media",
              requiredPermission: "jcr.member"
            },
            {
              displayName: "Career Angels",
              url: "/careers",
              requiredPermission: "jcr.member"
            },
            {
              displayName: "Feedback",
              url: "/feedback",
              requiredPermission: null
            },
            {
              displayName: "Make a Complaint",
              url: "/complaints",
              requiredPermission: null
            }
          ],
        },
        {
          displayName: "Services and Facilities",
          url: null,
          requiredPermission: null,
          staticImage: null,
          dropdown: [
            {
              displayName: "Facilities",
              url: "/facilities",
              requiredPermission: null
            },
            {
              displayName: "Toasties",
              url: "/toasties",
              requiredPermission: "jcr.member"
            },
            {
              displayName: "Stash",
              url: "/stash",
              requiredPermission: "jcr.member"
            },
            {
              displayName: "Gym",
              url: "/gym",
              requiredPermission: null
            },
            {
              displayName: "Room Bookings",
              url: "/bookings",
              requiredPermission: null
            }
          ],
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
          dropdown: [
            {
              displayName: "Book",
              url: "/events",
              requiredPermission: "jcr.member"
            },
            {
              displayName: "Photos",
              url: "/media/images",
              requiredPermission: "jcr.member"
            },
            {
              displayName: "Swapping",
              url: "/events/swapping",
              requiredPermission: "jcr.member"
            }
          ],
          alwaysDisplayed: null
        },
        {
          displayName: "Your Debt",
          url: "/debt",
          requiredPermission: "debt.has",
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
              displayName: "My Profile",
              url: "/my/profile",
              requiredPermission: null
            },
            {
              displayName: "My Bookings",
              url: "/my/bookings",
              requiredPermission: "jcr.member"
            },
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
              displayName: "Manage Complaints",
              url: "/complaints/admin",
              requiredPermission: "complaints.manage"
            },
            {
              displayName: "Manage Events",
              url: "/events/admin",
              requiredPermission: "events.manage"
            },
            {
              displayName: "Export Events",
              url: "/events/admin/export",
              requiredPermission: "events.export"
            },
            {
              displayName: "Manage Debts",
              url: "/debt/manage",
              requiredPermission: "debt.manage"
            },
            {
              displayName: "Manage Feedback",
              url: "/feedback/admin",
              requiredPermission: "feedback.manage"
            },
            {
              displayName: "Manage Toasties",
              url: "/toasties/admin",
              requiredPermission: "toastie.stock.edit"
            },
            {
              displayName: "Manage Sports and Socs",
              url: "/sportsandsocs/admin",
              requiredPermission: "sportsandsocs.manage"
            },
            {
              displayName: "Manage Applications",
              url: "/accounts/admin",
              requiredPermission: "users.manage"
            },
            {
              displayName: "Manage Swapping",
              url: "/events/swapping/admin",
              requiredPermission: "events.swapping"
            },
            {
              displayName: "Manage Alumni",
              url: "/alumni/admin",
              requiredPermission: "users.manage"
            }
          ],
          alwaysDisplayed: false
        },
        {
          displayName: "JCR Admin Options",
          url: null,
          requiredPermission: null,
          staticImage: null,
          dropdown: [
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
              displayName: "Manage Roles",
              url: "/jcr/roles/manage",
              requiredPermission: "jcr.manage"
            },
            {
              displayName: "Manage Committees",
              url: "/jcr/committees/manage",
              requiredPermission: "jcr.manage"
            },
            {
              displayName: "Manage Files",
              url: "/jcr/files/manage",
              requiredPermission: "jcr.files"
            },
            {
              displayName: "Manage Careers",
              url: "/careers/admin",
              requiredPermission: "careers.manage"
            },
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
