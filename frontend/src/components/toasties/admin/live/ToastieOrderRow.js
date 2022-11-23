import React, { useEffect, useState } from 'react';
import dateFormat from 'dateformat';

export const ToastieOrderRow = (props) => {
  const [completed, setCompleted] = useState(props.completedTime !== null);
  const { orderId, customerName, orderedAt, additionalItems, toasties, milkshakes, totalPrice} = props;

  useEffect(() => {
    setCompleted(props.completedTime !== null)
  }, [props.completedTime]);

  const generateToastieSection = () => (
    <div>
      <h3 className="font-semibold mb-2">Toasties</h3>
      <div className="flex flex-col">
        {
          toasties.map((toastie, i) => (
            <div key={i} className="flex flex-col border p-2 mb-2">
              <h4>{toastie.quantity} x {toastie.special ? `${toastie.special} (Special)` : `Toastie ${i + 1}`}</h4>
              <ul className="ml-2 list-inside list-disc">
                <li>Bread: {toastie.bread}</li>
                {
                  toastie.fillings.map((filling, j) => (
                    <li key={j}>{filling}</li>
                  ))
                }
              </ul>
            </div>
          ))
        }
      </div>
    </div>
  )

  const generateMilkshakesSection = () => (
    <div className="mb-2">
      <h3 className="font-semibold mb-2">Milkshakes</h3>
      <ul className="ml-2 list-inside list-disc">
        {
          milkshakes.map((milkshake, i) => <li key={i}>{milkshake.quantity} x {milkshake.name}</li>)
        }
      </ul>
    </div>
  )

  const generateAdditionalItemsSection = () => (
    <div className="mb-2">
      <h3 className="font-semibold mb-2">Additional Items</h3>
      <ul className="ml-2 list-inside list-disc">
        {
          additionalItems.map((item, i) => <li key={i}>{item.quantity} x {item.name}</li>)
        }
      </ul>
    </div>
  )

  const completeOrder = () => {
    setCompleted(true);
    props.complete();
  }

  if(completed) {
    return null;
  }

  return (
    <div className="flex flex-col border-2 border-red-900 p-2 mb-2">
      <div className="flex flex-row justify-between items-start">
        <div className="flex flex-col mb-1">
          <h2 className="font-semibold text-xl">Order #{orderId} - {customerName} (Total: £{totalPrice})</h2>
          <span className="text-sm italic">Order placed at {dateFormat(orderedAt, "dd/mm/yyyy HH:MM:ss")}</span>
        </div>
        <button
          className="bg-grey-500 text-white rounded-md px-2 py-1"
          onClick={completeOrder}
        >Mark Complete & Email</button>
      </div>
      {
        toasties.length === 0 ? null : generateToastieSection()
      }
      {
        milkshakes.length === 0 ? null : generateMilkshakesSection()
      }
      {
        additionalItems.length === 0 ? null : generateAdditionalItemsSection()
      }
    </div>
  )
}
