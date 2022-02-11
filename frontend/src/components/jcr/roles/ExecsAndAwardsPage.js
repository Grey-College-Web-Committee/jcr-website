import React from 'react';
import { Link, Redirect } from 'react-router-dom';

const information = [
  {
    year: "2021/22",
    exec: [
      {
        role: "President",
        name: "Hannah Richards"
      },
      {
        role: "FACSO",
        name: "Sophie Grantham"
      },
      {
        role: "Vice President",
        name: "James Marshall"
      },
      {
        role: "Chair",
        name: "Becca Whiting"
      },
      {
        role: "MCR President",
        name: "Laurence Wayne"
      },
      {
        role: "Senior Welfare Officers",
        name: "Fiona Tuite and Lucy Docherty"
      },
      {
        role: "Website Editor",
        name: "Finlay Boyle"
      },
      {
        role: "Technical Manager",
        name: "Ben Hacker"
      },
      {
        role: "Sports and Societies Officer",
        name: "James O'Neill"
      },
      {
        role: "Communications Officer",
        name: "To Be Elected"
      },
      {
        role: "Events Manager",
        name: "Izzy Cowell"
      },
      {
        role: "Secretary",
        name: "To Be Elected"
      },
      {
        role: "Bar Managers",
        name: "Will Hicks and Caitlin Tan"
      },
      {
        role: "Representatives Officer",
        name: "Isobel Warwick"
      },
      {
        role: "Students' Union Officer",
        name: "Monique Devaux"
      },
    ],
    awards: {
      pras: ["Awarded in 2022"],
      hlms: ["Awarded in 2022"],
      howick: "Awarded in 2022"
    }
  },
  {
    year: "2020/21",
    exec: [
      {
        role: "President",
        name: "Sam Dornan"
      },
      {
        role: "FACSO",
        name: "William Morrice"
      },
      {
        role: "Vice President",
        name: "Karan Patel"
      },
      {
        role: "Chair",
        name: "Xander Wilkinson"
      },
      {
        role: "MCR President",
        name: "Nathan Hall"
      },
      {
        role: "Senior Welfare Officers",
        name: "Hannah Richards and Luke Hopkins"
      },
      {
        role: "Website Editor",
        name: "Amy Hudspith"
      },
      {
        role: "Technical Manager",
        name: "Ben Hacker"
      },
      {
        role: "Sports and Societies Officer",
        name: "Giles Barron"
      },
      {
        role: "Communications Officer",
        name: "Ellen Knight"
      },
      {
        role: "Events Manager",
        name: "Ellie Reid"
      },
      {
        role: "Secretary",
        name: "James Lee"
      },
      {
        role: "Bar Manager",
        name: "Andy McDonald"
      },
      {
        role: "Representatives Officer",
        name: "Theo Burman"
      },
      {
        role: "Students' Union Officer",
        name: "Kathryn Ellison"
      },
    ],
    awards: {
      pras: ["Kathryn Ellison", "Megan Stuart", "Sam Graham", "Ned Vessey", "Josh Friend", "Jacob Bradbury", "Finlay Boyle"],
      hlms: ["Luke Hopkins", "Andrew McDonald", "Amy Allison", "Luke Wilson", "Giles Barron", "Emily Price", "Rosie Scott", "Lottie Price", "Ellen Knight", "Will Morrice", "Sam Dornan"],
      howick: "Karan Patel"
    }
  }
]

class ExecsAndAwardsPage extends React.Component {
  render () {
    return (
      <div className="flex flex-col justify-start">
        <div className="md:w-3/5 container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Execs and Awards</h1>
          <div className="text-left mb-4">
            <p className="text-left pb-1">This page lists all JCR Executive Committees and JCR award recipients from 2020/21 onwards. Generally those listed will have held their position from the end of Epiphany term for a year but the terms of office for some positions do differ slightly and their terms may overlap through multiple executive committees.</p>
            <p className="text-left">Awards are presented at the President's Guest Night annually and are given in recognition of significant contributions to the JCR. Presidential Recognition Awards are given to individuals who have made a significant contribution to life at Grey, and they can be awarded to any year group. Honorary Life Memberships go to those who have made an outstanding contribution to Grey life during their time here, these can only be given out to finalists. The final and most prestigious award goes to the one individual graduating that has really given the most to their time at Grey and has made an outstanding contribution.</p>
          </div>
          <div className="flex flex-col">
            {
              information.map((block, i) => {
                const { year, exec, awards } = block;

                return (
                  <div key={i} className="border p-2 text-left mb-2">
                    <h2 className="font-semibold text-2xl mb-1">{year}</h2>
                    <div className="mb-1">
                      <ul>
                        {
                          exec.map((role, j) => (
                            <li key={j}>
                              {role.role}: {role.name}
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                    <div>
                      <p>
                        <span className="font-medium">Howick Plate: </span>
                        { awards.howick }
                      </p>
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
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    );
  }
}

export default ExecsAndAwardsPage;
