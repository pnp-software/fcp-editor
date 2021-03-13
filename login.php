<?php

   require_once('inc_db.php');
   require_once('inc_lib.php');
   require_once('inc_session.php');

   // check if user is registered and provided correct password
   $row=mysqli_fetch_assoc(execQuery("SELECT * FROM users WHERE email=\"".mysqli_escape($_POST['email'])."\""));
   if ($row['email']!='' && $row['pass']!='' && $row['pass']==md5($_POST['pass']))
   {
      // remember in session
      $_SESSION['id']=$row['id'];
      $_SESSION['email']=$row['email'];
      $_SESSION['name']=$row['fullName'];
      execQuery("UPDATE users SET lastLogin=NOW() WHERE id=".$row['id']);
   }
   else // logout
   {
      $_SESSION['id']=0;
      $_SESSION['email']='';
      $_SESSION['name']='';
   }

   // send the file list
   require_once('load.php');
?>