
// initialize (prepare) autocomplete data so it does not need to be made every time again
function init_autocomplete()
{
   g.autocomplete_processed={};

   for (var ix in g.autocomplete)
   {
      var res=[];
      var str,par,i,j,row;
      var list=g.autocomplete[ix];

      for(i=0; i<list.TM.length; i++)
      {
         row=list.TM[i];

         // TM(x,y)_spid
         str="#TM("+row.TYPE+","+row.STYPE+"):"+row.SPID;
         res.push({'display':['#TM('+row.TYPE+','+row.STYPE+')',row.DESCR,row.SPID], "replace":str, "group":"#TM", "title":row.DESCR});

         // HKpar, like ADC_TEMPOH4A or nOfFuncExec_4
         for(j=0; j<row.params.length; j++)
         {
            if (row.params[j].PID!=null)
            {
               par='#HK:'+row.params[j].DESCR;
               res.push({'belongsTo':str,'display':[par,row.params[j].NAME], "replace":par, "group":"#HK", "title":row.params[j].NAME});
            }
         }

         // Find matching #EID ... TM where TYPE=5
         if (row.TYPE==5)
         {
            str='#EID:'+row.DESCR;
            res.push({'display':["#EID("+row.TYPE+","+row.STYPE+")",row.DESCR,row.SPID], "replace":str, "group":"#EID", "title":row.DESCR});
         }
      }

      for(i=0; i<list.TC.length; i++)
      {
         row=list.TC[i];

         // TC(x,y)_cname
         str="#TC("+row.TYPE+","+row.STYPE+"):"+row.CNAME;
         res.push({'display':['#TC('+row.TYPE+','+row.STYPE+')',row.DESCR,row.CNAME], "replace":str, "group":"#TC", "title":row.DESCR});

         // TCPar, such as PAR_PROP_PARAM_STR_LENGT
         for(j=0; j<row.params.length; j++)
         {
            par='#TCPAR:'+row.params[j].DESCR;
            res.push({'belongsTo':str,'display':[par,row.params[j].PNAME], "replace":par, "group":"#TCPAR", "title":row.params[j].PNAME});
         }
      }

      // #FPC diagrams list
      for (i=0; i<g.knownFiles.length; i++)
      {
         str='#FCP:'+g.knownFiles[i].fwdata.globals.fwprop.smName.replace(/ /g,'_');
         res.push({'display':[str,g.knownFiles[i].fwdata.globals.fwprop.smTitle], "replace":str, "group":"#FCP", "title":g.knownFiles[i].fwdata.globals.fwprop.smTitle||g.knownFiles[i].fwdata.globals.fwprop.smName});

         for (j=0; j<g.knownFiles[i].fwdata.globals.fwprop.globalvar.length; j++) if (g.knownFiles[i].fwdata.globals.fwprop.globalvar[j].name)
         {
            par=str+":"+g.knownFiles[i].fwdata.globals.fwprop.globalvar[j].name;
            res.push({'belongsTo':str,'display':[par,g.knownFiles[i].fwdata.globals.fwprop.globalvar[j].name,"="+g.knownFiles[i].fwdata.globals.fwprop.globalvar[j].value], "replace":par, "group":"#FPCPAR", "title":"="+g.knownFiles[i].fwdata.globals.fwprop.globalvar[j].value});
         }
      }

      g.autocomplete_processed[ix]=res;
   }

   init_autocomplete_list();
}


// show or hide tooltip when hovering a text in diagram
function autocompleteTooltip(el,show)
{
   var t=htmlspecialchars($(el.target).data('title')).replace('\n','<br>');
   var tooltip=$('#atooltip');
   tooltip.css({'top':($(el.target).position().top+16)+'px','left':Math.floor($(el.target).position().left+el.target.getBBox().width-20)+'px'});
   tooltip.html(t);
   if (show && !mouseButtonIsDown()) tooltip.show();
   else tooltip.hide();
}


function autocompleteTitle(word)
{
   var res=[];
   var list=g.autocomplete_processed[g.fwprop.autocomplete];
   if (!list) return '';
   for(var i=0; i<list.length; i++) if (list[i].replace==word) res.push(list[i].title);
   return res.filter(function(value,index,self){ return self.indexOf(value) === index}).join("\n");
}


function autocompleteFindMatching(word)
{
   var list=g.autocomplete_processed[g.fwprop.autocomplete];
   if (!list) return [];
   var matching=[];
   for(var i=0; i<list.length; i++) if (list[i].replace.indexOf(word)>=0 || (list[i].belongsTo && list[i].belongsTo.indexOf(word)>=0 )) matching.push(list[i]);
   matching.sort(function(a,b){ if (a.replace.indexOf(word)>=0) return -1; if (b.replace.indexOf(word)>=0) return 1; return 0; })
   return matching;
}


// add actual html/svg code to the tspans to support tooltips
function autocompleteTooltips(tspans)
{
   for (var i=0; i<tspans.length; i++)
   {
      var words=$(tspans[i]).text().split(/\s/);
      for (var j=0; j<words.length; j++) if (words[j]!='')
      {
         var title=autocompleteTitle(words[j]);
         if (title) words[j]="<a data-title=\""+htmlspecialchars(title)+"\">"+words[j]+"</a>";
      }
      $(tspans[i]).html(words.join('&nbsp;').replace(/(&nbsp;)+/g,'&nbsp;'));
   }
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
   if (word.length<2) return;

   // find word position height within the element
   $('#dummyTextarea').remove();
   var dummy=$('<textarea id=dummyTextarea>').attr('class',$(t).attr('class')).css('display','block').width($(t).width()).css('overflow','hidden').height(1);
   dummy.val(text.substr(0,start+len));
   dummy.insertAfter($(t));
   var h=dummy.prop("scrollHeight");
   dummy.remove();

   var matching=autocompleteFindMatching(word);

   // show autocomplete suggestions in a popup
   var html='';
   for(i=0; i<matching.length; i++)
   {
      var td=''; for(j=0; j<matching[i].display.length; j++) td+="<td>"+(matching[i].display[j]||'')+"</td>";
      if (matching[i].belongsTo) { td+="<td>For: "+matching[i].belongsTo+"</td>"; j++; }
      td+='<td></td>'.repeat(Math.max(0,5-j-1));
      html+="<tr data-autocomplete='"+matching[i].replace+"'>"+td+"</tr>";
   }
   pop.html("<table cellspacing=0>"+html+"</table>");

   pop.css('top',$(t).offset().top+h).css('right',$(window).width()-$(t).offset().left-$(t).width()-14);
   pop.css('max-height',($(window).height()-$(t).offset().top-h-20)+'px');
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
