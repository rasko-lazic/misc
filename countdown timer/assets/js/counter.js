var e,
CounterModule = {
	elements: {
		timerContainer: document.getElementById('timerContainer'),
		timeInput: document.getElementById('timeInput'),
		counters: document.getElementsByClassName('counter'),
		markers: document.getElementsByClassName('marker'),
		worker: null,
		editable: true,
		timerSecondsSet: 0,
		started: false,
		minorSecondsCounter: document.getElementById('minorSecondsCounter'),
		majorSecondsCounter: document.getElementById('majorSecondsCounter'),
		minorMinutesCounter: document.getElementById('minorMinutesCounter'),
		majorMinutesCounter: document.getElementById('majorMinutesCounter'),
		minorHoursCounter: document.getElementById('minorHoursCounter'),
		majorHoursCounter: document.getElementById('majorHoursCounter'),
		startButton: document.getElementById('timerToggleButton'),
		resetButton: document.getElementById('timerResetButton'),
		timerProgress: document.getElementById('timerProgress'),
		startHandler: null,
		pauseHandler: null
	},

	init: function() {
		e = this.elements;
		this.initWorker();
		this.bindActions();
	},

	initWorker: function () {
		if(window.Worker) {
			e.worker = new Worker('assets/js/counterWorker.js');
			e.worker.onmessage = function (message) {
				this.handleWorkerMessage(message.data);
			}.bind(this);
		} else {
			console.log('Web worker is not supported.');
		}
	},

	bindActions: function () {
		e.timerContainer.addEventListener('click', this.editTimer.bind(this));

		e.timeInput.addEventListener('keydown', function (event) {
			this.pushToCounter(event);
		}.bind(this));

		e.startHandler = this.startTimer.bind(this);
		e.pauseHandler = this.pauseTimer.bind(this);
		e.startButton.addEventListener('click', e.startHandler);
		e.resetButton.addEventListener('click', this.resetTimer.bind(this));
	},

	parseCounters: function () {
		return (parseInt(e.majorHoursCounter.innerHTML) * 10 + parseInt(e.minorHoursCounter.innerHTML)) * 3600
				+ (parseInt(e.majorMinutesCounter.innerHTML) * 10 + parseInt(e.minorMinutesCounter.innerHTML)) * 60
				+ (parseInt(e.majorSecondsCounter.innerHTML) * 10 + parseInt(e.minorSecondsCounter.innerHTML))
	},

	editTimer: function () {
		if(e.editable) {
			Array.prototype.forEach.call(e.counters, function(counter) {
				counter.classList.add('unsure');
			});
			Array.prototype.forEach.call(e.markers, function(marker) {
				marker.classList.add('unsure');
			});
			e.counters[5].classList.add('pointer');

			e.timeInput.focus();
		}
	},

	pushToCounter: function (event) {
		var char = event.key;
		var charCode = event.which;

		if(charCode >= 48 && charCode <= 57) {
			for(var i = 0; i < 5; i ++) {
				e.counters[i].innerHTML = e.counters[i + 1].innerHTML;
			}
			e.counters[5].innerHTML = char;

			e.timerSecondsSet = this.parseCounters();
		}

		if(charCode === 8) {
			for(var i = 5; i > 0; i--) {
				e.counters[i].innerHTML = e.counters[i - 1].innerHTML;
			}
			e.counters[0].innerHTML = 0;

			e.timerSecondsSet = this.parseCounters();
		}
	},

	startTimer: function () {
		if(e.timerSecondsSet > 0) {
			e.editable = false;
			e.started = true;
			this.toggleStartButton();

			if(e.counters[5].classList.contains('pointer')) {
				Array.prototype.forEach.call(e.counters, function(counter) {
					counter.classList.remove('unsure');
				});
				Array.prototype.forEach.call(e.markers, function(marker) {
					marker.classList.remove('unsure');
				});
				e.counters[5].classList.remove('pointer');
			}
			
			e.worker.postMessage({
				action: 'start',
				secondsSet: e.timerSecondsSet
			});
		}
	},

	pauseTimer: function () {
		e.started = false;
		this.toggleStartButton();
		e.worker.postMessage({
			action: 'pause',
			secondsSet: e.timerSecondsSet
		})
	},

	resetTimer: function () {
		e.worker.postMessage({
			action: 'reset',
			secondsSet: e.timerSecondsSet
		});

		e.started = false;
		e.editable = true;
		this.toggleStartButton();
		this.setCounters(e.timerSecondsSet);
		this.setProgress(0);
	},

	setCounters: function (seconds) {
		e.majorHoursCounter.innerHTML = Math.floor(seconds / 3600 / 10);
		e.minorHoursCounter.innerHTML = Math.floor(seconds / 3600 % 10);
		seconds = seconds % 3600;
		e.majorMinutesCounter.innerHTML = Math.floor(seconds / 60 / 10);
		e.minorMinutesCounter.innerHTML = Math.floor(seconds / 60 % 10);
		seconds = seconds % 60;
		e.majorSecondsCounter.innerHTML = Math.floor(seconds / 10);
		e.minorSecondsCounter.innerHTML = Math.floor(seconds % 10);
	},

	setProgress: function (value) {
		e.timerProgress.setAttribute("value", value);
	},

	toggleStartButton: function () {
		if(e.started) {
			e.startButton.removeEventListener('click', e.startHandler);
			e.startButton.innerHTML = 'STOP';
			e.startButton.addEventListener('click', e.pauseHandler);
		} else {
			e.startButton.removeEventListener('click', e.pauseHandler);
			e.startButton.innerHTML = 'START';
			e.startButton.addEventListener('click', e.startHandler);
		}
	},

	handleWorkerMessage: function (data) {
		if(data.secondsRemaining > 0) {
			this.setCounters(data.secondsRemaining);
			this.setProgress(data.percentagePassed);
		} else {
			e.started = false;
			this.toggleStartButton();
			this.setCounters(0);
			this.setProgress(0);
		}
	}
};

window.onload = CounterModule.init();