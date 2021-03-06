var scores_db_name = elx.env.version && parseInt(elx.env.version) > 5 ? "save/Scores_Mid.db" : "Scores_Mid.db";
var scores_name = null;

function scores_init(name)
{
    scores_name = name;
    if (!elx.load("sqlite"))
	return false;
    
    var scores_db = sqlite3_open(scores_db_name);
    if (!scores_db || typeof(scores_db) == "number")
	return false;
    
    function test_func(obj, row)	{
	obj.ok = 1;
	return 0;
    }
    
    var obj = {};
    sqlite3_exec(scores_db, "SELECT rank FROM " + name + " WHERE rank=1;", test_func, obj);
    
    if (!obj.ok) {
	sqlite3_exec(scores_db, "CREATE TABLE " + name + " (rank INTEGER PRIMARY KEY, time INTEGER NOT NULL, name TEXT NOT NULL);", null, null);
	for (var lo = 1; lo <= 10; lo++)
	    sqlite3_exec(scores_db , "INSERT INTO " + name + " (rank, time, name) VALUES (" + lo + ", " + (lo * 2450) + ', "Mid\'");', null, null);
    }
    sqlite3_close(scores_db);

    return true;
}

function scores_save(scores_a)
{
    scores_db = sqlite3_open(scores_db_name);
    
    for (var lo = 1; lo <= 10; lo++)
	sqlite3_exec(scores_db , "REPLACE INTO " + scores_name + " (rank, time, name) VALUES (" + lo + ", " + scores_a[lo].time + ", '" + scores_a[lo].name + "')", null, null);
    
    sqlite3_close(scores_db);
}

function scores_load()
{
    var s_arr = [];

    function get_row(arr, row) {
	arr[row.rank] = { rank: row.rank, time: row.time, name: row.name };
	return 0;
    }

    scores_db = sqlite3_open(scores_db_name);
    sqlite3_exec(scores_db, "SELECT rank, time, name FROM " + scores_name + ";", get_row, s_arr);

    sqlite3_close(scores_db);

    return s_arr;
}

// Test and set new score if needed
function scores_check(scores_a, time)
{
    for (var lo = 1; lo <= 10; lo++) {
	if (time <= scores_a[lo].time) {
	    for (var lo2 = 10; lo2 > lo; lo2--) {
		scores_a[lo2] = scores_a[lo2 - 1];
		scores_a[lo2].rank = lo2;
	    }
	    scores_a[lo] = { rank: lo, time: time, name: "" };
	    return lo;
	}
    }

    return 0;
}

true;
