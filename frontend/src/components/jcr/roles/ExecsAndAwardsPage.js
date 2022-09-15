import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import information from './execs-and-awards';

class ExecsAndAwardsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedYear: "2022/23"
    }
  }

  renderYear = (selected) => {
    const { year, exec, awards, sas } = information[selected];

    let allClubs = sas ? sas.sports.concat(sas.societies).concat(sas.committees) : null;

    if(allClubs) {
      allClubs.sort((a, b) => {
        return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0)
      });
    }

    return (
      <div className="text-left">
        <h2 className="font-semibold text-4xl mb-1">{year}</h2>
        <div className="mb-1">
          <h3 className="font-semibold text-3xl mb-1">JCR Executive Committee</h3>
          <ul>
            {
              exec.map((role, j) => (
                <li key={j}>
                  <span className="font-medium">{role.role}</span>: {role.name}
                </li>
              ))
            }
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-3xl mb-1">Awards</h3>
          <p>
            <span className="font-medium">Howick Plate: </span>
            { awards.howick }
          </p>
          { awards.leadership ? (
            <p>
              <span className="font-medium">Excellence in Leadership: </span>
              { awards.leadership }
            </p>
          ) : null }
          { awards.unsung ? (
            <p>
              <span className="font-medium">Unsung Hero: </span>
              { awards.unsung }
            </p>
          ) : null }
          <p>
            <span className="font-medium">Honorary Life Memberships: </span>
            {
              awards.hlms.map((person, j) => (
                <span key={j}>{j === 0 ? "" : ", "}{person}</span>
              ))
            }
            .
          </p>
          <p>
            <span className="font-medium">Presidential Recognition Awards: </span>
            {
              awards.pras.map((person, j) => (
                <span key={j}>{j === 0 ? "" : ", "}{person}</span>
              ))
            }
            .
          </p>
        </div>
        {
          sas ? (
            <div className="mt-1">
              <h3 className="font-semibold text-3xl mb-1">Sports, Societies, and Committees</h3>
              <div>
                <p>
                  <span className="font-medium">Sport of the Year: </span>
                  { sas.awards.sport }
                </p>
                <p>
                  <span className="font-medium">Society of the Year: </span>
                  { sas.awards.society }
                </p>
                <p>
                  <span className="font-medium">Committee of the Year: </span>
                  { sas.awards.committee }
                </p>
                <p>
                  <span className="font-medium">Team of the Year: </span>
                  { sas.awards.team }
                </p>
                { sas.awards.special ? (
                  <p>
                    <span className="font-medium">Special Recognition Award: </span>
                    { sas.awards.special }
                  </p>
                ) : null }
              </div>
              <div className="mt-1">
                <h4 className="font-semibold text-2xl mb-1">Colours and Commendations</h4>
                {
                  allClubs.map((club, i) => (
                    <div className="mb-1" key={i}>
                      <h5 className="font-semibold text-lg">{club.name}</h5>
                      <p>
                        <span className="underline">Colours:</span>
                        <span> </span>
                        {
                          club.colours.map((person, j) => (
                            <span key={j}>{j === 0 ? "" : ", "}{person}</span>
                          ))
                        }
                        .
                      </p>
                      { club.commendations && club.commendations.length !== 0 ? (
                        <p>
                          <span className="underline">Commendations:</span>
                          <span> </span>
                          {
                            club.commendations.map((person, j) => (
                              <span key={j}>{j === 0 ? "" : ", "}{person}</span>
                            ))
                          }
                          .
                        </p>
                      ) : null }
                    </div>
                  ))
                }
              </div>
            </div>
          ) : null
        }
      </div>
    )
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value), disabled: true }, this.loadCommittee);
  }

  render () {
    return (
      <div className="flex flex-col justify-start">
        <div className="relative">
          <img
            src="/images/execs_banner.jpg"
            className="w-full h-auto relative z-0 lg:block hidden lg:h-96 md:object-cover"
            alt="Replace banner with your image"
          ></img>
          <img
            src="/images/execs_banner.jpg"
            className="w-full h-auto relative z-0 block lg:hidden"
            alt="Replace banner with your image"
          ></img>
          <div className="absolute p-4 z-20 bottom-0 left-0 w-full h-full flex-col text-white bg-grey-500 bg-opacity-75 border-t-4 border-b-4 border-red-900 justify-center flex">
            <div className="flex flex-row align-middle items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold">Execs and Awards</h1>
            </div>
          </div>
        </div>
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <div className="text-left">
            <p className="text-left mb-2">This page lists all JCR Executive Committees and JCR award recipients from 2020/21 onwards. Generally those listed will have held their position from the end of Epiphany term for a year but the terms of office for some positions do differ slightly and their terms may overlap through multiple executive committees.</p>
            <p className="text-left">Colours and commendations are presented at the President's Guest Night annually and are given in recognition of significant contributions to a specific sport, society, or committee within the JCR. At the end of the year, at Phoenix Ball, Presidential Recognition Awards are given to individuals who have made a significant contribution to life at Grey, and they can be awarded to any year group. Honorary Life Memberships go to those who have made an outstanding contribution to Grey life during their time here, these can only be given out to finalists. The final and most prestigious award, the Howick Plate, goes to the one individual graduating that has really given the most to their time at Grey and has made an outstanding contribution.</p>
          </div>
          <div className="flex flex-row items-center text-2xl my-4 font-semibold">
            <span>View Year:</span>
            <select
              value={this.state.selectedYear}
              onChange={this.onInputChange}
              name="selectedYear"
              className="my-1 md:my-0 md:ml-2 w-auto border border-gray-400 disabled:opacity-50"
            >
              {
                Object.keys(information).map((year, i) => (
                  <option key={i} value={year}>{year}</option>
                ))
              }
            </select>
          </div>
          <div className="flex flex-col border p-2">
            {
              this.renderYear(this.state.selectedYear)
            }
          </div>
        </div>
      </div>
    );
  }
}

export default ExecsAndAwardsPage;
