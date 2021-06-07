// called each second
function timer()
{
   if (g.autoload_counter % 360 == 0) load_saved_files_list();
   g.autoload_counter++;
}

$(document).ready(function(){

   init_autocomplete_list();
   setInterval(timer,1000); // refresh list of saved files in 60-second interval
   load_saved_files_list(); // initialize saved files list

   // turn off browser's autocomplete for all input fields
   $('input').each(function(ix,el){ $(el).prop('autocomplete','off'); });

   $('.colorpickerHTML').html(colorPicker());
   $('.colorpickerHTMLdark').html(colorPickerDark());
   $('.colorItem').click(setColor);

   $('#toolbar').mouseenter(function(){ if (mouseButtonIsDown()) toolbarTransparent(); else { toolbarMidi(); toolbarVisible(); }  });
   $('#toolbar tr.menurow').hover(menurowHoverOver,menurowHoverOut);
   $('#desk').mouseenter(function(){ toolbarMin(); });
   $('#toolbar tr.menurow.nomenu').mouseenter(function(){ if (!mouseButtonIsDown()) toolbarMidi(); });

   $('#editbox').mouseenter(function(){ if (mouseButtonIsDown()) editboxTransparent(); else editboxVisible(); });
   $('#editbox').draggable({ handle: "#editboxlabel", drag: function(ev,ui) { editboxVisible(); ui.position=fixEditboxPos(ui.position); } });
   $('#modalwindow').draggable({ handle: "#modalheader", grid: [1,1], drag: function(ev,ui) {} });
   $('#modalqw').draggable();

   $('#savename').keyup(updateSaveFileListByName);

   $('#editboxminimizer').click(function(){ $('#editboxcontent').toggle(); $('#editboxminimizer').toggleClass('icon-minus-sign').toggleClass('icon-plus-sign'); fixEditboxPos(); });

   $(document).bind('contextmenu',function(e){ if (isEditable(e.target) || e.shiftKey) return true; return false; });
   $(document).keyup(function(event){ processGlobalShortcuts(event); });
   $(document).keydown(function(event){ processGlobalShortcuts(event); });

   $('input').keydown(function(ev){ processInputSpecialKeys(ev); });
   $('input').keypress(function(ev){ validateInput(ev,true); });
   $('input').keyup(function(ev){ validateInput(ev,false); });
   $('textarea').click(function(ev){ textareaAutocomplete(ev.target); });
   $('textarea').keyup(function(ev){ textareaRowsUpdate(ev.target); textareaAutocomplete(ev.target); });
   $('textarea').change(function(ev){ textareaRowsUpdate(ev.target); });

   $('input, textarea, select, button').prop("spellcheck",false);
   $('input, textarea, select, button').keyup(propUpdate);
   $('#epropEntry, #epropDo, #epropExit, #epropTrAction, #epropTrGuard, #epropEmbedSM').find("select").change(propSelectChange)
   $('#epropAutocomplete').change(propUpdate);
   $('input').keyup(propUpdate);
   $('#epropEntryAp').change(propUpdate);
   $('#epropDoAp').change(propUpdate);
   $('#epropExitAp').change(propUpdate);
   $('#epropTrGuardAp').change(propUpdate);
   $('#epropTrActionAp').change(propUpdate);

   $('input').mousedown(propSuggest);
   $('input').focus(propSuggest);
   $('.globvartype').change(propUpdate);
   $('#editbox').mousedown(function(ev){ if (!$(ev.target).attr("data-suggest")) propSuggestHide(); } );
   $('#modal').mousedown(function(ev){ if (!$(ev.target).attr("data-suggest")) propSuggestHide(); } );
   $('#suggest').click(propSuggestSelect);

   $(document).mousedown(function(e){ if(e.which===3) g.rightMouseButtonIsDown=true; if(e.which===1) g.leftMouseButtonIsDown=true; vertexHide(e); });
   $(document).mouseup(function(e){ if(e.which===3) g.rightMouseButtonIsDown=false; if(e.which===1) g.leftMouseButtonIsDown=false; fixEditboxPos(); editboxVisible(); toolbarVisible(); vertexHide(e); });

   $('#codegen').mousedown(function(e){ e.preventDefault(); return false; });
   $('#codegen').mouseup(function(e){ e.preventDefault(); return false; });

   $('#alertbox').click(function(){msg();});
   $('#alertbox').mouseover(function(){clearMsgTimeout(true);});
   $('#logoutmousedown').mousedown(function(event){signOut(); event.stopPropagation();});
   $('#loginpromptmenu').mousedown(function(event){signinShow(); event.stopPropagation();});

   $('#presetsmenu').mousedown(function(event){event.stopPropagation(); showMenu("#presets",true);}).mouseup(function(){showMenu(g.lastmenu);});
   $('#filesmenu').mousedown(function(event){event.stopPropagation(); showMenu("#files",true);}).mouseup(function(){showMenu(g.lastmenu);});
   $('#saveasmenu').mousedown(function(event){event.stopPropagation(); showMenu("#saveas",true);}).mouseup(function(){showMenu(g.lastmenu);});
   $('#importmenu').mousedown(function(event){event.stopPropagation(); showMenu("#import",true); idMapEditHide();}).mouseup(function(){showMenu(g.lastmenu);});

   $('#importfile').change(function(){importFileSelected();});
   $('#tagselect').change(function(){g.tagFilter=$(this).val(); updateFileSelections();});
   $('#autocomplete').click(function(ev){ autocomplete_do(ev.target); });

   $(document).on('click','.checkall',selectall);
   $(document).on('click','.projectbox blockquote',projectExpand);

   $('#globvaraddbtn').click(function(){global_variable_add(this);});
   $('#orderqmarkbtn').click(function(){openHelp('options');});
   $('#displayOrder0btn').click(function(){setDisplayOrder(0);});
   $('#displayOrder1btn').click(function(){setDisplayOrder(1);});
   $('#displayInfo0btn').click(function(){setDisplayInfo(0);});
   $('#displayInfo1btn').click(function(){setDisplayInfo(1);});
   $('#displayInfo2btn').click(function(){setDisplayInfo(2);});
   $('#entryacqmark').click(function(){openHelp('actions');});
   $('#doacqmark').click(function(){openHelp('actions');});
   $('#exitacqmark').click(function(){openHelp('actions');});
   $('#guardqmark').click(function(){openHelp('actions');});
   $('#tractionqmark').click(function(){openHelp('actions');});
   $('#embedsmqmark').click(function(){openHelp('embedsaved');});
   $('#opentabbtn').click(function(){open_tab($(this).prev().val());});
   $('#noteconnectbtn').click(function(){historyAdd(); addNoteConnector();});
   $('#toolbartbl').click(function(){propSuggestHide();});
   $('#toolbaropenbutton').click(function(){if (g.lastmenu.match(/code/)) g.lastmenu='#presets'; modalDialog(g.lastmenu); setTimeout(load_saved_files_list,400); });
   $('#toolbarcheckbutton').click(function(){ msg('Not implemented yet'); });
   $('#historybutton').click(function(){historyUndo();});
   $('#selfconnect').click(function(){historyAddPrepare(); selfConnect(); historyAddFinish(); refreshToolbars();});
   $('#deletebutton').click(function(){deleteKeyPressed();});

   $('#addstateI').click(function(){historyAdd(); stateClick(newstate('init',200,270));});
   $('#addstateF').click(function(){historyAdd(); stateClick(newstate('final',202,310));});
   $('#addstateC').click(function(){historyAdd(); stateClick(newstate('choice',200,350));});
   $('#addstateS').click(function(){historyAdd(); stateClick(newstate('state',165,390));});
   $('#addstateN').click(function(){historyAdd(); stateClick(newstate('note',285,390)); addNoteConnector();});
   $('#helpbutton').click(function(){openHelp();});
   $('#modaldestroy').click(function(){modalDestroy();});
   $('#modaldestroybtn').click(function(){modalDestroy();});
   $('#signinbtn').click(function(){signIn();});
   $('#loginbtn').click(function(){loginShow();});
   $('#registerbtn').click(function(){regShow();});
   $('#forgetpasslink').click(function(event){forgotPassFormShow(); event.preventDefault(); return false;});
   $('#backlink').click(function(event){loginReset(); event.preventDefault(); return false;});
   $('#passresetbtn').click(function(){passwordReset();});
   $('#backlinkpwres').click(function(event){passwordFormReset(); event.preventDefault(); return false;});
   $('#registerbtn2').click(function(){register();});
   $('#backlinkreg').click(function(){loginReset();});

   $('#importbutton').click(function(){importFileRun();});
   $('#downloadjsonbtn').click(function(){downloadJSON();});
   $('#downloadsvgbtn').click(function(){downloadSVG();});
   $('#downloadpngbtn').click(function(){downloadPNG();});
   $('#downloadcodestaticbtn').click(function(){downloadCode('static'); });
   $('#downloadcodedynamicbtn').click(function(){downloadCode('dynamic'); });
   $('#printsvgbtn').click(function(){printSVG();});
   $('#savebutton').click(function(){if (!userIsSigned()) signinShow(); else saveAs(false, false);});
   $('#commitbutton').click(function(){if (!userIsSigned()) signinShow(); else saveAs(false, true);});   
   $('#modalq').click(function(){propSuggestHide(); $(this).animate({marginLeft: 10},100,function(){ $(this).css({marginLeft: 0});});});
   $('#modalqw').click(function(event){event.stopPropagation();});
   $('#downloadcodebtn').click(function(){downloadCode();});
   $('#memallocstaticbtn').click(function(){setMemAlloc('static');});
   $('#memallocdynamicbtn').click(function(){setMemAlloc('dynamic');});

   // payment events
   $('#freetrialcontinue').click(function(){$('#payment').hide();});
   $('#chromeloginretry').click(function(){check_payment();});
   $('#buynowbtn').click(function(){ window_open('https://chrome.google.com/webstore/detail/fw-profile-editor/lgdelkgalbcgbedjodnbabmigphgopem','store',true); g.history=[]; chrome.app.window.current().close(); });

   // bind scroll function on mouse wheel movement
   $("#desk").bind('mousewheel DOMMouseScroll', function(e) {paperScroll(e); e.preventDefault(); });

   // ID Map editor. Do not propagate scroll event from idMapEdit textarea
   $('#idMapEditBtn').click(function(){idMapEditShow();});
   $("#idMapEdit").bind('mousewheel DOMMouseScroll', function(e) { e.stopPropagation(); });
   $("#idMapSaveBtn").click(saveIDmapBtnClick);

   // style file input
   $("#importfile").filestyle({input: false, buttonText: "&nbsp;Choose JSON file for import"});

   // set listeners
   if (isChromeApp())
   {
      chrome.storage.onChanged.addListener(message_receive);

      var w=chrome.app.window.current();
      chrome.runtime.getBackgroundPage(function(bgpage)
      {
         // chrome won't let us block window close on unsaved changes. Thus we need to listen
         // for onClosed event and restore the window if current one is closed with unsaved data
         w.onClosed.addListener(function()
         {
            if (isUnsaved())
               bgpage.createWindow(g.internalID,getExportJSON(),g.history);
         });
      });

      // if an chromeAppOnload data structure is propagated to this window through the background page, process it
      // this restores document which was closed with unsaved data and gives the user a chance to save it or discard
      if ('chromeAppOnload' in window)
      {
         restoreFromExport(chromeAppOnload.exportdata);
         g.history=chromeAppOnload.history;
         setInternalID(chromeAppOnload.internalID);
         delete window.chromeAppOnload;
         msg("You have attempted to close an unsaved document. It has been reopened for you. Please save your document or click here to <a href=# id=discard>close anyway</a>.",'error',-1);
         $('#discard').on('click',function(){g.history=[]; w.close();});
         updateTitle();
      }
   }
   else
   {
      $(window).on('storage', message_receive);
      $(window).on('beforeunload', function(){ if (isUnsaved()) return 'Unsaved changes will be lost.'; });
      $(window).on('unload', function()
      {
         window.name='w'; // ensure name reset before document is unloaded
         g.closing=true; // stop messaging on this tab
         all_tabs_refresh();
      });
   }

   $(window).on('hashchange', hash_change);
   hash_change();
});

