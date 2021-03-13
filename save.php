<?php
   require_once('inc_db.php');
   require_once('inc_lib.php');
   require_once('inc_session.php');

   if (userID()==0) return; // anonymous user can't save anything anywhere

   execQuery("UPDATE users SET idMap=\"".mysqli_escape($_POST['idMap'])."\" WHERE id=".userID());
   if (trim($_POST['name'])=='') die(""); // empty name is sent only if we want to save idMap alone

   $box=json_decode($_POST['viewbox'],true);
   if ($box['width']==0) $box['width']=800;
   if ($box['height']==0) $box['height']=400;
   $svg=$_POST['svg'];

   $existingID=$_POST['asID']+0;
   if ($existingID!=0) $perm=access_rights($existingID);

   // save diagram if user has access rights to write
   if ($perm=='ow' || $perm=='rw' || $existingID==0)
   {
      $userID=userID(); // This gives us the current user which is taken in case we store for the first time.

      if ($existingID > 0)
      {
         $row=mysqli_fetch_assoc(execQuery("SELECT * FROM diagrams WHERE id=".$existingID));
         $userID = $row['userID']; // use owner of the diagram in case we have already stored it once.
      }      

      execQuery("REPLACE INTO diagrams SET userID=".$userID.",
            name=\"".mysqli_escape(trim($_POST['name']))."\",
            lastUpdate=NOW(),
            fwprop=\"".mysqli_escape($_POST['fwprop'])."\",
            svg=\"".mysqli_escape($svg)."\",
            width=".($box['width']+0).", height=".($box['height']+0).",
            editorType=\"".preg_replace("{[^a-z ]}i","",$_POST['editorType'])."\"
            ".($existingID>0?", id=".$existingID:"") );

       // if new row was inserted, return its id
       $current=insertId();
       if ($current>0) $existingID=$current;

      // remember old version in history
      $commit = $_POST['commit'];
      if ($commit == 'true')
      {
         $row=mysqli_fetch_assoc(execQuery("SELECT * FROM diagrams WHERE id=".$existingID));
         $row['diagramID']=$row['id'];
         $row['userID']=userID(); // mark current user as the one who saved this
         $row['id']=0;

         foreach($row as $key=>$val) $row[$key]="$key=\"".mysqli_escape($val)."\"";
         execQuery("INSERT INTO history SET ".join(",",$row));
      }
   }
   else die("-1"); // no rights to write

   // print internal id of currently saved diagram
   echo $existingID;
?>