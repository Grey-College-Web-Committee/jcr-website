import React, { useState } from 'react';
import dateFormat from 'dateformat';
import api from '../../../../utils/axiosConfig';

export const ToastieSpecialRow = (props) => {
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description);
  const [available] = useState(props.available);
  const [startDate, setStartDate] = useState(props.startDate);
  const [endDate, setEndDate] = useState(props.endDate);
  const [priceWithoutBread, setPriceWithoutBread] = useState(props.priceWithoutBread);
  
  // Fillings also exist but cannot be edited
  const [fillings] = useState(props.fillings);
  const [updatedAt, setUpdatedAt] = useState(props.updatedAt); 

  const [disabled, setDisabled] = useState(false);
  const [edited, setEdited] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Called when they click the save button
  // Updates the server with the new information
  const saveChanges = async () => {
    setDisabled(true);
    setEdited(false);

    try {
      await api.post(`/toastie/special/update`, { id: props.id, name, description, startDate, endDate, priceWithoutBread });
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
      await api.post(`/toastie/special/delete`, { id: props.id });
    } catch (error) {
      alert("Unable to save changes");
      return;
    }

    setDeleted(true);
  }

  const getAvailabilityMessage = () => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if(start > now) {
      return "Unreleased";
    }

    if(end < now) {
      return "Expired";
    }

    if(!available) {
      return "Fillings Unavailable";
    }

    return "Yes"
  }

  if(deleted) {
    return null;
  }


  return (
    <tr>
      <td className="border border-red-900 p-1">
        <input
          type="text"
          className="w-48 py-1 px-2 border disabled:opacity-25"
          value={name} 
          maxLength={255}
          onChange={(e) => { setName(e.target.value); setEdited(true) }}
          disabled={disabled}
        />
      </td>
      <td className="border border-red-900 p-1">
        <textarea
          type="text"
          className="align-middle py-1 px-2 border disabled:opacity-25"
          rows={3}
          cols={35}
          value={description} 
          maxLength={255}
          onChange={(e) => { setDescription(e.target.value); setEdited(true) }}
          disabled={disabled}
        />
      </td>
      <td className="border border-red-900 p-1">
        <ul className="w-32 list-inside list-disc text-left ml-2">
          {fillings.map((filling, i) => <li key={i}>{filling}</li>)}
        </ul>
      </td>
      <td className="border border-red-900 p-1">
        <input
          type="date"
          className="w-full py-1 px-2 border disabled:opacity-25"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setEdited(true) }}
          disabled={disabled}
        />
      </td>
      <td className="border border-red-900 p-1">
        <input
          type="date"
          className="w-full py-1 px-2 border disabled:opacity-25"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setEdited(true) }}
          disabled={disabled}
        />
      </td>
      <td className="border border-red-900 p-1">
        <input
          type="number"
          className="w-full py-1 px-2 border disabled:opacity-25"
          value={priceWithoutBread}
          min="0"
          step="0.01"
          onChange={(e) => { setPriceWithoutBread(e.target.value); setEdited(true) }}
          disabled={disabled}
        />
      </td>
      <td className="border border-red-900 p-1">
        <span>{ getAvailabilityMessage() }</span>
      </td>
      <td className="border border-red-900 p-1">
        <span>{dateFormat(updatedAt, "dd/mm/yyyy HH:MM:ss")}</span>
      </td>
      <td className="border border-red-900 p-1">
        <button
          className="w-full bg-grey-500 text-white px-2 py-1 rounded-sm disabled:opacity-25"
          disabled={disabled || !edited || name.length === 0 || description.length === 0 || startDate.length === 0 || endDate.length === 0 || Number(priceWithoutBread) <= 0}
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
