import { React, useState } from 'react';
import dateFormat from "dateformat";

export const ToastieSpecial = (props) => {
  const [selectedBread, setSelectedBread] = useState("");
  
  const addToOrder = () => {
    const entry = {
      specialId: props.special.id,
      breadId: selectedBread
    }

    props.addToOrder(entry);

    setSelectedBread("");
  }

  return (
    <div className="flex flex-col lg:flex-row lg:justify-between">
      <div className="flex flex-col lg:mb-0 mb-2">
        <span className="font-semibold text-lg">{props.special.name} (£{props.special.priceWithoutBread} + Bread)</span>
        <span className="text-sm italic">Available until {dateFormat(props.special.endDate, "dd/mm/yyyy")}</span>
        <span className="">{props.special.description}</span>
        <span className="">(Filling{props.special.fillings.length === 1 ? "" : "s"}: {props.special.fillings.join(", ")})</span>
      </div>
      <div className="flex flex-col justify-center">
        <select
          className="mb-2 border p-1"
          value={selectedBread}
          onChange={e => setSelectedBread(e.target.value)}
          disabled={!props.special.available}
        >
          <option disabled={true} hidden={true} value="">Select bread...</option>
          {
            props.breads.map(bread => 
              <option
                key={bread.id}
                value={bread.id}
                disabled={!bread.available}
              >{bread.name} (Total: £{(Number(bread.pricePerUnit) + Number(props.special.priceWithoutBread)).toFixed(2)})</option>
            )
          }
        </select>
        <button
          className="bg-grey-500 text-white px-2 py-1 rounded-sm disabled:opacity-25"
          disabled={selectedBread === "" || !props.special.available}
          onClick={addToOrder}
        >{ props.special.available ? "Add to order" : "Unavailable" }</button>
      </div>
    </div>
  )
}
