var _3LabelName = '3+ hrs',
    _12LabelName = '12+ hrs',
    _24LabelName = '24+ hrs';
var isCronRunning = true;
refreshLabels(5*1000);


var saveItem = function(id, value) {
	var newId = 'GP_' + id;
	localStorage.setItem(newId, value);
};

var deleteItem = function(id) {
	var newId = 'GP_' + id;
	localStorage.removeItem(newId);
};

var loadItem = function(id) {
	var newId = 'GP_' + id;
	return localStorage.getItem(newId);
};

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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  // First, validate the message's structure
  if ((msg.from === 'popup') && (msg.subject === 'reset_option')) {
    for ( var i = 0, len = localStorage.length; i < len; ++i ) {
      var key = localStorage.key(i);
      if (key.startsWith('GP_')) {
        localStorage.removeItem(key);
      }
    }
  }
});

function addEmail(email) {
	saveItem(email.threadId, JSON.stringify(email));
	if(!isCronRunning) refreshLabels(5*1000);
}

function removeEmail(email) {
	deleteItem(email.threadId);
}

function refreshLabels(interval) {
	setTimeout(function(){
		// console.log('refresh local email labels');
		var count = 0;
		for ( var i = 0, len = localStorage.length; i < len; ++i ) {
			var detail = localStorage.getItem(localStorage.key(i));

			if (detail) {
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

				count++;
			}
		}

		if (count > 0)
			refreshLabels(interval);
		else{
			// console.log('refresh stopped');
			isCronRunning = false;
		}
			
	}, interval);
}

