import React from 'react';
import PropTypes from 'prop-types';
import RoleComponent from './RoleComponent';

class CommitteeComponent extends React.Component {
  render () {
    const { committee, membersByPosition, clickableRoles } = this.props;

    return (
      <div>
        <h2 className="font-semibold text-2xl">{ committee.name }</h2>
        {
          committee.description.split("\n").map((line, i) => (
            line.length === 0 ? null : <p key={i} className="py-1">{line}</p>
          ))
        }
        <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 2xl:gap-4 auto-rows-fr">
          {
            membersByPosition.map((entry, i) => (
              <React.Fragment key={i}>
                {entry.JCRRole.JCRRoleUserLinks.map((link, j) => (
                  <RoleComponent
                    key={`${i}-${j}`}
                    role={entry.JCRRole}
                    user={link.User}
                    vacant={false}
                    clickable={clickableRoles}
                    disableBodyScroll={this.props.disableBodyScroll}
                  />
                ))}
                {entry.JCRRole.JCRRoleUserLinks.length === 0 ? (
                  <RoleComponent
                    key={`${i}-vacant`}
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
  clickableRoles: PropTypes.bool
}

export default CommitteeComponent;
