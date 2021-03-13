
function hash_change()
{
   var IDtoOpen=parseInt(location.hash.replace('#',''));
   if (IDtoOpen>0)
   {
      // do not load document if it is currently open (or was just saved as new ID)
      if (IDtoOpen==g.internalID) return;

      // check if unsaved changes are present
      if (isUnsaved())
      {
         msg("This document has unsaved data, which prevents loading of another document in this tab. Save this diagram or close this tab first, before attempting to try again.","error",20);
         modalDestroy();
         location.hash=g.internalID;
         return;
      }

      msg('Loading document, wait please...',"info",-1);
      loadDocument(IDtoOpen);
   }
}


function open_tab(id)
{
   if (id!=0)
   {
      var w=window_open('#'+id,'w'+id);
      if (w && w.focus) w.focus(); // bring the new tab to front even if it's already opened
   }
   else msg('Choose a state machine to embed.<br>You may need to save it into a separate diagram first.',"error");
}


function message_broadcast(message)
{
   // use local storage for messaging. Set message in local storage and clear it right away
   // This is a safe way how to communicate with other tabs while not leaving any traces
   message.unique_identifier=(new Date).getTime()+Math.random();
   message.fromUID=window.uid;

   if (isChromeApp())
   {
      chrome.storage.local.set({"message":message});
      chrome.storage.local.remove('message');
   }
   else
   {
      localStorage.setItem('message',JSON.stringify(message));
      localStorage.removeItem('message');
   }
}

function message_receive(ev)
{
   if (g.closing) return; // ignore received messages on unload
   var message;

   if (isChromeApp())
   {
      if (!ev.message) return; // ignore other keys
      message=ev.message.newValue;
   }
   else
   {
      if (ev.originalEvent.key!='message') return; // ignore other keys
      message=JSON_fromString(ev.originalEvent.newValue);
   }

   if (!message) return; // ignore empty msg or msg reset
   if (message.fromUID==window.uid) return; // do not message myself

   // send data only if this tab is StateMachine (is of no use for procedures)
   if (message.command=='getDATA' && editorIsSM())
   {
      message_broadcast({'command':'replyDATA', 'forUID':message.fromUID, 'internalID':g.internalID, 'export': getExportJSON() });
   }

   // received autosuggest data from other tab, add it to list
   if (message.command=='replyDATA' && editorIsSM() && message.forUID==window.uid)
   {
      otherTabsData[message.internalID]=message.export;
      if (message.internalID==g.internalID && g.internalID!=0) msg("This diagram is already open in another tab.<br>You need to close one of the tabs!","error",-1);
   }

   // update filelist with data from most recent tab
   if (message.command=='filelist') processFilelist(message.data,true);

   // ask for clipboard data on otehr tabs
   if (message.command=='ask4clipboard') all_tabs_update_clipboard();

   // update clipboard data on tabs
   if (message.command=='clipboard') g.clipboard=message.data;

   // a special command to force refresh event on tab by messaging other tabs
   if (message.command=='refresh')
   {
      msg(); // reset message if any
      tab_refresh();
   }
}


function all_tabs_filelist_update(data)
{
   message_broadcast({'command':'filelist', 'data':data});
}

function all_tabs_update_clipboard()
{
   message_broadcast({'command':'clipboard', 'data':g.clipboard});
}

function all_tabs_ask_for_clipboard()
{
   message_broadcast({'command':'ask4clipboard'});
}


function all_tabs_refresh()
{
   // tell all other tabs to update
   message_broadcast({'command':'refresh'});
}

function tab_refresh()
{
   // clear other-tab's data
   otherTabsData={};

   // request data from all tabs
   message_broadcast({'command':'getDATA'}); // tell all other tabs (currently opened document) to broadcast current JSON data
}


// Get data of all saved documents
// Where necessary, update it with data on open tabs
function allSmFilesData()
{
   var res={};
   var fwdata;

   for (var i=0; i<g.knownFiles.length; i++)
   {
      if (!editorIsSM(g.knownFiles[i].editorType)) continue;
      id=parseInt(g.knownFiles[i].id);

      if (id in otherTabsData) fwdata=otherTabsData[id];
      else fwdata=g.knownFiles[i].fwdata;
      if (id==g.internalID) fwdata=getExportJSON();

      res[id]={'data':fwdata, 'embeds':[]};

      if (editorIsSM(fwdata.editorType))
      for (var j=0; j<fwdata.states.length; j++)
         if (fwdata.states[j].fwprop.embedSmId>0)
            arrayAddNonempty(res[id].embeds,parseInt(fwdata.states[j].fwprop.embedSmId));
   }

   return res;
}


// get data of all documents related to current document
// (those are either childs or parents of our document)
function allRelatedSmFilesData()
{
   var all=allSmFilesData();
   var res={};

   var rel=embeddingParents(g.internalID);
   if (g.internalID>0) arrayAddNonempty(rel,g.internalID);
   rel=addEmbeddedChilds(rel);

   for (var i=0; i<rel.length; i++)
      if (rel[i] in all)
         res[rel[i]]=all[rel[i]];

   return res;
}



// get all IDs which are in parent relation to given id (they are embedding our id directly or indirectly)
// order of IDs is given by parent depth, linear array is returned
// make sure all values are strictly numerical
function embeddingParents(id)
{
   var data=allSmFilesData();
   var ids=[parseInt(id)];
   var res=[];
   var len=-1;

   while (res.length!=len)
   {
      len=res.length;
      for (var i=0; i<ids.length; i++)
         for (var key in data)
            if (jQuery.inArray(ids[i],data[key].embeds) !== -1)
               arrayAddNonempty(res,parseInt(key));
      ids=res;
   }

   return res;
}

// add all IDs which are in child relation to given ids to the list
// order of IDs is given by child depth, linear array is returned
// make sure all values are strictly numerical
function addEmbeddedChilds(ids)
{
   // if id is undefined, we're interested in all childs of current diagram
   if (!ids || ids.length==0)
   {
      ids=[];
      for (var i=0; i<g.states.length; i++)
         if (g.states[i].fwprop.embedSmId>0)
            arrayAddNonempty(ids,parseInt(g.states[i].fwprop.embedSmId));
   }

   var data=allSmFilesData();
   var res=ids;
   var len=-1;

   while (res.length!=len)
   {
      len=res.length;
      for (var i=0; i<ids.length; i++)
         if (ids[i] in data)
         for (var j=0; j<data[ids[i]].embeds.length; j++)
            arrayAddNonempty(res,data[ids[i]].embeds[j]);

      ids=res;
   }

   return res;
}
