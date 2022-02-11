import React from 'react';
import PropTypes from 'prop-types';

class SingleTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      updatedIndexes: []
    }

    this.clearAnimation = undefined;
  }

  // Used to find out which ones have been changed so they can be pulsed
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    const { pairs } = this.props;
    const oldPairs = prevProps.pairs;

    let updatedIndexes = [];

    for(let i = 0; i < pairs.length; i++) {
      if(i >= oldPairs.length) {
        updatedIndexes.push(i);
        continue;
      }

      if(oldPairs[i].id !== pairs[i].id) {
        updatedIndexes.push(i);
      }
    }

    if(updatedIndexes.length !== 0) {
      if(this.clearAnimation) {
        window.clearTimeout(this.clearAnimation);
      }

      this.setState({ updatedIndexes }, () => {
        this.clearAnimation = window.setTimeout(() => {
          this.setState({ updatedIndexes: [] })
        }, 1000);
      });
    }
  }

  render () {
    return (
      <div className={`text-xs xl:text-base w-full md:w-1/4 flex flex-col ${this.props.left ? "md:mr-2" : "md:ml-2"}`}>
        <div className="flex flex-row justify-between my-1 items-end">
          {
            this.props.pairs.map((pair, i) => {
              const hotSeat = this.props.hotSeatLocations.includes(this.props.firstPosition + i);

              return (
                <div
                  className={`transition-all duration-500 w-24 h-20 mb-1 pb-1 border-b border-red-900 overflow-auto flex flex-col justify-center ${hotSeat ? "bg-yellow-700 text-white" : ""} ${this.state.updatedIndexes.includes(i) ? "animate-pulse bg-blue-200" : ""}`}
                  key={i}>
                  <div>
                    <span>{pair.first}</span>
                  </div>
                </div>
              );
            })
          }
        </div>
        <div className="border border-black h-16 w-full"></div>
        <div className="flex flex-row justify-between my-1 items-start">
          {
            this.props.pairs.map((pair, i) => {
              const hotSeat = this.props.hotSeatLocations.includes(this.props.firstPosition + i);

              return (
                <div
                  className={`transition-all duration-500 w-24 h-20 mt-1 pt-1 border-t border-red-900 overflow-auto flex flex-col justify-center ${hotSeat ? "bg-yellow-700 text-white" : ""} ${this.state.updatedIndexes.includes(i) ? "animate-pulse bg-blue-200" : ""}`}
                  key={i}
                >
                  <div>
                    <span>{pair.second}</span>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    )
  }
}

export default SingleTable;
