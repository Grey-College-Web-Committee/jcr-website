import React from 'react'
import PropTypes from 'prop-types'

class SportsAndSocsItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      revealed: false
    }
  }

  render () {
    const { revealed } = this.state;
    const { name, description, email, facebook, instagram, discord, type } = this.props;
    const hasShowMore = description.length >= 100;

    return (
      <div className="border-gray-400 border text-left p-2 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-semibold">{name}</h3>
          <p className="text-sm">{type}</p>
          <div className="py-1">
            {
              revealed ? (
                <p>{description}</p>
              ) : (
                <React.Fragment>
                  <p>{description.substring(0, 100)}
                    {
                      hasShowMore ? (
                        <React.Fragment>
                          ... <span className="font-semibold underline cursor-pointer" onClick={() => this.setState({ revealed: true })}>click to reveal more...</span>
                        </React.Fragment>
                      ) : null
                    }
                  </p>
                </React.Fragment>
              )
            }
          </div>
        </div>
        <div className="border-t border-gray-400 pt-2 flex flex-row justify-end">
          {
            email === null || email.length === 0 ? null : (
              <a className="ml-2" href={`mailto:${email}?subject=${name} - Info`} target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/socials/gmail.png"
                  className="w-auto h-8"
                />
              </a>
            )
          }
          {
            facebook === null || facebook.length === 0 ? null : (
              <a className="ml-2" href={facebook} target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/socials/f_logo_RGB-Blue_100.png"
                  className="w-auto h-8"
                />
              </a>
            )
          }
          {
            instagram === null || instagram.length === 0 ? null : (
              <a className="ml-2" href={instagram} target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/socials/Instagram_Glyph_Gradient_RGB.png"
                  className="w-auto h-8"
                />
              </a>
            )
          }
          {
            discord === null || discord.length === 0 ? null : (
              <a className="ml-2" href={discord} target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/socials/icon_clyde_blurple_RGB.png"
                  className="w-auto h-8"
                />
              </a>
            )
          }
        </div>
      </div>
    )
  }
}

export default SportsAndSocsItem;
