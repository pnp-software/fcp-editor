
   // --------------------------------
   //
   // State select/deselect functions
   //
   // --------------------------------

   function stateClick(state)
   {
      deselectAll();
      selectObject(state);
      refreshToolbars();
   }

   function deselectAll()
   {
      var i;
      refreshConnections();
      for(i=0; i<g.selected.length; i++) deselectObject(g.selected[i--]);
      deselectConnection();
      refreshToolbars();
   }

   function deselectObject(state)
   {
      // remove from selection array
      var i;
      for(i=0; i<g.selected.length; i++) if (g.selected[i].id==state.id) g.selected.splice(i--,1);
      state.attr({"stroke":'#666', 'stroke-width':1});
      destroySelectors();
      refreshToolbars();
   }

   function selectConnection(con)
   {
      if (con)
      {
         deselectAll();
         refreshConnection(getConnectionsIndex(con),'red');
         g.selectedCon=con;

         con.toFront();
         if (con.arrowend) con.arrowend.toFront();
         if (con.text) con.text.toFront();
      }
      refreshToolbars();
   }


   function deselectConnection(con)
   {
      if (!con) con=g.selectedCon;
      if (con) refreshConnection(getConnectionsIndex(con),'#000');
      refreshToolbars();
      g.selectedCon=false;
   }




   function isSelected(state)
   {
      var i, isSelected = false;
      for(i=0; i<g.selected.length; i++) if (g.selected[i].id==state.id) isSelected=true;
      return isSelected;
   }


   function selectObject(state)
   {
      if (!isSelected(state)) // add to array
      {
         state.attr({"stroke":"#6599FF", 'stroke-width': 2});
         state.selXpos=state.attr("x");
         state.selYpos=state.attr("y");
         g.selected.push(state);
      }

      if (g.selected.length==1 && state.fwprop.type!='final')
      {
         if (!stateIsNote(state) && !stateIsNoteDot(state))
         {
            if (!g.connector) g.connector=paper.rect(0,0,10,10,5).transform("t0.5,0.5")
            g.connector.attr({stroke:"#39f", fill: "#b9d5f1", cursor: "move"});
            g.connector.drag(connectordragmove,connectordragstart,connectordragend);
            g.connector.parent=state;
         }

         if (state.fwprop.type=='state' || stateIsNote(state))
         {
            if (!g.enlarger) g.enlarger=paper.path("M0,0L10,0L10,-10M0,0L10,-10M4,0L10,-6");
            g.enlarger.attr({"stroke-width":2, stroke:"#6599ff", fill: "#fff", cursor: "nw-resize"});
            g.enlarger.drag(enlargerdragmove,enlargerdragstart,enlargerdragend);
            g.enlarger.parent=state;
         }

         refreshState(state);
      }
      else
         destroySelectors();
   }
