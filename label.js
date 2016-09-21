var _3LabelName = '3+ hrs',
    _12LabelName = '12+ hrs',
    _24LabelName = '24+ hrs';
var isCronRunning = true;
refreshLabels(5*1000);

document.addEventListener('LB+GP', function(e){
	// console.log('****CS*****event received', e.detail);
	
	chrome.extension.sendMessage({action:e.detail.action, detail:e.detail}, function(response) {
		// console.log( response );
	});

	if (e.detail.action == 'apply_label')
		addEmail(e.detail);
	else
		removeEmail(e.detail);
});


function addEmail(email) {
	localStorage.setItem(email.threadId, JSON.stringify(email));
	if(!isCronRunning) refreshLabels(5*1000);
}

function removeEmail(email) {
	localStorage.removeItem(email.threadId);
}

function refreshLabels(interval) {
	setTimeout(function(){
		// console.log('refresh local email labels');

		for ( var i = 0, len = localStorage.length; i < len; ++i ) {
			var detail = localStorage.getItem(localStorage.key(i)); 
		  	
		  	var now = Date.now(),
	        timeDiffInHours = (now - detail.timestamp) / 1000/60/60;

	        if (timeDiffInHours >= 24 && detail.labelName != _24LabelName) {
	          detail.labelName = _24LabelName;
	        } else if( timeDiffInHours >= 12 && detail.labelName != _12LabelName) {
	          detail.labelName = _12LabelName;
	        }

	        chrome.extension.sendMessage({action:detail.action, detail:detail}, function(response) {
				// console.log( response );
			});
		}

		if (localStorage.length > 0)
			refreshLabels(interval);
		else{
			// console.log('refresh stopped');
			isCronRunning = false;
		}
			
	}, interval);
}

