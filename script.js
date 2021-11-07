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
      sessionTime: 1,
      breakTime: 2,
      timeLeft: 1*60, // in seconds
      running: false,
      type: 'session',
      accInterval: ''
    }
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.handleStartStop = this.handleStartStop.bind(this);
    this.startCountdown = this.startCountdown.bind(this);
    this.decrementTimeLeft = this.decrementTimeLeft.bind(this);
    this.reset = this.reset.bind(this);
    this.playAudio = this.playAudio.bind(this);
    this.stopAudio = this.stopAudio.bind(this);
  }
  
  handleTimeChange(event) {
    if (!this.state.running) {
      let e = event.target.id.split('-');
      let change = e[1] === 'increment' ? 1 : -1;
      let remaining = 60;
      
      if (e[0] === 'session') {
        if (this.state.sessionTime + change >= 1 && this.state.sessionTime + change <= 60){
          remaining = (this.state.sessionTime + change) * 60;
          this.setState({sessionTime: this.state.sessionTime + change});
        } else { remaining *= this.state.sessionTime}
      } else {
        if (this.state.breakTime + change >= 1 && this.state.breakTime + change <= 60) {
          remaining = (this.state.breakTime + change) * 60;
          this.setState({breakTime: this.state.breakTime + change});
        } else { remaining *= this.state.breakTime}
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
      if (this.state.type === 'session') {
        newTime = this.state.breakTime * 60;
        newType = 'break';
      } else {
        newTime = this.state.sessionTime * 60;
        newType = 'session';
      }
      this.setState({
        timeLeft: newTime,
        type: newType
      })
      this.playAudio('beep')
    } else if (this.state.timeLeft === 10) {
      this.playAudio('windDown')
    }
    this.setState({
      timeLeft: this.state.timeLeft - 1
    });
  }
  
  reset() {
    if (this.state.accInterval !== '') {
      this.state.accInterval.cancel()
      this.stopAudio('beep');
      this.stopAudio('windDown');
    };
    this.setState({
      sessionTime: 25,
      breakTime: 5,
      timeLeft: 25*60, 
      running: false,
      type: 'session',
      accInterval: ''
    })
  }
  
  playAudio(id) {
    let sound = document.getElementById(id);
    sound.play()
  }
  
  stopAudio(id) {
    let sound = document.getElementById(id);
    sound.pause();
    sound.currentTime = 0;
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
            <button onClick={this.reset} id='reset'>reset</button>
          </div>
          
          <TimeSetter timeName='break' label='rest' time={this.state.breakTime} onClick={this.handleTimeChange}/>
          
          <audio id='windDown' src='https://cdn.jsdelivr.net/gh/choeuna/pomodoro-timer@master/media/202163__luckylittleraven__gentleguitar.wav' type='audio/wav'></audio>
          <audio id='beep' src='https://cdn.jsdelivr.net/gh/choeuna/pomodoro-timer@master/media/339343__newagesoup__soft-blip-e-major.wav'></audio>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<Timer />, document.getElementById('app'));
