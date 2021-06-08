import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import LoadingHolder from '../../common/LoadingHolder';

class RoleComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      descriptionVisible: false,
      hideLoader: false
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
      <div className="flex flex-row justify-center items-center w-screen h-screen fixed bg-grey-500 bg-opacity-75 top-0 left-0 z-10">
        <div className="w-full md:w-1/2 bg-white p-2 md:m-0 m-4 border-gray-900 border-2">
          <div className="flex flex-row justify-between mb-1 align-middle px-2">
            <h2 className="text-2xl font-semibold">{role.name}</h2>
            <button
              onClick={() => { this.setState({ descriptionVisible: !this.state.descriptionVisible }) }}
              className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >Close</button>
          </div>
          <div className="flex flex-col md:flex-row p-2">
            <div className="mx-auto md:m-0 w-48 mb-2 h-full flex-grow-0 flex-shrink-0">
              <div className="border-2 border-red-900">
                <img
                  src={vacant || user.profilePicture === null ? "/images/default_avatar.png" : `/uploads/images/profile/${user.profilePicture}`}
                  alt="User Profile Picture"
                  className="w-auto"
                />
                <div className="p-1">
                  <p className="font-semibold">{role.name}</p>
                  <p>{vacant ? "Vacant" : this.makeDisplayName(user)}</p>
                </div>
              </div>
            </div>
            <div>
              {
                role.videoUrl === null || role.videoUrl === "" ? (
                  <div className="flex-grow px-2">
                    {
                      role.description === null || role.description === "" ? (
                        <React.Fragment>
                          <p className="py-1">There is currently not a description or video for this role. If you are interested in finding out more about what this role involves please contact the JCR Chair (<a href="mailto:grey.chair@durham.ac.uk" rel="noopener noreferrer" target="_blank" className="font-semibold underline">grey.chair@durham.ac.uk</a>) or the JCR President or Vice-President who will be happy to provide you information about the role and/or put you in touch with the current holder.</p>
                          <p className="py-1">You can also checkout the Byelaws on the <Link className="underline font-semibold" to="/jcr/files">Core Documents</Link> page which will include all of the responsibility of this role!</p>
                        </React.Fragment>
                      ) : (
                        <div className="flex-grow py-1 text-left">
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
                          <p>There is not currently a video for this role.</p>
                        </div>
                      )
                    }
                  </div>
                ) : (
                  <div className="flex flex-col flex-grow overflow-auto px-2">
                    <h3 className="text-left font-semibold text-lg hidden md:block">About the Role</h3>
                    {
                      role.description === null || role.description === "" ? null : (
                        <div className="flex-grow py-1 text-left">
                          {
                            role.description.split("\n").map((line, i) => {
                              if(line === null || line === "\n" || line === "") {
                                return null;
                              }

                              return (
                                <p className="py-1" key={i}>{line}</p>
                              )
                            })
                          }
                        </div>
                      )
                    }
                    {
                      this.state.hideLoader ? null : (
                        <LoadingHolder />
                      )
                    }
                    <div className={this.state.hideLoader ? "w-full" : "hidden"}>
                      <ReactPlayer
                        url={role.videoUrl}
                        onReady={() => { this.setState({ hideLoader: true })}}
                      />
                    </div>
                  </div>
                )
              }
            </div>
          </div>
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
