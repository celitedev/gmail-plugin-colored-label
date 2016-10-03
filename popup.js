document.addEventListener('DOMContentLoaded', function() {
  var inboxButton = document.getElementById('btn_inbox'),
  		resetButton = document.getElementById('btn_reset');

  chrome.tabs.query({active: true}, function (tabs){

    if (tabs[0].url.indexOf('mail.google.com') < 0)
      resetButton.disabled = true;
    else 
      resetButton.disabled = false;

  })


  inboxButton.addEventListener('click', function() {
  	chrome.tabs.create({url: 'https://mail.google.com/'});
  }, false);

  resetButton.addEventListener('click', function() {
    resetOption();
  }, false);
}, false);


function resetOption() {

  var port = chrome.extension.connect({name: "Sample Communication"});
  port.postMessage('reset_option');
  port.onMessage.addListener(function(msg) {
    if (msg.success) {
      chrome.tabs.query({
        active: true
      }, function (tabs) {
        // ...and send a request for the DOM info...
        chrome.tabs.sendMessage(
          tabs[0].id,
          {from: 'popup', subject: 'reset_option'});
      });
    };
  });
}

