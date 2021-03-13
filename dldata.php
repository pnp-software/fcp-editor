<?php
   require_once('inc_lib.php');

   $dldata=array();
   $dldecode=array();
   $dlname=array();
   $dlfolder=array();

   foreach ($_REQUEST as $key=>$val)
   {
      if (preg_match("{dldata([0-9]*)}",$key,$matches)) $dldata[$matches[1]+0]=$val;
      if (preg_match("{dldecode([0-9]*)}",$key,$matches)) $dldecode[$matches[1]+0]=$val;
      if (preg_match("{dlname([0-9]*)}",$key,$matches)) $dlname[$matches[1]+0]=$val;
      if (preg_match("{dlfolder([0-9]*)}",$key,$matches)) $dlfolder[$matches[1]+0]=$val;
   }

   if (count($dldecode)>0)
   foreach($dldecode as $key=>$val) if ($val=='true')
   {
      $dldata[$key]=base64_decode(preg_replace("{^[^,]+,}","",$dldata[$key]));
   }

   // ------------------------------------------------------------
   // one file is sent as is
   if (count($dlname)==1)
   {
      $name=reset($dlname);
      $data=reset($dldata);

      if ($name!='') sendDownloadHeaders($name);
      echo $data;
      die();
   }

   // ------------------------------------------------------------
   // multiple files are zipped and sent together
   // optionally put in subfolders

   // create empty unique temporary directory
   // we assume that the full path doesn't contain any quotes character " later
   $dir=getcwd()."/tmp/".time();
   while (!mkdir($dir)) $dir.="x";
   $target=$dir.".out";

   function cleanup()
   {
      global $dir;
      global $target;
      shell_exec("rm -Rf \"$dir\"");
      unlink($target);
      rmdir($dir);
   }
   register_shutdown_function('cleanup');

   foreach($dlname as $key=>$name)
   {
      $name=str_replace("/","_",$name);
      $subdir=str_replace("/","_",$dlfolder[$key]);
      if ($subdir!='') @mkdir($dir."/".$subdir);
      file_put_contents($dir."/".($subdir!=''?$subdir."/":"").$name,$dldata[$key]);
   }

   shell_exec("cd \"$dir\" && zip -1 -r \"$target\" .");

   sendDownloadHeaders($_REQUEST['zipname']."_".date("Y-m-d_H-i-s").".zip");
   readfile($target);

   // cleanup is called automatically
   exit;
?>
