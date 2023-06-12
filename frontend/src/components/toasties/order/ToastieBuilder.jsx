import React, { useState } from 'react'

export const ToastieBuilder = (props) => {
  const [selectedFillings, setSelectedFillings] = useState([]);
  const [selectedBread, setSelectedBread] = useState(null)

  const calculatePrice = () => {
    let total = 0;

    if(selectedBread !== null) {
      total += Number(props.breadLookup[selectedBread].pricePerUnit);
    }

    selectedFillings.forEach(id => total += Number(props.fillingLookup[id].pricePerUnit));

    return total.toFixed(2);
  }

  const isValid = () => {
    return (
      selectedBread !== null && selectedFillings.length > 0
    )
  }

  const addToOrder = () => {
    const entry = {
      breadId: selectedBread,
      fillingIds: selectedFillings,
      addedTime: new Date().getTime(),
      price: Number(calculatePrice())
    }

    props.addToOrder(entry);

    setSelectedBread(null);
    setSelectedFillings([]);
  }

  return (
    <div className="flex lg:flex-row flex-col-reverse">
      <div className="lg:w-4/5 flex flex-col">
        <div className="border flex flex-col p-1 mb-2">
          <h2 className="font-semibold text-lg mb-1">Select your bread</h2>
          {
            props.breads.sort((a, b) => a.name > b.name ? 1: -1).map((bread, i) => (
              <div 
                key={i} 
                className={`flex flex-row justify-between items-center border-b py-1 ${i === 0 ? "border-t" : ""}`}
              >
                <span>{bread.name} (£{bread.pricePerUnit})</span>
                {
                  bread.available ? (
                    <button
                      className="bg-grey-500 text-white w-20 p-1 rounded-sm disabled:opacity-25"
                      onClick={() => setSelectedBread(bread.id)}
                      disabled={selectedBread === bread.id}
                    >{ selectedBread === bread.id ? "Selected" : "Select" }</button>
                  ) : (
                    <span className="p-1">Out of Stock</span>
                  )
                }
              </div>
            ))
          }
        </div>
        <div className="border flex flex-col p-1">
          <h2 className="font-semibold text-lg mb-1">Add your fillings</h2>
          {
            props.fillings.sort((a, b) => a.name > b.name ? 1: -1).map((filling, i) => (
              <div key={i} className={`flex flex-row justify-between items-center border-b py-1 ${i === 0 ? "border-t" : ""}`}>
                <span>{filling.name} (£{filling.pricePerUnit})</span>
                {
                  filling.available ? (
                    <>
                      {
                        selectedFillings.includes(filling.id) ? (
                          <button
                            className="bg-grey-500 text-white w-20 p-1 rounded-sm disabled:opacity-25"
                            onClick={() => {
                              const copy = [...selectedFillings];
                              copy.splice(selectedFillings.indexOf(filling.id), 1);
                              setSelectedFillings(copy);
                            }}
                          >Remove</button>
                        ) : (
                          <button
                            className="bg-grey-500 text-white w-20 p-1 rounded-sm disabled:opacity-25"
                            onClick={() => setSelectedFillings([...selectedFillings, filling.id])}
                          >Add</button>
                        )
                      }
                    </>
                  ) : (
                    <span className="p-1">Out of Stock</span>
                  )
                }
              </div>
            ))
          }
        </div>
      </div>
      <div className="lg:w-1/5 border flex flex-col p-1 lg:ml-2 lg:mb-0 mb-2">
        <h3 className="font-semibold text-xl">Current Toastie</h3>
        <span>Bread: {selectedBread === null ? "None" : props.breadLookup[selectedBread].name}</span>
        <span>Fillings: {Object.keys(selectedFillings).length === 0 ? "None Selected" : ""}</span>
        <ul className="ml-2 list-inside list-disc">
          {
            selectedFillings.map((filling, i) => (
              <li key={i}>{props.fillingLookup[filling].name}</li>
            ))
          }
        </ul>
        <span>Total: £{calculatePrice()}</span>
        <button
          className="mt-2 p-1 w-full text-white bg-grey-500 rounded-sm disabled:opacity-25"
          disabled={!isValid()}
          onClick={addToOrder}
        >Add to Order</button>
      </div>
    </div>
  )
}
