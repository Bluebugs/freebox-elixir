var load_sqlite = false;
var gcid = elx.gcid();

function encode(plaintext)
{
   var SAFECHARS =
     "0123456789" +
     "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
     "abcdefghijklmnopqrstuvwxyz" +
     "-_.!~*()";
   var HEX = "0123456789ABCDEF";
   var encoded = "";

   for (var i = 0; i < plaintext.length; i++ ) {
      var ch = plaintext.charAt(i);

      if (ch == " ") {
         encoded += "+";
      } else {
         if (SAFECHARS.indexOf(ch) != -1) {
            encoded += ch;
         } else {
            var charCode = ch.charCodeAt(0);

            if (charCode > 255) {
               encoded += "+";
            } else {
               encoded += "%";
               encoded += HEX.charAt((charCode >> 4) & 0xF);
               encoded += HEX.charAt(charCode & 0xF);
            }
         }
      }
   }

   return encoded;
}

function decode(encoded)
{
   var HEXCHARS = "0123456789ABCDEFabcdef";
   var plaintext = "";
   var i = 0;

   while (i < encoded.length) {
      var ch = encoded.charAt(i);

      if (ch == "+") {
         plaintext += " ";
         i++;
      } else {
         if (ch == "%") {
            if (i < (encoded.length-2)
                && HEXCHARS.indexOf(encoded.charAt(i+1)) != -1
                && HEXCHARS.indexOf(encoded.charAt(i+2)) != -1 ) {
               plaintext += unescape( encoded.substr(i,3) );
               i += 3;
            } else {
               plaintext += "%[ERROR]";
               i++;
            }
         } else {
            plaintext += ch;
            i++;
         }
      }
   }

   return plaintext;
}

function save_highscore_heavy(data)
{
   var encoded_name;
   var encoded_gcid;

   db = sqlite3_open("Scores.db");
   if (!db || typeof(db) == "number")
     {
        elx.print("file not found.\n");
        return ;
     }

   sqlite3_exec(db, "PRAGMA synchronous=OFF;", null, null);

   sqlite3_exec(db, "CREATE TABLE timing (glv INTEGER PRIMARY KEY, gcid TEXT NOT NULL, level TEXT NOT NULL, value TEXT NOT NULL, game TEXT);", null, null);
   sqlite3_exec(db, "CREATE INDEX gm ON timing (gcid);", null, null);
   sqlite3_exec(db, "CREATE UNIQUE INDEX gl ON timing (gcid, level);", null, null);

   encoded_gcid = encode(gcid);
   encoded_name = encode(data.name);

   for (var i in data.score)
     {
        if (typeof(data.score[i]) == "number")
	  sqlite3_exec(db , "INSERT OR REPLACE INTO timing (gcid, level, value, game) VALUES ('" + encoded_gcid + "', '" + encode(i) + "', '" + data.score[i] + "', '" + encoded_name + "');", null, null);
     }

   sqlite3_close(db);
}

function save_highscore_end()
{
}

function save_highscore(score, name)
{
   if (!load_sqlite)
     {
        load_sqlite = elx.load("sqlite");
        if (!load_sqlite)
          return ;
     }

   ecore_thread_run(save_highscore_heavy, save_highscore_end, { score: score, name: name });
}

var over;
function load_highscore()
{
   var retour;
   over = false;

   function addmember(obj, row)
     {
        obj[decode(row.level)] = decode(row.value);
        over = true;

        return 0;
     }

   if (!load_sqlite)
     {
        load_sqlite = elx.load("sqlite");
        if (!load_sqlite)
          return null;
     }

   db = sqlite3_open("Scores.db");
   if (!db || typeof(db) == "number")
     {
        elx.print("file not found.\n");
        return null;
     }

   retour = new Object;
   sqlite3_exec(db, "SELECT level, value FROM timing WHERE gcid='" + encode(gcid) + "';", addmember, retour);

   sqlite3_close(db);

   return over ? retour : null;
}

true;
