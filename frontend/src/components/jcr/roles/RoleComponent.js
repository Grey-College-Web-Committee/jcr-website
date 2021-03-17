import React from 'react';
import PropTypes from 'prop-types';

class RoleComponent extends React.Component {
  makeDisplayName = (user) => {
    const upperCaseFirstName = user.firstNames.split(",")[0];
    const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();

    const upperCaseLastName = user.surname;
    const specialCaseList = ["MC", "MAC"];
    const foundSpecialCase = specialCaseList.filter(c => upperCaseLastName.startsWith(c));

    let lastName = upperCaseLastName.substring(0, 1) + upperCaseLastName.substring(1).toLowerCase();

    // Fix special cases like McDonald appearing as Mcdonald
    if(foundSpecialCase.length !== 0) {
      const c = foundSpecialCase[0].substring(0, 1) + foundSpecialCase[0].substring(1).toLowerCase();
      lastName = upperCaseLastName.substring(c.length);
      lastName = c + lastName.substring(0, 1) + lastName.substring(1).toLowerCase();
    }

    // Fix hyphens
    if(lastName.includes("-")) {
      let capNext = false;
      let newLastName = [];

      for(const i in lastName) {
        if(capNext) {
          newLastName.push(lastName[i].toUpperCase());
          capNext = false;
          continue;
        }

        newLastName.push(lastName[i]);
        capNext = lastName[i] === "-";
      }

      lastName = newLastName.join("")
    }

    return `${firstName} ${lastName}`;
  }

  render () {
    const { role, user, vacant } = this.props;

    if(vacant) {
      return (
        <div className="border-2 border-red-900">
          <img
            src="/images/default_avatar.png"
            alt="Vacant Picture"
            className="w-auto"
          />
          <div className="p-1">
            <p className="font-semibold">{role.name}</p>
            <p>Vacant</p>
          </div>
        </div>
      )
    }

    return (
      <div className="border-2 border-red-900">
        <img
          src={user.profilePicture === null ? "/images/default_avatar.png" : `/uploads/images/profile/${user.profilePicture}`}
          alt="User Profile Picture"
          className="w-auto"
        />
        <div className="p-1">
          <p className="font-semibold">{role.name}</p>
          <p>{this.makeDisplayName(user)}</p>
        </div>
      </div>
    )
  }
}

export default RoleComponent;
