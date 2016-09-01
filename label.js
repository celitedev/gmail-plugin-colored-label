document.addEventListener('LB+GP', function(e){
	console.log('****CS*****event received', e.detail);

	chrome.extension.sendMessage({action:'apply_label', detail:e.detail}, function(response) {
		console.log( response );
	});
});