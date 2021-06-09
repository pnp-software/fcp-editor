
function isEditable(t)
{
   if ($(t).is("input")
    || $(t).is("select")
    || $(t).is("textarea")
    || $(t).is("button")) return true;
   return false;
}

//
// global shortcuts handler. Receives events on both keydown and keyup too
//
function processGlobalShortcuts(event)
{
   switch(event.which)
   {
      case 13: // Enter
      propSuggestHide();
      break;

      case 9: // Tab
      if (event.type=='keydown') // ignore tab keyup
         propSuggestHide();
      break;

      case 27: // Esc
      if (event.type=='keydown') // ignore esc keyup
      {
         propSuggestHide();
         if ($('#modalq').is(":visible")) modalqDestroy();
         else modalDestroy();
      }
      break;
   }

   // Most of Global keyboard shortcuts are
   // only processed if focus is not on a form element
   if (isEditable(event.target)) return;

   switch(event.which)
   {
      case 27: // Esc
         msg();
      break;

      case 46: // Del
      deleteKeyPressed();
      break;

      case 65: // Ctrl+A, A
      if (event.ctrlKey) // Ctrl+A only
      {
         deselectAll();
         for(var i=0; i<g.states.length; i++)
            selectObject(g.states[i]);
         refreshToolbars()
      }
      break;

      case 90: // Ctrl+Z, Z
      if (event.ctrlKey) // Ctrl+Z only
      {
         event.preventDefault();
         if (event.type!='keyup') historyUndo();
      }
      break;

      case 67: // Ctrl+C, C
      if (event.ctrlKey) // Ctrl+C only
      {
         event.preventDefault();
         if (event.type!='keyup') controlCopy();
      }
      break;

      case 86: // Ctrl+V, V
      if (event.ctrlKey) // Ctrl+V only
      {
         event.preventDefault();
         if (event.type!='keyup') controlPaste();
      }
      break;

      case 88: // Ctrl+X, X
      if (event.ctrlKey) // Ctrl+V only
      {
         event.preventDefault();
         if (event.type!='keyup')
         {
            controlCopy();
            deleteKeyPressed();
         }
      }
      break;
   }
}


// callback a function if ENTER key is pressed on an INPUT field
function processInputSpecialKeys(ev)
{
   var t=ev.target;
   var key=ev.which;

   var enter=$(t).attr('data-enter');
   if (enter && key==13) eval(enter+"(t)");
}


// on each keypress, keydown and keyup, validate if the key/character
// is allowed on the INPUT element. If not, display error message
// and don't let the user to type that key/char
function validateInput(ev, keyIsChar)
{
   var t=ev.target;
   var char=ev.which;
   var filter=$(t).attr('data-filter');
   if (!filter) return;

   if (filter.match('number')) // we want to allow only numbers
   {
      if (!keyIsChar)
      {
         if ($(t).val().match(/.[-]/)) // fix double minus signs
            $(t).val("-"+$(t).val().replace(/[-]/g,''));

         if ($(t).val().split(/[.,]/).length > 2) // fix double dot
            $(t).val($(t).val().replace(/[.,]/g,'')+'.');
      }

      if (keyIsChar)
      if (char>=32 && (char<48 || char>57) && char!=44 && char!=45 && char!=46)
      {
         msg("Only numbers allowed here","error");
         ev.preventDefault();
         return;
      }
   }

   if (filter.match('noregex'))
   {
      if (char>=32 && char!=44 && keyIsChar)
      if ((char>=33 && char<=47) || (char>=58 && char<=64) || (char>=91 && char<=96) || (char>=123 && char<=127))
      {
         msg("Such character is not valid here","error");
         ev.preventDefault();
         return;
      }
   }

   if (filter.match('funcname') || filter.match('varname'))
   {
      // number must not be first
      if ($(t).val().match(/^[0-9]/) || (keyIsChar && char>=48 && char<=57 && $(t).val()==''))
      {
         msg("Identifier cannot start with a number ","error");
         $(t).val($(t).val().replace(/^[0-9]/g,''));
         ev.preventDefault();
         return;
      }

      // only allow valid characters
      if (char>=32 && keyIsChar)
      if (char<48 || (char>=58 && char<=64) || (char>=91 && char<=94) || char==96 || char>122 )
      {
         msg("Such character is not valid here","error");
         ev.preventDefault();
         return;
      }
   }

   if (char!=13 && char!=16 && (char<32 || keyIsChar)) msg("");

   propUpdate();
   refreshToolbarButtons();
}


// Update textarea rows count according to number of newlines
// in the value.
function textareaRowsUpdateOnly(t)
{
   $(t).attr("rows",Math.max(2, $(t).val().split("\n").length+1) );
   fixEditboxPos();

   // TODO: this is intricate. Sometimes it works sometimes it does not. Lets skip this for now
   /*
   // fix height of the element with long lines
   // needs to be called after other rendering is complete
   setTimeout(function(){
      var scroll=$('#editboxscrollablearea').scrollTop();
      var origHeight=$(t).height();
      if (origHeight==0) return;
      $(t).height(1);
      var scrollHeight=$(t).prop("scrollHeight");
      if (scrollHeight) $(t).height(Math.max(30,scrollHeight-8)+10);
      else $(t).height(origHeight);
      $('#editboxscrollablearea').scrollTop(scroll);

   },10);
   */
}

function textareaRowsUpdate(t)
{
   textareaRowsUpdateOnly(t);
   propUpdate();
   refreshToolbarButtons();
}


function findMatching(word)
{
   // get list of current autocomplete strings
   var list=g.autocomplete[g.fwprop.autocomplete];
   if (!list || list.length==0) return [];

   var matching=[];
   var txt,i,j,row;

   for(i=0; i<list.TM.length; i++)
   {
      row=list.TM[i];

      // TM(x,y)_spid
      txt="#TM("+row.TYPE+","+row.STYPE+")_"+row.SPID;
      if (txt.indexOf(word)>=0) matching.push({'display':['TM('+row.TYPE+','+row.STYPE+')',row.DESCR,row.SPID], "replace":txt, "group":"#TM", "title":row.DESCR});

      // HKpar, like ADC_TEMPOH4A or nOfFuncExec_4
      for(j=0; j<row.params.length; j++)
      {
         if (row.params[j].PID!=null)
         {
            txt=row.params[j].DESCR;
            if (txt.indexOf(word)>=0) matching.push({'display':[row.params[j].NAME,row.params[j].DESCR], "replace":txt, "group":"#HK", "title":row.params[j].NAME}); // TODO: TMPAR?
         }
      }

      // Find matching #EID ... TM where TYPE=5
      if (row.TYPE==5)
      {
         txt=row.DESCR;
         if (txt.indexOf(word)>=0 || "#EID".indexOf(word)>=0) matching.push({'display':["EID("+row.TYPE+","+row.STYPE+")",row.DESCR,row.SPID], "replace":txt, "group":"#EID", "title":row.DESCR});
      }
   }

   for(i=0; i<list.TC.length; i++)
   {
      row=list.TC[i];

      // TC(x,y)_cname
      txt="#TC("+row.TYPE+","+row.STYPE+")_"+row.CNAME;
      if (txt.indexOf(word)>=0) matching.push({'display':['TC('+row.TYPE+','+row.STYPE+')',row.DESCR,row.CNAME], "replace":txt, "group":"#TC", "title":row.DESCR});

      // TCPar, such as PAR_PROP_PARAM_STR_LENGT
      for(j=0; j<row.params.length; j++)
      {
         txt=row.params[j].DESCR;
         if (txt.indexOf(word)>=0) matching.push({'display':[row.params[j].PNAME,row.params[j].DESCR], "replace":txt, "group":"#TCPar", "title":row.params[j].PNAME}); // TODO: TCPAR
      }
   }

   // TODO Find matching #FPC

   return matching;
}


function textareaAutocomplete(t)
{
   var pop=$('#autocomplete');
   pop.data('targetElement',t);
   pop.empty().hide();

   var start=$(t).prop("selectionStart");
   pop.data('targetCursorPos',start);

   // get crrent word before cursor
   var text=$(t).val();
   while(start>0 && !text.substr(start-1,1).match(/\s/)) start--; // find word start
   pop.data('targetPositionStart',start);

   // trim current word to first whitespace
   var word=text.substr(start);
   var len=0;
   while(len<word.length && !word.substr(len,1).match(/\s/)) len++; // find word length
   word=$.trim(word.substr(0,len));
   pop.data('targetPositionLength',len);
   if (word=='') return;

   // find word position height within the element
   $('#dummyTextarea').remove();
   var dummy=$('<textarea id=dummyTextarea>').attr('class',$(t).attr('class')).css('display','block').width($(t).width()).css('overflow','hidden').height(1);
   dummy.val(text.substr(0,start+len));
   dummy.insertAfter($(t));
   var h=dummy.prop("scrollHeight");
   dummy.remove();

   var matching=findMatching(word);

   // show autocomplete suggestions in a popup
   var html='';
   for(i=0; i<matching.length; i++)
   {
      var td='<td>'+matching[i].group+'</td>'; for(j=0; j<matching[i].display.length; j++) td+="<td>"+matching[i].display[j]+"</td>";
      td+='<td></td>'.repeat(4-j-1);
      html+="<tr data-autocomplete='"+matching[i].replace+"'>"+td+"</tr>";
   }
   pop.html("<table cellspacing=0>"+html+"</table>");

   pop.css('top',$(t).offset().top+h).css('right',$(window).width()-$(t).offset().left-$(t).width()-14);
   if (matching.length>0) pop.show(); else autocompleteHide();
}



function autocompleteHide()
{
   $('#autocomplete').empty().hide();
}


function autocomplete_do(r)
{
   var pop=$('#autocomplete');
   var t=pop.data('targetElement');
   var start=pop.data('targetPositionStart');
   var len=pop.data('targetPositionLength');
   var cur=pop.data('targetCursorPos');
   var nword=$(r).closest('tr').data('autocomplete');
   if (!nword) return;
   var txt=$(t).val();

   $(t).val(txt.substr(0,start)+nword+ txt.substr(start+len));
   $(t).focus().prop('selectionEnd',cur-len+nword.length);
   $(t).keyup();
   autocompleteHide()
}
