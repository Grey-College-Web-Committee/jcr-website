import React from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosConfig.js';
import authContext from '../../utils/authContext.js';
import config from '../../config.json';
import LoadingHolder from '../common/LoadingHolder';

class DebtorPage extends React.Component {
  render () {
    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Debt Owed to the JCR</h1>
          <div className="text-lg flex flex-col">
            <p className="font-medium">You currently have an outstanding debt owed to the JCR.</p>
            <br />
            <p>Until you clear this debt with the FACSO you will be unable to:</p>
            <ul className="p-4 list-disc w-auto mx-auto text-left">
              <li>Order stash</li>
              <li>Order toasties</li>
              <li>Purchase formal tickets</li>
              <li>Purchase event tickets</li>
            </ul>
            <p>If you would like to pay your debt and have access to JCR services again or believe there has been an error please <a href="mailto:finlayboyle2001@gmail.com" className="font-semibold underline">Email the FACSO</a> and clear your debt immediately.</p>
            <br />
            <p>Access to the shop will then be granted within a few weeks.</p>
          </div>
        </div>
      </div>
    );
  }
}

DebtorPage.contextType = authContext;

export default DebtorPage;
