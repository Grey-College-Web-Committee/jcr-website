import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

class BarOrder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      completedDrinks: this.props.order.contents.filter(item => item.completed).map(item => item.id),
      paid: this.props.order.paid,
      completed: false
    }
  }

  static getDerivedStateFromProps = (props, state) => {
    // We will need to determine if some drinks have been marked as completed
    let updatedCompletedDrinks = state.completedDrinks;

    // Add the new ones iff they're not already part of the list
    props.order.contents.forEach(item => {
      if(item.completed) {
        if(!updatedCompletedDrinks.includes(item.id)) {
          updatedCompletedDrinks.push(item.id);
        }
      }
    });

    let updates = {}

    // Only update if there was actually a difference
    if(updatedCompletedDrinks !== state.completedDrinks) {
      updates.completedDrinks = updatedCompletedDrinks;
    }

    if(props.order.paid !== state.paid) {
      updates.paid = props.order.paid;
    }

    if(Object.keys(updates).length !== 0) {
      return updates;
    }

    return null;
  }

  markOrderCompleted = () => {
    this.setState({ paid: true, completed: true }, () => {
      this.props.updateOrderCompleted(this.props.order.id);
    });
  }

  markDrinkComplete = (id) => {
    let { completedDrinks } = this.state;
    completedDrinks.push(id);
    this.setState({ completedDrinks }, () => {
      this.props.updateContentCompleted(this.props.order.id, id);
    });
  }

  markOrderPaid = () => {
    this.setState({ paid: true }, () => {
      this.props.updateOrderPaid(this.props.order.id);
    });
  }

  render () {
    const { order, completed } = this.props;

    return (
      <div className={`text-left border mb-2 p-2 ${completed ? "bg-gray-200" : ""}`}>
        <div className="mb-2">
          <div className="flex flex-row justify-between items-center">
            <p>Order ID: {order.id}</p>
            { completed ? <p>Already Completed</p> : (
              <button
                onClick={this.markOrderCompleted}
                className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >Mark Paid & Completed</button>
            )}
          </div>
          <p className="py-1">Ordered By: {order.orderedBy} ({order.email})</p>
          <p className="py-1">Ordered At: {dateFormat(order.orderedAt, "dd/mm/yyyy HH:MM:ss")}</p>
          <p className="py-1">Table Number: {order.tableNumber}</p>
          <p className="py-1">Total to Pay: £{order.totalPrice.toFixed(2)}</p>
          {
            completed ? <p>This order has already been marked completed</p> : (
              <div className="flex flex-row justify-start items-center">
                <p>Paid: {order.paid || this.state.paid ? "Yes" : "No"}</p>
                {
                  order.paid || this.state.paid ? null : (
                    <button
                      onClick={this.markOrderPaid}
                      className="ml-2 px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    >Mark Paid</button>
                  )
                }
              </div>
            )
          }
        </div>
        <table className="mx-auto border-2 text-left border-red-900 w-full">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Mixer</th>
              <th className="p-2 font-semibold">Cordial</th>
              <th className="p-2 font-semibold">Quantity</th>
              <th className="p-2 font-semibold">Completed</th>
            </tr>
          </thead>
          <tbody>
            {
              order.contents.map(content => (
                <tr className={`text-center border-b border-gray-400 ${content.completed ? "bg-gray-200" : ""}`} key={content.id}>
                  <td className={`p-2 border-r border-gray-400 ${content.completed ? "line-through" : ""}`}>{content.name} ({content.size})</td>
                  <td className={`p-2 border-r border-gray-400 ${content.completed ? "line-through" : ""}`}>{content.mixer === null ? "N/A" : content.mixer}</td>
                  <td className={`p-2 border-r border-gray-400 ${content.completed ? "line-through" : ""}`}>{content.cordial === null ? "N/A" : content.cordial}</td>
                  <td className={`p-2 border-r border-gray-400 ${content.completed ? "line-through" : ""}`}>{content.quantity}</td>
                  <td className="p-2 border-r border-gray-400">
                    {
                      this.state.completedDrinks.includes(content.id) || completed ? "Completed" : (
                        <button
                          className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                          onClick={() => this.markDrinkComplete(content.id)}
                        >Mark Complete</button>
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

BarOrder.propTypes = {
  order: PropTypes.object.isRequired,
  updateContentCompleted: PropTypes.func.isRequired,
  updateOrderPaid: PropTypes.func.isRequired,
  updateOrderCompleted: PropTypes.func.isRequired,
  completed: PropTypes.bool.isRequired
}

export default BarOrder;
