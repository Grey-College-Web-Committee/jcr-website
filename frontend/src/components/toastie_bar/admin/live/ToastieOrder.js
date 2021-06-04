import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

class ToastieOrder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      completed: false,
      showCompleted: false
    }
  }

  static getDerivedStateFromProps = (props, state) => {
    if(props.showCompleted !== state.showCompleted) {
      return { showCompleted: props.showCompleted }
    }

    return null;
  }

  markOrderCompleted = () => {
    this.setState({ completed: true }, () => {
      this.props.updateOrderCompleted(this.props.order.id);
    });
  }

  render () {
    const { order } = this.props;
    const { showCompleted } = this.state;

    const completed = order.completed || this.state.completed;

    if(completed && !showCompleted) {
      return null;
    }

    return (
      <div className={`text-left border mb-2 p-2 ${completed ? "bg-gray-200" : ""}`}>
        <div className="mb-2">
          <div className="flex flex-row justify-between items-center">
            <p>Order ID: {order.id}</p>
            {
              completed ? (
                <p>Already Completed</p>
              ) : (
                <button
                  onClick={this.markOrderCompleted}
                  className="px-4 py-1 rounded bg-green-700 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >Mark Completed</button>
              )
            }
          </div>
          <p className="py-1">Ordered By: {order.displayName}</p>
          <p className="py-1">Ordered At: {dateFormat(order.createdAt, "dd/mm/yyyy HH:MM:ss")}</p>
          <p className="py-1">Table Number: {order.tableNumber}</p>
        </div>

        <table className="mx-auto border-2 text-left border-red-900 w-full">
          <thead className="bg-red-900 text-white">
            <tr>
              <th className="p-2 font-semibold">Item</th>
              <th className="p-2 font-semibold">Fillings</th>
              <th className="p-2 font-semibold">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {
              order.items.map((sub, subKey) => (
                <tr className="text-center border-b border-gray-400" key={subKey}>
                  <td className="p-2 border-r border-gray-400">{sub.toastie ? "Toastie" : sub.components[0].name}</td>
                  <td className="text-left p-2 border-r border-gray-400">
                    {
                      sub.toastie ? (
                        <ul className="list-inside list-disc">
                          {
                            sub.components.map(comp => (
                              <li>{comp.name}</li>
                            ))
                          }
                        </ul>
                      ) : "N/A"
                    }
                  </td>
                  <td className="p-2 border-r border-gray-400">{sub.toastie ? 1 : sub.components[0].quantity}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    )
  }
}

export default ToastieOrder;
