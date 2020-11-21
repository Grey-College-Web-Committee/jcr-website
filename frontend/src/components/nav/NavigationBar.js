import React from 'react';
import NavigationBarItem from './NavigationBarItem';
import authContext from '../../utils/authContext.js';

// Basic navigation bar for all pages
class NavigationBar extends React.Component {
  render () {
    const user = this.context;

    if(user) {
      return (
        <nav className="main_navigation">
          <ul>
            <NavigationBarItem title="Home" url="/" />
            <NavigationBarItem title="Order Toastie" url="/toasties" />
            {user.permissions.includes("toastie.stock.edit") ? <NavigationBarItem title="Toastie Stock" url="/toasties/stock" /> : null}
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
