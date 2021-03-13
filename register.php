<?php
   require_once('inc_db.php');
   require_once('inc_lib.php');
   require_once('inc_mail.php');

   $pass=nicePassword();

   // register the user

   if (trim($_POST['email'])=='' || trim($_POST['name'])=='') die("Both fields are mandatory and cannot be empty");
   execQuery("INSERT IGNORE INTO users SET email=\"".mysqli_escape($_POST['email'])."\", fullName=\"".$_POST['name']."\", registered=NOW(), pass='".md5($pass)."'");
   if (affectedRows()>0) echo "ok";
   else die("Username (email) already exists");

   // mail him his password
   sendmailPHP("fw.profile@pnp-software.com",$_POST['email'],"Your password for FW Profile editor","Dear ".$_POST['name'].",\n\nthank you for your interest in FW Profile editor.\n"
   ."Your free account has been set up,\nplease login using the following:\n\nusername: ".$_POST['email']."\npassword: ".$pass."\n\nFeel free to reply to this email if you have any question\n\nFW Profile team");
?>