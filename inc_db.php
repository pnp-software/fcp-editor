<?php
  // ------------------------------------------------------
  // This script should be called with include_once()
  // If a SELECT statement is to be executed, it runs the query on a slave database on localhost
  // If another statement (eg. UPDATE) is to be executed, it reconnects to master and all further
  // connections are executed only on the remote master.
  // ------------------------------------------------------

  function mysqli_escape($text)
  {
     return str_replace(array('\\', "\0", "\n", "\r", "'", '"', "\x1a"), array('\\\\', '\\0', '\\n', '\\r', "\\'", '\\"', '\\Z'), $text); //"
  }

  function mysqli_result($result, $row = 0, $field = 0)
  {
    mysqli_data_seek($result,$row);
    $row=mysqli_fetch_row($result);
    return $row[$field];
  }

  function execQuery($queryString,$dieOnError=true)
  {
     GLOBAL $dbcon_link_db;

     require('config.php'); // sql settings

     // if mysql connection is not set, setup it now
     if (!$dbcon_link_db)
     {
        for ($i=1;$i<50;$i++)
        {
           $dbcon_link_db=@mysqli_connect($sql_settings['host'],$sql_settings['user'],$sql_settings['pass']);
           if ($dbcon_link_db) break; // ok
           trigger_error("MySQL connect attempt ".($i+1),E_USER_NOTICE);
           if ($i<20) sleep($i);
        }

        if (!$dbcon_link_db) // can't connect
        {
           trigger_error("Fatal error: Can't connect to MySQL. ".mysqli_error($dbcon_link_db)." Query: $queryString",E_USER_NOTICE);
           if ($dieOnError) die(); else return;
        }

        if (!mysqli_select_db($dbcon_link_db, $sql_settings['dbname']))
        {
           trigger_error("Fatal error: cant access database $dbname ".mysqli_error($dbcon_link_db)." Query: $queryString",E_USER_NOTICE);
           if ($dieOnError) die(); else return;
        }
     }

     $result=mysqli_query($dbcon_link_db, $queryString);
     if (!$result)
     {
        trigger_error("Fatal error: The query $queryString has generated error ".mysqli_error($dbcon_link_db),E_USER_NOTICE);
        if ($dieOnError) die(); else return;
     }
     return $result;
  }

  function closeCurrentDbConnection()
  {
     GLOBAL $dbcon_link_db;
     @mysqli_close($dbcon_link_db);
     unset($dbcon_link_db);
  }

  function affectedRows()
  {
     GLOBAL $dbcon_link_db;
     return @mysqli_affected_rows($dbcon_link_db);
  }

  function insertId()
  {
     GLOBAL $dbcon_link_db;
     mysqli_insert_id($dbcon_link_db);
  }

?>