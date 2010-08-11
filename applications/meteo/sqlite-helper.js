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

function save_location_heavy(data)
{
   var encoded_name;
   var encoded_gcid;

   db = sqlite3_open("Location.db");
   if (!db || typeof(db) == "number")
     {
        elx.print("file not found.\n");
        return ;
     }

   sqlite3_exec(db, "PRAGMA synchronous=OFF;", null, null);

   sqlite3_exec(db, "CREATE TABLE places (glv INTEGER PRIMARY KEY, gcid TEXT NOT NULL, place TEXT NOT NULL);", null, null);
   sqlite3_exec(db, "CREATE INDEX gm ON places (gcid);", null, null);
   sqlite3_exec(db, "CREATE UNIQUE INDEX gl ON places (gcid, places);", null, null);

   encoded_gcid = encode(gcid);
   
   sqlite3_exec(db, "DELETE FROM places;", null, null);
   
   if (typeof(data.place) == "string")
      sqlite3_exec(db , "INSERT OR REPLACE INTO places (gcid, place) VALUES ('" + encoded_gcid + "', '" + data.place + "');", null, null);

   sqlite3_close(db);
}

function save_location_end()
{
}

function save_location_cancel()
{
}

function save_location(place)
{
   if (!load_sqlite)
     {
        load_sqlite = elx.load("sqlite");
        if (!load_sqlite)
          return ;
     }
   elx.print("Save : "+place+"\n");
   ecore_thread_run(save_location_heavy, save_location_end, save_location_cancel, {place: place});
}

var over;
function load_location(cb)
{
   
   over = false;

   function addmember(obj, row)
     {
	elx.print("LOAD : "+ row.place+"\n");
	var retour = {};
        retour.City = row.place;
        over = true;
	obj(retour);
        return 0;
     }

   if (!load_sqlite)
     {
        load_sqlite = elx.load("sqlite");
        if (!load_sqlite)
          return null;
     }

   db = sqlite3_open("Location.db");
   if (!db || typeof(db) == "number")
     {
        elx.print("file not found.\n");
        return null;
     }

   sqlite3_exec(db, "SELECT place FROM places WHERE gcid='" + encode(gcid) + "' limit 1;", addmember,cb);

   sqlite3_close(db);

   if(over)
      return null;
      else
   {
      cb();
      return null;
   }
}

true;
