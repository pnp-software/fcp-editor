<?php

   // send mail using PHP's mail() function. If that doesn't work,
   // try to send it through mandrillapp
   function sendmailPHP($from,$to,$subject,$body)
   {
      $ok=mail($to,$subject,$body,'From: '.$from);
      if (!$ok) $ok=sendmail($from,$to,$subject,$body);
      return $ok;
   }


   function ffgets($sock)
   {
      do { $data=fgets($sock); } while (!preg_match("{^[0-9]+[ ]}",$data));
      return $data;
   }

   function ffwrite($sock,$data)
   {
      return fwrite($sock,$data);
   }


   // send mail through mandrillapp.com
   // If you want to use this, register at mandrillapp.com and fill in $user and $pass
   // in this function ($pass is the API key you get)
   function sendmail($from,$to,$subject,$body,$headers='')
   {
      $CRLF="\r\n";
      $user="";
      $pass="";
      if ($user=='') error_log("No mailing agent found. Fix your PHP's config to support mail() function properly or edit ./inc_mail.php's sendmail() function and add your mandrillapp.com's account's user and pass");
      if (!preg_match("{<.+@.+>}",$from)) $from="<$from>";
      if (!preg_match("{<.+@.+>}",$to)) $to="<$to>";

      $sock=fsockopen("ssl://smtp.mandrillapp.com",465,$errno,$errstr,30);
      if (!$sock) return false;
      stream_set_timeout($sock,30);

      // read the initial welcome lines until valid response is received
      $s=ffgets($sock);
      if ($s+0!=220) return false;

      // send the mail headers
      fwrite($sock,"EHLO localhost".$CRLF);
      $s=ffgets($sock);
      if ($s+0!=250) return false;

      fwrite($sock,"AUTH LOGIN".$CRLF);
      $s=ffgets($sock);
      if ($s+0!=334) return false;

      fwrite($sock,base64_encode($user).$CRLF);
      $s=ffgets($sock);
      if ($s+0!=334) return false;

      fwrite($sock,base64_encode($pass).$CRLF);
      $s=ffgets($sock);
      if ($s+0!=235) return false;

      fwrite($sock,"MAIL FROM:".strstr($from,"<").$CRLF);
      $s=ffgets($sock);
      if ($s+0!=250) return false;
      fwrite($sock,"RCPT TO:".strstr($to,"<").$CRLF);
      $s=ffgets($sock);
      if ($s+0!=250) return false;
      fwrite($sock,"DATA".$CRLF);
      $s=ffgets($sock);
      if ($s+0!=354) return false;

      // build headers for the mail message
      if (is_array($headers)) $headers=join($CRLF,$headers);

      // send the data
      $data="From: $from".$CRLF."To: $to".$CRLF.($headers?$headers.$CRLF:'')."Content-Type: text/plain; charset=UTF-8".$CRLF."Content-Transfer-Encoding: base64".$CRLF."Subject: $subject".$CRLF.$CRLF.preg_replace("{[\n][.]}","\n..",chunk_split(base64_encode($body),76,$CRLF));
      fwrite($sock,$data.$CRLF.".".$CRLF);
      $s=ffgets($sock);
      if ($s+0!=250) return false;
      fwrite($sock,"QUIT".$CRLF);
      return true;
   }
?>