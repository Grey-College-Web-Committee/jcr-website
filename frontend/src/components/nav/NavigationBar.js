import React from 'react';
import NavigationBarItem from './NavigationBarItem';
import authContext from '../../utils/authContext.js';

// Basic navigation bar for all pages
class NavigationBar extends React.Component {
  render () {
    const user = this.context;

    if(user) {
      if(user.admin) {
        // User is an admin
        return (
          <nav className="main_navigation">
            <ul>
              <NavigationBarItem title="Home" url="/" />
              <NavigationBarItem title="Gym Membership" url="/gym" alive={false} />
              <NavigationBarItem title="Admin: Gym Memberships" url="/admin/gym" alive={false} />
              <NavigationBarItem title={user.username} url="/" alive={false} />
              <NavigationBarItem title="Logout" url="/accounts/logout" />
            </ul>
          </nav>
        );
      }

      // User is logged in
      return (
        <nav className="main_navigation">
          <ul>
            <NavigationBarItem title="Home" url="/" />
            <NavigationBarItem title={user.username} url="/" alive={false} />
            <NavigationBarItem title="Logout" url="/accounts/logout" />
          </ul>
        </nav>
      );
    }

    // User is logged out
    return (
      <nav className="main_navigation">
        <ul>
          <NavigationBarItem title="Home" url="/" />
          <NavigationBarItem title="Login" url="/accounts/login" />
        </ul>
      </nav>
    );
  }
}

NavigationBar.contextType = authContext;

export default NavigationBar;
