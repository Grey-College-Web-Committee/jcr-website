import React from 'react';
import CircularSpinner from './CircularSpinner';

class LoadingHolder extends React.Component {
  render () {
    return (
      <div className="flex flex-col justify-center">
        <div className="container mx-auto text-center p-4">
          <h2 className="font-semibold text-4xl pb-4">Loading...</h2>
          <CircularSpinner />
        </div>
      </div>
    )
  }
}

export default LoadingHolder;
