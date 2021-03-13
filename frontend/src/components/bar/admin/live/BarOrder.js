import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

class BarOrder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      completedDrinks: this.props.order.contents.filter(item => item.completed).map(item => item.id)
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

    // Only update if there was actually a difference
    if(updatedCompletedDrinks !== state.completedDrinks) {
      return { completedDrinks: updatedCompletedDrinks }
    }

    return null;
  }

  markDrinkComplete = (id) => {
    let { completedDrinks } = this.state;
    completedDrinks.push(id);
    this.setState({ completedDrinks }, () => {
      this.props.updateContentCompleted(this.props.order.id, id);
    });
  }

  render () {
    const { order } = this.props;

    return (
      <div className="text-left border mb-2 p-2">
        <div className="mb-2">
          <div className="flex flex-row justify-between items-center">
            <p>Order ID: {order.id}</p>
            <button
              className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >Mark Paid & Completed</button>
          </div>
          <p className="py-1">Ordered By: {order.orderedBy} ({order.email})</p>
          <p className="py-1">Ordered At: {order.orderedAt}</p>
          <p className="py-1">Table Number: {order.tableNumber}</p>
          <p className="py-1">Total to Pay: £{order.totalPrice.toFixed(2)}</p>
          <div className="flex flex-row justify-start items-center">
            <p>Paid: {order.paid ? "Yes" : "No"}</p>
            <button
              className="ml-2 px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >Mark Paid</button>
          </div>
        </div>
        <table className="mx-auto border-2 text-left border-red-900 w-full">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Mixer</th>
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
                  <td className={`p-2 border-r border-gray-400 ${content.completed ? "line-through" : ""}`}>{content.quantity}</td>
                  <td className="p-2 border-r border-gray-400">
                    {
                      this.state.completedDrinks.includes(content.id) ? "Completed" : (
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

export default BarOrder;
