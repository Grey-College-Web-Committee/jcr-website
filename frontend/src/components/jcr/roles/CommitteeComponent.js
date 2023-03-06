import React from 'react';
import PropTypes from 'prop-types';
import RoleComponent from './RoleComponent';

class CommitteeComponent extends React.Component {
  render () {
    const { committee, membersByPosition, clickableRoles, showDescription, showName } = this.props;

    return (
      <div>
        {
          showName ? (
            <h2 className="font-semibold text-2xl mb-1">{ committee.name }</h2>
          ) : null
        }
        {
          showDescription ? committee.description.split("\n").map((line, i) => (
            line.length === 0 ? null : <p key={i} className="py-1">{line}</p>
          )) : null
        }
        <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 2xl:gap-4 auto-rows-fr">
          {
            membersByPosition.map((entry, i) => (
              <React.Fragment key={i}>
                {entry.JCRRole.JCRRoleUserLinks.map((link, j) => (
                  <RoleComponent
                    key={`${entry.JCRRole.name}-${j}`}
                    role={entry.JCRRole}
                    user={link.User}
                    vacant={false}
                    clickable={clickableRoles}
                    disableBodyScroll={this.props.disableBodyScroll}
                  />
                ))}
                {entry.JCRRole.JCRRoleUserLinks.length === 0 ? (
                  <RoleComponent
                    key={`${entry.JCRRole.name}-vacant`}
                    role={entry.JCRRole}
                    user={null}
                    vacant={true}
                    clickable={clickableRoles}
                    disableBodyScroll={this.props.disableBodyScroll}
                  />
                ): null}
              </React.Fragment>
            ))
          }
        </div>
      </div>
    )
  }
}

CommitteeComponent.propTypes = {
  committee: PropTypes.object,
  membersByPosition: PropTypes.array,
  disableBodyScroll: PropTypes.func,
  clickableRoles: PropTypes.bool,
  showDescription: PropTypes.bool,
  showName: PropTypes.bool
}

export default CommitteeComponent;
