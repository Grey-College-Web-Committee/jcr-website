import React, { useState } from 'react'
import api from '../../../../utils/axiosConfig';

export const ToastieNewAdditionalStockRow = (props) => {
  const [name, setName] = useState("");
  const [typeId, setTypeID] = useState(-1);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [available, setAvailable] = useState(true);

  const [disabled, setDisabled] = useState(false);

  const addNewRow = async () => {
    setDisabled(true);

    if(name.length === 0 || pricePerUnit.length === 0 || Number(pricePerUnit) < 0 || typeId === -1) {
      alert("Invalid input");
      setDisabled(false);
      return;
    }
    
    let result;

    try {
      result = await api.post(`/toastie/additional/create`, { name, typeId, pricePerUnit, available });
    } catch (error) {
      alert("Error adding row");
      return;
    }

    props.onRowAdded(result.data.record, result.data.type);

    setDisabled(false);
    setName("");
    setTypeID(-1);
    setPricePerUnit(0);
    setAvailable(true);
  }

  return (
    <tr className="border-t-8 border-red-900">
      <td className="border border-red-900 p-1">
        <input
          type="text"
          className="w-full py-1 px-2 border disabled:opacity-25"
          value={name} 
          maxLength={255}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          placeholder="Item name..."
        />
      </td>
      <td className="border border-red-900 p-1">
        <select
          value={typeId}
          className="w-full py-1 px-2 border disabled:opacity-25"
          onChange={(e) => setTypeID(e.target.value)}
        >
          <option value={-1} disabled={true} hidden={true}>Select an option...</option>
          {props.allTypes.map(additionalType => 
            <option
              value={additionalType.id}
            >{additionalType.name}</option>
          )}
        </select>
      </td>
      <td className="border border-red-900 p-1">
        <input
          type="number"
          className="w-full py-1 px-2 border disabled:opacity-25"
          value={pricePerUnit}
          min="0"
          step="0.01"
          onChange={(e) => setPricePerUnit(e.target.value)}
          disabled={disabled}
        />
      </td>
      <td className="border border-red-900 p-1">
        <input
          type="checkbox"
          className="my-auto align-middle w-6 h-6 disabled:opacity-25"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          disabled={disabled}
        />
      </td>
      <td className="border border-red-900 p-1" colSpan={3}>
        <button
          className="w-full bg-green-900 text-white px-2 py-1 rounded-sm disabled:opacity-25"
          disabled={disabled || name.length === 0 || pricePerUnit.length === 0 || Number(pricePerUnit) < 0 || typeId === -1}
          onClick={addNewRow}
        >Add New Row</button>
      </td>
    </tr>
  )
}
