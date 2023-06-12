import React, { useEffect, useState } from 'react'
import { MdClose } from "react-icons/md";
import api from '../../../../utils/axiosConfig';

export const ToastieSpecialCreator = (props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priceWithoutBread, setPriceWithoutBread] = useState(0);

  const [selectedFilling, setSelectedFilling] = useState(-1);
  const [addedFillingIDs, setAddedFillingIDs] = useState([]);

  const [fillingsList, setFillingsList] = useState(props.fillingsList);
  const [fillingsMap, setFillingsMap] = useState({});

  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setFillingsMap(props.fillingsList.reduce((acc, entry) => {
      acc[entry.id] = {
        id: entry.id,
        name: entry.name,
        pricePerUnit: entry.pricePerUnit
      }
      return acc;
    }, {}));
    setFillingsList(props.fillingsList.sort((a, b) => a.name > b.name ? 1: -1));
  }, [props.fillingsList]);

  const addFilling = () => {
    const existingFillings = [...addedFillingIDs];
    existingFillings.push(selectedFilling);
    setAddedFillingIDs(existingFillings);
    setSelectedFilling(-1);
  }

  const removeFilling = (id) => {
    const existingFillings = [...addedFillingIDs];
    const index = existingFillings.indexOf(id);
    existingFillings.splice(index, 1);
    setAddedFillingIDs(existingFillings);
  }

  const isValid = () => {
    return (
      name.length > 0 &&
      description.length > 0 &&
      startDate.length > 0 &&
      endDate.length > 0 &&
      new Date(endDate) >= new Date(startDate) &&
      priceWithoutBread > 0 &&
      addedFillingIDs.length > 0
    )
  }

  const createSpecial = async () => {
    setDisabled(true);

    if(!isValid()) {
      alert("Invalid input");
      setDisabled(false);
      return;
    }

    let result;

    try {
      result = await api.post("/toastie/special/create", 
        { name, description, startDate, endDate, priceWithoutBread, addedFillingIDs }
      );
    } catch (error) {
      alert("Unable to add");
      return;
    }

    setName("");
    setDescription("");
    setStartDate(null);
    setEndDate(null);
    setPriceWithoutBread(0);
    setSelectedFilling(-1);
    setAddedFillingIDs([]);

    await props.onNewSpecialCreated(result.data.record, result.data.fillings, result.data.available);
    props.hide();
  }

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-10 bg-opacity-75 bg-grey-500 text-white">
      <div className="flex flex-col w-full h-full justify-center items-center align-items-center align-middle">
        <div className="w-1/2 min-h-3/5 border-8 border-red-900 bg-white text-black flex flex-col p-2 justify-between z-20">
          <div className="flex flex-col">
            <div className="flex flex-row justify-between items-center">
              <h2 className="text-3xl font-semibold mb-1">Create New Special</h2>
              <button
                className="bg-red-900 text-white px-2 py-1 rounded-sm"
                onClick={props.hide}
              >Close Window</button>
            </div>
            <div className="mb-2 flex flex-col">
              <h3 className="font-semibold text-xl">Details</h3>
              <div className="flex flex-row items-center mt-1">
                <span className="w-32">Name:</span>
                <input
                  type="text"
                  className="w-80 py-1 px-2 border disabled:opacity-25"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="flex flex-row items-center mt-1">
                <span className="w-32">Description:</span>
                <textarea
                  className="w-4/5 border py-1 px-2"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="flex flex-row items-center mt-1">
                <span className="w-32">Start Date:</span>
                <input
                  type="date"
                  className="w-48 py-1 px-2 border disabled:opacity-25"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="flex flex-row items-center mt-1">
                <span className="w-32">End Date:</span>
                <input
                  type="date"
                  className="w-48 py-1 px-2 border disabled:opacity-25"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="flex flex-row items-center mt-1">
                <span className="w-32">Price (no bread):</span>
                <input
                  type="number"
                  className="w-48 py-1 px-2 border disabled:opacity-25"
                  value={priceWithoutBread}
                  onChange={e => setPriceWithoutBread(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="mb-2 flex flex-col">
              <h3 className="font-semibold text-xl">Fillings</h3>
              <div className="flex flex-row items-center mt-1">
                <span>Filling:</span>
                <select
                  value={selectedFilling}
                  className="mx-2 border p-1 min-w-64"
                  onChange={e => setSelectedFilling(e.target.value)}
                  disabled={disabled}
                >
                  <option value={-1} disabled={true} hidden={true}>Select filling...</option>
                  {
                    fillingsList.map(filling => 
                      <option
                        key={filling.id}
                        disabled={addedFillingIDs.includes(`${filling.id}`)}
                        value={filling.id}
                        className=""
                      >{filling.name} (£{filling.pricePerUnit})</option>
                    )
                  }
                </select>
                <button
                  className="bg-green-700 text-white px-2 p-1 rounded-sm disabled:opacity-25"
                  onClick={addFilling}
                  disabled={selectedFilling === -1 || disabled}
                >Add to Special</button>
              </div>
              <div className="flex flex-col">
                <h4 className="font-semibold mb-2 text-lg">Added:</h4>
                {
                  addedFillingIDs.length === 0 ? <span className="mb-2">No fillings added yet</span> : addedFillingIDs.map(id => 
                    <div key={id} className="flex flex-row items-center mb-2">
                      <button
                        onClick={() => removeFilling(id)}
                        className="bg-red-900 text-white px-1 rounded-sm mr-2 h-6 w-6"
                        disabled={disabled}
                      >
                        <div className="flex flex-row justify-center items-center">
                          <MdClose />
                        </div>
                      </button>
                      <span className="w-full">{fillingsMap[id].name} (normal price £{fillingsMap[id].pricePerUnit})</span>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="mb-2 font-semibold">Note that fillings cannot be changed once you leave this screen but all other details can. To edit the fillings, delete the special and recreate it.</span>
            <button
              className="bg-green-700 text-white p-2 rounded-sm text-lg disabled:opacity-25"
              disabled={!isValid() || disabled}
              onClick={createSpecial}
            >Create Special</button>
          </div>
        </div>
      </div>
    </div>
  )
}
