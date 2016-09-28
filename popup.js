document.addEventListener('DOMContentLoaded', function() {
  var inboxButton = document.getElementById('btn_inbox'),
  		resetButton = document.getElementById('btn_reset');

  inboxButton.addEventListener('click', function() {
  	chrome.tabs.create({url: 'https://mail.google.com/'});
  }, false);

  resetButton.addEventListener('click', function() {
  	alert('reset');
  }, false);
}, false);


function resetOption() {
    chrome.extension.sendMessage({action:'reset_option'}, function(response) {
		// console.log( response );
	});
	for ( var i = 0, len = localStorage.length; i < len; ++i ) {
		var key = localStorage.key(i);
		if (key.startsWith('GP_')) {
			localStorage.removeItem(key);
		}
	}
}

