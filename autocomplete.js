// show or hide tooltip when hovering a text in diagram
function autocompleteTooltip(el,show)
{
   var t=$(el.target).data('title');
   var tooltip=$('#atooltip');
   tooltip.css({'top':($(el.target).position().top+16)+'px','left':Math.floor($(el.target).position().left+el.target.getBBox().width-20)+'px'});
   tooltip.text(t);
   if (show && !mouseButtonIsDown()) tooltip.show();
   else tooltip.hide();
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


// show table with autocomplete offerings
//
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


// hide autocomplete offerings
function autocompleteHide()
{
   $('#autocomplete').empty().hide();
}


// clicking an entry in autocomplete offerings will put it in the text
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
   autocompleteHide();
}
