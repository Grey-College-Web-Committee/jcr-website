import React from 'react';
import PropTypes from 'prop-types';
import SingleTable from './SingleTable';

class TableLayout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      refreshKey: this.props.refreshKey
    }

    this.maxPairsPerTable = 2;
  }

  renderTables = () => {
    const positions = [...this.props.positions];
    let tableData = [];

    while(positions.length > 0) {
      tableData.push(positions.splice(0, this.maxPairsPerTable));
    }

    let renders = [];

    for(let i = 0; i < tableData.length / 2; i++) {
      const firstTable = tableData[2 * i];

      if(2 * i + 1 >= tableData.length) {
        renders.push(
          <div className="flex flex-col md:flex-row justify-start" key={i}>
            <SingleTable
              pairs={firstTable}
              left={true}
            />
            <div className="md:w-1/2 md:ml-2 md:block hidden"></div>
          </div>
        )
        continue;
      }

      const secondTable = tableData[2 * i + 1];

      renders.push(
        <div className="flex flex-col md:flex-row justify-between" key={i}>
          <SingleTable
            pairs={firstTable}
            left={true}
          />
          <SingleTable
            pairs={secondTable}
            left={false}
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
