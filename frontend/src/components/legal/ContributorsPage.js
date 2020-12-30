import React from 'react';
import PropTypes from 'prop-types';

class ContributorsPage extends React.Component {
  render () {
    return (
      <div className="flex flex-col justify-start text-lg">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Contributors</h1>
          <div className="flex sm:flex-row flex-col sm:justify-between text-left">
            <div className="flex-grow flex flex-col border-black border-2 mx-2 p-2 sm:w-1/2 mb-4">
              <h2 className="font-semibold text-3xl pb-4">Website Design and Contributors</h2>
              <ul className="list-inside list-disc">
                <li>Finlay Boyle</li>
                <li>Ben Hacker</li>
                <li>Will Morrice</li>
                <li>James Lee</li>
              </ul>
              <a href="https://github.com/Grey-College-Web-Committee/grey-shop" rel="noopener noreferrer">
                <div className="flex flex-row items-center justify-center sm:justify-start">
                  <span className="mr-2 underline">Contribute on GitHub</span>
                  <img
                    src="/images/GitHub-Mark-120px-plus.png"
                    className="h-4"
                  />
                </div>
              </a>
            </div>
            <div className="flex-grow flex flex-col border-black border-2 mx-2 p-2 sm:w-1/2">
              <h2 className="font-semibold text-3xl pb-4">Image Attributions</h2>
              <ul className="list-inside list-disc">
                <li>Assets reused from the <a href="https://github.com/ben-willis/grey-jcr/" rel="noopener noreferrer"><span className="mr-2 underline">existing Grey JCR Website</span></a></li>
                <li>Grey Crest by AlexD - Own work, CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=5147969</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ContributorsPage;
