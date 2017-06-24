var interval = 20;
var countdownInterval = null;
var timeSet = 0;
var timeElapsed = 0;
var timeRemaining = 0;
var percentagePassed = 0;

function startInterval() {
	countdownInterval = setInterval(function () {
		timeElapsed += interval;
		percentagePassed = ((timeElapsed + interval) / (timeSet - 1000 + interval)) * 100;
		var timeRemaining = timeSet - timeElapsed;

		if(timeRemaining > 1000) {
			postMessage({
				secondsRemaining: Math.floor(timeRemaining / 1000),
				percentagePassed: percentagePassed
			});
		} else {
			postMessage({
				secondsRemaining: 0,
				percentagePassed: 0
			});
			timeElapsed = 0;
			clearInterval(countdownInterval);
		}
	}, interval);
};

function pauseInterval() {
	clearInterval(countdownInterval);
};

function resetInterval() {
	timeElapsed = 0;
	clearInterval(countdownInterval);
};

onmessage = function (message) {
	// TODO find a better solution for n skipping to n - 1 instantly
	timeSet = (message.data.secondsSet + 1) * 1000 - interval;

	switch(message.data.action) {
		case 'start':
			startInterval();
			break;
		case 'pause':
			pauseInterval();
			break;
		case 'reset':
			resetInterval();
			break;
	}
};
