
// ===============================================
// autocomplete checks
// ===============================================

function find_unique_scos_references(obj)
{
   return array_unique(object_strings(obj,'#(TC[(]|TM[(]|HK:|EID[(]|TMPAR:|TCPAR:)[^\\s]+'));
}


function invalid_scos_references(list,scos)
{
   if (typeof scos == "undefined") scos=g.autocomplete_processed[g.fwprop.autocomplete];
   var invalid=[];
   var i,j;

   for (var i=0; i<list.length; i++)
   {
      var found=0;
      for (j=0; j<scos.length; j++)
         if (scos[j].replace==list[i])
            { found=1; break; }
      if (found==0) invalid.push(list[i]);
   }

   return invalid;
}


function isBelonging(ref,toRef)
{
   var scos=g.autocomplete_processed[g.fwprop.autocomplete];
   for(var i=0; i<scos.length; i++) if (scos[i].replace==ref && scos[i].belongsTo==toRef) return true;
   return false;
}


// ===============================================
// (tools) checks for compatibility
// ===============================================

function checkSCOSbtnClick()
{
   var i,j,k;
   var html='';
   var tgt=$('#checkSCOSsel').val();
   var target=g.autocomplete_processed[tgt];
   $('#checkSCOSlist').html('');
   if (typeof target == "undefined") return;

   // go thru all files
   for (i=0; i<g.knownFiles.length; i++)
   {
      var res=find_unique_scos_references(g.knownFiles[i].fwdata);
      if (res.length==0) continue;

      var invalid=invalid_scos_references(res,target);
      if (invalid.length>0) html+='<li>'+g.knownFiles[i].name+(g.knownFiles[i].id!=g.internalID?' - <span class=loadnewwindow data-loaddocumentid='+g.knownFiles[i].id+'>edit</span>':'')+'</li>';
   }

   if (html=='') $('#checkSCOSlist').html("All saved documents seem to be compatible with the selected SCOS database "+tgt);
   else $('#checkSCOSlist').html("The following documents contain some SCOS References which are not valid in the selected database "+tgt+":<br>"+html);
}


// ===============================================
// (left toolbar) check for rules
// ===============================================

function toolbarCheck()
{
   var errmsg='';
   var errs=[];
   var i,j,k;
   var res={};
   var result=[];
   var curr,invalid,tc,tm,hk,eid,first,others;


   // -------------------------------=
   // Test Rule 1
   // -------------------------------=

   res.errmsg='Rule 1: All references to SCOS items in the text fields of the model (i.e. '+
              'all strings starting with: "#TC(...", or "#TM(,...", or "#HK:...", '+
              'or "#EID:...", or "TMPAR:...", or "TCPAR:...") must be valid with '+
              'respect to the SCOS database selected for the model';

   var curr=find_unique_scos_references(g.fwprop);
   var invalid=invalid_scos_references(curr);
   if (invalid.length>0) errs.push("<li>Global properties:</li>"+invalid.join("<br>"));

   for (i=0; i<g.connections.length; i++)
   {
      var curr=find_unique_scos_references(g.connections[i].fwprop);
      var invalid=invalid_scos_references(curr);
      if (invalid.length>0) errs.push("<li>Guard connection"
                 +(g.connections[i].stateFrom.fwprop.identifier?" from "+g.connections[i].stateFrom.fwprop.identifier:"")
                 +(g.connections[i].stateTo.fwprop.identifier?" to "+g.connections[i].stateTo.fwprop.identifier:"")
                 +":</li>"+invalid.join("<br>"));
   }

   for (i=0; i<g.states.length; i++)
   {
      curr=find_unique_scos_references(g.states[i].fwprop);
      invalid=invalid_scos_references(curr);
      if (invalid.length>0) errs.push("<li>Action Node "+(g.states[i].fwprop.identifier || '')+":</li>"+invalid.join("<br>"));
   }

   if (errs.length>0) { res.errs=errs; result.push(res); res={}; errs=[]; }


   // now we know that all references are valid
   // so we can assume just that

/*
   // -------------------------------=
   // Test Rule 2
   // -------------------------------=

   res.errmsg='Rule 2: It is not legal for the Action Description of a node to contain '+
              'more than one reference to a telecommand "TC(..."';

   for (i=0; i<g.states.length; i++)
   {
      curr=find_unique_scos_references(g.states[i].fwprop.entryDesc);
      tc=curr.filter(function(el){ return el.match(/^#TC[(]/); });
      if (tc.length>1) errs.push("<li>Action Node "+(g.states[i].fwprop.identifier || '')+":</li>"+tc.join("<br>"));
   }

   if (errs.length>0) { res.errs=errs; result.push(res); res={}; errs=[]; }
*/

   // -------------------------------=
   // Test Rule 3
   // -------------------------------=

   res.errmsg='Rule 3: If the Action Description of a node contains a reference to a '+
              'telecommand "TC(...", it cannot contain references to any other '+
              'SCOS elements';

   for (i=0; i<g.states.length; i++)
   {
      curr=find_unique_scos_references(g.states[i].fwprop.entryDesc);
      tc=curr.filter(function(el){ return el.match(/^#TC[(]/); });
      if (tc.length>0)
      {
         first=tc.shift(); // get first
         others=curr.filter(function(el){ return el!=first; });
         if (others.length>0) errs.push("<li>Action Node "+(g.states[i].fwprop.identifier || '')+":</li>"+others.join("<br>"));
      }
   }

   if (errs.length>0) { res.errs=errs; result.push(res); res={}; errs=[]; }


   // -------------------------------=
   // Test Rule 4
   // -------------------------------=

   res.errmsg='Rule 4: If the Action Descriotion of a node contains a reference to a '+
              'telecommand "TC(...", then the Notes field attached to that node can '+
              'only contain #TCPAR references which belong to that telecommand.';

   for (i=0; i<g.states.length; i++)
   {
      curr=find_unique_scos_references(g.states[i].fwprop.entryDesc);
      tc=curr.filter(function(el){ return el.match(/^#TC[(]/); });
      if (tc.length>0)
      {
         first=tc.shift(); // get first
         curr=find_unique_scos_references(g.states[i].fwprop.note);
         invalid=curr.filter(function(el){ return !isBelonging(el,first); });
         if (invalid.length>0) errs.push("<li>Action Node "+(g.states[i].fwprop.identifier || '')
               +":</li>"+first+"<br>does not recognize following parameters:</li>"+invalid.join("<br>"));
      }
   }

   if (errs.length>0) { res.errs=errs; result.push(res); res={}; errs=[]; }


   // -------------------------------=
   // Test Rule 5
   // -------------------------------=

   res.errmsg='Rule 5: It is not legal for the Guard Description of a control flow to hold '+
              'a reference to a telecommand "#TC..."';

   for (i=0; i<g.connections.length; i++)
   {
      curr=find_unique_scos_references(g.connections[i].fwprop.guardDesc);
      tc=curr.filter(function(el){ return el.match(/^#TC[(]/); });
      if (tc.length>0) errs.push("<li>Guard connection"
                 +(g.connections[i].stateFrom.fwprop.identifier?" from "+g.connections[i].stateFrom.fwprop.identifier:"")
                 +(g.connections[i].stateTo.fwprop.identifier?" to "+g.connections[i].stateTo.fwprop.identifier:"")
                 +":</li>"+tc.join("<br>"));
   }

   if (errs.length>0) { res.errs=errs; result.push(res); res={}; errs=[]; }

/*
   // -------------------------------=
   // Test Rule 6
   // -------------------------------=

   res.errmsg='Rule 6: It is not legal for the Action Description or the Guard Description '+
              'to contain more than one Event Packet reference "#EID(..."';

   for (i=0; i<g.states.length; i++)
   {
      curr=find_unique_scos_references(g.states[i].fwprop.entryDesc);
      eid=curr.filter(function(el){ return el.match(/^#EID[(]/); });
      if (eid.length>1) errs.push("<li>Action Node "+(g.states[i].fwprop.identifier || '')+":</li>"+eid.join("<br>"));
   }

   for (i=0; i<g.connections.length; i++)
   {
      curr=find_unique_scos_references(g.connections[i].fwprop.guardDesc);
      eid=curr.filter(function(el){ return el.match(/^#EID[(]/); });
      if (eid.length>1) errs.push("<li>Guard connection"
                 +(g.connections[i].stateFrom.fwprop.identifier?" from "+g.connections[i].stateFrom.fwprop.identifier:"")
                 +(g.connections[i].stateTo.fwprop.identifier?" to "+g.connections[i].stateTo.fwprop.identifier:"")
                 +":</li>"+eid.join("<br>"));


   }

   if (errs.length>0) { res.errs=errs; result.push(res); res={}; errs=[]; }
*/

   // -------------------------------=
   // Test Rule 7
   // -------------------------------=

   res.errmsg='Rule 7: If an Action Description or a Guard Description contains a '+
              'reference to an Event Packet "#EID:...", then it cannot hold any other '+
              'SCOS reference';

   for (i=0; i<g.states.length; i++)
   {
      curr=find_unique_scos_references(g.states[i].fwprop.entryDesc);
      eid=curr.filter(function(el){ return el.match(/^#EID[(]/); });
      if (eid.length>0)
      {
         first=eid.shift(); // get first
         others=curr.filter(function(el){ return el!=first; });
         if (others.length>0) errs.push("<li>Action Node "+(g.states[i].fwprop.identifier || '')+":</li>"+others.join("<br>"));
      }
   }

   for (i=0; i<g.connections.length; i++)
   {
      curr=find_unique_scos_references(g.connections[i].fwprop.guardDesc);
      eid=curr.filter(function(el){ return el.match(/^#EID[(]/); });
      if (eid.length>0)
      {
         first=eid.shift(); // get first
         others=curr.filter(function(el){ return el!=first; });
         if (others.length>0) errs.push("<li>Guard connection"
                 +(g.connections[i].stateFrom.fwprop.identifier?" from "+g.connections[i].stateFrom.fwprop.identifier:"")
                 +(g.connections[i].stateTo.fwprop.identifier?" to "+g.connections[i].stateTo.fwprop.identifier:"")
                 +":</li>"+others.join("<br>"));
      }
   }

   if (errs.length>0) { res.errs=errs; result.push(res); res={}; errs=[]; }


   // -------------------------------=
   // Test Rule 8
   // -------------------------------=

   res.errmsg='Rule 8: If an Action Description or a Guard Description contains a '+
              'reference to one or more housekeeping parameters "#HK:...", then the '+
              'only other SCOS reference it may contain is one telemetry packet '+
              'reference "TM(..." and that packet must contain all the referenced HK '+
              'parameters. Note that a housekeeping parameter may be contained in '+
              'several telemetry packets.';

   for (i=0; i<g.states.length; i++)
   {
      curr=find_unique_scos_references(g.states[i].fwprop.entryDesc);
      hk=curr.filter(function(el){ return el.match(/^#HK:/); });
      for (j=0; j<hk.length; j++)
      {
         others=curr.filter(function(el){ return !el.match(/^#HK:/); });
         tm=others.filter(function(el){ return el.match(/^#TM[(]/); });
         nontm=others.filter(function(el){ return !el.match(/^#TM[(]/); });
         if (nontm.length>0) errs.push("<li>Action Node "+(g.states[i].fwprop.identifier || '')+":</li>"+nontm.join("<br>"));
         for (k=0; k<tm.length; k++) if (!isBelonging(hk[j],tm[k])) errs.push("<li>Action Node "+(g.states[i].fwprop.identifier || '')
                +":</li>"+hk[j]+" does not belong to "+tm[k]);
      }
   }

   for (i=0; i<g.connections.length; i++)
   {
      curr=find_unique_scos_references(g.states[i].fwprop.guardDesc);
      hk=curr.filter(function(el){ return el.match(/^#HK:/); });
      for (j=0; j<hk.length; j++)
      {
         others=curr.filter(function(el){ return !el.match(/^#HK:/); });
         tm=others.filter(function(el){ return el.match(/^#TM[(]/); });
         nontm=others.filter(function(el){ return !el.match(/^#TM[(]/); });

         if (nontm.length>0) errs.push("<li>Guard connection"
                 +(g.connections[i].stateFrom.fwprop.identifier?" from "+g.connections[i].stateFrom.fwprop.identifier:"")
                 +(g.connections[i].stateTo.fwprop.identifier?" to "+g.connections[i].stateTo.fwprop.identifier:"")
                 +":</li>"+nontm.join("<br>"));

         for (k=0; k<tm.length; k++) if (!isBelonging(hk[j],tm[k])) errs.push("<li>Guard connection"
                 +(g.connections[i].stateFrom.fwprop.identifier?" from "+g.connections[i].stateFrom.fwprop.identifier:"")
                 +(g.connections[i].stateTo.fwprop.identifier?" to "+g.connections[i].stateTo.fwprop.identifier:"")
                 +":</li>"+hk[j]+" does not belong to "+tm[k]);
      }
   }

   if (errs.length>0) { res.errs=errs; result.push(res); res={}; errs=[]; }

   if (result.length==0)
   {
      msg('No rule violations found','ok');
      return [];
   }

   var output=[];
   for (i=0; i<result.length; i++)
   {
      output.push(result[i].errmsg+'<br><br>'+result[i].errs.join("<br><br>"));
   }
   msg(output.join("<br><hr>"),'error');
   return result;
}
