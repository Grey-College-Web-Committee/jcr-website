import React from 'react';

class ContributorsPage extends React.Component {
  render () {
    return (
      <div className="flex flex-col justify-start text-lg">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Contributors</h1>
          <div className="flex lg:flex-row flex-col lg:justify-between text-left">
            <div className="flex-grow flex flex-col mx-2 p-2 lg:w-1/2 mb-4 border-2">
              <h2 className="font-semibold text-3xl pb-4 text-center">Website Design and Contributors</h2>
              <ul className="list-inside list-disc">
                <li>Finlay Boyle</li>
                <li>Jacob Wrenn</li>
                <li>Ben Hacker</li>
                <li>Will Morrice</li>
              </ul>
            </div>
            <div className="flex-grow flex flex-col mx-2 p-2 lg:w-1/2 border-2">
              <h2 className="font-semibold text-3xl pb-4 text-center">Image Attributions</h2>
              <ul className="list-inside list-disc">
                <li>Assets reused from the <a href="https://github.com/ben-willis/grey-jcr/" target="_blank" rel="noopener noreferrer"><span className="mr-2 underline">existing Grey JCR Website</span></a></li>
                <li>Grey Crest by AlexD - Own work, CC BY-SA 3.0, <a href="https://commons.wikimedia.org/w/index.php?curid=5147969" target="_blank" rel="noopener noreferrer" className="underline">source</a></li>
                <li>Stash Personalisation Options Image - Ellen Knight</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ContributorsPage;
