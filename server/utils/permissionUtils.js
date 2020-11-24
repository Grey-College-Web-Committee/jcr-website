hasPermission = (session, permission) => {
  if(permission === null || session === null) {
    return false;
  }

  if(session.permissions === null) {
    return false;
  }

  return session.permissions.includes(permission.toLowerCase());
}

module.exports = { hasPermission };
