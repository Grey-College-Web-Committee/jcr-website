import React from 'react';
import PropTypes from 'prop-types';
import SingleTable from './SingleTable';

class TableLayout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      refreshKey: this.props.refreshKey
    }

    this.maxPairsPerTable = 3;
    this.hotSeatLocations = [29, 30];
  }

  renderTables = () => {
    const positions = [...this.props.positions];
    let tableData = [];

    while(positions.length > 0) {
      tableData.push(positions.splice(0, this.maxPairsPerTable));
    }

    let renders = [];

    for(let i = 0; i < tableData.length / 4; i++) {
      const firstTable = tableData[4 * i];

      if(4 * i + 1 >= tableData.length) {
        renders.push(
          <div className="my-2 flex flex-col md:flex-row justify-start" key={i}>
            <SingleTable
              pairs={firstTable}
              left={true}
              firstPosition={4 * i * this.maxPairsPerTable}
              hotSeatLocations={this.hotSeatLocations}
            />
            <div className="md:w-3/4 md:ml-2 md:block hidden"></div>
          </div>
        )
        continue;
      }

      const secondTable = tableData[4 * i + 1];
      const thirdTable = tableData[4 * i + 2];
      const fourthTable = tableData[4 * i + 3];

      renders.push(
        <div className="m-2 flex flex-col md:flex-row justify-between border-b border-t border-red-900" key={i}>
          <SingleTable
            pairs={firstTable}
            left={true}
            firstPosition={4 * i * this.maxPairsPerTable}
            hotSeatLocations={this.hotSeatLocations}
          />
          <SingleTable
            pairs={secondTable}
            left={false}
            firstPosition={(4 * i + 1) * this.maxPairsPerTable}
            hotSeatLocations={this.hotSeatLocations}
          />
          <SingleTable
            pairs={thirdTable}
            left={false}
            firstPosition={(4 * i + 2) * this.maxPairsPerTable}
            hotSeatLocations={this.hotSeatLocations}
          />
          <SingleTable
            pairs={fourthTable}
            left={false}
            firstPosition={(4 * i + 3) * this.maxPairsPerTable}
            hotSeatLocations={this.hotSeatLocations}
          />
        </div>
      );
    }

    return renders;
  }

  render () {
    return (
      <div className="flex flex-col transition-all">
        { this.renderTables() }
      </div>
    )
  }
}

export default TableLayout;
