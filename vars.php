<?php
   ob_start('ob_gzhandler');

   require('version.php');
   require_once('inc_db.php');
   require_once('inc_lib.php');
   require('config_user.php');

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

   function fetch($res)
   {
      $row=mysqli_fetch_assoc($res);
      $res=[];
      if (!$row || count($row)<1) return $res;
      foreach($row as $key=>$val) $res[preg_replace("{^[^_]+_}","",$key)]=is_null($val)?null:preg_replace("{\\s+}","_",trim($val));
      return $res;
   }


   // send autocomplete data from databases prefixed by SCOS_
   $resultDB=execQuery("SHOW DATABASES LIKE 'SCOS_%'"); // result order is undefined
   while($database=mysqli_fetch_assoc($resultDB))
   {
      $database=reset($database);
      // Telemetry Reports
      // PID: data
      // PCF: params
      // PLF: assignment of params to data

      $telemetry_reports=[];
      $result=execQuery("SELECT * FROM $database.pid");
      while($row=fetch($result))
      {
         $row['params']=[];
         $params=execQuery("SELECT * FROM $database.pcf, $database.plf WHERE PLF_NAME=PCF_NAME and PLF_SPID=\"".mysqli_escape($row['SPID'])."\"");
         while($par=fetch($params)) $row['params'][]=$par;
         $telemetry_reports[]=$row;
      }

      // Telecommands
      // CCF: data
      // CDF: 
      // CPC: 

      $telecommands=[];
      $result=execQuery("SELECT * FROM $database.ccf");
      while($row=fetch($result))
      {
         $row['params']=[];
         $params=execQuery("SELECT * FROM $database.cdf,$database.cpc WHERE CPC_PNAME=CDF_PNAME and CDF_CNAME=\"".mysqli_escape($row['CNAME'])."\"");
         while($par=fetch($params))
         {
            $parref=execQuery("SELECT * FROM $database.pas WHERE PAS_NUMBR=\"".mysqli_escape($par['PAFREF'])."\"");
            $par['params']=[];
            while($ref=fetch($parref)) $par['params'][]=$ref;
            $row['params'][]=$par;
         }
         $telecommands[]=$row;
      }

      // send whole autocoplete object for current SCOS_ database
      echo "g.autocomplete['".$database."']=".json_encode(["TM"=>$telemetry_reports, "TC"=>$telecommands]).";";
   }


   // send version
   echo "g.currentVersion=\"".$version."\";";



?>
