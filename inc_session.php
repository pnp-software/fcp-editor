<?php
   include_once('inc_db.php');
   require_once('inc_lib.php');

   function userID()
   {
      return $_SESSION['id']+0;
   }

   function sqlses_open($save_path, $name)
   {
      return true;
   }
   function sqlses_close()
   {
      return true;
   }

   function sqlses_read($id)
   {
      return (string) @mysqli_result(execQuery("SELECT sessionData FROM sessions WHERE id=\"".mysqli_escape($id)."\" LIMIT 1"),0);
   }

   function sqlses_write($id, $data)
   {
      execQuery("REPLACE sessions SET id=\"".mysqli_escape($id)."\", lastUpdate=NOW(), userID=\"".mysqli_escape(userID())."\", userIP=\"".mysqli_escape($_SERVER['REMOTE_ADDR'])."\", sessionData=\"".mysqli_escape($data)."\"");
      return affectedRows();
   }

   function sqlses_destroy($id)
   {
      execQuery("DELETE FROM sessions WHERE id=\"".mysqli_escape($id)."\"");
      return affectedRows();
   }

   function sqlses_gc($maxlifetime)
   {
      execQuery("DELETE FROM sessions WHERE lastUpdate < NOW() - INTERVAL 24 HOUR");
      return true;
   }

   session_set_cookie_params(0);
   session_set_save_handler("sqlses_open", "sqlses_close", "sqlses_read", "sqlses_write", "sqlses_destroy", "sqlses_gc");
   session_start();
?>
