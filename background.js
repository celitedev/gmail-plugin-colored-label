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
			//dev
			// client_id: '917063644343-8rfcntv7u3l77lm315bkkgeg6ak28lkq.apps.googleusercontent.com',
			// tony
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
	chrome.storage.sync.set(json,function(){
		console.log('save settings',Settings);
	});


}

function gmailAPILoaded(){    //do stuff here
    // alert('gmail api is loaded, creating labels');

    loadSettings();

    getLabels(function(response){
    	var labels = response.labels;

    	console.log('Gmail API is loaded. getting labels...');
    	labels.forEach(function(label){
    		if (label.name == '24+ hrs') {
    			Settings._24LabelId = label.id;
    		} else if (label.name == '12+ hrs') {
    			Settings._12LabelId = label.id;
    		} else if (label.name == '3+ hrs') {
    			Settings._3LabelId = label.id;
    		}
    	});

    	saveSettings();

    	if ("undefined" == typeof Settings._24LabelId) {
    		createLabel('24+ hrs', function(label){
		    	if (label.id != undefined && label.id != null) {
		    		Settings._24LabelId = label.id;
		    		saveSettings();
		    		console.log('created 24+ label', label.id);
		    	} else
		    		console.log('3+ label already exist', label.id);
		    });
    	}


    	if ("undefined" == typeof Settings._12LabelId) {
    		createLabel('12+ hrs', function(label){
		    	if (label.id != undefined && label.id != null) {
		    		Settings._12LabelId = label.id;
		    		saveSettings();
		    		console.log('created 12+ label', label.id);
		    	} else
		    		console.log('12+ label already exist', label.id);
		    });
    	}


    	if ("undefined" == typeof Settings._3LabelId) {
    		createLabel('3+ hrs', function(label){
		    	if (label.id != undefined && label.id != null) {
		    		Settings._3LabelId = label.id;
		    		saveSettings();
		    		console.log('created 3+ label', label.id);
		    	} else
		    		console.log('3+ label already exist', label.id);

		    });
    	}
    });
	
    chrome.extension.onMessage.addListener(function(message, sender, sendResponse){

    	if (message.action == 'apply_label') {
    		applyLabel(message.detail.threadId, message.detail.labelName, function(ret){
    			console.log('apply_label', ret );
    		});
    	} else if (message.action == 'remove_label') {
    		modifyThread(message.detail.threadId, [], [Settings._24LabelId, Settings._12LabelId, Settings._3LabelId]).execute(function(ret){
    			console.log('remove_label', ret );
    		});
    	} else if (message.action == 'reset_option') {

    		resetOptions(sendResponse);
    		
    	}
    	return;
    })

    chrome.extension.onConnect.addListener(function(port) {
	  console.log("Connected .....");
	  port.onMessage.addListener(function(msg) {
		if (msg == 'reset_option')
			resetOptions(port);
	  });
	});
}


function resetOptions(port) {

	var cbPort = port;
	if (!confirm('Are you sure to reset all labels?')) return;

	deleteLabel(Settings._24LabelId, function(){
		delete Settings._24LabelId;
		saveSettings();

		deleteLabel(Settings._12LabelId, function(){
			delete Settings._12LabelId;
			saveSettings();

			deleteLabel(Settings._3LabelId, function(){
				delete Settings._3LabelId;
				saveSettings();
				gmailAPILoaded();
				cbPort.postMessage({success:true});
			});		
		});
	});
	
	

}

function getLabels(callback) {
  var request = gapi.client.request(
		{
			path: 'https://www.googleapis.com/gmail/v1/users/me/labels',
			method: 'GET'
		}
	);

	request.execute(callback);
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
		promise = modifyThread (threadId, [Settings._24LabelId], [Settings._12LabelId,Settings._3LabelId]);
	} else if (labelName == '12+ hrs') {
		promise = modifyThread (threadId, [Settings._12LabelId], [Settings._3LabelId,Settings._24LabelId]);
	} else {
		promise = modifyThread (threadId, [Settings._3LabelId], [Settings._24LabelId,Settings._12LabelId]);
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

