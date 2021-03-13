
function exportContains(states,state)
{
   var i;
   for (i=0; i<states.length; i++)
   if (states[i].id==state.id) return true;
   return false;
}

function controlCopy()
{
   var s=[],c=[];
   var i,j;

   for (i=0; i<g.selected.length; i++)
   {
      s.push(exportPropertiesState(g.selected[i]));
   }

   for (i=0; i<g.connections.length; i++)
   {
      if (exportContains(s,g.connections[i].stateFrom) && exportContains(s,g.connections[i].stateTo))
         c.push(exportPropertiesConnection(g.connections[i]));
   }

   g.clipboard={ states: s, connections: c, editorType: g.fwprop.editorType };
   all_tabs_update_clipboard();
}

function checkClipboardDuplicites()
{
   var idents=[];

   for (var i=0; i<g.clipboard.states.length; i++)
      for (var j=0; j<g.states.length; j++)
         if (g.clipboard.states[i].fwprop.identifier==g.states[j].fwprop.identifier)
            arrayAddNonempty(idents,g.states[j].fwprop.identifier);

   if (idents.length>0)
   {
      msg("Warning: pasted data contain duplicite "+editorSwitch("state","action node")+" identifiers: "+idents.join(", "),"warning",20);
      return true;
   }
   return false;
}

function controlPaste()
{
   if (jQuery.isEmptyObject(g.clipboard)) return;
   if ($('#modal').is(":visible")) return;

   if (g.fwprop.editorType!=g.clipboard.editorType)
   {
      msg("Clipboard data contain "+editorSwitch("State Machine","Procedure",g.clipboard.editorType)
      +" elements, while current document is "+editorSwitch("State Machine","Procedure",g.fwprop.editorType)
      +". Paste is not possible.","error");
      return;
   }

   historyAddPrepare();
   if (g.clipboard && g.clipboard.states)
   {
      deselectAll();
      checkClipboardDuplicites();
      putOnPaper(g.clipboard.states, g.clipboard.connections, true);
      reorderAllStates();
   }
   historyAddFinish();
   refreshConnections();
   refreshToolbars();
}

// create elements on paper by using exported props
// if shift is required, shift the elements so they appear underneath the mouse cursor
function putOnPaper(states, connections, doShift)
{
   var i,obj,stateObjects=[];
   var minx=99999999,miny=99999999,sx=0,sy=0;

   if (isNaN(g.bg.mousex)) g.bg.mousex=100;
   if (isNaN(g.bg.mousey)) g.bg.mousey=100;

   if (doShift)
   {
      // find out leftmost topmost position
      for (i=0; i<states.length; i++)
      {
         minx=Math.min(states[i].attrs.x,minx);
         miny=Math.min(states[i].attrs.y,miny);
      }

      // get shift value for all coordinates
      sx=g.paperPanX-minx+g.bg.mousex;
      sy=g.paperPanY-miny+g.bg.mousey;
   }

   // add states
   for (i=0; i<states.length; i++)
   {
      obj=newstate(states[i].fwprop.type,0,0);
      stateObjects[states[i].id]=obj;
      obj.fwprop=clone(states[i].fwprop);
      obj.attr(states[i].attrs);
      obj.attr({'x':obj.attr('x')+sx, 'y':obj.attr('y')+sy});
      if (states[i].fwprop.type=='choice') obj.transform("r45");
      if (states[i].selected) selectObject(obj);
      refreshState(obj);
   }

   // add connections
   for (i=0; i<connections.length; i++)
   {
      obj=connect(stateObjects[connections[i].stateFromID],stateObjects[connections[i].stateToID],connections[i].shiftx,connections[i].shifty,clone(connections[i].vertexes),clone(connections[i].shiftxy));
      obj.fwprop=clone(connections[i].fwprop);

      if (sx!=0 || sy!=0)
      for (var j=0; j<obj.vertexes.length; j++)
      {
         obj.vertexes[j].x+=sx;
         obj.vertexes[j].y+=sy;
      }

      obj.attr(connections[i].attrs);
      if (connections[i].selected) selectConnection(obj);
   }
}


function reorderAllStates()
{
   var i;
   updateParents();
   for(i=0; i<g.states.length; i++) putStateToFront(g.states[i]);
}


function exportPropertiesState(state)
{
   return clone({
            id: state.id,
            attrs: state.attrs,
            fwprop: state.fwprop,
            selected: isSelected(state)
          });
}

function exportPropertiesConnection(con)
{
   return clone({
             attrs: con.attrs,
             fwprop: con.fwprop,
             shiftx: con.shiftx,
             shifty: con.shifty,
             vertexes: con.vertexes,
             shiftxy: con.shiftxy,
             stateFromID: con.stateFrom.id,
             stateToID: con.stateTo.id,
             selected: con==g.selectedCon
          });
}

// generate JSON export containing current diagram
function getExportJSON()
{
   var i,s=[],c=[];

   var glob=
   {
      paperPanX: g.paperPanX,
      paperPanY: g.paperPanY,
      attrs: g.bg.attrs,
      fwprop: g.fwprop
   };

   for (i=0; i<g.states.length; i++)
   {
      s.push(exportPropertiesState(g.states[i]));
   }

   for (i=0; i<g.connections.length; i++)
   {
      c.push(exportPropertiesConnection(g.connections[i]));
   }

   return {"editorVersion":g.currentVersion, "states": s, "connections": c, "globals": clone(glob)};
}

function getExportString(obj)
{
   return JSON_toString(obj?obj:getExportJSON());
}

// restore paper state from given json string
// This is used to LOAD previously saved state,
// as well as for undo/redo functionality
function restoreFromExportString(jsontext,fixEmptyName)
{
   var data=JSON_fromString(jsontext);
   restoreFromExport(data,fixEmptyName);
}

function restoreFromExport(data,fixEmptyName)
{
   // clear paper
   destroySelectors();
   deleteAllStates();

   // set globals
   g.paperPanX=data.globals.paperPanX;
   g.paperPanY=data.globals.paperPanY;
   g.fwprop=data.globals.fwprop;
   g.selected=[];
   g.selectedCon=false;

   // backward compatibility for stored machines - if editorType is empty
   // it means it was saved using State Machine editor, thus put there 'Sm'
   if (isEmpty(g.fwprop.editorType)) g.fwprop.editorType='Sm';

   // backward compatibility for missing display info
   if (isEmpty(g.fwprop.displayInfo)) g.fwprop.displayInfo=0;
   if (isEmpty(g.fwprop.displayOrder)) g.fwprop.displayOrder=1;

   // backward compatibility for missing shiftxy
   for (var i=0; i<data.connections.length; i++)
   {
      if (isEmpty(data.connections[i].shiftxy))
         data.connections[i].shiftxy={x:0,y:0};

      if (data.connections[i].fwprop.actionType=='function') data.connections[i].fwprop.actionType='call function';
      if (data.connections[i].fwprop.guardType=='function') data.connections[i].fwprop.guardType='call function';
      if (data.connections[i].fwprop.actionType=='code') data.connections[i].fwprop.actionType=(isEmpty(data.connections[i].fwprop.actionFunc)?'run code':'define function');
      if (data.connections[i].fwprop.guardType=='code') data.connections[i].fwprop.guardType=(isEmpty(data.connections[i].fwprop.guardFunc)?'run code':'define function');

      // add 'return' at the beginning of guard code if there is no return string found yet (backward compatibility)
      if ($.trim(data.connections[i].fwprop.guardCode)!='' && !data.connections[i].fwprop.guardCode.match(/\breturn\b/))
         data.connections[i].fwprop.guardCode='return '+data.connections[i].fwprop.guardCode;
   }

   // backward compatibility for function/code
   for (var i=0; i<data.states.length; i++)
   {
      if (data.states[i].fwprop.doType=='function') data.states[i].fwprop.doType='call function';
      if (data.states[i].fwprop.entryType=='function') data.states[i].fwprop.entryType='call function';
      if (data.states[i].fwprop.exitType=='function') data.states[i].fwprop.exitType='call function';
      if (data.states[i].fwprop.doType=='code') data.states[i].fwprop.doType=(isEmpty(data.states[i].fwprop.doFunc)?'run code':'define function');
      if (data.states[i].fwprop.entryType=='code') data.states[i].fwprop.entryType=(isEmpty(data.states[i].fwprop.entryFunc)?'run code':'define function');
      if (data.states[i].fwprop.exitType=='code') data.states[i].fwprop.exitType=(isEmpty(data.states[i].fwprop.exitFunc)?'run code':'define function');
   }

   // if document without name is loaded, generate automatically name for it
   if (fixEmptyName && $.trim(g.fwprop.smName)=='') fixEmptySMName();

   putOnPaper(data.states, data.connections);

   refreshConnections();
   refreshToolbars();
   refreshBackground();
   if (g.selected.length==1) stateClick(g.selected[0])
   if (g.selectedCon) selectConnection(g.selectedCon);

   reorderAllStates();
}


function historyUndo()
{
   if (g.history.length>0)
   {
      var row=g.history.pop();
      restoreFromExportString(row.data,false);
   }
}

function historyClear()
{
   g.history=[];
}

function historyAddPrepare()
{
   g.historyPrepare=getExportString();
}

function historyAddFinish(type)
{
   if (g.historyPrepare!=getExportString())
      historyAdd(type,g.historyPrepare)
}

function historyAdd(type,data)
{
   if (!type) type='';
   if (type && g.history.length>0 && g.history[g.history.length-1].type==type) return;
   if (!data) data=getExportString();
   if (g.history.length==0 || g.history[g.history.length-1].data!=data)
      g.history.push({ "type":type, "data": data });
   all_tabs_refresh();
}

function isUnsaved()
{
   return g.last_saved_state!=getExportString() && g.history.length!=0;
}
