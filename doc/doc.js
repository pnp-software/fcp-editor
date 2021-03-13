
   $(document).ready(function()
   {
      var h2=0;h3=0;
      $("#toc").html('');
      $("h2, h3").each(function(i)
      {
         current = $(this);
         if (current.prop("tagName").toUpperCase()=='H2') { h2++; h3=0; }
         if (current.prop("tagName").toUpperCase()=='H3') { h3++; }

         $("#toc").append("<li style='list-style: none; "+(h3==0?"margin-top: 4px;":"")+"'>"+(h3>0?"&nbsp;&nbsp;&nbsp;&nbsp;":"")+"<a href='#"+current.attr("id")+"'>"+h2+"."+(h3>0?h3+".":"")+" "+current.html()+"</a></li>");
      });


      $('#toclink').click(function(){
         $("#toc").slideToggle(); $(this).blur();
      });

   });

   function gotoHash(str)
   {
      location.hash=str;
   }
