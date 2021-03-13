
   function global_variable_add(t, skipChecks)
   {
      // if minus is pressed, user wants to remove the row
      if ($(t).find('.icon-minus').size())
      {
         $(t).parent().remove();
         propUpdate();
         refreshToolbars();
         return;
      }

      // get values
      var name=$(t).parent().find('.globvarname').val();
      var value=$(t).parent().find('.globvarvalue').val();
      var type=$(t).parent().find('.globvartype').val();

      // basic checks
      if (name=='') { if (!skipChecks) msg("Name must not be empty",'error'); return; }
      if (value=='' || value=='-' || value=='.' || value=='.-' || value=='-.') { if (!skipChecks) msg("Value must not be empty",'error'); return; }
      if (type.match(/^u/) && value.match(/[-]/)) { if (!skipChecks) msg("Unsigned integer must not be negative",'error'); return; }

      var row=$(t).parent().clone(true);
      row.find('button').removeClass('btn-success').html("<i class='icon-minus'></i>");
      row.find('input').attr("data-enter","");

      row.find('.globvarname').val(name);
      row.find('.globvarvalue').val(value);
      row.find('.globvartype').val(type);

      $('#globadd').prepend(row);

      $(t).parent().find('.globvarname').val('');
      $(t).parent().find('.globvarvalue').val('');
      $(t).parent().find('.globvartype').val('');

      if (!skipChecks) msg();
   }


   function refreshToolbarButtons()
   {
      // show or hide left toolbar buttons
      if (g.history.length>0 && g.history[0].data!="") $('#historybutton').find('button').css('background-color','white').find('i').removeClass('icon-white');
      else $('#historybutton').find('button').css('background-color','#777').find('i').addClass('icon-white');

      if (g.selected.length==1 && g.selected[0].fwprop.type=='state') $('#selfconnect').find('button').css('background-color','white').find('i').removeClass('icon-white');
      else $('#selfconnect').find('button').css('background-color','#777').find('i').addClass('icon-white');

      if (g.selected.length>0 || g.selectedCon) $('#deletebutton').find('button').css('background-color','white').find('i').removeClass('icon-white');
      else $('#deletebutton').find('button').css('background-color','#777').find('i').addClass('icon-white');

      $('#choiceButLabel').html(editorSwitch("Choice","Decision"));
      $('#stateButLabel').html(editorSwitch("State","Action"));
   }


   function refreshToolbars()
   {
      if (g.skipToolbarsRefresh) return;

      var state;
      var show='globalprop';
      var title="Global Properties";

      // refreshToolbars is always called by an action outside a toolbar.
      // Thanks to it we're sure we can move focus away from any active input
      // This is important else Delete key on INPUT would delete a state or such
      $('#blurator').focus();
      $('#blurator').blur();
      propSuggestHide();
      refreshToolbarButtons();

      // hide all properties dialogs
      $('#editboxcontent').find('.hidden').hide();

      $('#nameLabel').html(editorSwitch("State Machine Name:","Procedure Name:"));
      $('#epropSmName').attr("placeholder", editorSwitch("state machine name","procedure name"));
      $('#stateidLabel').html(editorSwitch("State Identifier:","Action Node Identifier:"));
      $('#entryActionLabel').html(editorSwitch("Entry Action:","Action:"));
      $('#choiceidLabel').html(editorSwitch("Choice Identifier:","Decision Node Identifier:"));
      $('#orderShowLabel').html(editorSwitch("Show transition order:","Show control flow order:"));

      // and now show appropriate dialog in properties box

      if (g.selected.length==1 && g.selected[0].fwprop.type!='notedot')
      {
         state=g.selected[0];
         if (state.fwprop.type=='state') title=editorSwitch("State","Action Node")+" Properties";
         if (state.fwprop.type=='init') title="Initial "+editorSwitch("State","Node")+" Properties";
         if (state.fwprop.type=='final') title="Final "+editorSwitch("State","Node")+" Properties";
         if (state.fwprop.type=='choice') title=editorSwitch("Choice","Decision Node")+" Properties";
         if (state.fwprop.type=='note') title="Note Properties";
         show=state.fwprop.type+"prop";
      }

      if (editorIsSM()) // there are no do/exit actions on procedures, so show them only in SM editor
      {
         $('#epropDo').show();
         $('#epropExit').show();
         $('#epropAp').hide();
      }
      else
      {
         $('#epropAp').show();
      }

      if (g.selectedCon && !stateIsNote(g.selectedCon.stateFrom))
      {
         title=editorSwitch("Transition","Control Flow")+" Properties";
         show="transprop";

         $('#epropTrAction').show();
         // there are no transition actions or triggers on procedures, never
         if (editorIsPR()) $('#epropTrAction').hide();

         $('#triggerguardprop').show();
         // Initial state in SM editor doesn't have triggers or guards
         if (editorIsSM() && g.selectedCon.stateFrom.fwprop.type=='init')
            $('#triggerguardprop').hide();

         $('#triggeridprop').show();

         // hide trigger identifier edit on transitions going from choice
         if (g.selectedCon.stateFrom.fwprop.type=='choice')
            $('#triggeridprop').hide();

         // there are no triggers on procedures, never
         if (editorIsPR()) $('#triggeridprop').hide();
      }

      propEditFill();
      $('#editboxcontent').find('textarea').each(function(){ textareaRowsUpdateOnly(this) });


      $('#editboxlabel').html(title);
      $('#'+show).show();
      fixEditboxPos();
   }


   function colorPicker()
   {
       var res="",i;
       var colors = [
             'ffffff', 'eeeeee', 'ffcccc', 'ffcc99', 'ffff99', 'ccffaa', 'ccffff', 'ccccff', '999999'
       ];

       for(i=0; i<colors.length; i++)
       {
          res=res+"<i class=colorItem style='background-color: #"+colors[i]+"' data-color='"+colors[i]+"'>&nbsp;</i>";
          if (i % 9 == 8) res=res+"<br clear=all>";
       }

       return "<div style='line-height: 10px; width: 280px;'>"+res+"</div>";
   }


   function setStateColor()
   {
      var rgb=$(this).attr("data-color");
      historyAddPrepare();

      if (g.selected)
         for (var i=0; i<g.selected.length; i++)
            g.selected[i].attr("fill","#"+rgb);

      historyAddFinish();
      refreshToolbars();
   }


   function fixEditboxPos(newpos)
   {
      var scroll=$('#editboxscrollablearea').scrollTop();
      $('#editboxscrollablearea').css({'height':'','padding-right':''});
      $('.qmarkR').css({'margin-right':"5px"});
      if ($('#editbox').height()+20>=$('#sizer').height())
      {
         $('#editboxscrollablearea').css({"height": ($('#sizer').height()-80-1)+"px" , "padding-right": "7px" }).scrollTop(scroll);
         $('.qmarkR').css({'margin-right':"10px"});
      }

      var marginV=15; // vertical margin
      var marginH=10; // horizontal margin
      var position=$('#editbox').offset();
      if (newpos) { position.left=newpos.left; position.top=newpos.top; }
      var pagew=$('#sizer').width();
      var pageh=$('#sizer').height();
      var boxw=$('#editbox').width();
      var boxh=$('#editbox').height();
      if (position.top < marginV) position.top=marginV;
      if (position.left < marginH) position.left=marginH;
      if (position.left>pagew-boxw-marginH) position.left=pagew-boxw-marginH;
      if (position.top>pageh-boxh-marginV) position.top=pageh-boxh-marginV;
      if (newpos) return position;
      $('#editbox').offset(position);
      if (position.left>=pagew-boxw-marginH) {  $('#editbox').css("left", '').css("right", marginH); }
   }


   function clearMsgTimeout(mouseover)
   {
      if (g.msgTimeout) clearTimeout(g.msgTimeout);
      if (mouseover) $('#alertdismiss').show();
      g.msgTimeout=false;
   }


   function msg(text, type, hideInterval) // type={error,info,success,warning}; auto hide in seconds, negative value means no autohide
   {
      clearMsgTimeout();
      if (!text) $('.alertboxcontainer').css('top','');
      else
      {
         $('.alertboxcontainer').css({'top':'0px', 'z-index': ''});
         if (type=='error')   { $('.alertbox').css({"border-color":"#eed3d7", "color":"#b94a48", "background-color": "#f2dede"}); $('.alertboxcontainer').css({'z-index': '1000'}); text=" Error on "+g.fwprop.smName+":<br>"+text; }
         else if (type=='info') $('.alertbox').css({"border-color":"#bce8f1", "color":"#3a87ad", "background-color": "#d9edf7"});
         else if (type=='warning') { $('.alertbox').css({"border-color":"#faebcc", "color":"#8a6d3b", "background-color": "#fcf8e3"}); $('.alertboxcontainer').css({'z-index': '1000'}); }
         else                      $('.alertbox').css({"border-color":"#d6e9c6", "color":"#468847", "background-color": "#dff0d8"});

         if (text!='') text=text+'<div id=alertdismiss style="display: none; margin-top: 15px; padding-top: 5px; border-top: 1px solid #'
                   +(type=="error"?"eed3d7":(type=="info"?"bce8f1":(type=="warning"?"faebcc":"d6e9c6")))+';">- click to dismiss -</div>';
         $('#alertbox').html(text);
         if (!hideInterval) hideInterval=5;
         if (hideInterval>0) g.msgTimeout=setTimeout(function(){msg();},hideInterval*1000);
      }
   }

   function toolbarSetWidth(w) { $('#toolbar').width(w); }
   function toolbarMidi() { toolbarSetWidth(110); }
   function toolbarMin() { toolbarSetWidth(40); }
   function toolbarWide() {toolbarSetWidth('100%'); }

   function toolbarOpacity(p) { $('#toolbar').fadeTo(0,p); }
   function toolbarTransparent() { toolbarOpacity(0.1); }
   function toolbarVisible() { toolbarOpacity(1); }

   function editboxOpacity(p) { $('#editbox').fadeTo(0,p); }
   function editboxTransparent() { editboxOpacity(0.1); }
   function editboxVisible() { editboxOpacity(1); }

   function mouseButtonIsDown() { return g.leftMouseButtonIsDown || g.rightMouseButtonIsDown };

   function editboxOn()
   {
      if ($('#editboxminimizer').hasClass('icon-plus-sign'))
         $('#editboxminimizer').click();
   }


   function menurowHoverOver(ev)
   {
      if (!mouseButtonIsDown())
      {
         toolbarMidi();
         if ($(this).find('.icon-white').length==0)
         {
            $(this).css({"background":"#b9d5f1"});
            $(this).children("td").css("color","#222");
            $(this).find("*").css({"cursor": "pointer"} );
         }
         else
           $(this).find("*").css({"cursor": "default"} );

      }
   }

   function menurowHoverOut(ev)
   {
      $(this).css("background","");
      $(this).find(".pull-right").addClass("icon-white");
      $(this).children("td").css("color","");
   }
