import React, { useEffect, useState } from 'react';
import dateFormat from 'dateformat';
import api from '../../../../utils/axiosConfig';

export const ToastieAdditionalStockRow = (props) => {
  const [name, setName] = useState(props.name);
  const [typeId, setTypeID] = useState(props.typeId);
  const [pricePerUnit, setPricePerUnit] = useState(props.pricePerUnit);
  const [available, setAvailable] = useState(props.available);
  const [updatedAt, setUpdatedAt] = useState(props.updatedAt); 

  const [disabled, setDisabled] = useState(false);
  const [edited, setEdited] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {

  }, [props.allTypes])

  // Called when they click the save button
  // Updates the server with the new information
  const saveChanges = async () => {
    setDisabled(true);
    setEdited(false);

    try {
      await api.post(`/toastie/additional/update`, { id: props.id, name, typeId, pricePerUnit, available });
    } catch (error) {
      alert("Unable to save changes");
      return;
    }

    setUpdatedAt(new Date());
    setDisabled(false);
  }

  // Called when they click the delete button
  // Marks deleted on the server and then hides row
  const deletePermanently = async () => {
    setDisabled(true);

    if(!window.confirm(`Are you sure you want to permanently delete ${name}?`)) {
      setDisabled(false);
      return;
    }

    try {
      await api.post(`/toastie/additional/delete`, { id: props.id });
    } catch (error) {
      alert("Unable to save changes");
      return;
    }

    setDeleted(true);
  }

  if(deleted) {
    return null;
  }

  return (
    <tr>
      <td className="border border-red-900 p-1">
        <input
          type="text"
          className="w-full py-1 px-2 border disabled:opacity-25"
          value={name} 
          maxLength={255}
          onChange={(e) => { setName(e.target.value); setEdited(true) }}
          disabled={disabled}
        />
      </td>
      <td className="border border-red-900 p-1">
        <select
          value={typeId}
          className="w-full py-1 px-2 border disabled:opacity-25"
          onChange={(e) => { setTypeID(e.target.value); setEdited(true) }}
        >
          {props.allTypes.map(additionalType => 
            <option
              key={additionalType.id}
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
          onChange={(e) => { setPricePerUnit(e.target.value); setEdited(true) }}
          disabled={disabled}
        />
      </td>
      <td className="border border-red-900 p-1">
        <input
          type="checkbox"
          className="my-auto align-middle w-6 h-6 disabled:opacity-25"
          checked={available}
          onChange={(e) => { setAvailable(e.target.checked); setEdited(true) }}
          disabled={disabled}
        />
      </td>
      <td className="border border-red-900 p-1">
        <span>{dateFormat(updatedAt, "dd/mm/yyyy HH:MM:ss")}</span>
      </td>
      <td className="border border-red-900 p-1">
        <button
          className="w-full bg-grey-500 text-white px-2 py-1 rounded-sm disabled:opacity-25"
          disabled={disabled || !edited}
          onClick={saveChanges}
        >Save</button>
      </td>
      <td className="border border-red-900 p-1">
        <button
          className="w-full bg-yellow-900 text-white px-2 py-1 rounded-sm disabled:opacity-25"
          disabled={disabled}
          onClick={deletePermanently}
        >Delete</button>
      </td>
    </tr>
  )
}
