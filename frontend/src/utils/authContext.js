import React from 'react';

// Used to pass the user to other components
const authContext = React.createContext({
  user: {}
});

export default authContext;
