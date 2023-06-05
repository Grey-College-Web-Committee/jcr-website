import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import dateFormat from 'dateformat';

class WelfareMessageRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: false
    }
  }

  render () {
    return (
      <tr className="text-center border-b border-gray-400">
        <td className="p-2 border-r border-gray-400">{this.props.thread.title}</td>
        <td className="p-2 border-r border-gray-400">{dateFormat(this.props.thread.lastUpdate, "dd/mm/yyyy HH:MM")}</td>
        <td className="p-2 border-r border-gray-400">
          <Link to={`/welfare/message/thread/${this.props.thread.id}`}>
            <button
              className="px-4 py-1 rounded bg-green-700 text-white w-full md:w-48 font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >View</button>
          </Link>
        </td>
      </tr>
    );
  }
}

WelfareMessageRow.propTypes = {
  thread: PropTypes.object.isRequired
}

export default WelfareMessageRow;
