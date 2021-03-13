function offline()
{
   var offline=false;
   return offline;
}

function isChromeApp()
{
   // we assume here that chrome.app.runtime is only available in chrome app or extensions
   if (typeof chrome == "object")
      if (chrome.app && chrome.app.runtime)
         return true;
   return false;
}

function offline_storage_key()
{
   return "fwprofile";
}


function offline_storage_saverow(stor,saveData)
{
   var maxID=99; // start at ID 100
   var saveIX=0;
   var saveID=0;

   saveData.lastUpdate=Math.floor((new Date()).getTime()/1000);
   saveData.curtime=0;

   for (var i=0; i<stor.diagrams.length; i++)
   {
      maxID=Math.max(maxID,stor.diagrams[i].id);
      if ($.trim(stor.diagrams[i].name)==$.trim(saveData.name)) { saveID=stor.diagrams[i].id; saveIX=i; }
   }

   if (saveID>0) // existing file
   {
      saveData.id=saveID;
      stor.diagrams[saveIX]=saveData;
   }
   else
   {
      saveID=maxID+1;
      saveData.id=saveID;
      stor.diagrams.push(saveData);
   }

   return {"saveID": saveID, "storageData": stor};
}


function offline_storage_renamerow(stor,id,newname,data)
{
   for (var i=0; i<stor.diagrams.length; i++)
      if (stor.diagrams[i].id==id)
      {
         stor.diagrams[i].name=newname;
         stor.diagrams[i].fwprop=data;
      }
   return stor;
}


function offline_storage_deleterow(stor,id)
{
   for (var i=0; i<stor.diagrams.length; i++)
      if (stor.diagrams[i].id==id)
         stor.diagrams.splice(i,1);
   return stor;
}



function offline_load()
{
   var initVal={"version":g.currentVersion,"userID":-1,"username":"Offline", "idMap":"{}", "diagrams":[]};
   var key=offline_storage_key();
   var setval={};

   if (isChromeApp())
   {
      chrome.storage.local.get(key,function(result)
      {
         result=result[key];
         if (!result)
         {
            setval[key]=initVal;
            chrome.storage.local.set(setval);
            result=initVal;
         }
         processFilelist(JSON_toString(result));
      });
   }
   else
   {
      if (!localStorage[key]) localStorage.setItem(key,JSON_toString(initVal));
      processFilelist(localStorage[key]);
   }
}


function offline_save(saveData)
{
   var key=offline_storage_key();
   var setval={};

   if (isChromeApp())
   {
      chrome.storage.local.get(key,function(stor)
      {
         stor=stor[key];
         var ret=offline_storage_saverow(stor,saveData);
         setval[key]=ret.storageData;
         chrome.storage.local.set(setval, function(){saveFinish(ret.saveID);});
      });
   }
   else
   {
      var stor=JSON_fromString(localStorage[key]);
      var ret=offline_storage_saverow(stor,saveData);
      localStorage.setItem(key,JSON_toString(ret.storageData));
      saveFinish(ret.saveID);
   }
}


function offline_save_map(map)
{
   var key=offline_storage_key();
   var setval={};

   if (isChromeApp())
   {
      chrome.storage.local.get(key,function(stor)
      {
         stor=stor[key];
         stor.idMap=map;
         setval[key]=stor;
         chrome.storage.local.set(setval);
      });
   }
   else
   {
      var stor=JSON_fromString(localStorage[key]);
      stor.idMap=map;
      localStorage.setItem(key,JSON_toString(stor));
   }
}


function offline_rename(id,newtags,newname,data)
{
   var key=offline_storage_key();
   var setval={};

   if (isChromeApp())
   {
      chrome.storage.local.get(key,function(stor)
      {
         stor=stor[key];
         setval[key]=offline_storage_renamerow(stor,id,newname,data);
         chrome.storage.local.set(setval, function(){ renameDone(id,newtags,newname); });
      });
   }
   else
   {
      var stor=JSON_fromString(localStorage[key]);
      localStorage.setItem(key,JSON_toString(offline_storage_renamerow(stor,id,newname,data)));
      renameDone(id,newtags,newname);
   }
}


function offline_delete(id)
{
   var key=offline_storage_key();
   var setval={};

   if (isChromeApp())
   {
      chrome.storage.local.get(key,function(stor)
      {
         stor=stor[key];
         setval[key]=offline_storage_deleterow(stor,id);
         chrome.storage.local.set(setval, function(){ deleteDone(); });
      });
   }
   else
   {
      var stor=JSON_fromString(localStorage[key]);
      localStorage.setItem(key,JSON_toString(offline_storage_deleterow(stor,id)));
      deleteDone();
   }
}
