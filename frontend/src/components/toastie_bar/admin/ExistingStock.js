import React from 'react';
import PropTypes from 'prop-types';

class ExistingStock extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    if(this.props.stock === undefined) {
      return (
        <p>Loading...</p>
      );
    }

    return (
      <React.Fragment>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Available</th>
              <th>Last Updated</th>
              <th>Permanently Remove</th>
            </tr>
          </thead>
          <tbody>
            {this.props.stock.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.available ? "Yes" : "No"}</td>
                <td>{item.updatedAt}</td>
                <td>Delete</td>
              </tr>
            ))}
          </tbody>
        </table>
      </React.Fragment>
    )
  }
}

export default ExistingStock;
