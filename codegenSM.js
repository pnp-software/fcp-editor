   // -
   // traverse all objects which share the same parent
   // -
   function traverseSM(parent,id,res)
   {
      var i, def=[], defsort=[], cr=[], tr=[], con=[];
      var actions=[], guards=[];
      var cnt={transitions:0, states:0, choices:0};
      var doAction, entryAction, endAction, trAction, trGuard;
      var smDesc=eName("smDesc",id);
      var trCheckEmpty;

      for (i=0; i<g.states.length; i++)
      if (g.states[i].parentState==parent)
      {
         if (!stateIsNote(g.states[i]))
            FWaddNote(g.states[i].fwprop.note,"Note for state "+getIdentifierName(g.states[i].fwprop),res);

         if (g.states[i].fwprop.type=='state')
         {
            cnt.states++;
            defsort.push("#define "+res.name+"_"+g.states[i].fwprop.identifier+" ({{cnt}})\t\t/**< The identifier of state "+g.states[i].fwprop.identifier+" in State Machine "+res.name+" */");
            def.push("\tconst FwSmCounterU2_t N_OUT_OF_"+g.states[i].fwprop.identifier+" = "+countOutgoingTransitions(g.states[i])+";\t/* The number of transitions out of state "+g.states[i].fwprop.identifier+" */");

            // if state name is not specified, stop here
            if (isEmpty(g.states[i].fwprop.identifier))
            {
               msg("Empty State Identifier is not allowed","error");
               return false;
            }

            // if state name is not unique, stop here
            if (countStatesByName(g.states[i].fwprop.identifier)>1)
            {
               msg("Duplicate state name '"+g.states[i].fwprop.identifier+"'","error");
               return false;
            }

            entryAction=FWaddFunction(g.states[i].fwprop.entryType, g.states[i].fwprop.entryFunc, g.states[i].fwprop.entryCode, g.states[i].fwprop.entryDesc, "Entry Action for the state "+getIdentifierName(g.states[i].fwprop)+".", false, res);
            exitAction=FWaddFunction(g.states[i].fwprop.exitType, g.states[i].fwprop.exitFunc, g.states[i].fwprop.exitCode, g.states[i].fwprop.exitDesc, "Exit Action for the state "+getIdentifierName(g.states[i].fwprop)+".", false, res);
            doAction=FWaddFunction(g.states[i].fwprop.doType, g.states[i].fwprop.doFunc, g.states[i].fwprop.doCode, g.states[i].fwprop.doDesc, "Do Action for the state "+getIdentifierName(g.states[i].fwprop)+".", false, res);
            if (entryAction=='' || exitAction=='' || doAction=='')
            {
               msg(g.states[i].fwprop.identifier+": "+(!entryAction?"Entry":(!exitAction?"Exit":"Do"))+" Action has description,<br>but no function or code defined","error",20);
               return false;
            }

            cr.push("\tFwSmAddState("+(isStatic()?"&":"")+smDesc+", "
                +res.name+"_"+g.states[i].fwprop.identifier+", "
                +"N_OUT_OF_"+g.states[i].fwprop.identifier+", "
                +entryAction+", "+exitAction+", "+doAction+", "
                +(g.states[i].smdescID==""?"NULL":(isStatic()?"&":"")+eName("smDesc",g.states[i].smdescID))+");");

            if (entryAction!="NULL") arrayAddNonempty(actions,entryAction);
            if (exitAction!="NULL") arrayAddNonempty(actions,exitAction);
            if (doAction!="NULL") arrayAddNonempty(actions,doAction);
         }

         if (g.states[i].fwprop.type=='choice')
         {
            // if choice name is not specified, stop here
            if (isEmpty(g.states[i].fwprop.identifier))
            {
               msg("Empty Choice Identifier is not allowed","error");
               return false;
            }

            cnt.choices++;
            def.push("\tconst FwSmCounterU2_t "+g.states[i].fwprop.identifier+" = "+(cnt.choices)+";\t\t/* The identifier of choice pseudo-state "+g.states[i].fwprop.identifier+" in State Machine "+res.name+" */");
            def.push("\tconst FwSmCounterU2_t N_OUT_OF_"+g.states[i].fwprop.identifier+" = "+countOutgoingTransitions(g.states[i])+";\t/* The number of transitions out of the choice-pseudo state "+g.states[i].fwprop.identifier+" */");
            cr.push("\tFwSmAddChoicePseudoState("+(isStatic()?"&":"")+smDesc+", "+g.states[i].fwprop.identifier+", N_OUT_OF_"+g.states[i].fwprop.identifier+");");
         }
      }

      // sort defines by name and add numeric values
      defsort=defsort.sort(function(a,b){return naturalSort(a,b);});
      for (i=0; i<defsort.length; i++) defsort[i]=defsort[i].replace(/{{cnt}}/,i+1);
      res.defines=res.defines.concat(defsort);

      // get all connections we care about
      for (i=0; i<g.connections.length; i++)
         if (g.connections[i].stateFrom.parentState==parent)
            con.push(g.connections[i]);

      // sort them by state and order number so it is nice
      con.sort(function(a,b){ return (a.stateFrom.id!=b.stateFrom.id) ? a.stateFrom.id-b.stateFrom.id : a.fwprop.order-b.fwprop.order});

      // process all connections (transitions) in the order
      for(i=0; i<con.length; i++)
      {
         if (stateIsNote(con[i].stateFrom)) continue;
         cnt.transitions++;

         FWaddNote(con[i].fwprop.note,"Note for Transition from "+getIdentifierName(con[i].stateFrom.fwprop)+" to "+getIdentifierName(con[i].stateTo.fwprop),res);
         trAction=FWaddFunction(con[i].fwprop.actionType, con[i].fwprop.actionFunc, con[i].fwprop.actionCode, con[i].fwprop.actionDesc, "Action on the transition from "+getIdentifierName(con[i].stateFrom.fwprop)+" to "+getIdentifierName(con[i].stateTo.fwprop)+".", false, res);
         trGuard=FWaddFunction(con[i].fwprop.guardType, con[i].fwprop.guardFunc, con[i].fwprop.guardCode, con[i].fwprop.guardDesc, "Guard on the transition from "+getIdentifierName(con[i].stateFrom.fwprop)+" to "+getIdentifierName(con[i].stateTo.fwprop)+".", true, res);
         if (trAction=="" || trGuard=="")
         {
            // we will assume here that empty FROM is init state, and empty TO is final state.
            // This could produce wrong error message if a state doesn't have identifier, but this is invalid at all so we don't care
            msg((!trAction?"Action":"Guard")+" has description, but no function or code<br>defined on transition from "+getIdentifierName(con[i].stateFrom.fwprop)+" to "+getIdentifierName(con[i].stateTo.fwprop),"error",20);
            return false;
         }

         if (trAction!="NULL") arrayAddNonempty(actions,trAction);
         if (trGuard!="NULL") arrayAddNonempty(guards,trGuard);

         // configure transitions
         trCheckEmpty=false;
         if (con[i].stateFrom.fwprop.type=='init' && con[i].stateTo.fwprop.type=='state') tr.push("\tFwSmAddTransIpsToSta("+(isStatic()?"&":"")+smDesc+", "+res.name+"_"+con[i].stateTo.fwprop.identifier+", "+trAction+");");
         if (con[i].stateFrom.fwprop.type=='init' && con[i].stateTo.fwprop.type=='choice') tr.push("\tFwSmAddTransIpsToCps("+(isStatic()?"&":"")+smDesc+", "+con[i].stateTo.fwprop.identifier+", "+trAction+");");
         if (con[i].stateFrom.fwprop.type=='state' && con[i].stateTo.fwprop.type=='choice') { trCheckEmpty=true; tr.push("\tFwSmAddTransStaToCps("+(isStatic()?"&":"")+smDesc+", "+con[i].fwprop.identifier+", "+res.name+"_"+con[i].stateFrom.fwprop.identifier+", "+con[i].stateTo.fwprop.identifier+", "+trAction+", "+trGuard+");"); }
         if (con[i].stateFrom.fwprop.type=='state' && con[i].stateTo.fwprop.type=='state') { trCheckEmpty=true; tr.push("\tFwSmAddTransStaToSta("+(isStatic()?"&":"")+smDesc+", "+con[i].fwprop.identifier+", "+res.name+"_"+con[i].stateFrom.fwprop.identifier+", "+res.name+"_"+con[i].stateTo.fwprop.identifier+", "+trAction+", "+trGuard+");"); }
         if (con[i].stateFrom.fwprop.type=='choice' && con[i].stateTo.fwprop.type=='state') tr.push("\tFwSmAddTransCpsToSta("+(isStatic()?"&":"")+smDesc+", "+con[i].stateFrom.fwprop.identifier+", "+res.name+"_"+con[i].stateTo.fwprop.identifier+", "+trAction+", "+trGuard+");");
         if (con[i].stateFrom.fwprop.type=='state' && con[i].stateTo.fwprop.type=='final') { trCheckEmpty=true; tr.push("\tFwSmAddTransStaToFps("+(isStatic()?"&":"")+smDesc+", "+con[i].fwprop.identifier+", "+res.name+"_"+con[i].stateFrom.fwprop.identifier+", "+trAction+", "+trGuard+");"); }
         if (con[i].stateFrom.fwprop.type=='choice' && con[i].stateTo.fwprop.type=='final') tr.push("\tFwSmAddTransCpsToFps("+(isStatic()?"&":"")+smDesc+", "+con[i].stateFrom.fwprop.identifier+", "+trAction+", "+trGuard+");");
         if (trCheckEmpty && isEmpty(con[i].fwprop.identifier))
         {
            msg("Trigger identifier cannot be empty:<br> "+con[i].stateFrom.fwprop.identifier+" -&gt; "+con[i].stateTo.fwprop.identifier,"error");
            return false;
         }
      }

      res.create=res.create.concat(def);
      res.create.push("");

      var params="\t\t"+cnt.states+",\t/* NSTATES - The number of states */\n"+
                 "\t\t"+cnt.choices+",\t/* NCPS - The number of choice pseudo-states */\n"+
                 "\t\t"+cnt.transitions+",\t/* NTRANS - The number of transitions */\n"+
                 "\t\t"+actions.length+",\t/* NACTIONS - The number of state and transition actions */\n"+
                 "\t\t"+guards.length+"\t/* NGUARDS - The number of transition guards */\n";

      var embinfo=(parent?', which is embedded in '+parent.fwprop.identifier:'');
      res.create.push("\t/** Create state machine "+smDesc+embinfo+" */");
      if (isStatic())
      {
         res.create.push("\tFW_SM_INST("+smDesc+",\n"+params+"\t);");
         res.create.push("\tFwSmInit(&"+smDesc+");");
      }
      else
      {
         res.create.push("\tFwSmDesc_t "+smDesc+" = FwSmCreate(\n"+params+"\t);");
      }

      res.create.push("");
      res.create.push("\t/** Configure the state machine "+smDesc+embinfo+" */");
      res.create.push("\tFwSmSetData("+(isStatic()?"&":"")+smDesc+", smData);");
      res.create=res.create.concat(cr);
      res.create=res.create.concat(tr);
      res.create.push("");
      return true;
   }


   // --------------------------------------------
   // generate FW Profile C code for state machine
   // --------------------------------------------

   function FWcodeSM()
   {
      var res={headers:[], defines:[], stubs:[], core:[], main:[], create:[], functions:[], dummycode:[], notes:[], name:""};
      var i,n;
      var initcount=0, init=false;
      var inits=[];
      var glob=[];
      var triggers=listTriggers();

      res.name=camelCase(g.fwprop.smName);
      if (res.name=='') { msg("Please specify state machine name in Global Properties","error"); return false; }

      if (!checkConParentMatch()) return false;

      for (i=0; i<g.states.length; i++)
      {
         g.states[i].eInit=false;
         g.states[i].smdescID=(g.states[i].fwprop.embedSmId>0?"Id"+g.states[i].fwprop.embedSmId:"");
      }

      // Find out main init state
      // Calculate how many main init states is out there in total (more than 1 is error)
      // Find out embedded inits
      for (i=0; i<g.states.length; i++)
      {
         if (g.states[i].fwprop.type=='init')
         {
            if (!g.states[i].parentState) // our init is main one (not nested anywhere)
            {
                initcount++;
                inits.push({"state":g.states[i], "level": 0});
            }
            else // this init has parent state. Propagate init there
            {
               // if the parent already holds some other init, that's an error
               if (g.states[i].parentState.eInit)
               {
                  msg("State "+g.states[i].parentState.fwprop.identifier+" holds more than one embedded init states, that's not allowed","error");
                  return false;
               }
               g.states[i].parentState.eInit=g.states[i];
               inits.push({"state": g.states[i], "level": getParentLevel(g.states[i])});
            }
         }
      }

      if (initcount==0) { msg("Couldn't find initial state. Please add one.","error"); return false; }
      if (initcount>1) { msg("Found more than one non-embed initial states. There has to be only one.","error"); return false; }


      // ------------------------------------------------------------------------------------------------------------------------------------
      // make code file .c
      // ------------------------------------------------------------------------------------------------------------------------------------

      res.core.push("/* "+res.name+" function definitions */");
      res.core.push("#include \""+res.name+".h\"");
      res.core.push("");
      res.core.push("/* FW Profile function definitions */");
      res.core.push("#include \"FwSm"+(isStatic()?"S":"D")+"Create.h\"");
      res.core.push("#include \"FwSmConfig.h\"");
      res.core.push("");
      res.core.push("#include <stdlib.h>");
      res.core.push("");

      // GLOBAL vars
      for (i=0; i<g.fwprop.globalvar.length; i++)
         if (g.fwprop.globalvar[i].name!='' && g.fwprop.globalvar[i].value!='')
            glob.push("static "+g.fwprop.globalvar[i].type.replace(/^u/,"unsigned ")+" "+g.fwprop.globalvar[i].name+" = "+g.fwprop.globalvar[i].value+";");

      if (glob.length>0)
      {
         res.core.push("/* Global variables */");
         for (i=0; i<glob.length; i++)
            res.core.push(glob[i]);
         res.core.push("");
      }

      // now init some headings
      res.create.push("/* ----------------------------------------------------------------------------------------------------------------- */");
      res.create.push("FwSmDesc_t "+res.name+"Create(void* smData)");
      res.create.push("{");

      // order init states by level, and create smDesc names/IDs for them
      inits.sort(function(a,b){return b.level-a.level});
      n=1;
      for (i=0; i<inits.length; i++)
      {
         inits[inits.length-i-1].state.smdescID=inits[inits.length-i-1].state.parentState.smdescID!=""?inits[inits.length-i-1].state.parentState.smdescID:(i==0?i:n++);
         if (inits[inits.length-i-1].state.parentState) inits[inits.length-i-1].state.parentState.smdescID=inits[inits.length-i-1].state.smdescID;
      }

      // Traverse through all init states and add code to 'res'
      for (i=0; i<inits.length; i++)
         if (!traverseSM(inits[i].state.parentState,inits[i].state.smdescID,res))
            return false;

      // closing *Create() function
      res.create.push("\treturn "+(isStatic()?"&":"")+"smDesc;");
      res.create.push("}");
      res.create.push("\r\n");


      // ------------------------------------------------------------------------------------------------------------------------------------
      // create header file .h
      // ------------------------------------------------------------------------------------------------------------------------------------

      res.headers.push("/**");
      res.headers.push(" * @file");
      res.headers.push(" * This header file declares the function to create one instance of the "+res.name+" state machine.");
      res.headers.push(" * The state machine is configured with a set of function pointers representing the non-default");
      res.headers.push(" * actions and guards of the state machine. Some of these functions may also be declared in");
      res.headers.push(" * this header file in accordance with the configuration of the state machine in the FW Profile");
      res.headers.push(" * Editor. In the latter case, the user has to provide an implementation for these functions");
      res.headers.push(" * in a user-supplied body file.");
      res.headers.push(" *");
      res.headers.push(" * This header file has been automatically generated by the FW Profile Editor.");
      res.headers.push(" * The state machine created by this file is shown in the figure below.");

      if (!isEmpty(g.fwprop.smNotes))
      {
         res.headers.push(" *");
         res.headers.push(" * "+g.fwprop.smNotes.replace(/\n/g,"\n * "));
         res.headers.push(" *");
      }

      if (res.notes.length>0)
      {
         res.headers=res.headers.concat(res.notes);
         res.headers.push(" *");
      }

      res.headers.push(" * @image html "+res.name+".png");
      res.headers.push(" *");
      res.headers.push(" * @author FW Profile code generator"+(g.currentVersion?" version "+g.currentVersion:""));
      res.headers.push(" * @date Created on: "+now());
      res.headers.push(" */");
      res.headers.push("");

      res.headers.push("/* Make sure to include this header file only once */");
      res.headers.push("#ifndef "+res.name.toUpperCase()+"_H_");
      res.headers.push("#define "+res.name.toUpperCase()+"_H_");
      res.headers.push("");
      res.headers.push("/* FW Profile function definitions */");
      res.headers.push("#include \"FwSmConstants.h\"");
      res.headers.push("");

      res.headers.push("/* State identifiers */");
      res.headers=res.headers.concat(res.defines);
      res.headers.push("");

      if (!isEmpty(g.fwprop.smIncludes))
      {
         res.headers.push("/* User-defined includes */");
         res.headers.push(g.fwprop.smIncludes);
         res.headers.push("");
      }

      if (triggers.length>0)
      {
         res.headers.push("/* The identifiers of transition commands (triggers) */");
         res.headers.push("#define Execute (0) /**< The identifier of the Execute transition trigger */");
         for (i=0; i<triggers.length; i++)
         {
             if (triggers[i] != "Execute")
             {
                res.headers.push("#define "+triggers[i]+" ("+triggerGetID(triggers[i]) + ")" + "/**< The identifier of the " + triggers[i] + " transition trigger */");                
             }
         }
         res.headers.push("");
      }

      res.headers.push("/**");
      res.headers.push(" * Create a new state machine descriptor.");
      res.headers.push(" * This interface creates the state machine descriptor "+g.fwprop.memalloc+"ally.");
      if (isStatic())
      {
         res.headers.push(" * It creates a single static instance of the state machine.");
         res.headers.push(" * The function should only be called once.");
         res.headers.push(" * If it is called several times, it always reconfigures and returns the same instance.");
      }
      res.headers.push(" * @param smData the pointer to the state machine data.");
      res.headers.push(" * A value of NULL is legal (note that the default value of the pointer");
      res.headers.push(" * to the state machine data when the state machine is created is NULL).");
      res.headers.push(" * @return the pointer to the state machine descriptor");
      res.headers.push(" */");
      res.headers.push("FwSmDesc_t "+res.name+"Create(void* smData);");
      res.headers.push("");
      res.headers=res.headers.concat(res.stubs);
      res.headers.push("#endif /* "+res.name+"_H_ */");
      res.headers.push("");

      res.core=res.core.concat(res.functions,res.create);


      // ------------------------------------------------------------------------------------------------------------------------------------
      // make main file Main.c
      // ------------------------------------------------------------------------------------------------------------------------------------

      res.main.push("/** "+res.name+" function definitions */");
      res.main.push("#include \""+res.name+".h\"");
      res.main.push("");

      res.main.push("/** FW Profile function definitions */");
      res.main.push("#include \"FwSmConstants.h\"");
      res.main.push("#include \"FwSm"+(isStatic()?"S":"D")+"Create.h\"");
      res.main.push("#include \"FwSmConfig.h\"");
      res.main.push("#include \"FwSmCore.h\"");
      res.main.push("");

      res.main.push("#include <stdio.h>");
      res.main.push("#include <stdlib.h>");
      res.main.push("");

      if (res.dummycode.length>0)
      {
         res.main.push("/* ----------------------------------------------------------------------------------------------------------------- */");
         res.main.push("");
         res.main=res.main.concat(res.dummycode);
         res.main.push("/* ----------------------------------------------------------------------------------------------------------------- */");
         res.main.push("");
      }

      // main function code
      res.main.push("int main(void)\n{");

      res.main.push("\t/** Define the state machine descriptor (SMD) */");
      res.main.push("\tFwSmDesc_t smDesc = "+res.name+"Create(NULL);");
      res.main.push("");

      res.main.push("\t/** Check that the SM is properly configured */");
      res.main.push("\tif (FwSmCheckRec(smDesc) != smSuccess) {");
      res.main.push("\t\tprintf(\"The state machine "+res.name+" is NOT properly configured ... FAILURE\\n\");");
      res.main.push("\t\treturn EXIT_FAILURE;");
      res.main.push("\t}");
      res.main.push("");
      res.main.push("\tprintf(\"The state machine "+res.name+" is properly configured ... SUCCESS\\n\");");
      res.main.push("");

      res.main.push("\t/** Start the SM, send a few transition commands to it, and execute it */");
      res.main.push("\tFwSmStart(smDesc);");

      if (triggers.length>0)
      {
          for (i=0; i<triggers.length; i++)
             res.main.push("\tFwSmMakeTrans(smDesc, "+triggers[i]+");");
          res.main.push("");
      }
      res.main.push("");

      res.main.push("\treturn EXIT_SUCCESS;");
      res.main.push("}");


      return res;
   }
