<?php
   require('config.php');
   require('version.php');
   require_once('inc_db.php');
   require_once('inc_lib.php');

   $empty=array(); $examples=array();
   $result=execQuery("SELECT * FROM diagrams WHERE userID='".$exampleUserID."' ORDER BY name");
   while($row=mysqli_fetch_assoc($result))
      if ($row['isEmpty']=='Y') $empty[]=$row; else $examples[]=$row;

   header("Content-Type: text/javascript");
   echo "var files=[";
   foreach($empty as $row) echo json_encode($row).",";
   echo "];";
   echo "for (var i=0; i<files.length; i++) fileListAppend(\"#createnew\",files[i],false);";
   echo "files=[";
   foreach($examples as $row) echo json_encode($row).",";
   echo "];";
   echo "for (var i=0; i<files.length; i++) fileListAppend(\"#examples\",files[i],false);";
   echo "\n";
   echo "g.currentVersion=\"".$version."\";";
?>
