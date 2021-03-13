<?php

   require_once('inc_db.php');
   require_once('inc_session.php');

   $action=trim($_REQUEST['action']);
   $id=$_REQUEST['id']+0;

   if (userID()<1) die(json_encode(array('error'=>'User is not signed in, please sign in.')));

   if ($action=='getusers')
   {
      $perm=access_rights($id);
      if ($perm=='') $res=array('error'=>'You do not have sufficient access rights for the given diagram.');
      else
      {
         $users=array();
         $result=execQuery("SELECT * FROM shares WHERE diagramID=".$id." ORDER BY id");
         while($row=mysqli_fetch_assoc($result)) $users[]=array("user"=>$row['email'], "perm"=>$row['perm']);
         $res=array('ok'=>true, "users"=>$users);
      }

      echo json_encode($res);
   }


   if ($action=='setusers')
   {
      $perm=access_rights($id);
      if ($perm=='' || $perm=='ro') die(json_encode(array('error'=>'You do not have rights to modify the settings')));

      // owner or user with writable access can modify share settings
      $perm=$_REQUEST['perm'];

      execQuery("DELETE FROM shares WHERE diagramID=".$id);
      foreach($perm as $p)
      {
         if ($p['email']!='')
         execQuery("INSERT IGNORE INTO shares SET email=\"".mysqli_escape($p['email'])."\", perm=\"".mysqli_escape($p['perm'])."\", diagramID=".$id);
      }
   }

?>