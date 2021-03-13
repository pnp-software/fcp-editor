<?php

   require_once('inc_db.php');
   require_once('inc_lib.php');
   require_once('inc_session.php');
   require('config.php');

   if (userID()!=$exampleUserID) die("You are not authorized to see this. Please login first.");

   if ($_REQUEST['seeas']>0)
   {
      $_SESSION['id']=$_REQUEST['seeas']+0;
      $_SESSION['name']=$_REQUEST['name'];
      $_SESSION['email']='';
      header("Location: ./");
      die();
   }

   echo '<meta http-equiv="content-type" content="text/html; charset=UTF-8">';
   echo "<style>td { font-family: Verdana; font-size: 10px; } </style>";
   echo "<table border=0 cellspacing=1 cellpadding=5 bgcolor=silver>";

   echo "<tr>";
   echo "<td>id</td>";
   echo "<td>name</td>";
   echo "<td>email</td>";
   echo "<td>registered</td>";
   echo "<td>last login</td>";
   echo "<td>diagrams</td>";
   echo "<td>sign in</td>";
   echo "</tr>";

   $result=execQuery("SELECT *, (SELECT count(*) FROM diagrams WHERE userID=users.id) as cnt FROM users ORDER BY cnt DESC, id");
   while($row=mysqli_fetch_assoc($result))
   {
      echo "<tr bgcolor=white>";
      echo "<td>".$row['id']."</td>";
      echo "<td>".$row['fullName']."</td>";
      echo "<td>".$row['email']."</td>";
      echo "<td>".$row['registered']."</td>";
      echo "<td>".$row['lastLogin']."</td>";
      echo "<td align=right>".$row['cnt']."</td>";
      echo "<td><a target=_blank href=\"users.php?seeas=".$row['id']."&name=".urlencode($row['fullName'])."\">sign in</a>";
      echo "</tr>";
   }

   echo "</table>";
?>