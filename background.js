//oauth2 auth
chrome.identity.getAuthToken(
	{'interactive': true},
	function(token){
	  //load Google's javascript client libraries
		window.gapi_onload = authorize;
		loadScript('https://apis.google.com/js/client.js');

		chrome.identity.getProfileUserInfo(function(userInfo){
			userId = userInfo.id;
			sKey = sKey + userId;
			Settings.authorizedEmail = userInfo.email;
		})
	}
);

var userId = "";
var sKey = 'GP_ColoredLabel1';
var Settings={};

var gapiToken=null;

function loadScript(url){
  var request = new XMLHttpRequest();

	request.onreadystatechange = function(){
		if(request.readyState !== 4) {
			return;
		}

		if(request.status !== 200){
			return;
		}

    eval(request.responseText);
	};

	request.open('GET', url);
	request.send();
}

function authorize(){
  gapi.auth.authorize(
		{
			client_id: '917063644343-8gdgklpcg3t8ml0fir2rl0up1o09h3pm.apps.googleusercontent.com',
			immediate: true,
			scope: 'https://www.googleapis.com/auth/gmail.modify'
		},
		function(token){
		  gapi.client.load('gmail', 'v1', gmailAPILoaded);
		  Settings.token = token;

		}
	);
}

function loadSettings(){
	chrome.storage.sync.get(sKey,function(items){
		console.log('load settings', items);
		Settings = Settings || items[sKey];
	});
}

function saveSettings() {
	var json = {};
	json[sKey] = Settings;
	chrome.storage.sync.set(json,function(items){
		console.log('save settings');
	});


}

function gmailAPILoaded(){    //do stuff here
    // alert('gmail api is loaded, creating labels');

    loadSettings();

    // if (!Settings.labelCreated) {
    	console.log('Gmail API is loaded. Creating labels...');
    	// Settings.labelCreated = true;
	    createLabel('24+ hrs', function(label){
	    	if (label.id != undefined) {
	    		Settings._24LabelId = label.id;
	    		saveSettings();
	    		console.log('created 24+ label', label.id);
	    	} else
	    		console.log('3+ label already exist', label.id);
	    });
	    createLabel('12+ hrs', function(label){
	    	if (label.id != undefined) {
	    		Settings._12LabelId = label.id;
	    		saveSettings();
	    		console.log('created 12+ label', label.id);
	    	} else
	    		console.log('12+ label already exist', label.id);
	    });
	    createLabel('3+ hrs', function(label){
	    	if (label.id != undefined) {
	    		Settings._3LabelId = label.id;
	    		saveSettings();
	    		console.log('created 24+ label', label.id);
	    	} else
	    		console.log('3+ label already exist', label.id);

	    });
    // }

    document.addEventListener('LB+GP', function(e){
    	console.log('**BG** event received', e);
    });

    chrome.extension.onMessage.addListener(function(message, sender, sendResponse){

    	if (message.action == 'apply_label') {
    		applyLabel(message.detail.threadId, message.detail.labelName, function(ret){

    			console.log( ret );

    		});
    	};
    	saveSettings();
    	return;
    })
}


function createLabel(newLabelName, callback) {
  var request = gapi.client.request(
		{
			path: 'https://www.googleapis.com/gmail/v1/users/me/labels',
			method: 'POST',
			body: {
				name: newLabelName
			}
		}
	);

	request.execute(callback);
}

function deleteLabel(labelId, callback) {

  var request = gapi.client.request(
		{
			path: 'https://www.googleapis.com/gmail/v1/users/me/labels/' + labelId,
			method: 'DELETE'
		}
	);

	request.execute(callback);
}

function applyLabel(threadId, labelName, callback) {

	var promise;

	if (labelName == '24+ hrs') {
		promise = modifyThread (threadId, [Settings._24LabelId], [Settings._12LabelId]);
	} else if (labelName == '12+ hrs') {
		promise = modifyThread (threadId, [Settings._12LabelId], [Settings._3LabelId]);
	} else {
		promise = modifyThread (threadId, [Settings._3LabelId], []);
	}

	promise.execute(callback);
}


function modifyThread( threadId, addLabelIds, removeLabelIds) {


	var request = gapi.client.request(
		{
			path: 'https://www.googleapis.com/gmail/v1/users/me/threads/' + threadId + '/modify',
			method: 'POST',
			body: {
				addLabelIds: addLabelIds,
				removeLabelIds: removeLabelIds
			}
		}
	);

	return request;
}


/* here are some utility functions for making common gmail requests */
function getThreads(query, labels){
  return gapi.client.gmail.users.threads.list({
		userId: 'me',
		q: query, //optional query
		labelIds: labels //optional labels
	}); //returns a promise
}

//takes in an array of threads from the getThreads response
function getThreadDetails(threads){
  var batch = new gapi.client.newBatch();

	for(var ii=0; ii<threads.length; ii++){
		batch.add(gapi.client.gmail.users.threads.get({
			userId: 'me',
			id: threads[ii].id
		}));
	}

	return batch;
}

function getThreadHTML(threadDetails){
  var body = threadDetails.result.messages[0].payload.parts[1].body.data;
	return B64.decode(body);
}

function archiveThread(id){
  var request = gapi.client.request(
		{
			path: '/gmail/v1/users/me/threads/' + id + '/modify',
			method: 'POST',
			body: {
				removeLabelIds: ['INBOX']
			}
		}
	);

	request.execute();
}

