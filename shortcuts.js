
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
}

function textareaRowsUpdate(t)
{
   textareaRowsUpdateOnly(t);
   propUpdate();
   refreshToolbarButtons();
}

