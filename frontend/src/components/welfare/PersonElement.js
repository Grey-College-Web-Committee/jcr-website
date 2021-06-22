import React from 'react'
import PropTypes from 'prop-types'

class PersonElement extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bioOpen: false
    }
  }

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
    const { role, user, bio } = this.props;

    if(this.state.bioOpen) {
      return (
        <div
          className="w-40 md:w-48 h-auto m-2 border-2 border-red-900 flex flex-col mx-auto p-2 text-left cursor-pointer"
          onClick={() => this.setState({ bioOpen: false })}
        >
          <p>{bio}</p>
        </div>
      )
    }

    return (
      <div
        className="w-40 md:w-48 h-auto m-2 border-2 border-red-900 flex flex-col mx-auto cursor-pointer"
        onClick={() => this.setState({ bioOpen: true })}
      >
        <img
          src={user.profilePicture === null ? "/images/default_avatar.png" : `/uploads/images/profile/${user.profilePicture}`}
          alt="User Profile"
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

PersonElement.propTypes = {
  role: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  bio: PropTypes.string.isRequired,
}

export default PersonElement;
