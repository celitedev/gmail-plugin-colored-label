var gmail, userEmail;
var _3hrs, _12hrs, _24hrs;
var _3LabelName = '3+ hrs',
    _12LabelName = '12+ hrs',
    _24LabelName = '24+ hrs';

function refresh(f) {
  if( (/in/.test(document.readyState)) || (typeof Gmail === undefined) ) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}

var main = function(){

  gmail = new Gmail();

  userEmail = gmail.get.user_email();
  var mails = gmail.get.visible_emails();
  applyLabels(mails);

  gmail.observe.on('delete_label', function(id, url, body, xhr){
    console.log('label deleted:', id, 'url:', url , 'body', body);
  });
}


function parseDate(dateString)
{
  var d = dateString.split(' at ')[0],
      ts = dateString.split(' at ')[1],
      a = ts.split(' ')[1],
      h = parseInt(ts.split(' ')[0].split(':')[0]) + (a == "AM" ? 0 : 12),
      m = ts.split(' ')[0].split(':')[1];
  var date = new Date(d);

  date.setHours(h);
  date.setMinutes(m);
  return date;
}

function applyLabels(mails)
{

  mails.forEach(function(mail){

    //filter out

    var now = Date.now(),
        timestamp = parseDate(mail.time).getTime(),
        timeDiffInHours = (now - parseDate(mail.time).getTime()) / 1000/60/60;

    if (timeDiffInHours < 3)
      return;
    else if (timeDiffInHours < 12 && ($.inArray(_3LabelName, mail.labels) > -1))
      return;
    else if (timeDiffInHours < 24 && ($.inArray(_12LabelName, mail.labels) > -1))
      return;
    else if (timeDiffInHours >=24 && ($.inArray(_24LabelName, mail.labels) > -1))
      return;
    
    gmail.get.email_data_async(mail.id, function(data){
      var lastEmail = data.threads[data.last_email];
      console.log('last email data', lastEmail.subject, lastEmail.from, lastEmail.datetime);

      if (lastEmail.from_email != userEmail) {
        var timeDiffInHours = (now - lastEmail.timestamp) /1000/60/60;
        var detail;
        if (timeDiffInHours >= 24) {
          detail = {
            threadId: data.thread_id,
            labelName: _24LabelName
          };
        } else if( timeDiffInHours >= 12) {
          detail = {
            threadId: data.thread_id,
            labelName: _12LabelName
          };
        } else if( timeDiffInHours >= 3) {
          detail = {
            threadId: data.thread_id,
            labelName: _3LabelName
          };
        }

        var event = new CustomEvent("LB+GP",{
          detail:detail
        });
        document.dispatchEvent(event);
      }
    });
  });
}


refresh(main);
