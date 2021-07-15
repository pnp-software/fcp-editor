<?php

   require('inc_db.php');
   require('config.php');

   echo "Creating mysql tables (if not exist)... ";

   $result=execQuery("CREATE TABLE IF NOT EXISTS diagrams (
   id int(10) unsigned NOT NULL AUTO_INCREMENT,
   userID int(10) unsigned NOT NULL,
   name varchar(255) NOT NULL,
   isEmpty enum('N','Y') NOT NULL DEFAULT 'N',
   editorType varchar(255) NOT NULL,
   lastUpdate datetime NOT NULL,
   fwprop mediumtext NOT NULL,
   svg mediumtext NOT NULL,
   width int(10) unsigned NOT NULL,
   height int(10) unsigned NOT NULL,
   PRIMARY KEY (id),
   KEY name (name,userID),
   KEY userID (userID)
   ) ENGINE=MyISAM ");

   $result=execQuery("CREATE TABLE IF NOT EXISTS sessions (
   id char(32) NOT NULL,
   lastUpdate datetime NOT NULL,
   userID varchar(255) NOT NULL,
   userIP varchar(255) NOT NULL,
   sessionData text NOT NULL,
   PRIMARY KEY (id),
   KEY lastUpdate (lastUpdate),
   KEY userID (userID),
   KEY userIP (userIP)
   ) ENGINE=MyISAM");


   $result=execQuery("CREATE TABLE IF NOT EXISTS users (
   id int(10) unsigned NOT NULL AUTO_INCREMENT,
   email varchar(255) NOT NULL,
   pass varchar(255) NOT NULL,
   fullName varchar(255) NOT NULL,
   registered datetime NOT NULL,
   lastLogin datetime NOT NULL,
   passResetCode varchar(255) NOT NULL,
   idMap MEDIUMTEXT NOT NULL,
   PRIMARY KEY (id),
   UNIQUE KEY email (email)
   ) ENGINE=MyISAM");

   $result=execQuery("CREATE TABLE IF NOT EXISTS shares (
   id int(10) unsigned NOT NULL AUTO_INCREMENT,
   diagramID int(10) unsigned NOT NULL,
   email varchar(255) NOT NULL,
   perm enum('ro','rw') NOT NULL,
   PRIMARY KEY (id),
   KEY diagramID (diagramID)
   ) ENGINE = MYISAM");

   $result=execQuery("CREATE TABLE IF NOT EXISTS history (
   id int(10) unsigned NOT NULL AUTO_INCREMENT,
   diagramID int(10) unsigned NOT NULL,
   userID int(10) unsigned NOT NULL,
   name varchar(255) NOT NULL,
   isEmpty enum('N','Y') NOT NULL DEFAULT 'N',
   editorType varchar(255) NOT NULL,
   lastUpdate datetime NOT NULL,
   fwprop mediumtext NOT NULL,
   svg mediumtext NOT NULL,
   width int(10) unsigned NOT NULL,
   height int(10) unsigned NOT NULL,
   PRIMARY KEY (id),
   KEY diagramID (diagramID)
   ) ENGINE = MYISAM");

   echo "Done. MySQL installation successful.<br>";

   echo "Creating example user...<br>";
   execQuery('INSERT IGNORE INTO users VALUES(\''.$exampleUserID.'\', \''.$exampleUsername.'\', \''.md5($exampleUserpass).'\', \'Example User\', \'2013-07-30 19:29:51\', \'2013-07-30 20:27:50\', \'\', \'\')');

   echo "Inserting example diagrams...<br>";
   execQuery('INSERT IGNORE INTO diagrams VALUES(2, \''.$exampleUserID.'\', \'New Procedure\',  \'Y\',\'Procedure\', NOW(), \'{\\n "states": [],\\n "connections": [],\\n "globals": {\\n  "paperPanX": 0,\\n  "paperPanY": 0,\\n  "attrs": {\\n "x": 0,\\n "y": 0,\\n "width": 1920,\\n "height": 912,\\n "r": 0,\\n "rx": 0,\\n "ry": 0,\\n "fill": "#eee",\\n "stroke": "#000",\\n "stroke-width": 0\\n  },\\n  "fwprop": {\\n "smName": "",\\n "editorType": "Pr",\\n "globalvar": [\\n {\\n "type": "int",\\n "name": "",\\n "value": ""\\n }\\n ],\\n "smIncludes": "",\\n "smNotes": "",\\n "memalloc": "dynamic"\\n  }\\n }\\n}\', \'<svg height="400" version="1.1" width="800" xmlns="http://www.w3.org/2000/svg" style="overflow: hidden; position: relative;" viewBox="0 0 800 400" preserveAspectRatio="xMinYMin"><desc style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">Created with Raphaël 2.1.0</desc><defs style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></defs><rect x="0" y="0" width="1920" height="912" r="0" rx="0" ry="0" fill="#eeeeee" stroke="#000" stroke-width="0" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></rect><rect x="232.00033277398325" y="227" width="8" height="8" r="4" rx="4" ry="4" fill="#ff0000" stroke="#000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); display: none;" stroke-width="1"></rect></svg>\', 800, 400)');
   execQuery('INSERT IGNORE INTO diagrams VALUES (5, \''.$exampleUserID.'\', \'Example 3\', \'N\', \'Procedure\', \'2015-03-24 03:15:10\', \'{\n "states": [\n  {\n   "id": 82,\n   "attrs": {\n    "x": 179,\n    "y": 91,\n    "width": 30,\n    "height": 30,\n    "r": 15,\n    "rx": 15,\n    "ry": 15,\n    "fill": "#fff",\n    "stroke": "#666",\n    "stroke-width": 1,\n    "fill-opacity": 100\n   },\n   "fwprop": {\n    "autoid": 1,\n    "type": "init",\n    "note": "Initial node. The procedure starts here"\n   },\n   "selected": false\n  },\n  {\n   "id": 83,\n   "attrs": {\n    "x": 262,\n    "y": 91,\n    "width": 104,\n    "height": 30,\n    "r": 10,\n    "rx": 10,\n    "ry": 10,\n    "fill": "#fff",\n    "stroke": "#666",\n    "stroke-width": 1,\n    "fill-opacity": 100\n   },\n   "fwprop": {\n    "autoid": 1,\n    "type": "state",\n    "note": "Action node 1",\n    "identifier": "NODE1",\n    "entryFunc": "Action1",\n    "doFunc": "",\n    "exitFunc": "",\n    "entryType": "function",\n    "doType": "function",\n    "exitType": "function",\n    "entryCode": "",\n    "doCode": "",\n    "exitCode": ""\n   },\n   "selected": false\n  },\n  {\n   "id": 85,\n   "attrs": {\n    "x": 302,\n    "y": 264,\n    "width": 24,\n    "height": 24,\n    "r": 0,\n    "rx": 0,\n    "ry": 0,\n    "fill": "#fff",\n    "stroke": "#666",\n    "stroke-width": 1,\n    "fill-opacity": 100,\n    "transform": "r45"\n   },\n   "fwprop": {\n    "autoid": 1,\n    "type": "choice",\n    "note": "Decision node",\n    "identifier": "DECISION1"\n   },\n   "selected": false\n  },\n  {\n   "id": 86,\n   "attrs": {\n    "x": 142,\n    "y": 336,\n    "width": 104,\n    "height": 30,\n    "r": 10,\n    "rx": 10,\n    "ry": 10,\n    "fill": "#fff",\n    "stroke": "#666",\n    "stroke-width": 1,\n    "fill-opacity": 100\n   },\n   "fwprop": {\n    "autoid": 2,\n    "type": "state",\n    "note": "Action node 3",\n    "identifier": "NODE3",\n    "entryFunc": "Action1",\n    "doFunc": "",\n    "exitFunc": "",\n    "entryType": "function",\n    "doType": "function",\n    "exitType": "function",\n    "entryCode": "",\n    "doCode": "",\n    "exitCode": ""\n   },\n   "selected": false\n  },\n  {\n   "id": 88,\n   "attrs": {\n    "x": 262,\n    "y": 176,\n    "width": 104,\n    "height": 30,\n    "r": 10,\n    "rx": 10,\n    "ry": 10,\n    "fill": "#fff",\n    "stroke": "#666",\n    "stroke-width": 1,\n    "fill-opacity": 100\n   },\n   "fwprop": {\n    "autoid": 3,\n    "type": "state",\n    "note": "Action node 2",\n    "identifier": "NODE2",\n    "entryFunc": "Action2",\n    "doFunc": "",\n    "exitFunc": "",\n    "entryType": "function",\n    "doType": "function",\n    "exitType": "function",\n    "entryCode": "",\n    "doCode": "",\n    "exitCode": ""\n   },\n   "selected": false\n  },\n  {\n   "id": 90,\n   "attrs": {\n    "x": 372,\n    "y": 336,\n    "width": 104,\n    "height": 30,\n    "r": 10,\n    "rx": 10,\n    "ry": 10,\n    "fill": "#fff",\n    "stroke": "#666",\n    "stroke-width": 1,\n    "fill-opacity": 100\n   },\n   "fwprop": {\n    "autoid": 4,\n    "type": "state",\n    "note": "Action node 4",\n    "identifier": "NODE4",\n    "entryFunc": "Action2",\n    "doFunc": "",\n    "exitFunc": "",\n    "entryType": "function",\n    "doType": "function",\n    "exitType": "function",\n    "entryCode": "",\n    "doCode": "",\n    "exitCode": ""\n   },\n   "selected": false\n  },\n  {\n   "id": 92,\n   "attrs": {\n    "x": 301,\n    "y": 399,\n    "width": 26,\n    "height": 26,\n    "r": 13,\n    "rx": 13,\n    "ry": 13,\n    "fill": "#000",\n    "stroke": "#666",\n    "stroke-width": 1,\n    "fill-opacity": 100\n   },\n   "fwprop": {\n    "autoid": 1,\n    "type": "final",\n    "note": "Final node. The procedure terminates here"\n   },\n   "selected": false\n  }\n ],\n "connections": [\n  {\n   "attrs": {\n    "fill": "none",\n    "stroke": "#000",\n    "path": [\n     [\n      "M",\n      214,\n      106\n     ],\n     [\n      "L",\n      254,\n      106.00000000000001\n     ]\n    ],\n    "stroke-width": 2,\n    "stroke-linecap": "round",\n    "stroke-linejoin": "round",\n    "stroke-dasharray": ""\n   },\n   "fwprop": {\n    "order": 1,\n    "identifier": "",\n    "guardFunc": "",\n    "actionFunc": "",\n    "guardType": "function",\n    "actionType": "function",\n    "guardCode": "",\n    "actionCode": ""\n   },\n   "shiftx": 0,\n   "shifty": 0,\n   "vertexes": [],\n   "shiftxy": {\n    "x": 0,\n    "y": 0\n   },\n   "stateFromID": 82,\n   "stateToID": 83,\n   "selected": false\n  },\n  {\n   "attrs": {\n    "fill": "none",\n    "stroke": "#000",\n    "path": [\n     [\n      "M",\n      314,\n      126\n     ],\n     [\n      "L",\n      314,\n      168\n     ]\n    ],\n    "stroke-width": 2,\n    "stroke-linecap": "round",\n    "stroke-linejoin": "round",\n    "stroke-dasharray": ""\n   },\n   "fwprop": {\n    "order": "1",\n    "identifier": "",\n    "guardFunc": "Guard1",\n    "actionFunc": "",\n    "guardType": "function",\n    "actionType": "function",\n    "guardCode": "",\n    "actionCode": "",\n    "note": ""\n   },\n   "shiftx": 31,\n   "shifty": 5,\n   "vertexes": [],\n   "shiftxy": {\n    "x": 0,\n    "y": 0\n   },\n   "stateFromID": 83,\n   "stateToID": 88,\n   "selected": false\n  },\n  {\n   "attrs": {\n    "fill": "none",\n    "stroke": "#000",\n    "path": [\n     [\n      "M",\n      314,\n      211\n     ],\n     [\n      "L",\n      314,\n      246\n     ]\n    ],\n    "stroke-width": 2,\n    "stroke-linecap": "round",\n    "stroke-linejoin": "round",\n    "stroke-dasharray": ""\n   },\n   "fwprop": {\n    "order": "1",\n    "identifier": "",\n    "guardFunc": "wait",\n    "actionFunc": "",\n    "guardType": "code",\n    "actionType": "function",\n    "guardCode": "exec_counter > 3;",\n    "actionCode": "",\n    "note": ""\n   },\n   "shiftx": 29,\n   "shifty": 6,\n   "vertexes": [],\n   "shiftxy": {\n    "x": 0,\n    "y": 0\n   },\n   "stateFromID": 88,\n   "stateToID": 85,\n   "selected": false\n  },\n  {\n   "attrs": {\n    "fill": "none",\n    "stroke": "#000",\n    "path": [\n     [\n      "M",\n      287,\n      276\n     ],\n     [\n      "L",\n      194,\n      276\n     ],\n     [\n      "L",\n      194,\n      328\n     ]\n    ],\n    "stroke-width": 2,\n    "stroke-linecap": "round",\n    "stroke-linejoin": "round",\n    "stroke-dasharray": ""\n   },\n   "fwprop": {\n    "order": "1",\n    "identifier": "",\n    "guardFunc": "Guard1",\n    "actionFunc": "",\n    "guardType": "function",\n    "actionType": "function",\n    "guardCode": "",\n    "actionCode": "",\n    "note": ""\n   },\n   "shiftx": 29,\n   "shifty": -5,\n   "vertexes": [\n    {\n     "x": 194,\n     "y": 276,\n     "hasMoved": true\n    }\n   ],\n   "shiftxy": {\n    "x": 0,\n    "y": 0\n   },\n   "stateFromID": 85,\n   "stateToID": 86,\n   "selected": false\n  },\n  {\n   "attrs": {\n    "fill": "none",\n    "stroke": "#000",\n    "path": [\n     [\n      "M",\n      341,\n      276\n     ],\n     [\n      "L",\n      424,\n      276\n     ],\n     [\n      "L",\n      424,\n      328\n     ]\n    ],\n    "stroke-width": 2,\n    "stroke-linecap": "round",\n    "stroke-linejoin": "round",\n    "stroke-dasharray": ""\n   },\n   "fwprop": {\n    "order": "2",\n    "identifier": "",\n    "guardFunc": "Guard2",\n    "actionFunc": "",\n    "guardType": "function",\n    "actionType": "function",\n    "guardCode": "",\n    "actionCode": "",\n    "note": ""\n   },\n   "shiftx": -38,\n   "shifty": -6,\n   "vertexes": [\n    {\n     "x": 424,\n     "y": 276,\n     "hasMoved": true\n    }\n   ],\n   "shiftxy": {\n    "x": 0,\n    "y": 0\n   },\n   "stateFromID": 85,\n   "stateToID": 90,\n   "selected": false\n  },\n  {\n   "attrs": {\n    "fill": "none",\n    "stroke": "#000",\n    "path": [\n     [\n      "M",\n      194,\n      371\n     ],\n     [\n      "L",\n      194,\n      412\n     ],\n     [\n      "L",\n      293,\n      412\n     ]\n    ],\n    "stroke-width": 2,\n    "stroke-linecap": "round",\n    "stroke-linejoin": "round",\n    "stroke-dasharray": ""\n   },\n   "fwprop": {\n    "order": 1,\n    "identifier": "",\n    "guardFunc": "",\n    "actionFunc": "",\n    "guardType": "function",\n    "actionType": "function",\n    "guardCode": "",\n    "actionCode": ""\n   },\n   "shiftx": 0,\n   "shifty": 0,\n   "vertexes": [\n    {\n     "x": 194,\n     "y": 412,\n     "hasMoved": true\n    }\n   ],\n   "shiftxy": {\n    "x": 0,\n    "y": 0\n   },\n   "stateFromID": 86,\n   "stateToID": 92,\n   "selected": false\n  },\n  {\n   "attrs": {\n    "fill": "none",\n    "stroke": "#000",\n    "path": [\n     [\n      "M",\n      424,\n      371\n     ],\n     [\n      "L",\n      424,\n      412\n     ],\n     [\n      "L",\n      335,\n      412\n     ]\n    ],\n    "stroke-width": 2,\n    "stroke-linecap": "round",\n    "stroke-linejoin": "round",\n    "stroke-dasharray": ""\n   },\n   "fwprop": {\n    "order": 1,\n    "identifier": "",\n    "guardFunc": "",\n    "actionFunc": "",\n    "guardType": "function",\n    "actionType": "function",\n    "guardCode": "",\n    "actionCode": ""\n   },\n   "shiftx": 0,\n   "shifty": 0,\n   "vertexes": [\n    {\n     "x": 424,\n     "y": 412,\n     "hasMoved": true\n    }\n   ],\n   "shiftxy": {\n    "x": 0,\n    "y": 0\n   },\n   "stateFromID": 90,\n   "stateToID": 92,\n   "selected": false\n  }\n ],\n "globals": {\n  "paperPanX": 0,\n  "paperPanY": 0,\n  "attrs": {\n   "x": 0,\n   "y": 0,\n   "width": 1920,\n   "height": 955,\n   "r": 0,\n   "rx": 0,\n   "ry": 0,\n   "fill": "#eee",\n   "stroke": "#000",\n   "stroke-width": 0\n  },\n  "fwprop": {\n   "globalvar": [\n    {\n     "type": "int",\n     "name": "",\n     "value": ""\n    },\n    {\n     "type": "int",\n     "name": "exec_counter",\n     "value": "1"\n    }\n   ],\n   "memalloc": "static",\n   "smName": "Example 3",\n   "editorType": "Pr",\n   "smIncludes": "",\n   "smNotes": "",\n   "displayInfo": 0,\n   "displayOrder": 1,\n   "smTags": "example"\n  }\n }\n}\', \'<svg height="374" version="1.1" width="374" xmlns="http://www.w3.org/2000/svg" style="background-color: #eeeeee; overflow: hidden; position: relative;" viewBox="122 71 374 374" preserveAspectRatio="xMinYMin"><desc style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">Created with Raphaël 2.1.2</desc><defs style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></defs><rect x="0" y="0" width="1920" height="955" r="0" rx="0" ry="0" fill="#eeeeee" stroke="#000" stroke-width="0" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></rect><rect x="179" y="91" width="30" height="30" r="15" rx="15" ry="15" fill="#ffffff" stroke="#666666" stroke-width="1" fill-opacity="100" transform="matrix(1,0,0,1,0.5,0.5)" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); fill-opacity: 100;"></rect><rect x="302" y="264" width="24" height="24" r="0" rx="0" ry="0" fill="#ffffff" stroke="#666666" stroke-width="1" fill-opacity="100" transform="matrix(0.7071,0.7071,-0.7071,0.7071,287.1299,-141.193)" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); fill-opacity: 100;"></rect><rect x="372" y="336" width="104" height="30" r="10" rx="10" ry="10" fill="#ffffff" stroke="#666666" stroke-width="1" fill-opacity="100" transform="matrix(1,0,0,1,0.5,0.5)" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); fill-opacity: 100;"></rect><text x="382" y="351" text-anchor="start" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: start; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: default;" font-size="10px" stroke-width="1"><tspan dy="3.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); font-weight: bold;">&#160;NODE4: &#160;Action2</tspan></text><path fill="none" stroke="#000000" d="M341,276L424,276L424,328" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;" stroke-dasharray="-2"></path><path fill="#000000" stroke="#000000" d="M10,0L0,5L10,10L7,6L7,4Z" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);" transform="matrix(0,-1,1,0,419,332.5)" stroke-width="1"></path><text x="370" y="260" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: move;" stroke-width="1"><tspan dy="3.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2:  [Guard2] </tspan></text><rect x="301" y="399" width="26" height="26" r="13" rx="13" ry="13" fill="#000000" stroke="#666666" stroke-width="1" fill-opacity="100" transform="matrix(1,0,0,1,0.5,0.5)" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); fill-opacity: 100;"></rect><path fill="none" stroke="#000000" d="M424,371L424,412L335,412" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;" stroke-dasharray="-2"></path><path fill="#000000" stroke="#000000" d="M10,0L0,5L10,10L7,6L7,4Z" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);" transform="matrix(1,0,0,1,330.5,407)" stroke-width="1"></path><text x="400" y="402" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: move;" stroke-width="1"><tspan dy="402" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></tspan></text><rect x="142" y="336" width="104" height="30" r="10" rx="10" ry="10" fill="#ffffff" stroke="#666666" stroke-width="1" fill-opacity="100" transform="matrix(1,0,0,1,0.5,0.5)" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); fill-opacity: 100;"></rect><text x="152" y="351" text-anchor="start" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: start; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: default;" font-size="10px" stroke-width="1"><tspan dy="3.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); font-weight: bold;">&#160;NODE3: &#160;Action1</tspan></text><path fill="none" stroke="#000000" d="M287,276L194,276L194,328" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;" stroke-dasharray="-2"></path><path fill="#000000" stroke="#000000" d="M10,0L0,5L10,10L7,6L7,4Z" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);" transform="matrix(0,-1,1,0,189,332.5)" stroke-width="1"></path><text x="243" y="261" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: move;" stroke-width="1"><tspan dy="3.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">1:  [Guard1] </tspan></text><path fill="none" stroke="#000000" d="M194,371L194,412L293,412" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;" stroke-dasharray="-2"></path><path fill="#000000" stroke="#000000" d="M10,0L0,5L10,10L7,6L7,4Z" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);" transform="matrix(-1,0,0,-1,297.5,417)" stroke-width="1"></path><text x="223" y="402" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: move;" stroke-width="1"><tspan dy="402" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></tspan></text><rect x="420" y="272.9923357963562" width="8" height="8" r="4" rx="4" ry="4" fill="#ff0000" stroke="#000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); display: none;" stroke-width="1"></rect><rect x="338.99015307449736" y="272" width="8" height="8" r="4" rx="4" ry="4" fill="#83e5fe" stroke="#000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); display: none;" stroke-width="1"></rect><rect x="262" y="176" width="104" height="30" r="10" rx="10" ry="10" fill="#ffffff" stroke="#666666" stroke-width="1" fill-opacity="100" transform="matrix(1,0,0,1,0.5,0.5)" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); fill-opacity: 100;"></rect><text x="272" y="191" text-anchor="start" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: start; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: default;" font-size="10px" stroke-width="1"><tspan dy="3.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); font-weight: bold;">&#160;NODE2: &#160;Action2</tspan></text><path fill="none" stroke="#000000" d="M314,211L314,246" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;" stroke-dasharray="-2"></path><path fill="#000000" stroke="#000000" d="M10,0L0,5L10,10L7,6L7,4Z" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);" transform="matrix(0,-1,1,0,309,250.5)" stroke-width="1"></path><text x="343" y="224" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: move;" stroke-width="1"><tspan dy="3.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"> [wait] </tspan></text><rect x="262" y="91" width="104" height="30" r="10" rx="10" ry="10" fill="#ffffff" stroke="#666666" stroke-width="1" fill-opacity="100" transform="matrix(1,0,0,1,0.5,0.5)" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); fill-opacity: 100;"></rect><text x="272" y="106" text-anchor="start" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: start; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: default;" font-size="10px" stroke-width="1"><tspan dy="3.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); font-weight: bold;">&#160;NODE1: &#160;Action1</tspan></text><path fill="none" stroke="#000000" d="M214,106L254,106.00000000000001" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;" stroke-dasharray="-2"></path><path fill="#000000" stroke="#000000" d="M10,0L0,5L10,10L7,6L7,4Z" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);" transform="matrix(-1,0,0,-1,258.5,111)" stroke-width="1"></path><text x="234" y="96" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: move;" stroke-width="1"><tspan dy="96" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></tspan></text><path fill="none" stroke="#000000" d="M314,126L314,168" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;" stroke-dasharray="-2"></path><path fill="#000000" stroke="#000000" d="M10,0L0,5L10,10L7,6L7,4Z" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);" transform="matrix(0,-1,1,0,309,172.5)" stroke-width="1"></path><text x="345" y="142" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#000000" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 10px; line-height: normal; font-family: Arial; cursor: move;" stroke-width="1"><tspan dy="3.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"> [Guard1] </tspan></text></svg>\', 374, 374)');

   echo "Done";
?>
