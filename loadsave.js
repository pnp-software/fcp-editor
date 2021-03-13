
function userIsSigned()
{
   return g.username!="";
}

function setInternalID(id)
{
   g.internalID=id;
   location.hash=(id==0?'':id);
   window.name='w'+id;
}

function saveAs(overwrite, commit)
{
   if (typeof commit === "undefined") commit=false;

   var name=$.trim($('#savename').val());
   var proj=$.trim($('#saveproj').val());
   var asID=$.trim($('#saveid').val());
   var ex=findFilesByName(name);
   var k=Object.keys(ex);
   var el=ex[asID];

   if (k.length>1 && asID<1) { msg("The name is ambiguous, more than one diagram was found with this name. Choose your target diagram with mouse.",'error',15); return; }
   if (name=='') return;

   if (el && isEmpty(overwrite))
   {
      $("#modalq").click();
      $('#modalq').fadeTo(200,1);
      $('#modalqw').html('File already exists. Overwrite?<br><br>'+name+'<br><br><button class="btn btn-success" id=overwriteyes><i class="icon-ok icon-white"></i> Overwrite</button> <button class=btn id=overwriteno>Cancel</button>');
      $('#overwriteyes').click(function(){modalqDestroy(); saveAs(true, commit);});
      $('#overwriteno').click(function(){modalqDestroy();});
      return;
   }

   g.fwprop.smName=name;
   g.fwprop.smTags=proj;
   var data=getExportString();

   modalDestroy();
   refreshToolbars();
   updateTitle();

   var saveData= { "name": name, "svg": getSVG(), "asID":asID, "editorType":editorTypeLong(g.fwprop.editorType), "fwprop": data, "viewbox": getScreenBoxJSON(), "idMap": JSON_toString(g.triggerIDmap), "commit": commit }

   msg("saving...","info",-1);

   if (offline())
   {
      offline_save(saveData);
   }
   else
   {
      $.post("save.php", saveData, function(res)
      {
         saveFinish(res);
      }).fail(function(){
         msg("Saving failed due to connection error, please try again","error");
      });
   }
}


function saveFinish(id)
{
   if (id==-1)
   {
      msg("Insufficient permissions to save this document",'error');
      return;
   }

   setInternalID(id);
   load_saved_files_list(true);
   g.last_saved_state=getExportString();
   msg("Document saved");
}


function loadDocument(id,fwdata)
{
   if (!fwdata)
   {
      if (g.knownFiles.length==0)
      {
         // if no files are known (just loading, not loaded yet), retry later
         setTimeoutWithParams(loadDocument,[id],100);
         return;
      }

      fwdata=findFileById(id).fwdata;

      if (!fwdata)
      {
         // ID was not found
         msg('Document '+id+' not found',"error");
         // TODO: clear current document so it is empty
         return;
      }
   }
   else
      fwdata=JSON_fromString(fwdata);

   historyClear();
   restoreFromExport(fwdata,true);
   setInternalID(id);
   modalDestroy(g.internalID);
   refreshToolbars();
   g.last_saved_state=getExportString();
   updateTitle();
   msg("Document opened successfully",'success',1);
   tab_refresh();
   all_tabs_refresh();
}


function brief_known_files()
{
   var res={};
   for (var i=0; i<g.knownFiles.length; i++)
      res[g.knownFiles[i].id]={'n':g.knownFiles[i].name, 'lu': g.knownFiles[i].lastUpdate};
   return res;
}


function load_saved_files_list(wait)
{
   if (offline())
   {
      offline_load();
      return;
   }

   if (wait && g.load_in_progress)
   {
      // if we want to wait for the completion of previous request, restart itself a bit later by a timer
      setTimeoutWithParams(load_saved_files_list,[true],100);
      return;
   }

   // if there is already an operation in progress, do nothing
   if (g.load_in_progress) return;

   g.load_in_progress=true;
   $('#waitimg').show();

   $.post("load.php", {'known':brief_known_files()}, function(res)
   {
      processFilelist(res);
      g.autoload_counter=1; // reget after full interval again
      g.load_in_progress=false;
   }).fail(function()
   {
      $('#waitimg').hide();
      g.load_in_progress=false;
      g.autoload_counter=0; // retry faled right on the next autoload call
   });
}

function refreshUserControls()
{
   if (userIsSigned())
   {
      $('#modalident').html(g.username);
      $('#modalident').show();
      $('#modallogout').show();
      $('#modallogin').hide();
      $('#loadarrow').hide();
      $('#loadfiles').show();
      signinHide();
   }
   else
   {
      $('#modalident').hide();
      $('#modallogout').hide();
      $('#modallogin').show();
      $('#loadarrow').show();
      $('#loadfiles').hide();
   }

   // indicate unsaved changes somehow
   if (isUnsaved()) $('#unsaved').show();
   else $('#unsaved').hide();
}


function fileNameByID(id)
{
   if (id==0 || isEmpty(id)) return '';
   var file=findFileById(id);
   if (file) return file.name;
   else return '~ deleted ~';
}


function editorTypeShort(long)
{
   if (long=='State Machine' || long=='Sm') return 'Sm';
   if (long=='Procedure' || long=='Pr') return 'Pr';
}

function editorTypeLong(short)
{
   if (short=='Sm' || short=='State Machine') return 'State Machine';
   if (short=='Pr' || short=='Procedure') return 'Procedure';
}


// checks whether given id exists in stored diagrams
// Returns the entire file object or false if not found
function findFileById(id)
{
   id=parseInt(id);
   if (isNaN(id)) id=0;
   if (id in g.knownFilesAssoc) return g.knownFilesAssoc[id];
   else return false;
}


// checks whether given name exists in stored diagrams
// Returns associative list of file objects for all files matching the name
function findFilesByName(name)
{
   var found={};

   for (var i=0; i<g.knownFiles.length; i++)
      if ($.trim(g.knownFiles[i].name)==$.trim(name))
      {
         found[g.knownFiles[i].id]=g.knownFiles[i];
      }

   return found;
}

function findFilesByProject(projectName, excludeId)
{
   if (typeof excludeId === "undefined") excludeId=0;

   var found=[];
   var numFound = 0;

   for (var i=0; i<g.knownFiles.length; i++)
      if ($.trim(g.knownFiles[i].projectName)==$.trim(projectName))
      {
          if (g.knownFiles[i].id != excludeId)
          {
              found[numFound++]=g.knownFiles[i].id;
          }
      }

   return found;
}

function plural(nr)
{
   if (Math.floor(nr)!=1) return "s";
   return "";
}

function daysAgo(secElapsed)
{
   var days=secElapsed/60/60/24;
   var hours=(days-Math.floor(days))*24;
   var minutes=(hours-Math.floor(hours))*60;
   var days=Math.floor(days); hours=Math.floor(hours); minutes=Math.floor(minutes);
   var result=(days>0?days+" day"+plural(days)+" ":"")+(hours>0?hours+" hour"+plural(hours)+" ":"")+(minutes>0?minutes+" minute"+plural(minutes)+" ":"");
   result=result.replace(/^([0-9a-z]+ [0-9a-z]+).*/,"$1");
   return result!=""?result+" ago":"few seconds ago";
}


function projectExpand()
{
   var t=$(this);
   t.closest('.projectbox').toggleClass('collapsed');
}


function fileListAppend(selector,file,edit)
{
   var id=file.id;

   var dirname=file.fwdata ? $.trim(file.fwdata.globals.fwprop.smTags) : '';
   var dir=btoa(encodeURIComponent(dirname)).replace(/=/g,'');

   if ($('#dir'+dir).length==0 && dir!='')
      $(selector).append("<div class=projectbox id='dir"+dir+"'><br><div class=hrline></div>"+
                         "<div class='pull-right projsel'>Select: <a class=checkall>all</a>, <a class=checkall>none</a></div>"+
                         "<blockquote style='margin-left: -20px; font-weight: bold;'>"+dirname+"</blockquote><div id='dircontent"+dir+"'></div></div>");

   if (dir!='') selector="#dircontent"+dir;
   $(selector).append("<div data-id=\""+id+"\" class=\"itemname radius5 thumbName"+id+"\" id=loadFile"+id+">"
          +(edit?"<div id=deletestart"+id+" class=\"pull-right fileab\" style=\"margin-right: 3px;\"><b style='font-size: 25px; color: #ffaaaa; padding-left: 4px; line-height: 24px;' title='erase'>&times</b></div>"
                 +"<div id=sharestart"+id+" class=\"pull-right fileab\"><i class='icon-user' style='opacity: 0.5; "
                     +"border-top: 4px solid transparent; margin-top: -1px; border-bottom: 6px solid transparent; margin-bottom: -6px; border-right: 3px solid transparent; "
                     +"border-left: 3px solid transparent; margin-left: 1px; margin-right: 0px;' title='share'></i></div>"
                 +"<div id=revisionsstart"+id+" class=\"pull-right fileab\"><i class='icon-time' style='opacity: 0.5; "
                     +"border-top: 4px solid transparent; margin-top: -1px; border-bottom: 6px solid transparent; margin-bottom: -6px; border-right: 3px solid transparent; "
                     +"border-left: 3px solid transparent; margin-left: 1px; margin-right: 0px;' title='history'></i></div>"
                 +"<div id=renamestart"+id+" class=\"pull-right fileab\"><i class='icon-pencil' style='opacity: 0.5; "
                     +"border-top: 4px solid transparent; margin-top: -1px; border-bottom: 6px solid transparent; margin-bottom: -6px; border-right: 3px solid transparent; "
                     +"border-left: 10px solid transparent; margin-left: -10px; margin-right: 0px;' title='rename'></i></div>"
                 +"<i class='icon-share chboximg' id=chbox"+id+"></i>":"")
          +"<span class=\"filename filenamename"+id+"\" id=filename"+id+">"+htmlspecialchars(file.name)+"</span>"+((file.isShared==1 || g.userID!=file.userID) && edit && !offline()?"<span style='color: #"+(g.userID!=file.userID?"00aa00":"417ec1")+"; font-size: 20px;'> &nbsp;&#9679;</span>":"")+""
          +(edit?"<div class=filetags id=tag"+id+"></div><div class=fileprops id=props"+id+"></div>":"")
          +"<div class=\"itemsvg hidden thumbID"+id+"\"><div class=content>"
            +"<div class='thumbnail'>"
            +"<img id=thumbimg"+id+" style='background-color: #eee;'>"
            +"<div class=caption>"
               +"<div>"+(file.isEmpty=='Y'?"New "+editorTypeLong(file.editorType):file.name)+"</div>"+(edit?"<font size=1>"+editorTypeLong(file.editorType)+" | Last change "+daysAgo(file.secElapsed)+"</font>":"")
            +"</div></div></div></div></div>");

   $("#deletestart"+id).click(function(event){deleteStart(event,this,$(this).closest('.itemname').attr('data-id'));});
   $("#renamestart"+id).click(function(event){renameStart(event,this,$(this).closest('.itemname').attr('data-id'));});
   $("#sharestart"+id).click(function(event){shareStart(event,this,$(this).closest('.itemname').attr('data-id'));});
   $("#revisionsstart"+id).click(function(event){revisionsStart(event,this,$(this).closest('.itemname').attr('data-id'));});
   $("#chbox"+id).click(function(event){massSelectFile($(this).closest('.itemname').attr('data-id'),this,event);})

   $("#loadFile"+id).mouseover(function(){ thumbPreview($(this).attr('data-id')); }).click(function()
   {
      if ($(this).attr('data-id')==g.internalID)
      {
         $("#modalq").click();
         $('#modalq').fadeTo(200,1);
         $('#modalqw').html('This document is already loaded.<br><br><button class="btn btn-success" id=alreadyloaded><i class="icon-ok icon-white"></i> Dismiss</button>');
         $('#alreadyloaded').click(function(){modalqDestroy();});
         return;
      }

      var loadfunction;
      (function(t)
      {
         loadfunction=function()
         {
            historyClear();
            if ($(t).attr('data-fwprop')) loadDocument(0,$(t).attr("data-fwprop"))
            else location.hash=$(t).attr('data-id');
         }
      })(this);

      if (isUnsaved())
      {
         $("#modalq").click();
         $('#modalq').fadeTo(200,1);
         $('#modalqw').html('Unsaved changes will be lost. Continue loading?<br><br><button class="btn btn-success" id=losechangesyes><i class="icon-ok icon-white"></i> Continue</button> <button class=btn id=losechangesno>Cancel</button>');
         $('#losechangesyes').click(function(){modalqDestroy(); loadfunction();});
         $('#losechangesno').click(function(){modalqDestroy();});
      }
      else loadfunction();
   });

   if (!edit)
   {
      $('#thumbimg'+id).attr("data-src",dataURL_encode(file.svg,"image/svg+xml"));
      $("#loadFile"+id).attr("data-fwprop",file.fwprop);
   }
}


// set file list content and display username if user is signed in
function processFilelist(res,noBroadcast)
{
   var data=JSON_fromString(res);
   var i=0;
   var id=0;
   var knF=[];
   var knA={};

   if (data.username) g.username=data.username; else g.username="";
   if (data.userID) g.userID=data.userID; else g.userID=0;

   // update KnownFiles
   for (i=0; i<data.diagrams.length; i++)
      knA[data.diagrams[i].id]=data.diagrams[i];

   for (i=0; i<g.knownFiles.length; i++)
   {
      if (g.knownFiles[i].id in knA)
      {
         if (knA[g.knownFiles[i].id].change=="none") knF.push(g.knownFiles[i]);
         else if (knA[g.knownFiles[i].id].change!="noex") knF.push(knA[g.knownFiles[i].id]);
         delete knA[g.knownFiles[i].id];
      }
   }

   for (i=0; i<data.diagrams.length; i++)
      if (data.diagrams[i].id in knA)
         knF.push(data.diagrams[i]);

   for (var i=0; i<knF.length; i++)
   {
      knF[i].fwdata=JSON_fromString(knF[i].fwprop);
      knF[i].editorType=editorTypeShort(knF[i].editorType);
      knF[i].secElapsed=knF[i].curtime==0?(new Date).getTime()/1000-knF[i].lastUpdate:knF[i].curtime-knF[i].lastUpdate;
      knF[i].projectName=$.trim(knF[i].fwdata.globals.fwprop.smTags);
   }

   // sort
   g.knownFiles=knF.sort(function(a,b) { var p=naturalSort(a.projectName,b.projectName); if (p==0) return naturalSort(a.name,b.name); else return p; });


   // update associative known files object
   g.knownFilesAssoc={};
   for (var i=0; i<g.knownFiles.length; i++)
   {
      g.knownFilesAssoc[g.knownFiles[i].id]=g.knownFiles[i];
   }

   // update file list
   $('#modalfilelist').empty();

   for (var i=0; i<g.knownFiles.length; i++)
      fileListAppend("#modalfilelist",g.knownFiles[i],true);

   // collapse all projects
   $("#modalfilelist .projectbox").addClass('collapsed');

   if (i<1)
      $('#modalfilelist').html("<div style='font-size: 10px;'>no diagrams saved yet</div>");

   $('#waitimg').hide();
   modalSetheight();
   updateFileSelections();
   updateSaveList();

   // Update ID mappings of trigger identifiers to integer values.
   // Only add the received values to the global pool to ensure newer values
   // which are not on the server yet will not get reset.
   var mappings=JSON_fromString(data.idMap);
   for (var i in mappings) g.triggerIDmap[i]=mappings[i];

   // push file list to all other tabs
   if (!noBroadcast) all_tabs_filelist_update(res);
   if (g.currentVersion!=data.version && !offline()) msg("Version of this editor on server has changed.<br>It is strongly advised to <a href='javascript:location.reload();'>Reload</a> this webpage.",'warning',60);

   // if list is loaded while diagram is empty and name is not set,
   // set it. Makes sure that the used ID is not from any existing saved diagrams
   if (g.states.length==0 && $.trim(g.fwprop.smName)=='') fixEmptySMName();

   if ($('#savename').is(":visible")) $('#savename').focus();
   refreshUserControls();
   thumbPreview();
   scrollHovered();

   // refresh toolbars, but only if focus is somewhere else
   if ($(':focus').filter(':input').length==0) refreshToolbars();
}

function updateSaveList()
{
   $('#savelist').html('');

   var list=$('#modalfilelist').clone(true);
   $(list).append('<br><br>');

   $(list).find("*").removeAttr("id");
   $(list).find('.projsel').remove();
   $(list).appendTo('#savelist');

   $('#savelist .itemname').off('click');
   $('#savelist .itemname').click(function()
   {
      $('#savename').val($(this).find('.filename').text());
      $('#saveproj').val($(this).closest('.projectbox').find('blockquote').text());
      $('#saveid').val($(this).data('id'));
      saveAs(false);
   });
}


// find out coordinates of top-left corner and bottom-right corner
// of screen which contains some drawings (states, or vertexes)
// and add some margins

function getScreenBox()
{
   var i,bbox;
   var margin=20;
   var all=paper.set();

   for (i=0; i<g.states.length; i++)
   {
      all.push(g.states[i]);
      if (g.states[i].text && $.trim(g.states[i].text.attr("text"))!="") all.push(g.states[i].text);
   }

   for (i=0; i<g.connections.length; i++)
   {
      all.push(g.connections[i]);
      if (g.connections[i].text && $.trim(g.connections[i].text.attr("text"))!="") all.push(g.connections[i].text);
   }

   bbox=all.getBBox();
   return {x: bbox.x-margin, y: bbox.y-margin, width: bbox.width+2*margin, height: bbox.height+2*margin };
}

function getScreenBoxJSON()
{
   return JSON.stringify(getScreenBox());
}

function modalSetheight()
{
  var p80=Math.floor(paper.height/100*80);
  var p20=70;
  $('#modalwindow').height(p80)
  $('#modalheader').height(p20);
  $('#modalcontent').height(p80-p20-10);

  $('#modalcontent').slimScroll(
  {
     height: p80-p20-10,
     railVisible: true,
     alwaysVisible: true,
     disableFadeOut: true,
     color: '#999999',
     railColor: '#cccccc',
     wheelStep: 20
  });
}

function modalDialog(menu)
{
   var ex=findFilesByName(g.fwprop.smName);
   var k=Object.keys(ex);

   toolbarMin();
   modalSetheight();
   loginReset();
   modalqDestroy();
   $('#modal').show();
   $('#savename').val(g.fwprop.smName);
   $('#saveproj').val(g.fwprop.smTags);
   $('#saveid').val(k.length==1?reset(k):(ex[g.internalID]?g.internalID:''));
   $('#modal').fadeTo(0,1);
   $('#modalbg').fadeTo(0,0);
   $('#modaltbl').fadeTo(0,0);
   $('#modalbg').fadeTo(200,0.8,function(){$('#modaltbl').fadeTo(400,1);});
   $('#modalcontent').scrollTop(0);

   refreshUserControls();
   signinHide();

   if (menu!='') // files
   {
      $('#modalmenu').show();
      $('#code').hide();
      $('#modallabel').html("Manage Files");
      showMenu(menu,true);
   }
   else // code
   {
      $('#modalmenu').hide();
      showMenu('#code',true);
      $('#modallabel').html(editorSwitch("State Machine","Procedure")+" Code");
      refreshMemAlloc();
   }

   // some things need to be done few times
   modalSetheight();
}

function modalDestroy(id)
{
   $('#modaltbl').fadeTo(400,0,function()
   {
      $('#modalbg').fadeTo(200,0,function()
      {
         $('#modal').hide();
         toolbarMin();
         if (!isEmpty(id) && id>0) g.lastpreviewID=id;
      });
   });
}

function modalqDestroy()
{
   $('#modalq').hide();
   if ($('#savename').is(":visible"))
   {
     var top=$('#modalcontent').scrollTop();
     $('#savename').focus();
     $('#modalcontent').scrollTop(top);
   }
}


function regShow()
{
   $('#logorreg').slideUp(200);
   $('#regform').slideDown(200,function(){$('#regName').focus();});
}

function loginShow()
{
   $('#logorreg').slideUp(200);
   $('#loginform').slideDown(200,function(){$('#loginEmail').focus();});
}

function loginReset()
{
   $('#logorreg').slideDown(200);
   $('#loginform').slideUp(200);
   $('#regform').slideUp(200);
   $('#preview').hide();
}

function passwordFormReset()
{
   $('#forgotpassform').slideUp(200);
   $('#loginform').slideDown(200);
}

function signinHide()
{
   $('#loginprompt').slideUp(200);
}

function updateIDmapEdit()
{
   var map="";
   for (var i in g.triggerIDmap) map+=i+": "+g.triggerIDmap[i]+"\n";
   $("#idMapEdit").val(map);
}

function idMapEditShow()
{
   $('#idMapEditBtn').hide();
   $('#idMapEdit').show();
   $('#idMapSaveBtn').show();
   $('#import').parent().scrollTop(2000);
}

function idMapEditHide()
{
   $('#idMapEdit').slideUp();
   $('#idMapSaveBtn').slideUp();
   $('#idMapEditBtn').slideDown();
}

function saveIDmapBtnClick()
{
   var match;
   var lines=$("#idMapEdit").val().split("\n");
   var map={};

   for (var i=0; i<lines.length; i++)
   {
      match=lines[i].match(/^([a-zA-Z0-9_]+):\s*([0-9]+)[,;]*$/);
      if (match) map[match[1]]=parseInt(match[2]);
   }

   if (offline())
   {
      offline_save_map(JSON_toString(map));
      g.triggerIDmap=map;
      idMapEditHide();
   }
   else
   {
      $('#waitimg').show();
      $.post("save.php", {"idMap": JSON_toString(map)}, function(res)
      {
         g.triggerIDmap=map;
         $('#waitimg').hide();
         idMapEditHide();
      }).fail(function(){
         msg("Saving failed due to connection error, please try again","error");
         $('#waitimg').hide();
      });
   }
}


function saveIDmap()
{
   if (!userIsSigned()) return;
   updateIDmapEdit();
   saveIDmapBtnClick();
}


function scrollHovered()
{
   $('#modalcontent').scrollTop(0);
   var of=$(".itemnamehover").offset();
   var top=0;
   if (of) top=of.top;
   $('#modalcontent').scrollTop(top-$('#modalcontent').height()/2-50);
}

function showMenu(active,remember)
{
   $('#presets').hide();
   $('#files').hide();
   $('#saveas').hide();
   $('#import').hide();
   $('#loginprompt').hide();
   $('#preview').hide();

   $('#presetsmenu').removeClass('active');
   $('#filesmenu').removeClass('active');
   $('#saveasmenu').removeClass('active');
   $('#importmenu').removeClass('active');
   $('#loginpromptmenu').removeClass('active');

   $(active).show();
   $(active+'menu').addClass('active');
   if (remember) g.lastmenu=active;

   if ($('#savename').is(":visible")) $('#savename').focus();

   if (active=='#presets') thumbPreview(g.lastpreviewID || g.internalID);
   if (active=='#files') { thumbPreview(g.internalID || g.lastpreviewID); scrollHovered(); }
   if (active=='#saveas') thumbPreview(g.internalID || g.lastpreviewID);
   if (active=='#import') updateIDmapEdit();

   modalSetheight();
}

function renameStart(ev,t,id)
{
   ev.stopPropagation();

   $("#modalq").click();
   $('#modalq').fadeTo(200,1);
   $('#modalqw').html('<div class=pull-left>&nbsp;Rename file:</div>'+
   '<input type=text id=inprename style="width: 380px;" class=pull-right><br clear=all><div class=pull-left>&nbsp;Project name:</div>'+
   '<input type=text id=inptags class="project pull-right" style="width: 380px;" data-filter="noregex" placeholder="Project name (optional)" data-suggest="tags">'+
   '<div class=pull-right>&nbsp;Assign new project name to all diagrams in this project.</div><input type=checkbox id=inprenall class="project pull-right"/>'+
   '<br><div id=renamedmsg style="color: #b94a48">&nbsp;</div><br><br>'+
   '<button class="btn btn-success" id=renamebuttonconfirm><i class="icon-ok icon-white"></i> Confirm</button> <button class=btn id=renamebuttoncancel>Cancel</button>');

   $('#renamebuttoncancel').click(function(){modalqDestroy();});
   $('#renamebuttonconfirm').click(function(){renameDo(id);});
   $('#inprename').keydown(function(event){if (event.which==13) renameDo(id);});
   $('#inptags').mousedown(function(event){event.stopPropagation();});

   $('#modalqw').find('#inptags').val($(t).parent().find('.filetags').text()).mousedown(propSuggest).keydown(function(ev){ if (ev.which==13) renameDo(id); processInputSpecialKeys(ev); }).keypress(function(ev){ validateInput(ev,true); }).keyup(function(ev){ validateInput(ev,false); }).focus(propSuggest);
   $('#modalqw').mousedown(propSuggestHide);
   $('#modalqw').find('#inprename').val($(t).parent().find('.filename').text()).select();
}


function renameDone(id,newtags,newname)
{
   // if user renamed currently open diagram, set it in global properties
   if (id==g.internalID)
   {
      g.fwprop.smTags=newtags;
      g.fwprop.smName=newname;
      refreshToolbars();
   }

   $('#tag'+id).text(newtags);
   $('#filename'+id).text(newname);

   modalqDestroy();
   load_saved_files_list(true);
}

function renameDo(id)
{
   var newname=$.trim($('#inprename').val());
   var newtags=$.trim($('#inptags').val());
   var renameAll=$('#inprenall').is(':checked');

   var data=findFileById(id).fwdata;
   var oldname = data.globals.fwprop.smName;
   var oldtags = data.globals.fwprop.smTags;

   data.globals.fwprop.smTags=newtags;
   data.globals.fwprop.smName=newname;

   if (newname==$.trim($('#filename'+id).text()) && newtags==$.trim($('#tag'+id).text()))
   {
      modalqDestroy();
      return;
   }
   
   var projectFiles = [];
   if (renameAll && oldtags != newtags)
   {
         // Check whether there are other diagrams within this project.
         projectFiles=findFilesByProject(oldtags, id);
   }

   if (offline())
   {
      var file=findFilesByName(newname); // lets assume offline will have only one file with given name
      if (!$.isEmptyObject(file) && !file[id])
      {
         $('#renamedmsg').html('Rename failed: target filename already exists.');
         return;
      }

      offline_rename(id,newtags,newname,getExportString(data));
      return;
   }

   $('#renamedmsg').html('&nbsp;');
   $('#waitimg').show();

   $.post("rendel.php?ac=rename", {'id':id, 'name': newname, 'projname':newtags, 'data': getExportString(data), 'projectFiles':projectFiles}, function(res)
   {
      if (res=='ok')
      {
         $('#waitimg').hide();
         renameDone(id,newtags,newname);
      }
      else
      {
         $('#renamedmsg').html(res);
         $('#waitimg').hide();
      }
   }).fail(function(){
         $('#renamedmsg').html('Connection error. Please try again.');
         $('#waitimg').hide();
      });  
}


function revisionsStart(ev,t,id)
{
   ev.stopPropagation();

   if (offline())
   {
      revisionsDo(/*...*/);
      return;
   }

   $('#waitimg').show();
   $.post('revisions.php',{'id':id},function(res)
   {
      $('#waitimg').hide();
      var data=JSON_fromString(res);
      if (data.error) { msg(data.error,'error'); return; }
      revisionsDo(data.revisions)
   }).fail(function(){
         msg('Connection error. Please try again.','error');
         $('#waitimg').hide();
   });
}


function revisionsDo(revisions)
{
   var txt='';
   for (var i=0; i<revisions.length; i++)
   txt=txt+'<a href=# id=revision'+revisions[i].id+'>'+revisions[i].lastUpdate.substr(0,16)+'</a><br>';

   if (txt=='') txt="Empty result";
   for (i=0; i<24-revisions.length; i++) txt=txt+'<br>';

   $("#modalq").click();
   $('#modalq').fadeTo(200,1);
   $('#modalqw').html("<div id=revisionthumb class=pull-right style='width: 380px; position: absolute; margin-left: 150px;'><div style='position: absolute;' id=revisionq></div>"
                       +'<button type="button" class="close" style="margin-right: -20px; margin-top: -20px; outline: none;" id="revbuttoncancel" spellcheck="false">&times;</button><br>'
                       +"<img style='width: 100%;' id=revisionimg src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAGQAQMAAABs65Z3AAAAA1BMVEXu7u6DSdFtAAAAPklEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4NndAAAfVRSv0AAAAASUVORK5CYII=\">"
                       +"<br><br><div class=pull-left>Saved by user: <span id=revisionuser></span></div><br clear=all></div><div class=pull-left style='margin-top: -20px;'><h5 style='text-align: left;'>All revisions</h5>"+txt
                     +"</div><br clear=all>");

   $('#revbuttoncancel').click(function(){modalqDestroy();});

   for (i=0; i<revisions.length; i++)
   $('#revision'+revisions[i].id).data('fwdata',revisions[i].fwprop)
      .data('svgdata',dataURL_encode(revisions[i].svg,"image/svg+xml"))
      .data('fullName',revisions[i].fullName)
      .mouseover(function()
   {
      $('.revisionhoverlink').removeClass('revisionhoverlink');
      $(this).addClass('revisionhoverlink');
      $('#revisionimg').attr('src',$(this).data('svgdata'))
      $('#revisionthumb').css('top',($('#modalqw').scrollTop()+30)+'px');
      $('#revisionuser').text($(this).data('fullName'));
   }).click(function()
   {
      var loadfunction;
      (function(t)
      {
         loadfunction=function()
         {
            modalqDestroy();
            loadDocument(0,$(t).data('fwdata'));
         }
      })(this);

      if (isUnsaved())
      {
         $('#revisionq').html('<br><div align=center style="border: 1px solid #ddd; background-color: #fff; padding: 20px; width: 338px; margin-top: 30px;">'
         +'Unsaved changes will be lost. Continue loading?<br><br><button class="btn btn-success" id=losechangesyes><i class="icon-ok icon-white"></i> Continue</button> <button class=btn id=losechangesno>Cancel</button>'
         +'</div>');

         $('#losechangesyes').click(function(){loadfunction();});
         $('#losechangesno').click(function(){$('#revisionq').html('');});
      }
      else loadfunction();
   });

   $('#modalqw').on('scroll',function()
   {
      $('#revisionimg').closest('div').css('top',($('#modalqw').scrollTop()+30)+'px');
   });

   if (revisions.length>0)
   $('#revision'+revisions[0].id).trigger('mouseover');
}



function shareStart(ev,t,id)
{
   ev.stopPropagation();
   if (offline()) { msg('Sharing is not available for offline version of FW Profile editor','error'); return; }

   $('#waitimg').show();
   $.post('share.php',{'action':'getusers','id':id},function(res)
   {
      $('#waitimg').hide();

      var data=JSON_fromString(res);

      if (data.error)
      {
         msg(data.error,'error');
         return;
      }

      if (!data || !data.ok)
      {
         msg('Connection error. Please try again.','error');
         return;
      }

      function addshareuser(email,perm)
      {
         $('#shareusers').append(
         '<div><input type=text class="pull-left" style="width: 360px;" placeholder="email@address" value="'+htmlspecialchars(email)+'">'+
         '<select style="width: 60px; margin-left: 10px;" class="pull-left"><option>rw<option '+(perm=='ro'?'SELECTED':'')+'>ro</select>'+
         '<button class="shareuserremove btn btn-link pull-left" style="margin-left: 10px; width: 75px;">remove</button></div>');
         $('.shareuserremove').off().on('click',function(){$(this).parent().remove();});
      }

      var txt='<p><b>'+$('#filename'+id).text()+'</b><p align=justify>Share this diagram with other users, add their email address below. You must specify the same email address which is used to sign in.';
      txt+=' The user will not be notified.<br><br><div id=shareusers></div><button class="btn btn-link" id=sharemoreadd>+ add more users</button><br><br>';
      txt+='<button class="btn btn-info" id=sharebuttondo><i class="icon-ok icon-white"></i> Save settings</button> <button id=sharebuttoncancel class=btn>Cancel</button>';

      $("#modalq").click();
      $('#modalq').fadeTo(200,1);
      $('#modalqw').html(txt);

      for (var i=0; i<data.users.length; i++) addshareuser(data.users[i].user,data.users[i].perm);
      if (i==0) addshareuser('','rw');

      $('#sharebuttondo').click(function(){shareDo(id);});
      $('#sharebuttoncancel').click(function(){modalqDestroy();});
      $('#sharemoreadd').click(function() { addshareuser('','rw'); });
      
   }).fail(function(){
         msg('Connection error. Please try again.','error');
         $('#waitimg').hide();
   });
}


function shareDo(id)
{
   var perm=[];
   $('#shareusers').find('input').each(function()
   {
      var item={'email':$(this).val(), 'perm':$(this).next().val()}
      perm.push(item);
   });

   $('#waitimg').show();
   $.post('share.php',{'action':'setusers','id':id,'perm':perm},function(res)
   {
      $('#waitimg').hide();

      var data=JSON_fromString(res);

      if (data.error)
      {
         msg(data.error,'error');
         return;
      }

      modalqDestroy();
      g.knownFilesAssoc[id].lastUpdate=0;
      load_saved_files_list(true);
   }).fail(function(){
      msg('Connection error. Please try again.','error');
      $('#waitimg').hide();
   })

}


function deleteStart(ev,t,id)
{
   ev.stopPropagation();

   $("#modalq").click();
   $('#modalq').fadeTo(200,1);
   $('#modalqw').html('Do you really want to delete the selected file?<br>'+($(t).parent().find('.filename').html())+'<br><div id=deletedmsg style="color: #b94a48">&nbsp;</div><br><button class="btn btn-danger" id=deletebuttondo><i class="icon-remove icon-white"></i> Delete</button> <button id=deletebuttoncancel class=btn>Cancel</button>');
   $('#deletebuttondo').click(function(){deleteDo(id);});
   $('#deletebuttoncancel').click(function(){modalqDestroy();});
}

function deleteDone()
{
   modalqDestroy();
   load_saved_files_list(true);
}

function deleteDo(id)
{
   $('#deletedmsg').html('&nbsp;');

   if (offline())
   {
      offline_delete(id);
      deleteDone();
      return;
   }

   $('#waitimg').show();
   $.post("rendel.php?ac=delete",{'id': id}, function(res)
   {
      if (res=='ok')
      {
         deleteDone();
         $('#waitimg').hide();
      }
      else
      {
         $('#deletedmsg').html(res);
         $('#waitimg').hide();
      }
   }).fail(function(){
        $('#deletedmsg').html('Connection error. Please try again.');
        $('#waitimg').hide();
      });
}



// set name of state machine or procedure to some unique value
// It looks into the list of stored files to ensure it doesn't
// use existing filename (if any)
function fixEmptySMName()
{
   var name='';
   var id=1;
   while (name=='' || !$.isEmptyObject(findFilesByName(name))) name='Diagram '+(id++);
   g.fwprop.smName=name;
   updateTitle();
}



function thumbPreview(id)
{
   if (isEmpty(id) || id==0)
      if ($('#preview').is(":visible"))
         id=g.lastpreviewID;

   if (!isEmpty(id) && id>0)
      g.lastpreviewID=id;

   $('#preview').empty();

   if ($('.thumbName'+g.lastpreviewID).is(":visible"))
   {
      var thumb=$('#loadFile'+id+' .content').clone();
      $(thumb).find("*").removeAttr("id");
      var src=$(thumb).find("img").attr("data-src");
      $(thumb).find("img").attr("src",src?src:dataURL_encode(id in g.knownFilesAssoc?g.knownFilesAssoc[id].svg:fixSVG(""),"image/svg+xml"));
      $('#preview').html($(thumb).html());
      $('#preview').show();
   }

   // remove hover class from all elements
   $('#modalwindow').find(".itemnamehover").removeClass('itemnamehover');
   // add hover class for our element
   $('.thumbName'+g.lastpreviewID).addClass('itemnamehover');
   $(".itemnamehover").closest('.projectbox').removeClass('collapsed');
}


function allFilesTags()
{
   var res={};

   for (var i=0; i<g.knownFiles.length; i++)
      res[g.knownFiles[i].id]=g.knownFiles[i].fwdata.globals.fwprop.smTags;

   return res;
}

function updateKnownTags(filesTags)
{
   var tags=[];
   var f;

   for (var id in filesTags)
   {
      f=filesTags[id];
      if (!f) f='';
      $('#tag'+id).text(f);
      arrayAddNonempty(tags,$.trim(f));
   }

   g.knownTags=tags;
}


function selectall(ev)
{
   var t=$(this);
   var sel=t.text();
   var box=t.closest('.projectbox');

   if (box.length>0) // clicking select in project box
   {
      box.find('.itemname').each(function(i,el)
      {
         var id=$(el).attr('data-id');
         selectFile(id,sel=='all');
      });
   }
   else // clicking select in outer element
   {
      $('#modalfilelist').find('.itemname').each(function(i,el)
      {
         var id=$(el).attr('data-id');
         var b=false;
         if (sel=='projectless' && $(el).closest('.projectbox').length==0) b=true; else b=false;
         if (sel=='all') b=true;
         if (sel=='none') b=false;
         selectFile(id,b);
      });

      if (sel=='all')
      $('#modalfilelist').find('.projectbox').removeClass('collapsed');
   }

   updateFileSelections();
}


// update selection of files and tag list
function updateFileSelections()
{
   var id;
   var cnt=0;
   var filesTags=allFilesTags();
   updateKnownTags(filesTags);
   if (jQuery.inArray(g.tagFilter,g.knownTags) === -1) g.tagFilter='';

   // construct regular expression to match tags
   var reg=new RegExp("\\b"+g.tagFilter+"\\b");

   for (id in filesTags)
   {
      if (id in g.selectedFiles)
      {
         cnt++;
         $('#chbox'+id).removeClass('icon-check').removeClass('icon-share').addClass('icon-check');
         $('#thumbimg'+id).attr('src',dataURL_encode(id in g.knownFilesAssoc?g.knownFilesAssoc[id].svg:fixSVG(""),"image/svg+xml"));
      }
      else $('#chbox'+id).removeClass('icon-check').removeClass('icon-share').addClass('icon-share');

      $('.thumbName'+id).show();
      if (g.tagFilter!='' && (!filesTags[id] || !filesTags[id].match(reg))) $('.thumbName'+id).hide();
   }

   for (id in g.selectedFiles)
      if (!(id in filesTags))
         delete g.selectedFiles[id];

   $(".actionscnt").text(cnt>0?cnt:"");
   $('#tagselect').html("<option value=''>All tags"+(g.knownTags.length>0?"<option>"+g.knownTags.join("<option>"):""));
   $('#tagselect').val(g.tagFilter).hide();
}

function selectFile(id,isToBeSelected)
{
   if (isToBeSelected) g.selectedFiles[id]=true;
   else delete g.selectedFiles[id];
}

function massSelectFile(id,t,ev)
{
   ev.stopPropagation();
   selectFile(id,!g.selectedFiles[id]);
   updateFileSelections();
}


function updateSaveFileListByName()
{
   var name=$('#savename').val();
   var ex=findFilesByName(name);
   var k=Object.keys(ex);
   var id=(k.length==1?reset(k):'');

   if (id)
   {
      $('#saveid').val(id);
      thumbPreview(ex[id].id);
   }

   if (k.length>1 || k.length==0) $('#saveid').val('');
}


function signinShow()
{
   showMenu('#loginprompt',false);
   $('#logorreg').show();
   $('#loginform').hide();
   $('#regform').hide();
   $('#code').hide();
   $('#preview').hide();
   $('#forgotpassform').hide();
   $('#passresettext').html("");
   $('#loginfailtext').html("");
   forgotPassFormClear();
}

function forgotPassFormShow()
{
   forgotPassFormClear();
   $('#passresettext').html('');
   $('#loginform').slideUp(200);
   $('#forgotpassform').slideDown(200);
}

function forgotPassFormClear()
{
   $('#rescoderow').hide();
   $('#respw1row').hide();
   $('#respw2row').hide();

   $('#rescode').val('');
   $('#respw1').val('');
   $('#respw2').val('');
}


function passwordReset()
{
   $('#rescodetext').html('');
   $('#passresettext').html('');
   $('#respw2text').html('');
   $('#passresettext').parent().addClass('error').removeClass('info');

   if ($('#rescode').val()!='') // if we are in the phase of setting new password, check if pw1=pw2 && pw1!=''
   {
      if ($('#respw1').val()!=$('#respw2').val() || $('#respw1').val()=='')
      {
         $('#respw2text').html('Both passwords must be the same and must not be empty');
         return;
      }
   }

   $('#waitimg').show();

   $.post("reset.php", { e: $('#loginEmailPassReset').val(), h: $('#rescode').val(), pw: $('#respw1').val() }, function(res){
         $('#waitimg').hide();
         if (res=='changed')
         {
            $('#loginPass').val('');
            $('#loginEmail').val($('#loginEmailPassReset').val());
            $('#mailpasstext').html('Password has been changed successfully');
            $('#forgotpassform').slideUp(200);
            $('#loginform').slideDown(200,function(){ $('#loginPass').focus(); });
            forgotPassFormClear();
         }
         else if (res=='ok')
         {
            $('#passresettext').parent().addClass("info").removeClass("error");
            $('#passresettext').html('Reset code has been emailed to your address');
            $('#rescoderow').slideDown(200);
            $('#respw1row').slideDown(200);
            $('#respw2row').slideDown(200);
            $('#rescode').val('');
            $('#respw1').val('');
            $('#respw2').val('');
            $('#rescode').focus();
         }
         else
         {
            if (res.match(/user/i)) $('#passresettext').html(res);
            else $('#rescodetext').html(res);
         }
   }).fail(function()
   {
      $('#passresettext').html("Connection error, please try again.");
      $('#waitimg').hide();
   });
}



function signIn()
{
   $('#loginfailtext').html('');
   $('#mailpasstext').html('');
   $('#waitimg').show();

   $.post("login.php?type="+Raphael.type, {email: $('#loginEmail').val(), pass: $('#loginPass').val() }, function(res){
      processFilelist(res);
      if (userIsSigned())
      {
         $('#loginEmail').val("");
         $('#loginPass').val("");
         showMenu(g.lastmenu,false);
         refreshToolbars();
      }
      else
      {
         $('#loginfailtext').html("Wrong email or password, please try again");
      } }).fail(function()
      {
         $('#loginfailtext').html("Connection error, please try again.");
         $('#waitimg').hide();
      });
}

function signOut()
{
   if (offline())
   {
      msg("Logging out offline makes no sense","error");
      return;
   }

   $('#waitimg').show();
   $.post("login.php?type="+Raphael.type, {}, function(res)
   {
      processFilelist(res);
      $('#waitimg').hide();
      loginReset();
      thumbPreview(g.lastpreviewID);
      refreshToolbars();
   }).fail(function(){ $('#waitimg').hide(); });

}

function register()
{
   $('#waitimg').show();
   $('#regfailtext').html('');
   $.post("register.php", { email: $('#regEmail').val(), name: $('#regName').val() }, function(res)
   {
      $('#waitimg').hide();

      if (res=='ok')
      {
         $('#loginPass').val("");
         $('#loginEmail').val($('#regEmail').val());
         $('#regEmail').val("");
         $('#regName').val("");

         $('#mailpasstext').html('Registration successful. Check your email for password');
         $('#regform').slideUp(200);
         $('#loginform').slideDown(200,function(){ $('#loginPass').focus(); });
      }
      else
      {
         $('#regfailtext').html(res);
      }
   }).fail(function()
   {
      $('#regfailtext').html("Connection error, please try again.");
      $('#waitimg').hide();
   });
}