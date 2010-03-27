var db = null;
var db_name = "MPD-client.db";
var tbl_name = null;

var id = "1"; /* db primary key (only one mpd anyway) */
var host1 = 192;
var host2 = 168;
var host3 = 0;
var host4 = 1;
var port = 6600; /* tcp port */

function db_init(name)
{
  tbl_name = name;
  if (!elx.load("sqlite"))
    return false;

  db = sqlite3_open(db_name);
  if (!db || typeof(db) == "number")
    return false;

  function test_func(obj, row)	{
    obj.ok = 1;
    return 0;
  }

  var obj = {};
  sqlite3_exec(db, "SELECT host1, host2, host3, host4 FROM " + tbl_name + "WHERE id='" + id + "';", test_func, obj);
  if (!obj.ok) {
    sqlite3_exec(db, "CREATE TABLE " + name + " (id INTEGER PRIMARY KEY, host1 INTEGER NOT NULL, host2 INTEGER NOT NULL, host3 INTEGER NOT NULL, host4 INTEGER NOT NULL, port INTEGER);", null, null);
    sqlite3_exec(db , "INSERT INTO " + name + " (id, host1, host2, host3, host4, port) VALUES ('" + id + "', '" + host1 + "', '" + host2 + "', '" + host3 + "', '" + host4 + "', '" + port + "');", null, null);
  }

  return true;
}

function db_save(pref)
{
  sqlite3_exec(db , "REPLACE INTO " + tbl_name + " (id, host1, host2, host3, host4, port) VALUES (" + id + ", " + pref.host1 + ", " + pref.host2 + ", " + pref.host3 + ", " + pref.host4 + ", " + pref.port + ");", null, null);
}

function db_load()
{
  var result = [];

  function get_row(arr, row) {
    arr[row.id] = { id: row.id, host1: row.host1, host2: row.host2, host3: row.host3, host4: row.host4, port: row.port };
    return 0;
  }

  sqlite3_exec(db, "SELECT id, host1, host2, host3, host4, port FROM " + tbl_name + " WHERE id='" + id +"';", get_row, result);
  return result;
}

function db_close()
{
  sqlite3_close(db);
}

true;

