// Accurate_Interval.js
// From Alex J Wayne
// http://stackoverflow.com/questions/8173580/setinterval-timing-slowly-drifts-away-from-staying-accurate
// Github: https://gist.github.com/AlexJWayne/1d99b3cd81d610ac7351
const accurateInterval = function (fn, time) {
  var cancel, nextAt, timeout, wrapper;
  nextAt = new Date().getTime() + time;
  timeout = null;
  wrapper = function () {
    nextAt += time;
    timeout = setTimeout(wrapper, nextAt - new Date().getTime());
    return fn();
  };
  cancel = function () {
    return clearTimeout(timeout);
  };
  timeout = setTimeout(wrapper, nextAt - new Date().getTime());
  return {
    cancel: cancel
  };
};

const TimeSetter = (props) => {
  let wrapperId = props.timeName + '-wrapper';
  let increment = props.timeName + '-increment';
  let decrement = props.timeName + '-decrement';
  let labelId = props.timeName + '-label';
  let length = props.timeName + '-length';
  let onClick = props.onClick;
  
  return (
    <div id={wrapperId}>
      <button onClick={onClick} id={increment}>+</button>
      <p id={labelId}>{props.label}</p>
      <p id={length}>{props.time}</p>
      <button onClick={onClick} id={decrement}>-</button>
    </div>
  )
};

class Timer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sessionTime: 25,
      breakTime: 5,
      timeLeft: 25*60, // in seconds
      running: false,
      type: 'session',
      accInterval: ''
    }
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.handleStartStop = this.handleStartStop.bind(this);
    this.startCountdown = this.startCountdown.bind(this);
    this.decrementTimeLeft = this.decrementTimeLeft.bind(this);
    this.resetTimes = this.resetTimes.bind(this);
  }
  
  handleTimeChange(event) {
    if (!this.state.running) {
      let e = event.target.id.split('-');
      let change = e[1] === 'increment' ? 1 : -1;
      let remaining;
      
      if (e[0] === 'session') {
        remaining = (this.state.sessionTime + change) * 60;
        this.setState({sessionTime: this.state.sessionTime + change});
      } else {
        remaining = (this.state.breakTime + change) * 60;
        this.setState({breakTime: this.state.breakTime + change});
      }
      if (e[0] === this.state.type) {
        this.setState({timeLeft: remaining});
      }
    }
  }
  
  handleStartStop() {
    if (this.state.running){
      this.setState({running: false});
      this.state.accInterval.cancel();
    } else {
      this.setState({running: true});
      this.startCountdown();
    }
  }

  startCountdown() {
    this.setState({
      accInterval: accurateInterval(this.decrementTimeLeft, 1000)
    });
  }
  
  decrementTimeLeft() {
    if (this.state.timeLeft === 0) {
      let newTime, newType;
      if (this.state.type === 'work') {
        newTime = this.state.breakTime * 60;
        newType = 'rest';
      } else {
        newTime = this.state.sessionTime * 60;
        newType = 'work';
      }
      this.setState({
        timeLeft: newTime,
        type: newType
      })
    }
    this.setState({
      timeLeft: this.state.timeLeft - 1
    });
  }
  
  resetTimes() {
    this.setState({
      timeLeft: 25*60,
      sessionTime: 25,
      breakTime: 5,
      type: 'session',
      accInterval: ''
    })
  }
  
  render() {
    // title formatting
    let titleLetters = 'POMODORO'.split('').map(letter => {
      return (
      <p class='title'>{letter}</p>)
    });
    
    // timer 
    let s = this.state.timeLeft % 60;
    let m = (this.state.timeLeft - s)/60;
    let sStr = s.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
    let timerIconClasses = this.state.running ? "fas fa-pause" : "fas fa-play";
    let timerLabel = this.state.type === 'session' ? 'WORK' : 'REST';
    
    return (
      <div id='pomodoro-wrapper'>
        <div id='title-wrapper'>{titleLetters}</div>
        <div id='contents-wrapper'>
          <TimeSetter timeName='session' label='work' time={this.state.sessionTime} onClick={this.handleTimeChange}/>
          
          <div id='timer-wrapper'>
            <p id='timer-label'>{timerLabel}</p>
            <div id='time-left'>{m}:{sStr}</div>
            <i class={timerIconClasses} id='start_stop' onClick={this.handleStartStop}></i>
            <button onClick={this.resetTimes} id='reset'>reset</button>
          </div>
          
          <TimeSetter timeName='break' label='rest' time={this.state.breakTime} onClick={this.handleTimeChange}/>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<Timer />, document.getElementById('app'));

// don't allow timers to go below 1 minute
// don't allow times to go above 60 minutes
// at 00:00, beep for at least 1 second
// rewind beep with reset click
// 