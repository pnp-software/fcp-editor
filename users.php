<?php

   require_once('inc_db.php');
   require_once('inc_lib.php');
   require_once('inc_session.php');
   require('config_user.php');

   $html="<html><head><meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\"></head><body>".
         "<script type='text/javascript' src=js/jquery.min.js></script>".
         "<style>td,body { font-family: Verdana; font-size: 12px; } button,input {padding:10px; margin: 1px;} i { color: red; display: block; margin-bottom: 20px; } .delbtn { font-weight: bold; cursor: pointer; margin: -5px; padding: 5px; } .delbtn:hover { color: red; } a { color: #00f; text-decoration: none; } a:hover { text-decoration: underline; } </style>";

   // check if user is signed in
   // if not, provide login form
   //
   if (userID()!=$exampleUserID)
   {
      echo $html;
      echo "You are not authorized to see this. Please login first.<br><br>";

      echo "<table border=0 cellspacing=0 cellpadding=5>
            <tr><td>E-mail:</td><td><input type=text id=loginEmail placeholder='your@email' autocomplete=off spellcheck=false></td></tr>
            <tr><td>Password:</td><td><input type=password id=loginPass placeholder='your password' autocomplete=off spellcheck=false></td></tr>
            <tr><td></td><td><button type=submit id=signinbtn>Sign In</button></td></tr>
            </table>";

      echo '<script> $("#signinbtn").on("click",function(){
         $.post("login.php",{"email":$("#loginEmail").val(),"pass":$("#loginPass").val()},function(ret)
         {
            ret=JSON.parse(ret);
            if (ret.userID=='.$exampleUserID.') location.reload(); // special user id
            else alert("Incorrect user/password combination, or current user cannot see this");
         });
      });</script>';
      die();
   }


   // user requested to be signed in as a different user:
   //
   if ($_REQUEST['seeas']>0)
   {
      $_SESSION['id']=$_REQUEST['seeas']+0;
      $_SESSION['name']=$_REQUEST['name'];
      $_SESSION['email']='';
      header("Location: ./");
      die();
   }


   if ($_REQUEST['action']=='deletedb')
   {
      $db=trim($_REQUEST['dbname']);
      if (!preg_match("{^SCOS_}",$db)) die("Error: Only databases with prefix SCOS_ can be deleted this way");
      execQuery("DROP DATABASE ".$db);
      echo "ok";
      die();
   }


   $status=[];

   $dbs=[];
   $result=execQuery("SHOW DATABASES LIKE 'SCOS_%'"); // result order is undefined
   while($database=mysqli_fetch_assoc($result))
   {
      $database=reset($database);
      $dbs[]=$database;
   }

   echo $html; // header

   // user uploaded a file to import SCOS database
   //
   if ($_REQUEST['ac']=='import')
   {
      $db=trim($_REQUEST['dbname']);
      $i=trim($_REQUEST['instructions']);
      $zipfile=$_FILES['zip']['tmp_name'];
      if ($db=='' || !preg_match("{^SCOS_[a-zA-Z0-9._]+\$}",$db)) { echo "<i>Error: database name must match format: SCOS_x_y_z</i>"; goto out; }
      if (!is_uploaded_file($zipfile)) { echo "<i>Error: upload file not found</i>"; goto out; }
      else // file is uploaded and is OK, database name is OK, lets continue
      {
         // read ZIP data
         $z = new ZipArchive();
         $ok=$z->open($zipfile);
         if (!$ok) { echo "<i>Error: zip file cannot be read"; goto out; }

         // parse instructions
         $in=preg_split("{(\r*\n)+}",trim($_REQUEST['instructions']));
         $instructions=[];
         foreach($in as $line)
         {
            preg_match("{^([a-z]+):(.*)}",$line,$matches1);
            $pref=array_map('trim',preg_split("{,}",$matches1[2]));

            foreach($pref as $p)
            {
               preg_match("{([A-Z0-9_]+)=([0-9]+)}i",$p,$matches2);
               $instructions[$matches1[1]][$matches2[1]]=$matches2[2];
            }
         }

         // check if database exists, if yes, error
         if (in_array($db,$dbs)) { echo "<i>Error: Database $db already exists</i>"; goto out; }

         // create database
         execQuery("CREATE DATABASE ".$db);
         $dbs[]=$db;

         // create tables
         execQuery("CREATE TABLE ".$db.".ccf (CCF_CNAME varchar(255) NOT NULL,CCF_DESCR varchar(255) NOT NULL,CCF_DESCR2 varchar(255) DEFAULT NULL,
                                              CCF_TYPE int(11) DEFAULT NULL,CCF_STYPE int(11) DEFAULT NULL,CCF_NNAME varchar(64),CCF_NDESCR text,PRIMARY KEY (CCF_CNAME))");
         execQuery("CREATE TABLE ".$db.".cdf (CDF_CNAME varchar(255) NOT NULL,CDF_GRPSIZE int(255) DEFAULT NULL,CDF_PNAME varchar(255) DEFAULT NULL)");
         execQuery("CREATE TABLE ".$db.".cpc (CPC_PNAME varchar(255) NOT NULL,CPC_DESCR varchar(255) DEFAULT NULL,CPC_PAFREF varchar(255) DEFAULT NULL,
                                              CPC_NNAME varchar(64),CPC_NDESCR text,PRIMARY KEY (CPC_PNAME))");
         execQuery("CREATE TABLE ".$db.".pas (PAS_NUMBR varchar(255) NOT NULL,PAS_ALTXT varchar(255) NOT NULL,PAS_ALVAL varchar(255) NOT NULL,PRIMARY KEY (PAS_NUMBR,PAS_ALVAL))");
         execQuery("CREATE TABLE ".$db.".pcf (PCF_NAME varchar(255) NOT NULL,PCF_DESCR varchar(255) DEFAULT NULL,PCF_PID double DEFAULT NULL,
                                              PCF_NNAME varchar(64),PCF_NDESCR text,PRIMARY KEY (PCF_NAME))");
         execQuery("CREATE TABLE ".$db.".pid (PID_TYPE int(11) NOT NULL,PID_STYPE int(11) NOT NULL,PID_SPID int(11) NOT NULL,PID_DESCR varchar(255) DEFAULT NULL,
                                              PID_NNAME varchar(64),PID_NDESCR text,PRIMARY KEY (PID_TYPE,PID_STYPE,PID_SPID),KEY PID_SPID (PID_SPID))");
         execQuery("CREATE TABLE ".$db.".plf (PLF_NAME varchar(255) NOT NULL,PLF_SPID int(11) NOT NULL,PRIMARY KEY (PLF_NAME,PLF_SPID))");

         // import files one by one
         foreach (['ccf','cdf','cpc','pas','pcf','pid','plf'] as $table)
         {
            $status[$table]="<span style='color:red'>not found!</span>"; // initial value

            $data=[];
            for($i=0;$i<$z->numFiles;$i++)
            {
               $filepath=$z->getNameIndex($i);
               if (basename($filepath)==$table.".dat") { $data=preg_split("{(\r*\n)+}",$z->getFromName($filepath)); $status[$table]=$filepath; break; }
            }

            $data=array_filter($data);
            if (count($data)==0) continue;

            foreach($data as $line)
            {
               $set=[];
               $line=preg_split("{\t}",$line);
               foreach($instructions[$table] as $col=>$ix)
               {
                  $val=$line[$ix-1]; if ($val=='') $val="NULL"; else $val="\"".mysqli_escape($val)."\"";
                  $ex=execQuery("SHOW COLUMNS FROM ".$db.".".$table." LIKE '".$col."'"); $ex=count(mysqli_fetch_assoc($ex))?TRUE:FALSE;
                  if ($ex) $set[]=$col."=".$val;
               }
               if (count($set)>0) execQuery("INSERT IGNORE INTO ".$db.".".$table." SET ".join(",",$set));
            }

            $status[$table].=" ... ".count($data)." entries imported OK";
         }

      }
   }

   out:

   usort($dbs,'version_compare');


   // list of imported tables
   //
   if (count($status)>0)
   {
      echo "<h3>Import finished for newly created database ".$db.". Status below:</h3><pre>";
      foreach($status as $key=>$val) echo "Table $key: ".$val."<br>";
      echo "</pre><br><br>";
   }


   // top buttons
   echo "<button id=signoutbtn>Sign Out</button> &nbsp; ";
   echo "<button id=newscosbtn>+ Upload new SCOS database</button>";
   echo '<script> $("#signoutbtn").on("click",function(){ $.post("login.php",{},function(ret) { location.reload(); }); });</script>';
   echo '<script> $("#newscosbtn").on("click",function(){ $("#uploadform").toggle(); });</script>';


   // hidden upload form for scos database import from ZIP file
   echo "<div style='display:none' id=uploadform>";
   echo "<br><br>";
   echo "<form id=uploadform method=post action=\"".htmlspecialchars($_SERVER['PHP_SELF'])."\" enctype='multipart/form-data'>";
   echo "<input type=hidden name=ac value=import>";
   if (!class_exists("ZipArchive")) echo "<i>Warning: your PHP installation seems to be missing ZipArchive, please install it and refresh this page.<br>Example installation command: sudo apt-get install php-zip</i>";
   echo "Upload new database by uploading ZIP file with CSV data (may take several minutes):<br><br>";
   echo "<table border=0 cellspacing=1 cellpadding=5 bgcolor=silver>";
   echo "<tr><td>ZIP file for upload:</td><td bgcolor=white><input type=file name=zip style='padding:0;'></td></tr>";
   echo "<tr><td>Create database name:</td><td bgcolor=white><input type=text name=dbname placeholder='For example: SCOS_1_2' style='padding: 5px; width: 250px;'></td></tr>";
   echo "<tr><td valign=top>Import instructions:</td><td bgcolor=white><textarea cols=100 rows=9 name=instructions style='padding: 5px;'>";
   echo "ccf: CCF_CNAME=1, CCF_DESCR=2, CCF_DESCR2=3, CCF_TYPE=7, CCF_STYPE=8, CCF_NNAME=21, CCF_NDESCR=22\n";
   echo "cdf: CDF_CNAME=1, CDF_GRPSIZE=6, CDF_PNAME=7\n";
   echo "cpc: CPC_PNAME=1, CPC_DESCR=2, CPC_PAFREF=11, CPC_NNAME=16, CPC_NDESCR=17\n";
   echo "pas: PAS_NUMBR=1, PAS_ALTXT=2, PAS_ALVAL=3\n";
   echo "pcf: PCF_NAME=1, PCF_DESCR=2, PCF_PID=3, PCF_NNAME=24, PCF_NDESCR=25\n";
   echo "pid: PID_TYPE=1, PID_STYPE=2, PID_SPID=6, PID_DESCR=7, PID_NNAME=16, PID_NDESCR=17\n";
   echo "plf: PLF_NAME=1, PLF_SPID=2\n";
   echo "</textarea></td></tr>";
   echo "<tr><td></td><td bgcolor=white><input type=submit value='Start upload' id=uploadbtn><img id=waitimage src=img/wait32.gif style='display: none; position: absolute; margin: 4px;'></td></tr>";
   echo "</table>";
   echo "</form>";
   echo "</div>";
   echo '<script> $("#uploadbtn").on("click",function(ev){ setTimeout(function(){$("#uploadbtn").prop("disabled",true);},100);  $("#waitimage").css("display","inline"); });</script>';

   // list of known SCOS databases
   //
   echo "<br><br>";
   echo "<h1>SCOS databases</h1>";
   echo "<table border=0 cellspacing=1 cellpadding=5 bgcolor=silver>";

   echo "<tr>";
   echo "<td>database name</td><td></td>";
   echo "</tr>";

   foreach($dbs as $database)
   {
      echo "<tr bgcolor=white>";
      echo "<td>".$database."</td>";
      echo "<td><span class=delbtn>&times;</span></td>";
      echo "</tr>";
   }
   echo "</table>";
   echo '<script>$(".delbtn").on("click",function(ev){ var n=$(ev.target).parent().prev().text(); if (confirm("Delete database "+n+"?"))
   {
      $.post("users.php",{"action":"deletedb","dbname":n},function(res){
         if (res=="ok") location.search="r="+Math.random(); // force reload if successful
         else alert(res); // print error
      })
   } })</script>';


   // list of all known users
   //
   echo "<h1>All users</h1>";

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
      echo "<td><a href=\"users.php?seeas=".$row['id']."&name=".urlencode($row['fullName'])."\">sign in as this user</a>";
      echo "</tr>";
   }

   echo "</table>";
?>
