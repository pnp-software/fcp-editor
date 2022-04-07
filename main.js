   // initialize the paper raphael object. Everything is drawn on it.
   var paper = Raphael("desk", $(document).width(), $(document).height());
   paper.globals = {};
   var g=paper.globals; // now g. is a shortcut for paper.globals.

   g.fwprop={};                  // global properties for current desktop
   g.fwprop.globalvar=[];        // user-defined variables
   g.fwprop.editorType='Pr';     // editor type, 'Sm' for state machine, 'Pr' for procedures
   g.fwprop.displayInfo=0;       // auto show descriptions or functions
   g.fwprop.displayOrder=1;      // show order on transitions (non-standard)
   g.states=[];                  // all states array
   g.connections=[];             // all arrows array
   g.selected=[];                // all selected objects (states)
   g.selectedCon=false;          // currently selected transition arrow or empty
   g.statesInside=[];            // all states inside currently selected one
   g.backgroundColor='#eee';     // guess what
   g.bg;                         // holds background element
   g.history=[];                 // undo/redo history
   g.lastmenu='#presets';        // indicates last shown menu item in modal dialog
   g.import='';                  // holds import data for JSON import of saved diagram
   g.internalID=0;               // internal ID of current diagram, used to remember current file's id
   g.lastpreviewID=3;            // id of last preview thumb
   g.knownFiles=[];              // list of known saved files, updated every time when file list is loaded. item={id:, name:}
   g.knownFilesAssoc={};         // associative version of g.knownFiles, holding always the same data. Doesn't use more memory
   g.knownTags=[];               // list of known used tags, updated every time when file list is loaded. Parsed and separated by coma already
   g.triggerIDmap={};            // map of trigger names and IDs, synced to the server
   g.closing=false;              // this tab is not closing. True indicates close has been initiated
   g.zoom=1;                     // zoom
   g.selectedFiles={};           // ids of selected files
   g.tagFilter='';               // string of currently filtered tag in files list
   g.currentVersion=false;       // current version of editor on server
   g.autocomplete={};            // list of autocomplete strings to offer autocomplete in Descriptions

   var loadfunction=function(){} // function which is called for loading document after confirmation
   var otherTabsData={};         // object which holds data received from other tabs, like autosuggest etc
   window.uid=(new Date).getTime()+Math.random();

   // make sure that paper width/height update on window resize
   $(window).resize(function(){ paper.setSize($('#sizer').width(),$('#sizer').height()); refreshBackground(); fixEditboxPos(); propSuggestHide(); modalSetheight(); })

   // preload some images so they are visible right away when needed
   var preload_img = new Image(); preload_img.src='img/signinarrow.png';

   // these are some rendering fixes which are recommended to be applied
   paper.renderfix();
   paper.safari();

   // track if mouse button is pressed down
   g.leftMouseButtonIsDown = false;
   g.rightMouseButtonIsDown = false;

   // remembers shift position of paper (panning by dragging with right mouse button or by mouse wheel scroll)
   g.paperPanX=0;
   g.paperPanY=0;

   // -------------------------------------------
   //
   //   background selector
   //
   // -------------------------------------------

   g.selectionbox=false; // holds selection box

   // initiate background of the same size as paper
   g.bg = paper.rect(0, 0, paper.width, paper.height).attr({"fill": g.backgroundColor, "stroke-width": 0});
   g.bg.id="bg";
   g.bg.drag(bgdragmove, bgdragstart, bgdragend);
   g.bg.dblclick(editboxOn);
   g.bg.mousedown(function(){ if (this.mouseButton==1) deselectAll();});
   g.bg.mousemove(bgmousemove);


   // -------------------------------------------
   //
   //   action elements (connect, delete, move, etc)
   //
   // -------------------------------------------

   g.connector=false; // is empty or holds object which is used to draw new connection (transition)
   g.connectorArrow=false; // is empty or holds the actual connector arrow object
   g.enlarger=false; // is empty or holds element which is dragged to enlarge state size
   g.vertex=false; // is empty or holds element to add or modify vertex within transition path
   g.shifter=false; // is empty or holds element to shift transition arrow

   g.fwprop.memalloc="static"; // default memory allocation
   g.clipboard={}; // holds Ctrl+C data
   g.autoload_counter=1; // is incremented each second, and the list of files (in Open dialog) is refreshed when it reaches 60
   g.load_in_progress=false; // specifies if a connection to server is in progress
   g.last_saved_state=""; // holds export data string of previously saved state
   g.username=""; // username of currently signed in user, is updated after login
   g.userID=0; // id of currently signed in user, is updated after login
   g.autocomplete_timer_id=0; // each autocomplete attempt triggers increase of this value and cancels all previous timers

   historyClear();

   g.last_saved_state=getExportString();
   refreshToolbars();
   all_tabs_ask_for_clipboard();
   check_payment();
