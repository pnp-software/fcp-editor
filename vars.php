<?php
   require('config.php');
   require('version.php');
   require_once('inc_db.php');
   require_once('inc_lib.php');

   header("Content-Type: text/javascript");

   // get diagram presets for empty diagrams and example diagrams from database from the example user
   $empty=array(); $examples=array();
   $result=execQuery("SELECT * FROM diagrams WHERE userID='".$exampleUserID."' ORDER BY name");
   while($row=mysqli_fetch_assoc($result))
      if ($row['isEmpty']=='Y') $empty[]=$row; else $examples[]=$row;

   // send diagram presets
   echo "var files=[";
   foreach($empty as $row) echo json_encode($row).",";
   echo "];";
   echo "for (var i=0; i<files.length; i++) fileListAppend(\"#createnew\",files[i],false);";
   echo "files=[";
   foreach($examples as $row) echo json_encode($row).",";
   echo "];";
   echo "for (var i=0; i<files.length; i++) fileListAppend(\"#examples\",files[i],false);";
   echo "\n";


   // send autocomplete data from databases prefixed by SCOS_
   $result=execQuery("SHOW DATABASES LIKE 'SCOS_%'"); // result order is undefined
   while($database=reset(mysqli_fetch_assoc($result)))
   {
      $autocomplete=[];

      // get telecommands #TC and add to autocomplete list
      $resultTC=execQuery("SELECT * FROM ".$database.".ccf");
      while($row=mysqli_fetch_assoc($resultTC))
         $autocomplete[]="\""."#TC(".$row['CCF_TYPE'].",".$row['CCF_STYPE'].")[".$row['CCF_CNAME']."] ".$row['CCF_DESCR']." [".$row['CCF_DESCR2']."]\"";

      // get telemetry reports #TM and add to autocomplete list
      $resultTM=execQuery("SELECT * FROM ".$database.".pid");
      while($row=mysqli_fetch_assoc($resultTM))
         $autocomplete[]="\""."#TM(".$row['PID_TYPE'].",".$row['PID_STYPE'].")[".$row['PID_SPID']."] ".$row['PID_DESCR']."\"";

      // send whole autocoplete object for current SCOS_ database
      echo "g.autocomplete['".$database."']=[".join(",",$autocomplete)."];";
   }


   // send version
   echo "g.currentVersion=\"".$version."\";";

   

?>
