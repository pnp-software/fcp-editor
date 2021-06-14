// ------------------------------------------
// In order to suggest existing action/trigger/guard values,
// we need to be able to list all used ones.
// The functions below will help with that.
// ------------------------------------------

function isEmpty(s)
{
   if (s=='' || s===undefined) return true;
   return false;
}

function arrayAddNonempty(ar,val)
{
   if (!isEmpty(val) && jQuery.inArray(val,ar) === -1 ) ar.push(val);
}

function naturalSort(a,b)
{
   var splitreg=/(\d+)|(\D+)/g;
   var num=/\d+/;
   a=a.match(splitreg);
   b=b.match(splitreg);
   if (!a) a=[];
   if (!b) b=[];

   while(a.length > 0 && b.length > 0)
   {
      var wa=a.shift();
      var wb=b.shift();
      if(num.test(wa) || num.test(wb))
      {
         if(!num.test(wa)) return 1;
         if(!num.test(wb)) return -1;
         if(wa!=wb) return wa-wb;
      }
      else if(wa.toUpperCase()!=wb.toUpperCase()) return wa.toUpperCase()>wb.toUpperCase() ? 1 : -1;
   }
   return a.length-b.length;
}


// sort array, and return only unique values
function array_unique(ar)
{
   var ar=ar.sort(naturalSort);
   var res=[];
   for (var i=0; i<ar.length; i++)
      if (res.length==0 || res[res.length-1]!=ar[i])
         res.push(ar[i]);

   return res;
}


function array_unique_unsorted(ar)
{
   var i;
   var unique=[];

   for (i=0; i<ar.length; i++)
      if (ar[i] && jQuery.inArray(JSON.stringify(ar[i]), unique) === -1)
         unique.push(JSON.stringify(ar[i]));

   for (i=0; i<unique.length; i++)
      unique[i]=JSON_fromString(unique[i]);

   return unique;
}


// list all named actions
function listActions(states,connections)
{
   var i;
   var res=[];
   if (!states) states=g.states;
   if (!connections) connections=g.connections;

   for (i=0; i<states.length; i++)
   {
      arrayAddNonempty(res,states[i].fwprop.entryFunc);
      arrayAddNonempty(res,states[i].fwprop.doFunc);
      arrayAddNonempty(res,states[i].fwprop.exitFunc);
   }

   for (i=0; i<connections.length; i++)
      arrayAddNonempty(res,connections[i].fwprop.actionFunc);

   return res;
}

// list all named triggers
function listTriggers(connections)
{
   var res=[];
   if (!connections) connections=g.connections;
   for (var i=0; i<connections.length; i++)
      arrayAddNonempty(res,connections[i].fwprop.identifier);
   return res;
}

// list all named guards
function listGuards(connections)
{
   var res=[];
   if (!connections) connections=g.connections;
   for (var i=0; i<connections.length; i++)
      arrayAddNonempty(res,connections[i].fwprop.guardFunc);
   return res;
}


function listAllActions()
{
   var res=listActions();
   var rel=allRelatedSmFilesData();

   for (var key in rel)
      if (rel[key].data.states && rel[key].data.connections)
         res=res.concat(listActions(rel[key].data.states,rel[key].data.connections));

   return array_unique(res);
}

function listAllTriggers()
{
   var res=listTriggers();
   var rel=allRelatedSmFilesData();

   for (var key in rel)
      if (rel[key].data.states)
         res=res.concat(listTriggers(rel[key].data.connections));

   return array_unique(res);
}

function listAllGuards()
{
   var res=listGuards();
   var rel=allRelatedSmFilesData();

   for (var key in rel)
      if (rel[key].data.states)
         res=res.concat(listGuards(rel[key].data.connections));

   return array_unique(res);
}

function listAllTags()
{
   return g.knownTags;
}

function triggerGetID(trigger)
{
   // return the trigger identifier if it is already mapped
   if (trigger in g.triggerIDmap) return g.triggerIDmap[trigger];

   // if we are here it means trigger was not found. Add it
   var next=0;
   for (var t in g.triggerIDmap) next=Math.max(next,g.triggerIDmap[t]);
   next=next+1;
   g.triggerIDmap[trigger]=next;
   return next;
}

// ------------------------------------------
// generate auto IDs for triggers, guards, actions and states
// ------------------------------------------

function getNextStateAutoID(type)
{
   var i=0;
   for(var j=0; j<g.states.length; j++)
   if (g.states[j].fwprop.type==type) i=Math.max(i,g.states[j].fwprop.autoid);
   return i+1;
}

function getNextActionAutoID()
{
   var list=listAllActions();
   var i, max=0, m;
   for(i=0; i<list.length; i++)
   {
      m=list[i].match(/^(Action)([0-9]+)$/);
      if (m) max=Math.max(max,m[2]);
   }
   return max+1;
}

function getNextTriggerAutoID()
{
   var list=listAllTriggers();
   var i, max=0, m;
   for(i=0; i<list.length; i++)
   {
      m=list[i].match(/^(Trigger)([0-9]+)$/);
      if (m) max=Math.max(max,m[2]);
   }
   return max+1;
}

function getNextGuardAutoID()
{
   var list=listAllGuards();
   var i, max=0, m;
   for(i=0; i<list.length; i++)
   {
      m=list[i].match(/^(Guard)([0-9]+)$/);
      if (m) max=Math.max(max,m[2]);
   }
   return max+1;
}

function getNextOrderID(state)
{
   var i,ret=0;
   for (i=0; i<g.connections.length; i++)
      if (g.connections[i].stateFrom.id==state.id)
         ret=Math.max(g.connections[i].fwprop.order,ret);

   return ret+1;
}

function countOutgoingTransitions(state)
{
   var i,ret=0;
   for (i=0; i<g.connections.length; i++)
      if (g.connections[i].stateFrom.id==state.id)
         ret++;

   return ret;
}

// reorder remaining transitions on the stateFrom accordingly.
// The transitions are reordered only numerically (the .order property changes)
// but the physical order remains intact, and the current transition remains with undefined .order
// so it must be always set to newOrder after calling this function
function reorderTransitions(state, prevOrder, newOrder)
{
   for(var i=0; i<g.connections.length; i++)
   {
      if (g.connections[i].stateFrom.id==state.id)
      {
        if (prevOrder<newOrder)
           if (g.connections[i].fwprop.order>prevOrder && g.connections[i].fwprop.order<=newOrder) g.connections[i].fwprop.order--;
        if (prevOrder>newOrder)
           if (g.connections[i].fwprop.order<prevOrder && g.connections[i].fwprop.order>=newOrder) g.connections[i].fwprop.order++;
      }
   }
}



// ------------------------------------------
// Properties suggestion
// ------------------------------------------

function propSuggestHighlight(el,scroll)
{
   // make all rows unselected
   $('#suggest').find("a").css({"background-color":"#fff", "color":"#000"});
   // select one row
   $(el).css({"background-color":"#6599FF", "color":"#fff"});
   // if scrolling is required, do so
   if (scroll) $('#suggest').scrollTop($(el).position().top);
}

function propSuggest(ev)
{
   var t=this;
   var suggest=$(t).attr('data-suggest');
   var hig=$(t).val();
   if (!suggest) return;
   var isP=$(t).hasClass('project');

   var list;

   if ($(t).is(":focus") && ev.type=='mousedown')
   {
      if (! $('#suggest').is(":hidden"))
      {
         propSuggestHide();
         return;
      }
   }

   if (suggest=='action') list=listAllActions();
   else if (suggest=='trigger') list=listAllTriggers();
   else if (suggest=='guard') list=listAllGuards();
   else if (suggest=='tags') list=listAllTags();

   $('#suggest').attr("data-target",$(this).attr("id"));
   $('#suggest').attr("data-isFunction",'Yeah'); // non-empty value means selecting from suggestions replaces entire input
   $('#suggest').show().scrollTop(0);
   $('#suggest').width($(t).width()+12).html("<a>"+list.join("</a><a>")+"</a>");
   $('#suggest').offset({"top": $(t).offset().top + $(t).height()+9+(isP?-2:0), "left": $(t).offset().left });
   $('#suggest').find("a").mouseenter(function(){propSuggestHighlight(this);})
   $('#suggest').find("a").each(function(higlight){ return function() { if ($(this).html()==higlight) propSuggestHighlight(this,true);} }(hig));
   if (list.length==0) propSuggestHide();

   if (isP) $('#suggest').addClass('rounded').removeClass('sharp');
   else $('#suggest').addClass('sharp').removeClass('rounded');
}

function propSuggestHide()
{
   $('#suggest').hide();
   $('#suggest').attr("data-target","");
   autocompleteHide();
}

function propSuggestSelect(ev)
{
   if ($(ev.target).find("a").length==0) // make sure the user clicked on actual element
   {
      var text=$(ev.target).html();
      var target=$('#'+$('#suggest').attr("data-target"));

      if ($('#suggest').attr("data-isFunction"))
      {
         // set value
         target.val(text);
         // switch to function and trigger change event to hide code block if needed
         target.prev("select").val('function').change();
      }
      else
      {
         var final=($.trim(target.val())!=''?$.trim(target.val())+", ":"")+text;
         target.val(final.replace(new RegExp(text+", *", 'g'), ""));
      }
   }
   propSuggestHide();
   propUpdate();
}


function setDisplayInfo(type)
{
   g.fwprop.displayInfo=type;
   refreshDisplayInfo();
   refreshStates();
   refreshConnections();
}

function setDisplayOrder(y)
{
   g.fwprop.displayOrder=y;
   refreshDisplayInfo();
   refreshConnections();
}

function refreshDisplayInfo()
{
   $('#displayInfo').find('i').addClass('hidden').parent().removeClass("btn-info");
   $('#displayInfo'+g.fwprop.displayInfo).removeClass('hidden').show().parent().addClass('btn-info');

   $('#displayOrder').find('i').addClass('hidden').parent().removeClass("btn-info");
   $('#displayOrder'+g.fwprop.displayOrder).removeClass('hidden').show().parent().addClass('btn-info');
}

function setMemAlloc(type)
{
   g.fwprop.memalloc=type;
   refreshMemAlloc();
}

function refreshMemAlloc()
{
   $('#memalloc').find('i').addClass('hidden').parent().removeClass("btn-info");
   $('#memalloc'+g.fwprop.memalloc).removeClass('hidden').parent().addClass('btn-info');
}


// ------------------------------------------
//
// Properties editing
//
// ------------------------------------------

// called on onChange event for SELECT
function propSelectChange(t)
{
   var userChanged=true;
   if (t.target) t=this;   // if called on onChange event
   else userChanged=false; // indicates that user changed the <select> value by mouse

   var set=$(t).val();
   var parent=$(t).parent();
   if (parent.is("td")) parent=parent.parent();
   if (parent.is("tr")) parent=parent.parent();

   if (set.match(/Else/i))
   {
      parent.find('select').val('run code');
      parent.find('textarea').eq(0).val('return 1;');
      parent.find('textarea').eq(1).val('Else');
      propUpdate();
      return propSelectChange(t);
   }

   if (set.match(/Wait/i))
   {
      parent.find('select').val('run code');
      parent.find('textarea').eq(0).val('return (FwPrGetNodeExecCnt(prDesc) == N);');
      parent.find('textarea').eq(1).val('Wait N cycles');
      propUpdate();
      return propSelectChange(t);
   }

   if (set.match(/code/)) { $(t).width(269); $(t).next().hide(); }
   if (set.match(/function/)) { $(t).width(118); $(t).next().show(); }

   if (set=='run code')
      if (userChanged) parent.find(".hidden").slideDown(100);
      else parent.find(".hidden").show();
   if (set=='call function' || set=='define function')
      if (userChanged) parent.find(".hidden").slideUp(100);
      else parent.find(".hidden").hide();

   // in all cases, set font to better suit code needs
   parent.find(".hidden").find("textarea").css({'font-size': '11px', 'line-height': '16px', 'font-family': 'monospace'});

   if (userChanged) propUpdate();
   refreshToolbarButtons();
   setTimeout(fixEditboxPos,110);
}

// fill properties for selected state or connection
function propEditFill()
{
   if (g.selected.length==1)
   {
      var state=g.selected[0];
      if (state.fwprop.type=='state')
      {
         $('#epropStateID').val(state.fwprop.identifier);
         $('#epropStateNote').val(state.fwprop.note);

         $('#epropEntryType').val(state.fwprop.entryType);
         $('#epropEntryFunc').val(state.fwprop.entryFunc);
         $('#epropEntryCode').val(state.fwprop.entryCode);
         $('#epropEntryDesc').val(state.fwprop.entryDesc);
         $('#epropEntryAp')[0].checked = state.fwprop.entryAp;
         propSelectChange('#epropEntryType');

         $('#epropDoType').val(state.fwprop.doType);
         $('#epropDoFunc').val(state.fwprop.doFunc);
         $('#epropDoCode').val(state.fwprop.doCode);
         $('#epropDoDesc').val(state.fwprop.doDesc);
         $('#epropDoAp')[0].checked = state.fwprop.doAp;
         propSelectChange('#epropDoType');

         $('#epropExitType').val(state.fwprop.exitType);
         $('#epropExitFunc').val(state.fwprop.exitFunc);
         $('#epropExitCode').val(state.fwprop.exitCode);
         $('#epropExitDesc').val(state.fwprop.exitDesc);
         $('#epropExitAp')[0].checked = state.fwprop.exitAp;
         propSelectChange('#epropExitType');

         var options='<option value=0>';
         if (!userIsSigned()) options+="<option value=0>Sign in to use this feature...";
         for (var i=0; i<g.knownFiles.length; i++)
         {
            if (g.knownFiles[i].editorType==g.fwprop.editorType && g.knownFiles[i].id!=g.internalID)
               options+="<option value="+g.knownFiles[i].id+">"+g.knownFiles[i].name;
         }

         if (editorIsSM())
         {
            $('#epropEmbedSmId').html(options);
            $('#epropEmbedSM').show();
            propSelectChange('#epropEmbedSmId');
         }
         else $('#epropEmbedSM').hide();

         $('#epropEmbedSmId').val(state.fwprop.embedSmId);
      }
      if (state.fwprop.type=='init')
      {
         $('#epropInitNote').val(state.fwprop.note);
      }
      if (state.fwprop.type=='note')
      {
         $('#epropNoteNote').val(state.fwprop.note);
      }
      if (state.fwprop.type=='final')
      {
         $('#epropFinalNote').val(state.fwprop.note);
      }
      if (state.fwprop.type=='choice')
      {
         $('#epropChoiceID').val(state.fwprop.identifier);
         $('#epropChoiceNote').val(state.fwprop.note);
      }

      return; // stop here
   }

   if (g.selectedCon)
   {
      var conn=g.selectedCon;
      var options='<option>call function<option>define function<option>run code<option disabled=true>--------------------<option>Else guard';
      if (editorIsPR()) options+='<option>Wait N cycles'
      $('#epropTrGuardType').html(options);

      $('#epropTrigger').val(conn.fwprop.identifier);
      $('#epropTrGuardType').val(conn.fwprop.guardType);
      $('#epropTrGuardFunc').val(conn.fwprop.guardFunc);
      $('#epropTrGuardCode').val(conn.fwprop.guardCode);
      $('#epropTrGuardDesc').val(conn.fwprop.guardDesc);
      $('#epropTrGuardAp')[0].checked = conn.fwprop.guardAp;
      propSelectChange('#epropTrGuardType');

      $('#epropTrGuardOrder').html(function(n){var ret=""; for (var i=1;i<=n;i++) ret+="<option>"+i; return ret;}(countOutgoingTransitions(conn.stateFrom)));
      $('#epropTrGuardOrder').val(conn.fwprop.order);

      $('#epropTrActionType').val(conn.fwprop.actionType);
      $('#epropTrActionFunc').val(conn.fwprop.actionFunc);
      $('#epropTrActionCode').val(conn.fwprop.actionCode);
      $('#epropTrActionDesc').val(conn.fwprop.actionDesc);
      $('#epropTrActionAp')[0].checked = conn.fwprop.actionAp;
      propSelectChange('#epropTrActionType');

      $('#epropTrNote').val(conn.fwprop.note);
      return; // stop here
   }

   // if we are here so far, we're going to process global state properties
   refreshDisplayInfo();
   $('#epropSmName').val(g.fwprop.smName);
   $('#epropSmTitle').val(g.fwprop.smTitle);
   $('#epropSmTags').val(g.fwprop.smTags);
   $('#epropPreConditions').val(g.fwprop.preConditions);
   $('#epropPostConditions').val(g.fwprop.postConditions);
   $('#epropAutocomplete').val(g.fwprop.autocomplete);
   $('#epropSmNotes').val(g.fwprop.smNotes);

   $("#globadd").empty();
   var globs=clone(g.fwprop.globalvar)
   while(globs.length>0)
   {
      var row=globs.pop();
      $("#globvar").find(".globvartype").val(row.type);
      $("#globvar").find(".globvarname").val(row.name);
      $("#globvar").find(".globvarvalue").val(row.value);
      global_variable_add($("#globvar").find("button").get(0), true);
   }
}

// check if there is a recursion error in embedding
function isEmbeddedError()
{
    var rel=allRelatedSmFilesData();
    var res={};
    var i,key;
    for (key in rel) res[key]=0;
    for (key in rel) // for all related files

    for (i=0; i<rel[key].data.states.length; i++) // check all states
       res[rel[key].data.states[i].fwprop.embedSmId]++; // count how many times we saw them

    for (key in res)
       if (res[key]>1)
          return true;

    return false;
}


function countStatesByName(text)
{
   var count=0;
   for (var i=0; i<g.states.length; i++)
      if (g.states[i].fwprop.identifier==text) count++;
   return count;
}

function valueFixUndefined(text)
{
   return text;
}

// set modified properties
function propUpdate()
{
   if (g.selected.length==1)
   {
      var error='';
      var state=g.selected[0];
      historyAdd(state.fwprop.type+'prop'+state.id);

      if (state.fwprop.type=='state')
      {
         state.fwprop.identifier=$('#epropStateID').val();
         state.fwprop.note=$('#epropStateNote').val();
         
         state.fwprop.entryType=$('#epropEntryType').val();
         state.fwprop.entryFunc=$('#epropEntryFunc').val();
         state.fwprop.entryCode=$('#epropEntryCode').val();
         state.fwprop.entryDesc=$('#epropEntryDesc').val();
         state.fwprop.entryAp=$('#epropEntryAp').is(':checked');

         state.fwprop.doType=$('#epropDoType').val();
         state.fwprop.doFunc=$('#epropDoFunc').val();
         state.fwprop.doCode=$('#epropDoCode').val();
         state.fwprop.doDesc=$('#epropDoDesc').val();
         state.fwprop.doAp=$('#epropDoAp').is(':checked');

         state.fwprop.exitType=$('#epropExitType').val();
         state.fwprop.exitFunc=$('#epropExitFunc').val();
         state.fwprop.exitCode=$('#epropExitCode').val();
         state.fwprop.exitDesc=$('#epropExitDesc').val();
         state.fwprop.exitAp=$('#epropExitAp').is(':checked');

         state.fwprop.embedSmId=$('#epropEmbedSmId').val()

         // warn if some other state is already embeding this one
         if (state.fwprop.embedSmId>0)
            if (isEmbeddedError())
               error=fileNameByID(state.fwprop.embedSmId)+" is either already embedded on some other state, or causes a circular dependency in combination with some other machine which acts as a parent or child to the current diagram, considering all levels up and down. Make sure you know what you're doing.";
      }
      if (state.fwprop.type=='note')
      {
         state.fwprop.note=$('#epropNoteNote').val();
      }
      if (state.fwprop.type=='init')
      {
         state.fwprop.note=$('#epropInitNote').val();
      }
      if (state.fwprop.type=='final')
      {
         state.fwprop.note=$('#epropFinalNote').val();
      }
      if (state.fwprop.type=='choice')
      {
         state.fwprop.identifier=$('#epropChoiceID').val();
         state.fwprop.note=$('#epropChoiceNote').val();
      }

      // validity checks
      if (state.fwprop.identifier)
      {
         if (countStatesByName(state.fwprop.identifier)>1)
            msg("Duplicite "+editorSwitch("state","node")+" name '"+state.fwprop.identifier+"'","error");
         else
            if (error!='')
              msg(error,"error",-1);
      }

      refreshState(state);
      all_tabs_refresh();
      return; // stop here
   }

   if (g.selectedCon)
   {
      var conn=g.selectedCon;
      historyAdd('conprop'+conn.id);

      conn.fwprop.identifier=$('#epropTrigger').val();
      conn.fwprop.guardType=$('#epropTrGuardType').val();
      conn.fwprop.guardFunc=$('#epropTrGuardFunc').val();
      conn.fwprop.guardCode=$('#epropTrGuardCode').val();
      conn.fwprop.guardDesc=$('#epropTrGuardDesc').val();
      conn.fwprop.guardAp=$('#epropTrGuardAp').is(':checked');

      var prevOrder=conn.fwprop.order;
      var newOrder=$('#epropTrGuardOrder').val();
      reorderTransitions(conn.stateFrom, prevOrder, newOrder);
      conn.fwprop.order=newOrder;

      conn.fwprop.actionType=$('#epropTrActionType').val();
      conn.fwprop.actionFunc=$('#epropTrActionFunc').val();
      conn.fwprop.actionCode=$('#epropTrActionCode').val();
      conn.fwprop.actionDesc=$('#epropTrActionDesc').val();
      conn.fwprop.actionAp=$('#epropTrActionAp').is(':checked');      

      conn.fwprop.note=$('#epropTrNote').val();
      refreshConnections(conn.stateFrom);
      refreshConnection(getConnectionsIndex(conn));
      all_tabs_refresh();
      return; // stop here
   }


   // if we are here so far, we're going to process global state properties
   historyAdd('globalprop');
   g.fwprop.smName=$('#epropSmName').val();
   g.fwprop.smTags=$('#epropSmTags').val();
   g.fwprop.smTitle=$('#epropSmTitle').val();
   g.fwprop.preConditions=$('#epropPreConditions').val();
   g.fwprop.postConditions=$('#epropPostConditions').val();
   g.fwprop.smNotes=$('#epropSmNotes').val();

   var prevName=g.fwprop.autocomplete || "";
   g.fwprop.autocomplete=$('#epropAutocomplete').val();
   var curName=g.fwprop.autocomplete || "";

   if (prevName!=curName)
   {
      // update all texts on states and connections
      // so autosuggest tooltips are refreshed
      for (var i=0; i<g.states.length; i++) 
      {
         if (g.states[i].text) g.states[i].text.str='';
         updateStateText(g.states[i]);
      }
      for (i=0; i<g.connections.length; i++) 
      {
         if (g.connections[i].text) g.connections[i].text.str='';
         updateConnectionText(g.connections[i]);
      }
   }


   g.fwprop.globalvar=[];
   $("#globvar, #globadd").find(".globrow").each(function(){ 
       g.fwprop.globalvar.push({
          "type": $(this).find(".globvartype").val(),
          "name": $(this).find(".globvarname").val(),
          "value": $(this).find(".globvarvalue").val()
   }) });

   updateTitle();
   all_tabs_refresh();
}


function init_autocomplete_list()
{
   var options=[];
   for (var i in g.autocomplete) options.push(i);
   options=options.sort(naturalSort).reverse();
   if (options.length==0) $('#autocompleteList').hide();
   else $('#epropAutocomplete').html( '<option><option>'+options.join('<option>'));
}
