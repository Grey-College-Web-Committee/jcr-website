import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

class RoleComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      descriptionVisible: false
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

  renderDescription = () => {
    if(!this.state.descriptionVisible) {
      return null;
    }

    const { role, user, vacant } = this.props;

    return (
      <div className="w-screen h-screen flex flex-row justify-center items-center fixed bg-grey-500 bg-opacity-75 top-0 left-0 z-10">
        <div className="flex flex-col w-full m-2 md:w-1/2 bg-white p-4 border-2 border-grey-900 text-lg h-auto">
          <div className="flex flex-row justify-between items-center">
            <h2 className="mb-2 text-3xl font-semibold">{role.name}</h2>
            <button onClick={() => { this.setState({ descriptionVisible: !this.state.descriptionVisible })}}>Close</button>
          </div>
          <div className="flex flex-col md:flex-row">
            <div className="w-48 h-auto flex-grow-0 flex-shrink-0">
              {
                vacant ? (
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
                ) : (
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
            </div>
            {
              role.description === null || role.description === "" ? (
                <div className="flex-grow px-2">
                  <p className="py-1">No description has been provided for this role yet! If you are interested in finding out more about what this role involves please contact the JCR Chair (grey.chair@durham.ac.uk) or the JCR President or Vice-President who will be happy to provide you information about the role and/or put you in touch with the current holder!</p>
                  <p className="py-1">You can also checkout the Byelaws on the <Link className="underline font-semibold" to="/jcr/files">Core Documents</Link> page which will include all of the responsibility of this role!</p>
                </div>
              ) : (
                <div className="flex-grow px-2">
                  {
                    role.description.split("\n").map((line, i) => {
                      if(line === null || line === "\n" || line === "") {
                        return null;
                      }

                      return (
                        <p className="py-1">{line}</p>
                      )
                    })
                  }
                </div>
              )
            }
          </div>
          {
            role.videoUrl === null || role.videoUrl === "" ? null : (
              <div className="flex flex-row justify-center py-2 flex-grow overflow-auto">
                <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${role.videoUrl}`} title="Grey JCR Role Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />
              </div>
            )
          }
        </div>
      </div>
    );
  }

  render () {
    const { role, user, vacant } = this.props;

    if(vacant) {
      return (
        <React.Fragment>
          { this.renderDescription() }
          <div className="border-2 border-red-900" onClick={() => { this.setState({ descriptionVisible: !this.state.descriptionVisible })}}>
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
        </React.Fragment>
      )
    }

    return (
      <React.Fragment>
        { this.renderDescription() }
        <div className="border-2 border-red-900" onClick={() => { this.setState({ descriptionVisible: !this.state.descriptionVisible })}}>
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
      </React.Fragment>
    )
  }
}

export default RoleComponent;
