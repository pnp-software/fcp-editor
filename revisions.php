<?php

   require_once('inc_db.php');
   require_once('inc_session.php');

   $id=$_REQUEST['id']+0;

   if (userID()<1) die(json_encode(array('error'=>'User is not signed in, please sign in.')));

   $perm=access_rights($id);
   if ($perm=='') die(json_encode(array('error'=>'You do not have rights to access history for this diagram')));

   $revisions=array();

   // add all other saved version to the list of revisions
   $result=execQuery("SELECT history.*,users.fullName FROM history LEFT JOIN users ON users.id=history.userID WHERE diagramID=".$id." ORDER BY id DESC");
   while($row=mysqli_fetch_assoc($result))
   {
      $revisions[]=$row;
   }

   echo json_encode(array('revisions'=>$revisions));
?>