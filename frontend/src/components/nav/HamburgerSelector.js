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
            this.props.hideBody(true);
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
          hideSelf={() => {
            this.props.hideBody(false);
            this.setShowMenu(false)
          }}
          items={[...menuOptions]}
          user={this.props.user}
          location={this.props.location}
        />
      </li>
    )
  }
}

HamburgerSelector.propTypes = {
  menuOptions: PropTypes.array.isRequired,
  user: PropTypes.object,
  location: PropTypes.string.isRequired
}

export default HamburgerSelector;
