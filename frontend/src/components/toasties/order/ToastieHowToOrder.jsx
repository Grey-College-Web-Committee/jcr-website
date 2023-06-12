import React from 'react';

import { IconContext  } from 'react-icons';
import { GiChocolateBar, GiBreadSlice, GiSandsOfTime, GiMilkCarton } from 'react-icons/gi';

export const ToastieHowToOrder = (props) => {
  if(!props.visible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 bg-grey-900 bg-opacity-25 w-screen h-screen flex flex-col justify-center items-center z-30">
        <div className="bg-white border-red-900 border-2 p-2 flex flex-col lg:w-1/2">
            <div className="flex flex-row justify-between mb-2">
                <h2 className="font-semibold text-3xl">How to Order</h2>
                <button
                    onClick={props.hide}
                    className="bg-red-900 p-2 rounded-sm text-white"
                >Close</button>
            </div>
            <div className="hidden lg:block">
                <p className="mb-1">
                    The JCR is testing a new ordering system. <span className="font-semibold">Payment is no longer taken online. </span>
                    If you have any feedback or notice any issues please email grey.website@durham.ac.uk!
                </p>
                <ul className="list-inside ml-2 list-disc my-2 text-lg">
                    <li>
                        <span className="font-semibold">Build a Toastie: </span>
                        Click the 'Build a Toastie' tab, select your bread, add your fillings and then click 'Add to Order'.
                    </li>
                    <li>
                        <span className="font-semibold">Specials: </span> 
                        Click the 'Specials' tab, use the dropdown on the special you want, select your bread and then click 'Add to Order'.
                        If the tab is empty then there are no specials at this time.
                    </li>
                    <li>
                        <span className="font-semibold">Milkshakes: </span> 
                        Click the 'Milkshakes' tab and click 'Add' next to the item you want.
                    </li>
                    <li>
                        <span className="font-semibold">Soft Drinks / Snacks: </span> 
                        Click the 'Other Items' tab and click 'Add' next to the item you want.
                    </li>
                    <li>
                        Once you're ready, click 'Place Order'. <span className="font-semibold">You'll be emailed when your order is ready!</span>
                    </li>
                </ul>
                <p>
                    If you are not a member of Grey College or you are not logged in, you will need to provide your name and CIS username. 
                    After placing your order you will receive an email with a link to verify your order. 
                    <span className="font-semibold"> Toastie Bar staff cannot see your order until you have verified it!</span>
                </p>
            </div>
            <div className="lg:hidden block">
                <p className="mb-1">
                    The JCR is testing a new ordering system. <span className="font-semibold">Payment is no longer taken online. </span>
                    If you have any feedback or notice any issues please email grey.website@durham.ac.uk!
                </p>
                <div className="flex flex-col my-1">
                    <div className="flex flex-col border p-1 mb-1">
                        <div className="flex flex-row items-center">
                            <IconContext.Provider value={{ className: "w-6 h-6 mr-1" }}>
                                <GiBreadSlice />
                            </IconContext.Provider> 
                            <span className="text-xl">Build a Toastie</span>
                        </div>
                        <span>Select your bread, add your fillings and then click 'Add to Order'.</span>
                    </div>
                    <div className="flex flex-col border p-1 mb-1">
                        <div className="flex flex-row items-center">
                            <IconContext.Provider value={{ className: "w-6 h-6 mr-1" }}>
                                <GiSandsOfTime />
                            </IconContext.Provider> 
                            <span className="text-xl">Specials</span>
                        </div>
                        <span>
                            Use the dropdown on the special you want, select your bread and then click 'Add to Order'.
                            If the tab is empty then there are no specials at this time.
                        </span>
                    </div>
                    <div className="flex flex-col border p-1 mb-1">
                        <div className="flex flex-row items-center">
                            <IconContext.Provider value={{ className: "w-6 h-6 mr-1" }}>
                                <GiMilkCarton />
                            </IconContext.Provider> 
                            <span className="text-xl">Milkshakes</span>
                        </div>
                        <span>Click 'Add' next to the item you want.</span>
                    </div>
                    <div className="flex flex-col border p-1 mb-1">
                        <div className="flex flex-row items-center">
                            <IconContext.Provider value={{ className: "w-6 h-6 mr-1" }}>
                                <GiChocolateBar />
                            </IconContext.Provider> 
                            <span className="text-xl">Soft Drinks / Snacks</span>
                        </div>
                        <span>Click 'Add' next to the item you want.</span>
                    </div>
                </div>
                <p>
                    If you are not a member of Grey College or you are not logged in, you will need to provide your name and CIS username. 
                    After placing your order you will receive an email with a link to verify your order. 
                    <span className="font-semibold"> Toastie Bar staff cannot see your order until you have verified it!</span>
                </p>
            </div>
        </div>
    </div>
  )
}
