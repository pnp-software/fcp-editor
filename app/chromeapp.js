function createWindow(internalID, exportdata, history)
{
    chrome.app.window.create("index.html",
    {
        "id": "w"+(new Date).getTime(),
        "bounds":
        {
            "width":   window.screen.availWidth,
            "height":  window.screen.availHeight
        }
    }, function(w)
    {
       if (exportdata)
       {
          w.contentWindow.chromeAppOnload={'internalID': internalID, 'exportdata':exportdata, 'history':history};
       }
    });
}



function getLicense(doneFunc)
{
   var CWS_LICENSE_API_URL = 'https://www.googleapis.com/chromewebstore/v1.1/userlicenses/';

   try { var t = chrome.identity; } catch(e) {  doneFunc(e); return; }
   chrome.identity.getAuthToken({interactive: true}, function(token)
   {
      if (chrome.runtime.lastError)
      {
         doneFunc(chrome.runtime.lastError.message);
         return;
      }

      var req = new XMLHttpRequest();
      req.open('GET', CWS_LICENSE_API_URL + chrome.runtime.id);
      req.setRequestHeader('Authorization', 'Bearer ' + token);

      req.onreadystatechange = function()
      {
         if (req.readyState == 4)
         {
            doneFunc(req.responseText);
         }
      };
      req.send();
   });
}

chrome.app.runtime.onLaunched.addListener(function(){createWindow();});
