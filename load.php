<?php
   ob_start("ob_gzhandler");

   require_once('inc_db.php');
   require_once('inc_lib.php');
   require_once('inc_session.php');
   require('version.php');

   $known=(array) $_REQUEST['known'];

   $map=@mysqli_result(execQuery("SELECT idMap FROM users WHERE id=".userID()),0);
   if (trim($map)=='') $map="{}";

   echo "{\"userID\": ".json_encode(userID()).", \"username\": ".json_encode($_SESSION['name']).",
          \"idMap\": ".json_encode($map).", \"version\": ".json_encode($version).",
          \"diagrams\":[";

   $diagramData=array();
   $i=0;

   // check if user is logged in
   if (userID()>0)
   {
      // get all diagrams owned by the user, and all other shared by other users with this one
      $shared_ids=shared_diagram_ids();
      $sharing_ids=sharing_diagram_ids();
      $result=execQuery("SELECT *, CASE WHEN id IN (0".join(',',$sharing_ids).") THEN 1 ELSE 0 END as isShared, "
                                ." UNIX_TIMESTAMP(lastUpdate) as lastUpdate, UNIX_TIMESTAMP() as curtime FROM diagrams WHERE userID=".userID()
                                .(count($shared_ids)>0?" OR id IN (".join(",",$shared_ids).")":""));

      // print it this way to avoid big buffers in memory in case of many stored diagrams
      while(true)
      {
         $row=mysqli_fetch_assoc($result);
         if (!$row) break;
         if ($i++>0) echo ",";

         if ($known[$row['id']]['lu']==$row['lastUpdate'] && $known[$row['id']]['n']==$row['name']) $row=array("id"=>$row['id'], "change"=>"none");
         else $row['change']='updt';

         echo json_encode($row);
         unset($known[$row['id']]);
      }

      foreach($known as $id=>$row)
      {
         echo (($i>0)?",":"").json_encode(array("id"=>$id, "change"=>"noex"));
         $i++;
      }
   }

   echo "]}";
?>