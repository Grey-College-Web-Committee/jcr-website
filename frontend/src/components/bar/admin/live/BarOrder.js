import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

class BarOrder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      completedDrinks: []
    }
  }

  markDrinkComplete = (id) => {
    let { completedDrinks } = this.state;
    completedDrinks.push(id);
    this.setState({ completedDrinks }, () => {
      this.props.updateDrinkCompleted(this.props.order.id, id);
    });
  }

  render () {
    const { order } = this.props;

    return (
      <div className="text-left border mb-2">
        <p>Order ID: {order.id}</p>
        <p>Ordered By: {order.orderedBy} (order.email)</p>
        <p>Ordered At: {order.orderedAt}</p>
        <p>Table Number: {order.tableNumber}</p>
        <p>Total to Pay: £{order.totalPrice.toFixed(2)}</p>
        <p>Paid: £{order.paid ? "Yes" : "No"}</p>
        <p>Order:</p>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mixer</th>
              <th>Quantity</th>
              <th>Mark Completed</th>
            </tr>
          </thead>
          <tbody>
            {
              order.contents.map(content => (
                <tr key={content.id}>
                  <td>{content.name} ({content.size})</td>
                  <td>{content.mixer === null ? "N/A" : content.mixer}</td>
                  <td>{content.quantity}</td>
                  <td>
                    {
                      this.state.completedDrinks.includes(content.id) ? "Completed" : (
                        <button
                          onClick={() => this.markDrinkComplete(content.id)}
                        >Complete</button>
                      )
                    }
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    )
  }
}

export default BarOrder;
