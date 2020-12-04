import React from 'react';
import PropTypes from 'prop-types';
import HamburgerMenu from './HamburgerMenu';

class HamburgerSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showMenu: false,
      parentActive: true
    }
  }

  setShowMenu = (choice) => {
    this.setState({ showMenu: choice, parentActive: !choice });
  }

  render () {
    const { menuOptions } = this.props;
    return (
      <li
        className="p-3 ml-auto justify-end sm:hidden"
        onClick={() => {
          if(this.state.parentActive) {
            this.setShowMenu(true);
          }
        }}
      >
        <img
          src="/images/hamburger-232.png"
          alt="Additional Menu Options"
          style={{
            width: "48px"
          }}
        />
        <HamburgerMenu
          active={this.state.showMenu}
          hideSelf={() => { this.setShowMenu(false) }}
          items={[...menuOptions]}
          user={this.props.user}
          location={this.props.location}
        />
      </li>
    )
  }
}

export default HamburgerSelector;
