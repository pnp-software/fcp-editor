<?php

   require_once('inc_db.php');
   require_once('inc_lib.php');
   require_once('inc_mail.php');
   require_once('inc_session.php');

   $email=trim($_REQUEST['e']);
   $hash=trim($_REQUEST['h']);
   $pw=trim($_REQUEST['pw']);

   $user=mysqli_fetch_assoc(execQuery("SELECT * FROM users WHERE email=\"".mysqli_escape($email)."\""));

   // ensure that user exists
   if ($user['id']<1) die("No such user or email.");

   // handle user request to send reset code by email
   if ($hash=='')
   {
      $hash=md5(nicePassword(32));
      execQuery("UPDATE users SET passResetCode='".$hash."' WHERE id=".$user['id']);
      sendmailPHP("noreply@pnp-software.com",$user['email'],"Password reset code for FW Profile editor","Dear user.\nPassword reset code for you is following:\n\n".$hash);
      die("ok");
   }

   // ensure that user has valid reset link (compare hashes)
   if ($hash!=$user['passResetCode']) die("Wrong reset code provided.");

   // user submitted the form to change password. User exissts. User reset code matches. Change password
   if ($pw=='') die("Password must not be empty");
   execQuery("UPDATE users SET pass=\"".md5($pw)."\", passResetCode='' WHERE id=".$user['id']);
   echo "changed";

?>