   // -------------------------------------------
   //
   //   state element drag
   //
   // -------------------------------------------

   var statedragstart = function()
   {
      var i,j;
      var t=this;
      while (t.parent) t=t.parent;
      t.x = t.attr("x");
      t.y = t.attr("y");
      t.wasMoving=false;
      if (g.selectedCon) deselectConnection();
      if (!isSelected(t)) stateClick(t);

      var now=(new Date).getTime();
      if (t.clickTime && now-t.clickTime<500) // doubleclick encountered
      {
         if (t.fwprop.type=='state' && editorIsSM() && t.fwprop.embedSmId)
         {
            t.clickTime=1;
            t.openTabID=t.fwprop.embedSmId;
            return;
         }
         else
            editboxOn(); // workaround if dblclick is not properly handled
      }
      t.clickTime=now;

      historyAddPrepare();

      // remember array of vertexes for outgoing transitions out of current state
      // so we can manipulate the values based on the original ones later
      for(i=0; i<g.selected.length; i++)
      {
         cloneVertexes(g.selected[i]);
         putStateToFront(g.selected[i]);

         // remember array of states which move along with our current state
         // (if they are inside the state)
         g.statesInside=[];
         for (j=0;j<g.states.length;j++)
            if (g.states[j].id!=t.id && stateIsInside(g.selected[i],g.states[j]))
            {
               cloneVertexes(g.states[j]);
               g.statesInside.push({ "state": g.states[j], "x": g.states[j].attr("x"), "y": g.states[j].attr("y")} );
               putStateToFront(g.states[j]);
            }
      }

      g.skipToolbarsRefresh=true;
   };


   var statedragmove = function (dx, dy)
   {
      var snap;
      var t=this;
      while (t.parent) t=t.parent;
      var i,j,k,sn,snap;
      var movex=0, movey=0;
      t.wasMoving=true;
      t.clickTime=0;

      // snap to other elements
      for(i=0;i<g.states.length;i++)
      {
         if (t.id==g.states[i].id) continue; // won't snap to itself
         if (isSelected(g.states[i])) continue; // ignore selected
         if (stateIsInside(t,g.states[i])) { putStateToFront(g.states[i]); continue; } // ignore snap to embeded states
         snap=snap_area(g.states[i].attr("x")+g.states[i].attr("width")/2,g.states[i].attr("y")+g.states[i].attr("height")/2,t.x+dx+t.attr("width")/2, t.y+dy+t.attr("height")/2);
         if (snap[0]!=0) movex=snap[0];
         if (snap[1]!=0) movey=snap[1];
      }

      // TODO: snap to all vertexes as well, exclude those vertexes which we actually move along, else we're going to snap to self all the time

      // move all selected objects
      for(i=0;i<g.selected.length;i++)
         changeStatePosition(g.selected[i],g.selected[i].selXpos,dx+movex,g.selected[i].selYpos,dy+movey);

      // move all states inside our moving states
      for (i=0; i<g.statesInside.length; i++)
         changeStatePosition(g.statesInside[i].state,g.statesInside[i].x,dx+movex,g.statesInside[i].y,dy+movey);

      if (g.selected.length==1) selectObject(g.selected[0]);

      refreshConnections();  // all of them, since we may be dragging many elements
   }

   var statedragup = function ()
   {
      g.skipToolbarsRefresh=false;
      updateParents();

      var t=this;
      var i;
      while (t.parent) t=t.parent;
      if (!t.wasMoving) stateClick(t);
      else historyAddFinish();

      for(i=0;i<g.selected.length;i++)
      {
         g.selected[i].selXpos=g.selected[i].attr("x");
         g.selected[i].selYpos=g.selected[i].attr("y");
      }
      t.wasMoving=false;

      refreshToolbars();

      if (t.openTabID>0) { open_tab(t.openTabID); t.openTabID=0; }
   };

   var statemousemove = function()
   {
      if (!mouseButtonIsDown()) vertexHide();
   }





   // -------------------------------------------
   //
   //   label element drag - drag&drop functions for text label on transitions
   //
   // -------------------------------------------

   var labeldragstart = function ()
   {
      refreshConnections();
      var t=this;
      while (t.parent) t=t.parent;
      t.x = t.shiftx;
      t.y = t.shifty;
      deselectAll();
      selectConnection(t);
      historyAddPrepare();
      g.skipToolbarsRefresh=true;
      t.wasMoving=false;
   };

   var labeldragmove = function (dx, dy)
   {
      var t=this;
      while (t.parent) t=t.parent;
      t.shiftx=t.x+dx;
      t.shifty=t.y+dy;
      selectConnection(t);
      t.wasMoving=true;
   };

   var labeldragup = function ()
   {
      var t=this;
      while (t.parent) t=t.parent;

      if (t.wasMoving) historyAddFinish();
      g.skipToolbarsRefresh=false;
      refreshToolbars();
   };



   // -------------------------------------------
   //
   //   background selector - drag&drop functions for background panning and square selector
   //
   // -------------------------------------------


   var bgdragstart = function(x, y, ev)
   {
      if (this.id!='bg') return;
      this.mouseButton = ev.which || ev.button;

      if (this.mouseButton==1)
         g.selectionbox = paper.rect(x + g.paperPanX, y + g.paperPanY, 0, 0).attr({"stroke": "#00f", "stroke-width": 1, fill: "#aaf", opacity: .4});
      else
      {
         if (g.selectionbox)
         {
            g.selectionbox.remove();
            g.selectionbox=false;
         }
         this.wasMoving=false;

         g.selectionbox = paper.rect(g.paperPanX, g.paperPanY, paper.width, paper.height).attr({"stroke": "#f00", "stroke-dasharray":"--", "stroke-width": 3, fill: "#fff", opacity: 0});
         g.selectionbox.x=g.paperPanX;
         g.selectionbox.y=g.paperPanY;
         for (var i=0; i<=6; i++) setTimeoutWithParams(doZoom,[1+i/3,ev.clientX,ev.clientY],20*i);
      }

      this.x = this.attr("x");
      this.y = this.attr("y");

   }


   var bgdragmove = function(dx, dy)
   {
      if (this.id!='bg') return;

      if (this.mouseButton==1) // selection
      {
         var xoffset = 0, yoffset = 0;

         if (dx < 0)
         {
             xoffset = dx;
             dx = -1 * dx;
         }
         if (dy < 0)
         {
             yoffset = dy;
             dy = -1 * dy;
         }

         g.selectionbox.transform("T" + xoffset + "," + yoffset+"t0.5,0.5");
         g.selectionbox.attr("width", dx);
         g.selectionbox.attr("height", dy);
      }
      else // panning
      {
         g.selectionbox.attr("x",g.selectionbox.x+dx*2);
         g.selectionbox.attr("y",g.selectionbox.y+dy*2);
         this.wasMoving=true;
      }
   }


   var bgdragend = function(ev)
   {
      var i,t;
      if (this.id!='bg') return;

      if (this.mouseButton==1)
      {
         if (g.selectionbox)
         {
            // get transform vector so it can be substracted
            t=g.selectionbox.transform();
            if (!t || t.length==0 || t[0].length!=3) t=[['T',0,0]];

            for(i=0; i<g.states.length; i++)
            {
               if (g.states[i].attr("x")>g.selectionbox.attr("x")+t[0][1] && g.states[i].attr("y")>g.selectionbox.attr("y")+t[0][2]
                && g.states[i].attr("x")+g.states[i].attr("width")<g.selectionbox.attr("x")+g.selectionbox.attr("width")+t[0][1]
                && g.states[i].attr("y")+g.states[i].attr("height")<g.selectionbox.attr("y")+g.selectionbox.attr("height")+t[0][2]
               )
                  selectObject(g.states[i]);
            }

            g.selectionbox.remove();

         }
         g.selectionbox=false;
         deselectConnection();
      }
      else
      {
         for (var i=0; i<=6; i++) setTimeoutWithParams(doZoom,[3-i/3,ev.clientX,ev.clientY],20*i);
         setTimeout(function(){g.selectionbox.remove(); refreshToolbars();},20*i+20);
      }
   }

   var bgmousemove = function(ev)
   {
      if (!mouseButtonIsDown()) vertexHide();
      g.bg.mousex=ev.clientX;
      g.bg.mousey=ev.clientY;
   }


   // -------------------------------------------
   //
   //   arrow vertex element drag
   //
   // -------------------------------------------

   var vertexdragstart = function(x,y,ev)
   {
      var i, reuse=false;
      var coord=this.parentPath.coord;
      var verts=this.parentPath.vertexes;
      var shift=this.parentPath.shiftxy;
      var movex=0, movey=0, snap;
      this.shifting=ev.shiftKey;

      // shifting entire arrow path
      if (this.shifting)
      {
         var sh=this.parentPath.shiftxy;

         // the dragged element will always be centered on mouse position on drag
         this.x = x-5+g.paperPanX;
         this.y = y-5+g.paperPanY;
         this.oldx=this.attr("x")-sh.x;
         this.oldy=this.attr("y")-sh.y;
         sh.x-=this.attr("x")-this.x;
         sh.y-=this.attr("y")-this.y;
         this.attr( {x: this.x, y: this.y} );

         selectConnection(this.parentPath);
         g.vertex.toFront();
         historyAddPrepare();

         this.parentPath.shiftxy.hasMoved=false;
      }
      else // creating vertex:
      {
         x-=shift.x;
         y-=shift.y;

         selectConnection(this.parentPath);
         g.vertex.toFront();
         historyAddPrepare();

         // the dragged element will always be centered on mouse position on drag
         this.x = x-5+g.paperPanX;
         this.y = y-5+g.paperPanY;

         // decide whether to reuse existing vetex (if it's 10px near to our position)
         for (i=0; i<verts.length; i++)
         {
            snap=snap_area(verts[i].x,verts[i].y, x+g.paperPanX, y+g.paperPanY, 10);
            if (snap[0]!=0 || snap[1]!=0) { movex=snap[0]; movey=snap[1]; }
            if ( (verts[i].x==x+movex+g.paperPanX) && (verts[i].y==y+movey+g.paperPanY))
            {
               reuse=true;
               break;
            }
         }
   
         // if we're not reusing existing vertex, we have to find out order position
         // of the new one and push it in between (using array.splice)
         if (!reuse)
         {
            for(i=0; i<verts.length; i++)
            {
               if (getLengthAtPoint(coord, x+g.paperPanX+shift.x, y+g.paperPanY+shift.y) < getLengthAtPoint(coord, verts[i].x+shift.x, verts[i].y+shift.y))
                  break;
            }
   
            this.parentPath.vertexes.splice(i,0,{x:false, y:false, hasMoved:false});
         }
   
         this.parentPath.vertexes[i].hasMoved=false;
         this.ins = i;
      }

   }

   var vertexdragmove = function(dx,dy)
   {
      // shifting entire arrow
      if (this.shifting)
      {
         this.attr( {x: this.x + dx, y: this.y + dy} );
         this.parentPath.shiftxy={x:this.x-this.oldx+dx, y:this.y-this.oldy+dy, hasMoved:true}
         refreshConnection(getConnectionsIndex(this.parentPath),'red');
      }
      else // creating vertex:
      {
         var i,j, movex=0, movey=0, snap;

         // snap to other elements
         for(i=0;i<g.states.length;i++)
         {
            snap=snap_area(g.states[i].attr("x")+g.states[i].attr("width")/2,g.states[i].attr("y")+g.states[i].attr("height")/2,this.x+dx+5, this.y+dy+5);
            if (snap[0]!=0) movex=snap[0];
            if (snap[1]!=0) movey=snap[1];
         }
   
         for (i=0; i<g.connections.length; i++)
            for (j=0; j<g.connections[i].vertexes.length; j++)
               if (g.connections[i].vertexes[j]!=this.parentPath.vertexes[this.ins]) // do not snap to itself
               {
                  snap=snap_area(g.connections[i].vertexes[j].x,g.connections[i].vertexes[j].y,this.x+dx+5, this.y+dy+5);
                  if (snap[0]!=0) movex=snap[0];
                  if (snap[1]!=0) movey=snap[1];
               }

         this.attr( {x: this.x + dx + movex + this.parentPath.shiftxy.x, y: this.y + dy + movey + this.parentPath.shiftxy.y} );
         this.parentPath.vertexes[this.ins]={x:this.x+dx+5+movex, y:this.y+dy+5+movey, hasMoved:true}
      }

      refreshConnection(getConnectionsIndex(this.parentPath),'red');
   }

   var vertexdragend = function()
   {
      // shifting entire arrow
      if (this.shifting)
      {
         // only clicked the shifter
         if (!this.parentPath.shiftxy.hasMoved)
         {
           this.parentPath.shiftxy={x:0,y:0};
           selectConnection(this.parentPath);
         }

      }
      else // creating vertex:
      {
         // if we only clicked the vertex modifier, we'd like to remove it instead
         if (!this.parentPath.vertexes[this.ins].hasMoved)
         {
           this.parentPath.vertexes.splice(this.ins,1);
           selectConnection(this.parentPath);
         }
      }

      g.vertex.hide();
      historyAddFinish();
      refreshToolbars();
   }


   // -------------------------------------------
   //
   //   arrow shifter element drag
   //
   // -------------------------------------------

   var shifterdragstart = function(x,y)
   {
      this.x = x;
      this.y = y;
      historyAddPrepare();
      selectConnection(this.parentPath);
      g.shifter.toFront();
      this.parentPath.movingCoord={x:0,y:0};
      this.parentPath.movingEnd=(this.type=='path'?1:0);
   }

   var shifterdragmove = function(dx,dy)
   {
      this.attr( {x: this.x-this.attr('width')/2+dx+g.paperPanX, y: this.y-this.attr('height')/2+dy+g.paperPanY} );
      this.parentPath.movingCoord={x:this.x+dx-this.parentPath.shiftxy.x+g.paperPanX,y:this.y+dy-this.parentPath.shiftxy.y+g.paperPanY};
      refreshConnection(getConnectionsIndex(this.parentPath),'red');
   }

   var shifterdragend = function()
   {
      var target,conn,s1,s2,err='';

      conn=this.parentPath;
      conn.hide(); conn.arrowend.hide(); conn.text.hide(); this.hide();
      target=paper.getElementByPoint(conn.movingCoord.x+conn.shiftxy.x-g.paperPanX,conn.movingCoord.y+conn.shiftxy.y-g.paperPanY);
      if (target) while (target.parent) target=target.parent;
      conn.show(); conn.arrowend.show(); conn.text.show();

      if (target)
      {
         s1=conn.stateFrom;
         s2=conn.stateTo;

         if (conn.movingEnd) // attaching end of the arrow, thus modify stateTo
         {
            if (conn.stateTo.node!=target.node)
            {
               if (editorIsSM())
               {
                  if (target.fwprop.type=='init') err="Initial state doesn't accept incomming transitions";
                  if (target.fwprop.type==s1.fwprop.type && s1.fwprop.type=='choice') err="The source and target of a transition cannot both be choice pseudo-states";
                  if (s1.fwprop.type=='init' && target.fwprop.type=='final') err="Transition from initial to final state makes no sense";
               }

               if (editorIsPR())
               {
                  if (target.fwprop.type=='init') err="Initial node doesn't accept incomming control flow";
                  if (s1.fwprop.type=='init' && target.fwprop.type=='final') err="Transition from initial to final node makes no sense";
                  if (target.fwprop.type=='choice' && conn.stateFrom.node==target.node) err="Control flow from decision node to itself makes no sense";
               }

               if (err=='')
               {
                  if (conn.stateFrom.node==target.node) // if self-connect is detected, modify arrow path.
                  {
                     var X=conn.stateFrom.attr('x');
                     var Y=conn.stateFrom.attr('y');
                     conn.vertexes=[{x:X-20,y:Y+10},{x:X+10,y:Y-20}];
                     conn.shiftxy={x:0,y:0};
                  }

                  conn.stateTo=target;
               }

            }
         }
         else // attaching start of arrow, thus modify stateFrom
         {
            if (conn.stateFrom.node!=target.node)
            {

               if (editorIsSM())
               {
                  if (target.fwprop.type=='init' && connectionsCountFrom(target)>0) err="Only one transition is allowed from initial state";
                  if (target.fwprop.type==s2.fwprop.type && s2.fwprop.type=='choice') err="The source and target of a transition cannot both be choice pseudo-states";
                  if (target.fwprop.type=='init' && s2.fwprop.type=='final') err="Transition from initial to final state makes no sense";
                  if (target.fwprop.type=='final') err="Transition from final state makes no sense";
               }

               if (editorIsPR())
               {
                  if (target.fwprop.type=='init' && connectionsCountFrom(target)>0) err="Only one control flow is allowed from initial node";
                  if (target.fwprop.type=='state' && connectionsCountFrom(target)>0) err="Only one control flow is allowed from action node";
                  if (target.fwprop.type=='init' && s2.fwprop.type=='final') err="Control flow from initial to final node makes no sense";
                  if (target.fwprop.type=='final') err="Control flow from final node makes no sense";
                  if (target.fwprop.type=='choice' && conn.stateTo.node==target.node) err="Control flow from decision node to itself makes no sense";
               }

               if (err=='')
               {
                  if (conn.stateTo.node==target.node) // if self-connect is detected, modify arrow path.
                  {
                     var X=conn.stateTo.attr('x');
                     var Y=conn.stateTo.attr('y');
                     conn.vertexes=[{x:X-20,y:Y+10},{x:X+10,y:Y-20}];
                     conn.shiftxy={x:0,y:0};
                  }

                  if (editorIsSM())
                  if (target.fwprop.type=='init')
                  {
                     conn.fwprop.identifier='';
                     conn.fwprop.guardType='call function';
                     conn.fwprop.guardFunc='';
                     conn.fwprop.guardCode='';
                     conn.fwprop.guardDesc='';
                  }

                  reorderTransitions(conn.stateFrom, conn.fwprop.order, countOutgoingTransitions(conn.stateFrom) );
                  conn.stateFrom=target;
                  conn.fwprop.order=countOutgoingTransitions(conn.stateFrom);
               }
            }
         }
      }

      if (err!='') msg(err,"error");

      conn.movingCoord={};
      selectConnection(conn);
      refreshConnections();
      historyAddFinish();
      refreshToolbars();
   }


   // -------------------------------------------
   //
   //   connector - drag&drop functions for 
   //
   // -------------------------------------------


   var connectordragstart = function(x,y)
   {
      this.x = x - this.attr("width")/2;
      this.y = y - this.attr("height")/2;
   }

   var connectordragmove = function(dx,dy)
   {
       this.hide();
       this.attr( {x: this.x + dx + g.paperPanX, y: this.y + dy + g.paperPanY} );

       var coord=full_coordinates({stateFrom: g.connector.parent, stateTo: g.connector, vertexes: []});
       var arrowpath=build_path_string(coord);

       if (!g.connectorArrow)
       {
          g.connectorArrow=paper.path(arrowpath).attr({"stroke-width": 2 });
          g.connectorArrow.stateFrom=g.connector.parent;
          g.connectorArrow.stateTo=g.connector;
          g.connectorArrow.vertexes=[];
          g.connectorArrow.arrowend=paper.path(arrow_path_string());
          updateConnectionAttrs(g.connectorArrow, '#000');
       }
       updateConnectionAttrs(g.connectorArrow, '#000');
   }

   var connectordragend = function()
   {
      // find out which state I am on
      var target, con;
      target=paper.getElementByPoint(g.connector.attr("x") + g.connector.attr("width")/2 - g.paperPanX,g.connector.attr("y") + g.connector.attr("height")/2 - g.paperPanY);
      if (target) while (target.parent) target=target.parent;

      stateClick(g.connector.parent);
      if (!target || !target.fwprop || stateIsNote(target) || stateIsNoteDot(target)) return; // exit if element is not a state

      if (target && target!=g.connector.parent)
      {
         historyAdd();
         con=connect(g.connector.parent,target);

         if (con && editorIsSM()) stateClick(target);
         if (con && editorIsPR()) selectConnection(con);
      }
   }


   // -------------------------------------------
   //
   //   enlarger - drag&drop functions for the enlarger element
   //
   // -------------------------------------------


   var enlargerdragstart = function()
   {
      historyAddPrepare();

      this.x = this.attr("x");
      this.y = this.attr("y");
      this.w = this.parent.attr("width");
      this.h = this.parent.attr("height");
      this.wasMoving=false;
   }

   var enlargerdragmove = function(dx,dy)
   {
       var min=30;

       // move enlarger object
       if (this.w+dx<min) dx=min-this.w; if (this.h+dy<min) dy=min-this.h;
       this.attr( {x: this.x + dx, y: this.y + dy} );
       // resize state
       var newx = this.w+dx; if (newx<min) newx=min;
       var newy = this.h+dy; if (newy<min) newy=min;
       this.parent.attr({width: newx, height: newy});

       for(var i=0;i<g.states.length;i++)
       {
         if (this.parent.id==g.states[i].id) continue; // won't snap to itself
         if (stateIsInside(this.parent,g.states[i])) putStateToFront(g.states[i]);
      }

       refreshState(this.parent);
       refreshConnections(this.parent);
       this.wasMoving=true;
   }

   var enlargerdragend = function()
   {
      if (this.wasMoving) historyAddFinish();
      // round the width to multiplies of two, in order to get better alignment with transition arrows
      this.parent.attr({ width: Math.floor(this.parent.attr("width")/2)*2, height: Math.floor(this.parent.attr("height")/2)*2 })
      updateParents();
      stateClick(this.parent);
   }

