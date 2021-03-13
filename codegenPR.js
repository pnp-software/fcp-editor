   // -
   // traverse all objects and create gen code
   // -
   function traversePR(res)
   {
      var i, action, guard;
      var cnt={ "states":0, "choices":0, "transitions":0 };
      var def=[], defsort=[], cr=[], actions=[], guards=[], con=[], tr=[];

      for (i=0; i<g.states.length; i++)
      {
         if (!stateIsNote(g.states[i]))
            FWaddNote(g.states[i].fwprop.note,"Note for node "+getIdentifierName(g.states[i].fwprop),res);

         if (g.states[i].fwprop.type=='state')
         {
            cnt.states++;
            defsort.push("#define "+res.name+"_"+g.states[i].fwprop.identifier+" ({{cnt}})\t\t/**< The identifier of action node "+g.states[i].fwprop.identifier+" in procedure "+res.name+" */");

            // if Action node name is empty, stop
            if (isEmpty(g.states[i].fwprop.identifier))
            {
               msg("Action Node with empty identifier is not allowed","error");
               return false;
            }

            // if state name is not unique, stop here
            if (countStatesByName(g.states[i].fwprop.identifier)>1)
            {
               msg("Duplicate Node name '"+g.states[i].fwprop.identifier+"'","error");
               return false;
            }

            // get action function pointer. NULL is not allowed for Action nodes
            action=FWaddFunction(g.states[i].fwprop.entryType, g.states[i].fwprop.entryFunc, g.states[i].fwprop.entryCode, g.states[i].fwprop.entryDesc, "Action for node "+getIdentifierName(g.states[i].fwprop)+".", false, res);

            if (action=='')
            {
               msg(g.states[i].fwprop.identifier+": Action has description,<br>but no function or code defined","error",20);
               return false;
            }

            if (action=="NULL")
            {
               msg("Node must have valid action: "+g.states[i].fwprop.identifier,"error");
               return false;
            }

            cr.push("\tFwPrAddActionNode("+(isStatic()?"&":"")+"prDesc, "+res.name+"_"+g.states[i].fwprop.identifier+", "+action+");");
            if (action!="NULL") arrayAddNonempty(actions,action);
         }

         if (g.states[i].fwprop.type=='choice')
         {
            // if decision node name is empty, stop
            if (isEmpty(g.states[i].fwprop.identifier))
            {
               msg("Decision Node with empty identifier is not allowed","error");
               return false;
            }

            cnt.choices++;
            def.push("\tconst FwPrCounterU2_t "+g.states[i].fwprop.identifier+" = "+(cnt.choices)+";\t\t/** The identifier of decision node "+g.states[i].fwprop.identifier+" in procedure "+res.name+" */");
            def.push("\tconst FwPrCounterU2_t N_OUT_OF_"+g.states[i].fwprop.identifier+" = "+countOutgoingTransitions(g.states[i])+";\t/* The number of control flows out of decision node "+g.states[i].fwprop.identifier+" in procedure "+res.name+" */");
            cr.push("\tFwPrAddDecisionNode("+(isStatic()?"&":"")+"prDesc, "+g.states[i].fwprop.identifier+", N_OUT_OF_"+g.states[i].fwprop.identifier+");");
         }
      }

      // sort defines by name and add numeric values
      defsort=defsort.sort(function(a,b){return naturalSort(a,b);});
      for (i=0; i<defsort.length; i++) defsort[i]=defsort[i].replace(/{{cnt}}/,i+1);
      res.defines=res.defines.concat(defsort);

      // get copy of all connections so we can sort them by order
      for (i=0; i<g.connections.length; i++)
         con.push(g.connections[i]);

      // sort them by state and order number so it is nice
      con.sort(function(a,b){ return (a.stateFrom.id!=b.stateFrom.id) ? a.stateFrom.id-b.stateFrom.id : a.fwprop.order-b.fwprop.order});

      // process all connections (transitions) in the order
      for(i=0; i<con.length; i++)
      {
         if (stateIsNote(con[i].stateFrom)) continue;
         cnt.transitions++;
         guard=FWaddFunction(con[i].fwprop.guardType, con[i].fwprop.guardFunc, con[i].fwprop.guardCode, con[i].fwprop.guardDesc, "Guard on the Control Flow from "+getIdentifierName(con[i].stateFrom.fwprop)+" to "+getIdentifierName(con[i].stateTo.fwprop)+".", true, res);
         FWaddNote(con[i].fwprop.note,"Note for Control Flow from "+getIdentifierName(con[i].stateFrom.fwprop)+" to "+getIdentifierName(con[i].stateTo.fwprop),res);

         if (guard=='')
         {
            // we will assume here that empty FROM is init state, and empty TO is final state.
            // This could produce wrong error message if a state doesn't have identifier, but this is invalid at all so we don't care
            msg("Guard has description, but no function or code<br>defined on Control Flow from "+getIdentifierName(con[i].stateFrom.fwprop)+" to "+getIdentifierName(con[i].stateTo.fwprop),"error",20);
            return false;
         }

         if (guard!="NULL") arrayAddNonempty(guards,guard);

         // configure transitions
         if (con[i].stateFrom.fwprop.type=='init' && con[i].stateTo.fwprop.type=='state') tr.push("\tFwPrAddFlowIniToAct("+(isStatic()?"&":"")+"prDesc, "+res.name+"_"+con[i].stateTo.fwprop.identifier+", "+guard+");");
         if (con[i].stateFrom.fwprop.type=='init' && con[i].stateTo.fwprop.type=='choice') tr.push("\tFwPrAddFlowIniToDec("+(isStatic()?"&":"")+"prDesc, "+con[i].stateTo.fwprop.identifier+", "+guard+");");
         if (con[i].stateFrom.fwprop.type=='state' && con[i].stateTo.fwprop.type=='choice') { tr.push("\tFwPrAddFlowActToDec("+(isStatic()?"&":"")+"prDesc, "+res.name+"_"+con[i].stateFrom.fwprop.identifier+", "+con[i].stateTo.fwprop.identifier+", "+guard+");"); }
         if (con[i].stateFrom.fwprop.type=='state' && con[i].stateTo.fwprop.type=='state') { tr.push("\tFwPrAddFlowActToAct("+(isStatic()?"&":"")+"prDesc, "+res.name+"_"+con[i].stateFrom.fwprop.identifier+", "+res.name+"_"+con[i].stateTo.fwprop.identifier+", "+guard+");"); }
         if (con[i].stateFrom.fwprop.type=='choice' && con[i].stateTo.fwprop.type=='state') tr.push("\tFwPrAddFlowDecToAct("+(isStatic()?"&":"")+"prDesc, "+con[i].stateFrom.fwprop.identifier+", "+res.name+"_"+con[i].stateTo.fwprop.identifier+", "+guard+");");
         if (con[i].stateFrom.fwprop.type=='state' && con[i].stateTo.fwprop.type=='final') { tr.push("\tFwPrAddFlowActToFin("+(isStatic()?"&":"")+"prDesc, "+res.name+"_"+con[i].stateFrom.fwprop.identifier+", "+guard+");"); }
         if (con[i].stateFrom.fwprop.type=='choice' && con[i].stateTo.fwprop.type=='final') tr.push("\tFwPrAddFlowDecToFin("+(isStatic()?"&":"")+"prDesc, "+con[i].stateFrom.fwprop.identifier+", "+guard+");");
         if (con[i].stateFrom.fwprop.type=='choice' && con[i].stateTo.fwprop.type=='choice') tr.push("\tFwPrAddFlowDecToDec("+(isStatic()?"&":"")+"prDesc, "+con[i].stateFrom.fwprop.identifier+", "+con[i].stateTo.fwprop.identifier+", "+guard+");");
      }

      res.create=res.create.concat(def);
      res.create.push("");

      var params="\t\t"+cnt.states+",\t/* N_ANODES - The number of action nodes */\n"+
                 "\t\t"+cnt.choices+",\t/* N_DNODES - The number of decision nodes */\n"+
                 "\t\t"+cnt.transitions+",\t/* N_FLOWS - The number of control flows */\n"+
                 "\t\t"+actions.length+",\t/* N_ACTIONS - The number of actions */\n"+
                 "\t\t"+guards.length+"\t/* N_GUARDS - The number of guards */\n";

      res.create.push("\t/** Create the procedure */");
      if (isStatic())
      {
         res.create.push("\tFW_PR_INST(prDesc,\n"+params+"\t);");
         res.create.push("\tFwPrInit(&prDesc);");
      }
      else
      {
         res.create.push("\tFwPrDesc_t prDesc = FwPrCreate(\n"+params+"\t);");
      }

      res.create.push("");
      res.create.push("\t/** Configure the procedure */");
      res.create.push("\tFwPrSetData("+(isStatic()?"&":"")+"prDesc, prData);");
      res.create=res.create.concat(cr);
      res.create=res.create.concat(tr);
      res.create.push("");

      return true;
   }


   // ----------------------------------------
   // generate FW Profile C code for Procedure
   // ----------------------------------------

   function FWcodePR()
   {
      var res={headers:[], defines:[], stubs:[], core:[], main:[], create:[], functions:[], dummycode:[], notes:[], name:""};
      var i;
      var initcount=0, init=false;
      var inits=[];
      var glob=[];

      res.name=camelCase(g.fwprop.smName);
      if (res.name=='') { msg("Please specify procedure name in Global Properties","error"); return false; }

      for (i=0; i<g.states.length; i++)
         if (g.states[i].fwprop.type=='init')
             initcount++;

      if (initcount==0) { msg("Couldn't find initial node. Please add one.","error"); return false; }
      if (initcount>1) { msg("Found more than one initial nodes. There has to be only one.","error"); return false; }


      // ------------------------------------------------------------------------------------------------------------------------------------
      // make code file .c
      // ------------------------------------------------------------------------------------------------------------------------------------

      res.core.push("#include \""+res.name+".h\"");
      res.core.push("");
      res.core.push("/* FW Profile function definitions */");
      res.core.push("#include \"FwPr"+(isStatic()?"S":"D")+"Create.h\"");
      res.core.push("#include \"FwPrConfig.h\"");
      res.core.push("#include \"FwPrCore.h\"");
      res.core.push("");
      res.core.push("/* "+res.name+" function definitions */");
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
      res.create.push("FwPrDesc_t "+res.name+"Create(void* prData)");
      res.create.push("{");

      // generate the *Create code
      if (!traversePR(res)) return false;

      // closing *Create() function
      res.create.push("\treturn "+(isStatic()?"&":"")+"prDesc;");
      res.create.push("}");
      res.create.push("\r\n");

      // ------------------------------------------------------------------------------------------------------------------------------------
      // create header file .h
      // ------------------------------------------------------------------------------------------------------------------------------------

      res.headers.push("/**");
      res.headers.push(" * @file");
      res.headers.push(" * This header file declares the function to create one instance of the "+res.name+" procedure.");
      res.headers.push(" * The procedure is configured with a set of function pointers representing the non-default");
      res.headers.push(" * actions and guards of the procedure. Some of these functions may also be declared in");
      res.headers.push(" * this header file in accordance with the configuration of the procedure in the FW Profile");
      res.headers.push(" * Editor. In the latter case, the user has to provide an implementation for these functions");
      res.headers.push(" * in a user-supplied body file.");
      res.headers.push(" *");
      res.headers.push(" * This header file has been automatically generated by the FW Profile Editor.");
      res.headers.push(" * The procedure created by this file is shown in the figure below.");

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
      res.headers.push("/* FW Profile constant definitions */");
      res.headers.push("#include \"FwPrConstants.h\"");
      res.headers.push("");

      res.headers.push("/* Action node identifiers */");
      res.headers=res.headers.concat(res.defines);
      res.headers.push("");

      if (!isEmpty(g.fwprop.smIncludes))
      {
         res.headers.push("/* User-defined includes */");
         res.headers.push(g.fwprop.smIncludes);
         res.headers.push("");
      }

      res.headers.push("/**");
      res.headers.push(" * Create a new procedure descriptor.");
      res.headers.push(" * This interface creates the procedure descriptor "+g.fwprop.memalloc+"ally.");
      if (isStatic())
      {
         res.headers.push(" * It creates a single static instance of the procedure.");
         res.headers.push(" * The function should only be called once.");
         res.headers.push(" * If it is called several times, it always reconfigures and returns the same instance.");
      }
      res.headers.push(" * @param prData the pointer to the procedure data.");
      res.headers.push(" * A value of NULL is legal (note that the default value of the pointer");
      res.headers.push(" * to the procedure data when the procedure is created is NULL).");
      res.headers.push(" * @return the pointer to the procedure descriptor");
      res.headers.push(" */");
      res.headers.push("FwPrDesc_t "+res.name+"Create(void* prData);");
      res.headers.push("");
      res.headers=res.headers.concat(res.stubs);
      res.headers.push("#endif /* "+res.name+"_H_ */");
      res.headers.push("\r\n");

      res.core=res.core.concat(res.functions,res.create);


      // ------------------------------------------------------------------------------------------------------------------------------------
      // make main file Main.c
      // ------------------------------------------------------------------------------------------------------------------------------------

      res.main.push("/** "+res.name+" function definitions */");
      res.main.push("#include \""+res.name+".h\"");
      res.main.push("");

      res.main.push("/** FW Profile function definitions */");
      res.main.push("#include \"FwPrConstants.h\"");
      res.main.push("#include \"FwPr"+(isStatic()?"S":"D")+"Create.h\"");
      res.main.push("#include \"FwPrConfig.h\"");
      res.main.push("#include \"FwPrCore.h\"");
      res.main.push("");

      res.main.push("#include <stdio.h>");
      res.main.push("#include <stdlib.h>");
      res.main.push("#include <time.h>");
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

      res.main.push("\t/** Define the procedure descriptor (PRD) */");
      res.main.push("\tFwPrDesc_t prDesc = "+res.name+"Create(NULL);");
      res.main.push("");
      res.main.push("\tsrand(time(NULL));")
      res.main.push("");
      
      res.main.push("\t/** Check that the procedure is properly configured */");
      res.main.push("\tif (FwPrCheck(prDesc) != prSuccess) {");
      res.main.push("\t\tprintf(\"The procedure "+res.name+" is NOT properly configured ... FAILURE\\n\");");
      res.main.push("\t\treturn EXIT_FAILURE;");
      res.main.push("\t}");
      res.main.push("");
      res.main.push("\tprintf(\"The procedure "+res.name+" is properly configured ... SUCCESS\\n\");");
      res.main.push("");

      res.main.push("\t/** Start the procedure, and execute it a few times */");
      res.main.push("\tFwPrStart(prDesc);");
      res.main.push("\tFwPrExecute(prDesc);");
      res.main.push("\tFwPrExecute(prDesc);");
      res.main.push("\tFwPrExecute(prDesc);");
      res.main.push("\tFwPrExecute(prDesc);");
      res.main.push("");
      res.main.push("\treturn EXIT_SUCCESS;");
      res.main.push("}");

      return res;
   }
