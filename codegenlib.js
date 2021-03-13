
   function eName(name,id) // make embed name
   {
      if (!id) return name;
      return "E"+name+id;
   }

   function getIdentifierName(fwprop)
   {
      if (fwprop.type=='final') return editorSwitch("Final State","Final Node");
      if (fwprop.type=='init') return editorSwitch("Initial State","Initial Node");
      return fwprop.identifier;
   }


   // add note to notes
   function FWaddNote(note,label,res)
   {
      note=$.trim(note);
      if (note=='') return;
      res.notes.push(" *");
      res.notes.push(" * <b>"+label+"</b>");
      res.notes.push(" * "+note.replace(/\n/g,"\n * "));
   }


   // create function or code for actions and guards
   // also construct useful comment and add stub if own code is provided
   function FWaddFunction(type,func,code,desc,label,isBool,res)
   {
      var autoname=false;

      if (!isEmpty(desc))
      {
         if (type=='define function' && isEmpty(func)) return ""; // throws an error
         if (type=='call function' && isEmpty(func)) return ""; // throws an error
         if (type=='run code' && isEmpty(code)) return ""; // throws an error
      } else desc='';

      if (isEmpty(func))
      {
         if (type!='run code') return "NULL";
         else if (isEmpty(code)) return "NULL";
         func="code"+Math.floor(Math.random()*100000);
         autoname=true;
      }

      var comment=[];
      comment.push("/**");
      comment.push(" * "+label);
      if (desc)
      {
         if (desc.split("\n").length>1 || desc.length>90)
         {
            comment.push(" * <pre>");
            comment.push(" * "+desc.replace(/\n/g,"\n * "));
            comment.push(" * </pre>");
         }
         else
            comment.push(" * "+desc.replace(/\n/g,"\n * "));
      }
      if (editorSwitch("state machine","procedure")=="state machine")
        comment.push(" * @param smDesc the state machine descriptor");
      else
        comment.push(" * @param prDesc the procedure descriptor");
        
      if (isBool) comment.push(" * @return 1 if the guard is fulfilled, otherwise 0.");
      comment.push(" */");

      if (type=='define function') code=''; // see mail from Alessandro on 1.11.2016
      if (isEmpty(code)) code='';
      code=code.replace(/\n/g,"\n\t").replace(/\s+$/,"");
      if (type=='run code' || type=='define function')
      {
         var stub=(autoname?"static ":"")+(isBool?"Fw"+editorSwitch("Sm","Pr")+"Bool_t":"void")+" "+func+"(Fw"+editorSwitch("Sm","Pr")+"Desc_t "+editorSwitch("sm","pr")+"Desc)";
         var target = code ? res.functions : res.dummycode;

         if (!autoname) // named code
         {
            for (var i=0; i<comment.length; i++) res.stubs.push(comment[i]);
            res.stubs.push(stub+";");
            res.stubs.push("");
            target.push("/* "+label+" */");
         }
         else // unnamed code with auto-generated name
         {
            for (var i=0; i<comment.length; i++) res.functions.push(comment[i]);
         }

         target.push(stub);
         target.push("{\t(void)"+editorSwitch("sm","pr")+"Desc;");
         if (type!='run code') target.push("\tprintf(\"  "+label+"\\n\");");
         if (isBool || code) target.push((isBool?"\t"+(code?code:"return rand()>RAND_MAX/2 ? 1 : 0")+";":(code?"\t"+code+";":"")).replace(/;+$/,";"));
         target.push("}");
         target.push("");
      }

      return "&"+func;
   }


   // find out nested level
   //
   function getParentLevel(state)
   {
      var i=0;
      while (state.parentState) { state=state.parentState; i++; }
      return i;
   }


   // test all connections if they are between objects on the same parent states
   //
   function checkConParentMatch()
   {
      var i;
      for (i=0; i<g.connections.length; i++)
         if (g.connections[i].stateFrom.parentState!=g.connections[i].stateTo.parentState && !stateIsNote(g.connections[i].stateFrom))
            {
               msg("Connection between elements of two different (embedded) state machines is not allowed","error");
               return false;
            }
      return true;
   }


   // build camel case name, replacing all nonalphanum characters
   function camelCase(text)
   {
      text=removeDiacritic(text);
      return text.replace(/(^|\s)\w/g, function(match) {
              return match.toUpperCase();
      }).replace(/[^a-zA-Z0-9]/g,'');
   }


   function now()
   {
      var today = new Date()
      var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months[today.getMonth()]+" "+today.getDate()+" "+today.getFullYear()+" "+today.getHours()+":"+today.getMinutes()+":"+today.getSeconds();
   }

   function isStatic()
   {
      if (g.fwprop.memalloc=='static') return true;
      return false;
   }


   function fileTopCommentPush(filename)
   {
      var res=[];
      res.push("/**");
      res.push(" * @file "+filename);
      res.push(" *");
      res.push(" * @author FW Profile code generator"+(g.currentVersion?" version "+g.currentVersion:""));
      res.push(" * @date Created on: "+now());
      if (!isEmpty(g.fwprop.smNotes))
      {
         res.push(" *");
         res.push(" * "+g.fwprop.smNotes.replace(/\n/g,"\n * "));
      }
      res.push(" */")
      res.push("");
      return res.join("\n")+"\n";
   }


   function codeText(res,t)
   {
      return res[t].join("\n").replace(/\n\n+/g,"\n\n");
   }

   function dlformAppendCode(i,code,name,folder,jsonString,pngData)
   {
      if ($('.dlflags[data-flag="'+folder+'"]').length>0) folder+=' [uniq@'+(i+1)+']';
      dlformAppend(++i,folder);
      $('#dlname'+i).val(name+".h");
      $('#dldata'+i).val(codeText(code,"headers"));
      $('#dlfolder'+i).val(folder);

      dlformAppend(++i);
      $('#dlname'+i).val(name+".c");
      $('#dldata'+i).val(fileTopCommentPush(name+".c")+codeText(code,"core"));
      $('#dlfolder'+i).val(folder);

      dlformAppend(++i);
      $('#dlname'+i).val(name+"Main.c");
      $('#dldata'+i).val(fileTopCommentPush(name+"Main.c")+codeText(code,"main"));
      $('#dlfolder'+i).val(folder);

      dlformAppend(++i);
      $('#dlname'+i).val(name+".json");
      $('#dldata'+i).val(jsonString);
      $('#dlfolder'+i).val(folder);

      dlformAppend(++i);
      $('#dlname'+i).val(name+".png");
      $('#dldata'+i).val(pngData);
      $('#dlfolder'+i).val(folder);
      $('#dldecode'+i).val('true');

      return i;
   }


   function downloadCode(memalloc)
   {
      if (!userIsSigned())
      {
         signinShow();
         return;
      }

      var i=0;
      var j=0;
      var code,fwdata,id,file;

      var all={};
      for (var k=0; k<g.knownFiles.length; k++)
      {
         fwdata=g.knownFiles[k].fwdata;
         id=g.knownFiles[k].id;
         all[id]={'data':fwdata, 'embeds':[]};

         for (var n=0; n<fwdata.states.length; n++)
            if (fwdata.states[n].fwprop.embedSmId>0)
               arrayAddNonempty(all[id].embeds,parseInt(fwdata.states[n].fwprop.embedSmId));
      }

      dlformReset();

      if (memalloc) // only consider selected files if memalloc is set - when it is not then user wants only current diagram
      for (var key in g.selectedFiles)
      {
         code=FWcode(all,all[key].data,key,memalloc);
         if (!code) return; // error on code generator

         file=findFileById(key);
         j=dlformAppendCode(j,code,camelCase(file.name),file.name,file.fwprop,getImagePNGdata($('#thumbimg'+key).get(0)));
         dlformZIPname(file.name); // will be overwritten later if i>1
         i++;
      }

      if (i==1)
      {
         dlformSubmit();
         saveIDmap();
      }
      else if (i>1)
      {
         dlformZIPname("selected_"+i+"_code_folders");
         dlformSubmit();
         saveIDmap();
      }
      else
      {
         var image = new Image;
         image.onload = function()
         {
            code=FWcode();
            if (!code) return; // error on code generator

            dlformAppendCode(1,code,camelCase(g.fwprop.smName),g.fwprop.smName,getExportString(),getImagePNGdata(image))
            dlformZIPname(g.fwprop.smName);
            dlformSubmit();
            saveIDmap();
         }
         image.src = getSVG("image/svg+xml");
      }
   }


   // Include all child state machines (from other documents) and globvar data
   // in global structures g.states, g.connections and g.fwprop
   function extendSMembed(all,currentJSON,id,memalloc)
   {
      var i,j;
      var shift=1;
      var max=1;

      var queue=[{'data':currentJSON,'parent':false}];
      var queued=[id];

      // reset g.*
      g.states=[];
      g.connections=[];
      g.fwprop.globalvar=[];
      g.fwprop.smIncludes="";
      g.fwprop.memalloc=memalloc;
      g.fwprop.editorType=currentJSON.globals.fwprop.editorType;
      g.fwprop.smName=currentJSON.globals.fwprop.smName;

      while (queue.length>0)
      {
         var q=queue.shift();
         var current=q.data;
         var parent=q.parent;

         // first we need to modify IDs of states to ensure unique values across all embedded State Machines
         // we will do this by shifting the values by 'shift' on all states, and increasing the shift for the next run
         for (i=0; i<current.states.length; i++)
         {
            current.states[i].id+=shift;
            current.states[i].attr=function(e){ return this.attrs[e]; }
            max=Math.max(current.states[i].id,max);

            // if our state embeds other diagram file, add it to queue
            var eID=parseInt(current.states[i].fwprop.embedSmId);
            if (eID>0 && eID in all && jQuery.inArray(eID,queued) === -1)
            {
               queue.push({'data':all[eID].data,'parent':current.states[i]});
               queued.push(eID);
            }
         }

         for (i=0; i<current.connections.length; i++)
         {
            current.connections[i].stateFromID+=shift;
            current.connections[i].stateToID+=shift;

            for (j=0; j<current.states.length; j++)
            {
               if (current.connections[i].stateFromID==current.states[j].id) current.connections[i].stateFrom=current.states[j];
               if (current.connections[i].stateToID==current.states[j].id) current.connections[i].stateTo=current.states[j];
            }
         }

         shift=max+1;
         updateParents(current.states,parent);

         for (i=0; i<current.states.length; i++) g.states.push(current.states[i]);
         for (i=0; i<current.connections.length; i++) g.connections.push(current.connections[i]);
         for (i=0; i<current.globals.fwprop.globalvar.length; i++) g.fwprop.globalvar.push(current.globals.fwprop.globalvar[i]);
         if (!isEmpty(current.globals.fwprop.smIncludes)) g.fwprop.smIncludes+="\n"+current.globals.fwprop.smIncludes;
      }

      // remove duplicites from includes and global variables
      g.fwprop.smIncludes=array_unique_unsorted(g.fwprop.smIncludes.split("\n")).join("\n");
      g.fwprop.globalvar=array_unique_unsorted(g.fwprop.globalvar);
   }


   function FWcode(all,currentJSON,id,memalloc)
   {
      var res;

      // Important: g.* is unmodified yet at this moment and contains correct data for current state machine
      if (!all) all=allSmFilesData();
      if (!currentJSON) currentJSON=getExportJSON();
      if (!id) id=parseInt(g.internalID);
      if (!memalloc) memalloc=g.fwprop.memalloc;

      // This is a bit tricky. The entire FW Profile editor was initially written as
      // single-document editor, holding all states and connections in global variables,
      // which are just referrenced and never passed to functions as arguments.
      // Later, when the editor has been enhanced to support multiple tabs
      // and embedded state machines from other saved documents, it was necessary to
      // rewrite code generator (with all supporting functions it uses). This could lead
      // to lots of issues, so I decided to do it the lazy and safe way.

      // So lets backup the global variables which hold real states and connections on the current paper,
      // and then hack on the globals to pretend for a while that all embed states are drawn on the same paper.
      // Thus code generator can remain almost unchanged, still operating on the global states & connections.
      // When done, revert all changes back (restore states&connections from backup). Shhhh, nobody will notice.

      // Backup first
      var backup={};
      backup.states=g.states;
      backup.connections=g.connections;
      backup.fwprop=clone(g.fwprop);

      // Now lets build our superglobal state machine or procedure
      // including all child state machines (from other documents)
      // This touches only g.states, g.connections and g.fwprop
      // and obviously adds no childs for procedures since there are none
      extendSMembed(all,currentJSON,id,memalloc);

      // generate the actual code
      if (editorIsPR()) res=FWcodePR();
      if (editorIsSM()) res=FWcodeSM();

      // Revert back to original values
      g.states=backup.states;
      g.connections=backup.connections;
      g.fwprop=backup.fwprop;

      // if generated result is empty, do nothing
      if (!res) return res;

      // output the resulting code to the user
      $("#codegenHname").text(res.name+".h:");
      $("#codegenHcode").text(codeText(res,"headers"));
      $("#codegenCname").text(res.name+".c:");
      $("#codegenCcode").text(codeText(res,"core"));
      $("#codegenMname").text(res.name+"Main.c:");
      $("#codegenMcode").text(codeText(res,"main"));

      // highlight C code for easier reading
      sh_highlightDocument();
      return res;
   }
