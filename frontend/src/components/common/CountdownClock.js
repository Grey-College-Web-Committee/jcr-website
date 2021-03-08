import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';

class CountdownClock extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      countdown: ""
    }
  }

  componentDidMount = () => {
    // Start as soon as it mounts
    this.startPositionLoop();
  }

  startPositionLoop = () => {
    // Starts the loop to tick every second
    const keepGoing = this.setPosition();

    if(keepGoing) {
      setTimeout(this.startPositionLoop, 1000);
    } else {
      this.props.onFinish();
      this.setState({ countdown: "Countdown Finished" });
    }
  }

  setPosition = () => {
    // Calculates the weeks, days, hours, minutes and seconds until the release
    const { until } = this.props;
    const now = new Date();
    let diff = Math.floor((until.getTime() - now.getTime()) / 1000);

    if(diff <= 0) {
      return false;
    }

    const second = 1;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;

    const weeks = Math.floor(diff / week);
    diff -= weeks * week;
    const days = Math.floor(diff / day);
    diff -= days * day;
    const hours = Math.floor(diff / hour);
    diff -= hours * hour;
    const minutes = Math.floor(diff / minute);
    diff -= minutes * minute;
    const seconds = Math.floor(diff / second);
    diff -= seconds * second;

    const countdown = this.makeCountdownString(weeks, days, hours, minutes, seconds);

    this.setState({ weeks, days, hours, minutes, seconds, countdown });
    return true;
  }

  makeCountdownString = (weeks, days, hours, minutes, seconds) => {
    // Pretty simple, just creates the string in a readable format
    let display = "";

    if(weeks !== 0) {
      display = `${weeks} week${weeks === 1 ? "" : "s"}`;
    }

    if(days !== 0) {
      if(display.length === 0) {
        display = `${days} day${days === 1 ? "" : "s"}`;
      } else {
        display = `${display}, ${days} day${days === 1 ? "" : "s"}`;
      }
    }

    if(hours !== 0) {
      if(display.length === 0) {
        display = `${hours} hour${hours === 1 ? "" : "s"}`;
      } else {
        display = `${display}, ${hours} hour${hours === 1 ? "" : "s"}`;
      }
    }

    if(minutes !== 0) {
      if(display.length === 0) {
        display = `${minutes} minute${minutes === 1 ? "" : "s"}`;
      } else {
        display = `${display}, ${minutes} minute${minutes === 1 ? "" : "s"}`;
      }
    }

    if(display.length === 0) {
      display = `${seconds} second${seconds === 1 ? "" : "s"}`;
    } else {
      display = `${display}, ${seconds} second${seconds === 1 ? "" : "s"}`;
    }

    return display;
  }

  render () {
    return (
      <div>
        <p>{this.props.aboveText} { this.props.sameLine ? this.state.countdown : null }</p>
        { this.props.sameLine ? null : <p>{this.state.countdown}</p> }
        <p>({this.props.verb} at {dateFormat(this.props.until, "dd/mm/yyyy HH:MM")})</p>
      </div>
    );
  }
}

CountdownClock.propTypes = {
  until: PropTypes.instanceOf(Date).isRequired,
  onFinish: PropTypes.func.isRequired,
  aboveText: PropTypes.string.isRequired,
  verb: PropTypes.string.isRequired,
  sameLine: PropTypes.bool.isRequired
}

export default CountdownClock;
