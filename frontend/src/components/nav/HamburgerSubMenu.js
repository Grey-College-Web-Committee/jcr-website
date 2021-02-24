import React from 'react';
import PropTypes from 'prop-types';
import HamburgerMenuElement from './HamburgerMenuElement';

class HamburgerSubMenu extends React.Component {
  render () {
    if(!this.props.active) {
      return null;
    }

    return (
      <div className="w-screen h-full top-0 left-0 fixed overflow-y-auto overflow-x-hidden bg-red-900 text-white block z-20">
        <ul className="flex flex-col text-center justify-center">
          <li className="flex justify-center border-b border-gray-200 pt-4 pb-4">
            <img
              src="/images/header-crest-232.png"
              alt="Grey College Logo"
              style={{
                width: "48px",
                height: "48px"
              }}
            />
          </li>
          <li className="border-b border-gray-200 pt-4 pb-4 cursor-pointer font-medium" onClick={() => {
            this.props.hideSelf();
          }}>
            ← Back
          </li>
          {this.props.contents.map((item, i) => (
            <HamburgerMenuElement
              user={this.props.user}
              {...item}
              id={i}
              key={i}
              hideWholeMenu={this.props.hideWholeMenu}
              location={this.props.location}
            />
          ))}
        </ul>
      </div>
    );
  }
}

HamburgerSubMenu.propTypes = {
  contents: PropTypes.array.isRequired,
  active: PropTypes.bool.isRequired,
  hideSelf: PropTypes.func.isRequired,
  hideWholeMenu: PropTypes.func.isRequired,
  user: PropTypes.object,
  location: PropTypes.string.isRequired
}

export default HamburgerSubMenu;
