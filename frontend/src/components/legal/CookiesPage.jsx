import React from 'react';

class CookiesPage extends React.Component {
  render () {
    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Cookie Policy</h1>
          <div className="flex flex-col w-full md:w-3/5 mx-auto text-justify">
            <p className="font-semibold">Last Updated: 18/01/2021</p>
            <p>We use cookies and local storage to provide services offered on this website. Cookies and local storage are data stored by your browser at the request of the website.</p>
            <p>There are two types of cookies that are set on this website:</p>
            <ul className="list-disc list-inside py-2">
              <li>First Party: Set directly by the website when you are using the services provided</li>
              <li>Third Party: Set by other companies such as Stripe for fraud protection and to provide the payment functionality of the website</li>
            </ul>
            <p>We do not set any analytic or advertising cookies.</p>
            <h3 className="font-semibold text-2xl py-4">Essential Cookies</h3>
            <p>You cannot opt out of the use of these cookies as they are required for the website to function.</p>
            <table className="text-left border mt-2">
              <thead>
                <tr>
                  <th className="p-2 border">Cookie</th>
                  <th className="p-2 border">Purpose</th>
                  <th className="p-2 border">Expiry</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border">
                  <td className="p-2 border">user_sid</td>
                  <td className="p-2 border">Stores a unique session token so that you do not have to login everytime you move to a new page on the website.</td>
                  <td className="p-2 border">3 hours or when you logout (whichever is first)</td>
                </tr>
              </tbody>
            </table>
            <h3 className="font-semibold text-2xl py-4">Third Party Cookies</h3>
            <p>In order to provide secure payment on this website. This website uses a service provided by the company Stripe. They set cookies that are required to prevent fraud and ensure that the payment process functions as intended. <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener noreferrer" className="underline">You can find more information about their specific cookie policy by clicking this text</a></p>
          </div>
        </div>
      </div>
    );
  }
}

export default CookiesPage;
