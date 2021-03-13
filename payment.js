
function check_payment()
{
   if (isChromeApp())
   chrome.runtime.getBackgroundPage(function(bgpage)
   {
       $('#debug').val("debug log is empty");

       $('#paynoaccess').show();
       $('#payloginprogress').show();
       $('#chromeloginretry').hide();
       $('#paysoonmsg').hide();
       $('#paynowmsg').hide();
       $('#payment').show();

       bgpage.getLicense(function(res)
       {
          $('#payloginprogress').hide();
          $('#chromeloginretry').show();

          $('#debug').val(res);
          res=JSON_fromString(res);

          if (res.accessLevel=='FULL')
          {
             $('#payment').hide();
             return;
          }

          if (!res.result) // no access at all yet, request user to sign in
          {
             $('#paynoaccess').show();
             $('#paysoonmsg').hide();
             $('#paynowmsg').hide();
             $('#payment').show();
             return;
          }

          var now=(new Date()).getTime();
          var key='freetrialexpired';

          if (res.createdTime < now-27*86400*1000) // expired
          {
             chrome.storage.local.get(key,function(exp)
             {
                exp=exp[key];
                if (!exp)
                {
                   exp=now+3*86400*1000;
                   setval={};
                   setval[key]=exp;
                   chrome.storage.local.set(setval, function(){});
                }

                var daysleft=(exp-now)/86400/1000;

                if (daysleft>0) // show 3 days and continue
                {
                   $('#paynoaccess').hide();
                   $('#paysoonmsg').show();
                   $('#paynowmsg').hide();
                   $('#freedaysleft').text(Math.round(daysleft));
                   $('#payment').show();
                }
                else // expired, require purchase
                {
                   $('#paynoaccess').hide();
                   $('#paysoonmsg').hide();
                   $('#paynowmsg').show();
                   $('#payment').show();
                }
             });
          }
          else
             $('#payment').hide();
       });
   });
}

