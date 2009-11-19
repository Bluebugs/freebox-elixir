var test = true;

var sound = elx.load("mix");

var shutdown;

if (shutdown == undefined || shutdown == false)
  {
     test &= elx.load("evas");
     test &= elx.load("ecore");
     test &= elx.load("ecore-evas");
     test &= elx.load("edje");
  }

test &= elx.include("edje-helper.edj", "score-helper");
test &= elx.include("edje-helper.edj", "edje-helper");
test &= elx.include("edje-helper.edj", "ecore-job-helper");
test &= elx.include("edje-helper.edj", "math_helper");

var FN = "/.fonts/";

var NULL = null;

var ee;
var evas;
var btn = 0;
var o_edje;
var o_back = null;

var e_timer = null;
var gaming = -1;
var dx = 0;
var dy = 0;
var timestamp = 0;
var key_count = 0;
var key_cleanup_cb = null;

var grid = null;

var et = null;
var o_blk = null;

var start_time = null;

var total;

var x = 0;
var y = 0;

var scores;

var sample;
var playing = true;

var map = { count: [], mines: [], flags: [], revealed: [], grid: null };

var mouse_detect = false;

function message_cb(data, obj, type, id, msg)
{
   if (id == 1)
     {
	if (!mouse_detect)
	  {
	     evas_object_event_callback_del(o_back, EVAS_CALLBACK_KEY_DOWN, key_game_cb_down, null);
	     evas_object_event_callback_del(o_back, EVAS_CALLBACK_KEY_UP, key_game_cb_up, null);
	  }

        evas_object_event_callback_del(o_edje, EVAS_CALLBACK_KEY_DOWN, key_menu_cb_down, null);
        evas_object_event_callback_del(o_edje, EVAS_CALLBACK_KEY_UP, key_menu_cb_up, null);
        build_map(msg);
     }
   else
     if (id == 2)
       {
          x = msg[0];
          y = msg[1];
       }
}

var cursors = new Array();
var cursors_idler = null;
function cursor_idler_cb(data)
{
   var next = cursors.pop();

   if (next)
     {
        x = next[1];
        y = next[2];

        edje_object_message_send(o_edje, EDJE_MESSAGE_INT_SET, 4, next);
     }
   else
     {
        ecore_idler_del(cursors_idler);
        cursors_idler = null;
     }

   return 1;
}

function refresh_cursor(cx, cy)
{
   var state = 2;

   if (map.revealed[cy][cx])
     state = 0;
   else
     if (map.flags[cy][cx])
       state = 1;

   cursors.push([ state, cx, cy ]);
   if (cursors_idler == null)
     cursors_idler = ecore_idler_add(cursor_idler_cb, null);
}

function signal_cb_mouse_in(data, obj, sig, src)
{
   var part = src.substring(7).split("/");

   cursors = new Array();
   x = parseInt(part[0]);
   y = parseInt(part[1]);

   refresh_cursor(x, y);
}

function build_map(level)
{
   var mine = 0;

   edje_freeze();
   evas_event_freeze(evas);

   evas_object_del(o_edje);
   o_edje = edje_object_add(evas);
   evas_object_layer_set(o_edje, 1);
   evas_object_move(o_edje, 0, 0);
   evas_object_resize(o_edje, 720, 576);
   evas_object_show(o_edje);

   if (!mouse_detect)
     {
	evas_object_event_callback_add(o_back, EVAS_CALLBACK_MOUSE_MOVE, mouse_move_cb, null);
	evas_object_event_callback_add(o_back, EVAS_CALLBACK_KEY_DOWN, key_game_cb_down, null);
	evas_object_event_callback_add(o_back, EVAS_CALLBACK_KEY_UP, key_game_cb_up, null);
     }
   evas_object_event_callback_add(o_edje, EVAS_CALLBACK_KEY_DOWN, key_game_cb_down, null);
   evas_object_event_callback_add(o_edje, EVAS_CALLBACK_KEY_UP, key_game_cb_up, null);
   evas_object_focus_set(o_edje, 1);

   gaming = level;
   switch (level) {
    case 0:
       edje_object_file_set(o_edje, "Demineur.edj", "level,easy");
       map.count = elx.include("Demineur.edj", "level,easy,int");
       map.mines = elx.include("Demineur.edj", "level,easy,boolean");
       map.flags = elx.include("Demineur.edj", "level,easy,boolean");
       map.revealed = elx.include("Demineur.edj", "level,easy,boolean");
       mine = parseInt(elx.include("Demineur.edj", "level,easy,mine"));
       break;
    case 1:
       edje_object_file_set(o_edje, "Demineur.edj", "level,middle");
       map.count = elx.include("Demineur.edj", "level,middle,int");
       map.mines = elx.include("Demineur.edj", "level,middle,boolean");
       map.flags = elx.include("Demineur.edj", "level,middle,boolean");
       map.revealed = elx.include("Demineur.edj", "level,middle,boolean");
       mine = parseInt(elx.include("Demineur.edj", "level,middle,mine"));
       break;
    case 2:
       edje_object_file_set(o_edje, "Demineur.edj", "level,expert");
       map.count = elx.include("Demineur.edj", "level,expert,int");
       map.mines = elx.include("Demineur.edj", "level,expert,boolean");
       map.flags = elx.include("Demineur.edj", "level,expert,boolean");
       map.revealed = elx.include("Demineur.edj", "level,expert,boolean");
       mine = parseInt(elx.include("Demineur.edj", "level,expert,mine"));
       break;
   }

   map.grid = edje_object_part_swallow_get(o_edje, "grid");

   edje_object_signal_callback_add(o_edje, "mouse,clicked,1", "detect-*", signal_cb_reveal, null);
   edje_object_signal_callback_add(o_edje, "mouse,clicked,2", "detect-*", signal_cb_rawoul, null);
   edje_object_signal_callback_add(o_edje, "mouse,clicked,3", "detect-*", signal_cb_flag, null);
   edje_object_signal_callback_add(o_edje, "mouse,in", "detect-*", signal_cb_mouse_in, null);
   edje_object_message_handler_set(o_edje, message_cb, null);

   ecore_evas_callback_pre_render_set(ee, pre_render_cb);

   edje_object_part_text_set(o_edje, "flag,count", mine);
   edje_object_signal_emit(o_edje, "setup,reset", "js");

   cursors = new Array();
   x = 0;
   y = 0;

   refresh_cursor(0, 0);

   var xc = map.revealed[0].length;
   var yc = map.revealed.length;

   total = xc * yc - mine;
   count = mine;

   for (; mine > 0; --mine)
     {
        var nyb;
        var pyb;

        var x = rand(xc) - 1;
        var y = rand(yc) - 1;

        var obj;

        if (map.mines[y][x])
          {
             ++mine;
             continue;
          }
        map.mines[y][x] = true;

        obj = edje_object_part_swallow_get(map.grid, x + "/" + y);
        if (!obj)
          {
             ++mine;
             continue;
          }

        edje_object_signal_emit(obj, "setup", "code");

        nyb = y - 1 >= 0;
        pyb = y + 1 < yc;

        if (x - 1 >= 0)
          {
             if (nyb) map.count[y - 1][x - 1]++;
             map.count[y][x - 1]++;
             if (pyb) map.count[y + 1][x - 1]++;
          }
        if (nyb) map.count[y - 1][x]++;
        if (pyb) map.count[y + 1][x]++;
        if (x + 1 < xc)
          {
             if (nyb) map.count[y - 1][x + 1]++;
             map.count[y][x + 1]++;
             if (pyb) map.count[y + 1][x + 1]++;
          }
     }

   start_time = null;
   if (!et)
     et = ecore_timer_add(0.1, timer_update, null);

   evas_event_thaw(evas);
   edje_thaw();
}

function restart_cb(data, e, obj, event)
{
   var tmp;

   evas_object_event_callback_del(o_blk, EVAS_CALLBACK_KEY_DOWN, restart_cb, null);
   evas_object_event_callback_del(o_blk, EVAS_CALLBACK_MOUSE_DOWN, restart_cb, null);
   evas_object_event_callback_del(o_blk, EVAS_CALLBACK_MOUSE_WHEEL, restart_cb, null);
   evas_object_del(o_blk);
   evas_object_focus_set(o_edje, 1);

   tmp = edje_object_file_get(o_edje);

   switch (tmp.part) {
    case "level,easy": build_map(0); break;
    case "level,middle": build_map(1); break;
    case "level,expert": build_map(2); break;
   }
}
function lock_down()
{
   evas_object_event_callback_del(o_edje, EVAS_CALLBACK_KEY_DOWN, key_game_cb_down, null);
   evas_object_event_callback_del(o_edje, EVAS_CALLBACK_KEY_UP, key_game_cb_up, null);
   edje_object_signal_callback_del(o_edje, "mouse,clicked,1", "detect-*", signal_cb_reveal);
   edje_object_signal_callback_del(o_edje, "mouse,clicked,2", "detect-*", signal_cb_reveal);
   edje_object_signal_callback_del(o_edje, "mouse,clicked,3", "detect-*", signal_cb_reveal);
   edje_object_signal_callback_del(o_edje, "mouse,in", "detect-*", signal_cb_mouse_in);

   o_blk = evas_object_rectangle_add(evas);
   evas_object_event_callback_add(o_blk, EVAS_CALLBACK_KEY_DOWN, restart_cb, null);
   evas_object_event_callback_add(o_blk, EVAS_CALLBACK_MOUSE_DOWN, restart_cb, null);
   evas_object_event_callback_add(o_blk, EVAS_CALLBACK_MOUSE_WHEEL, restart_cb, null);
   evas_object_color_set(o_blk, 1, 1, 1, 1);
   evas_object_move(o_blk, 0, 0);
   evas_object_resize(o_blk, 720, 576);
   evas_object_layer_set(o_blk, 20);
   evas_object_focus_set(o_blk, 1);
   evas_object_show(o_blk);
}
function ending(signal)
{
   if (et)
     ecore_timer_del(et);
   et = null;

   edje_object_signal_emit(o_edje, signal, "js");

   lock_down();
}
function winner_cb()
{
   var tmp = edje_object_file_get(o_edje);
   var level = null;

   switch (tmp.part)
     {
     case "level,easy": level = "easy"; break;
     case "level,middle": level = "middle"; break;
     case "level,expert": level = "expert"; break;
     }

   var d = new Date();

   if (level)
     if (!scores[level] || scores[level] > d.getTime() - start_time)
       {
          scores[level] = d.getTime() - start_time;
          save_highscore(scores, "Demineur");
       }

   ending("setup,winner");
}
function looser_cb()
{
   ending("setup,looser");
}

function reveal(x, y)
{
   var obj;

   if (x < 0
       || y < 0
       || y >= map.revealed.length
       || x >= map.revealed[0].length)
     return false;

   if (map.revealed[y][x])
     return false;

   if (map.flags[y][x])
     return false;

   obj = edje_object_part_swallow_get(map.grid, x + "/" + y);
   if (!obj)
     return false;
   edje_object_signal_emit(obj, "reveal", "code");

   map.revealed[y][x] = true;

   if (map.mines[y][x])
     {
        looser_cb();
        return true;
     }

   switch (map.count[y][x])
     {
      case 0:
        {
           for (var yi = -1; yi <= 1; ++yi)
             for (var xi = -1; xi <= 1; ++xi)
               reveal(x + xi, y + yi);
           break;
        }
      case 1:
        {
           edje_object_signal_emit(obj, "1", "code");
           break;
        }
      case 2:
        {
           edje_object_signal_emit(obj, "2", "code");
           break;
        }
      default:
        {
           edje_object_signal_emit(obj, "more", "code");
           edje_object_part_text_set(obj, "count", map.count[y][x]);
           break;
        }
     }

   total--;
   if (total == 0)
     {
        winner_cb();
        return true;
     }
   return false;
}
function rawoul(x, y)
{
   var obj;

   if (x < 0
       || y < 0
       || y >= map.revealed.length
       || x >= map.revealed[0].length)
     return false;

   if (!map.revealed[y][x])
     return false;

   if (map.flags[y][x])
     return false;

   var count = 0;

   obj = edje_object_part_swallow_get(map.grid, x + "/" + y);
   if (!obj)
     return false;
   edje_object_signal_emit(obj, "reveal", "code");

   var xstart = x - 1;
   var ystart = y - 1;
   var xend = xstart + 3;
   var yend = ystart + 3;

   if (xstart < 0)
     xstart = 0;
   if (ystart < 0)
     ystart = 0;
   if (xend > map.revealed[0].length)
     xend = map.revealed[0].length;
   if (yend > map.revealed.length)
     yend = map.revealed.length;

   for (var yi = ystart; yi < yend; ++yi)
     for (var xi = xstart; xi < xend; ++xi)
       if (map.flags[yi][xi])
         count++;

   if (map.count[y][x] == count)
     for (var xi = xstart; xi < xend; xi++)
       for (var yi = ystart; yi < yend; yi++)
         reveal(xi, yi);
}
function flag(x, y)
{
   if (!map.revealed[y][x])
     {
        var obj = edje_object_part_swallow_get(map.grid, x + "/" + y);
        if (obj)
          {
             var osignal;
             var fsignal;

             if (map.flags[y][x])
               {
                  osignal = "flag,off";
                  fsignal = "reset-";
                  map.flags[y][x] = false;
                  count += 1;
               }
             else
               {
                  osignal = "flag,on";
                  fsignal = "flag-";
                  map.flags[y][x] = true;
                  count -= 1;
               }

             fsignal += x + "/" + y;

             edje_object_signal_emit(obj, osignal, "code");
             edje_object_signal_emit(o_edje, fsignal, "code");
             edje_object_part_text_set(o_edje, "flag,count", count);
             refresh_cursor(x, y);
          }
     }
}

function signal_cb_reveal(data, obj, sig, src)
{
   var part = src.substring(7).split("/");
   ecore_evas_callback_pre_render_set(ee, pre_render_cb);

   evas_event_freeze(evas);

   reveal(parseInt(part[0]), parseInt(part[1]));
   refresh_cursor(parseInt(part[0]), parseInt(part[1]));

   evas_event_thaw(evas);
}
function signal_cb_rawoul(data, obj, sig, src)
{
   var part = src.substring(7).split("/");
   ecore_evas_callback_pre_render_set(ee, pre_render_cb);

   evas_event_freeze(evas);

   rawoul(parseInt(part[0]), parseInt(part[1]));
   refresh_cursor(parseInt(part[0]), parseInt(part[1]));

   evas_event_thaw(evas);
}
function signal_cb_flag(data, obj, sig, src)
{
   var part = src.substring(7).split("/");

   evas_event_freeze(evas);

   flag(parseInt(part[0]), parseInt(part[1]));
   refresh_cursor(parseInt(part[0]), parseInt(part[1]));

   evas_event_thaw(evas);
}

function pre_render_cb(ecore_evas)
{
   edje_freeze();

   ecore_evas_callback_pre_render_set(ee, null);
   ecore_evas_callback_post_render_set(ee, post_render_cb);
}
function post_render_cb(ecore_evas)
{
   edje_thaw();

   ecore_evas_callback_post_render_set(ee, null);
}
function timer_update(data)
{
   if (start_time == null)
     {
        var tmp = new Date();
        start_time = tmp.getTime();
        ecore_timer_interval_set(et, 1);
     }

   var d = new Date();

   edje_object_part_text_set(o_edje, "clock,count", split_time(d.getTime() - start_time));
   return 1;
}

function game_reset_cb(obj)
{
   x = obj.x;
   y = obj.y;

   return 0;
}
function update_position(vx, vy)
{
   var tx = x + vx;
   var ty = y + vy;

   if (ty >= map.revealed.length)
     ty = 0;
   if (ty < 0)
     ty = map.revealed.length - 1;
   if (tx >= map.revealed[0].length)
     tx = 0;
   if (tx < 0)
     tx = map.revealed[0].length - 1;

   refresh_cursor(tx, ty);
}
function key_cleanup()
{
   timestamp = 0;
   cursors = new Array();
   ecore_idle_enterer_add(game_reset_cb, { x: x, y: y });
}
function key_game_cb_down(data, e, obj, event)
{
   evas_event_freeze(evas);

   if (timestamp == event.timestamp)
     switch (event.keyname) {
      case "Programe_Minus":
      case "Page_Down":
      case "Yellow":
      case "Red":
      case "y":
      case "b":
      case "Home":
      case "equal":
      case "Escape":
      case "Start":
      case "Stop":
      case "period":
      case "Mute":
	 evas_event_thaw(evas);
	 return ;
      case "KP4":
      case "Left":
      case "FP/Left":
      case "RC/Left":
      case "RCL/Left":
      case "GP/Left":
      case "KP6":
      case "Right":
      case "FP/Right":
      case "RC/Right":
      case "RCL/Right":
      case "GP/Right":
      case "KP8":
      case "Up":
      case "FP/Up":
      case "RC/Up":
      case "RCL/Up":
      case "GP/Up":
      case "KP2":
      case "Down":
      case "FP/Down":
      case "RC/Down":
      case "RCL/Down":
      case "GP/Down":
	 ecore_idler_del(key_cleanup_cb);
	 key_cleanup_cb = null;
	 if (key_count++ < 2)
	   {
	      evas_event_thaw(evas);
	      return ;
	   }
     }

   switch (event.keyname) {
   case "KP4":
   case "Left":
   case "FP/Left":
   case "RC/Left":
   case "RCL/Left":
   case "GP/Left":
      dx = -1;
      cursors = new Array();
      update_position(dx, dy);
      break;
   case "KP6":
   case "Right":
   case "FP/Right":
   case "RC/Right":
   case "RCL/Right":
   case "GP/Right":
      dx = 1;
      cursors = new Array();
      update_position(dx, dy);
      break;
   case "KP8":
   case "Up":
   case "FP/Up":
   case "RC/Up":
   case "RCL/Up":
   case "GP/Up":
      dy = -1;
      cursors = new Array();
      update_position(dx, dy);
      break;
   case "KP2":
   case "Down":
   case "FP/Down":
   case "RC/Down":
   case "RCL/Down":
   case "GP/Down":
      dy = 1;
      cursors = new Array();
      update_position(dx, dy);
      break;
   case "a":
   case "Green":
   case "KP_Enter":
   case "Return":
   case "Select":
   case "FP/Ok":
   case "RC/Ok":
      key_cleanup();
      ecore_evas_callback_pre_render_set(ee, pre_render_cb);
      reveal(x, y);
      refresh_cursor(x, y);
      dx = 0; dy = 0;
      break;
   case "Programe_Plus":
   case "Page_Up":
   case "Blue":
   case "x":
      key_cleanup();
      ecore_evas_callback_pre_render_set(ee, pre_render_cb);
      rawoul(x, y);
      refresh_cursor(x, y);
      dx = 0; dy = 0;
      break;
   case "Programe_Minus":
   case "Page_Down":
   case "Yellow":
   case "Red":
   case "y":
   case "b":
      key_cleanup();
      ecore_evas_callback_pre_render_set(ee, pre_render_cb);
      flag(x, y);
      refresh_cursor(x, y);
      dx = 0; dy = 0;
      break;
   case "Home":
   case "equal":
   case "Escape":
   case "Start":
   case "Stop":
      edje_exit(evas, o_edje, menu_back);
      dx = 0; dy = 0;
      break;
   case "period":
   case "Mute":
      if (sample)
        if (playing) {
           Mix_Paused(-1);
           playing = false;
        } else {
           Mix_Resume(-1);
           playing = true;
        }
      break;
   }

   evas_event_thaw(evas);
}

function key_game_cb_idle(data)
{
   key_count = 0;
   key_cleanup_cb = null;
   return 0;
}

function key_game_cb_up(data, e, obj, event)
{
   switch (event.keyname) {
   case "KP4":
   case "Left":
   case "FP/Left":
   case "RC/Left":
   case "RCL/Left":
   case "GP/Left":
   case "KP6":
   case "Right":
   case "FP/Right":
   case "RC/Right":
   case "RCL/Right":
   case "GP/Right":
      dx = 0;
      cursors = new Array();
      break;
   case "KP8":
   case "Up":
   case "FP/Up":
   case "RC/Up":
   case "RCL/Up":
   case "GP/Up":
   case "KP2":
   case "Down":
   case "FP/Down":
   case "RC/Down":
   case "RCL/Down":
   case "GP/Down":
      dy = 0;
      cursors = new Array();
      break;
   }

   timestamp = event.timestamp;
   if (!key_cleanup_cb)
     key_cleanup_cb = ecore_idler_add(key_game_cb_idle, null);

   if (dx == 0 && dy == 0)
     cursors = new Array();
}

function update_scores()
{
   if (scores["easy"])
     edje_object_part_text_set(o_edje, "timing/score/0", split_time(scores["easy"]));
   if (scores["middle"])
     edje_object_part_text_set(o_edje, "timing/score/1", split_time(scores["middle"]));
   if (scores["expert"])
     edje_object_part_text_set(o_edje, "timing/score/2", split_time(scores["expert"]));
}

function menu_back(test)
{
   if (!test)
     {
        if (et)
          ecore_timer_del(et);
        et = null;
        if (e_timer)
          {
             ecore_timer_del(e_timer);
             e_timer = null;
          }

        evas_object_event_callback_del(o_edje, EVAS_CALLBACK_KEY_DOWN, key_game_cb_down, null);
        evas_object_event_callback_del(o_edje, EVAS_CALLBACK_KEY_UP, key_game_cb_up, null);
	if (!mouse_detect)
	  {
	     evas_object_event_callback_del(o_back, EVAS_CALLBACK_KEY_DOWN, key_game_cb_down, null);
	     evas_object_event_callback_del(o_back, EVAS_CALLBACK_KEY_UP, key_game_cb_up, null);
	  }

        edje_object_signal_callback_del(o_edje, "mouse,clicked,1", "detect-*", signal_cb_reveal);
        edje_object_signal_callback_del(o_edje, "mouse,clicked,2", "detect-*", signal_cb_rawoul);
        edje_object_signal_callback_del(o_edje, "mouse,clicked,3", "detect-*", signal_cb_flag);
        edje_object_signal_callback_del(o_edje, "mouse,in", "detect-*", signal_cb_mouse_in);

        evas_object_event_callback_add(o_edje, EVAS_CALLBACK_KEY_DOWN, key_menu_cb_down, null);
        evas_object_event_callback_add(o_edje, EVAS_CALLBACK_KEY_UP, key_menu_cb_up, null);
	if (!mouse_detect)
	  {
	     evas_object_event_callback_add(o_back, EVAS_CALLBACK_KEY_DOWN, key_menu_cb_down, null);
	     evas_object_event_callback_add(o_back, EVAS_CALLBACK_KEY_UP, key_menu_cb_up, null);
	  }

        edje_object_file_set(o_edje, "Demineur.edj", "menu");

        edje_object_message_send(o_edje, EDJE_MESSAGE_INT, 3, gaming);
        gaming = -1;
        evas_object_focus_set(o_edje, 1);
        update_scores();

        map = { count: [], mines: [], flags: [], revealed: [] };
     }
}

function key_menu_cb_down(data, e, obj, event)
{
   switch (event.keyname) {
   case "KP8":
   case "Up":
   case "FP/Up":
   case "RC/Up":
   case "RCL/Up":
   case "GP/Up":
      edje_object_message_send(o_edje, EDJE_MESSAGE_INT, 1, -1);
      break;
   case "KP2":
   case "Down":
   case "FP/Down":
   case "RC/Down":
   case "RCL/Down":
   case "GP/Down":
      edje_object_message_send(o_edje, EDJE_MESSAGE_INT, 1, +1);
      break;
   case "KP_Enter":
   case "Return":
   case "Select":
   case "FP/Ok":
   case "RC/Ok":
      edje_object_message_send(o_edje, EDJE_MESSAGE_INT, 2, 1);
      break;
   case "Home":
   case "equal":
   case "Escape":
   case "Stop":
   case "Start":
      ecore_main_loop_quit();
      break;
   }
}
function key_menu_cb_up(data, e, obj, event)
{
}

function sound_idler_cb(data)
{
   Mix_OpenAudio(44100, 0x9010, 2, 1024);
   sample = Mix_LoadWAV("Demineur.ogg");
   if (sample)
     Mix_PlayChannel(-1, sample, -1);

   return 0;
}

function mouse_move_cb(data, e, obj, event)
{
   if (!mouse_detect)
     {
        evas_object_event_callback_del(o_back, EVAS_CALLBACK_MOUSE_MOVE, mouse_move_cb, null);
	evas_object_event_callback_del(o_back, EVAS_CALLBACK_KEY_DOWN, key_menu_cb_down, null);
	evas_object_event_callback_del(o_back, EVAS_CALLBACK_KEY_UP, key_menu_cb_up, null);
        ecore_evas_cursor_set(ee, "freebox-mouse.png", 200, 0, 0);
        evas_object_layer_set(o_edje, 0);
	evas_object_del(o_back);
	o_back = null;
        mouse_detect = true;
     }
}

function interface_builder_cb(data)
{
   o = edje_object_add(evas);
   edje_object_message_handler_set(o, message_cb, null);
   edje_object_file_set(o, "Demineur.edj", "menu");
   evas_object_layer_set(o, 1);
   evas_object_move(o, 0, 0);
   evas_object_resize(o, 720, 576);
   evas_object_event_callback_add(o, EVAS_CALLBACK_KEY_DOWN, key_menu_cb_down, null);
   evas_object_event_callback_add(o, EVAS_CALLBACK_KEY_UP, key_menu_cb_up, null);
   evas_object_focus_set(o, 1);
   evas_object_show(o);
   o_edje = o;

   o = evas_object_rectangle_add(evas);
   evas_object_move(o, 0, 0);
   evas_object_layer_set(o, 2);
   evas_object_resize(o, 720, 576);
   evas_object_event_callback_add(o, EVAS_CALLBACK_MOUSE_MOVE, mouse_move_cb, null);
   evas_object_color_set(o, 0, 0, 0, 0);
   evas_object_show(o);
   o_back = o;

   update_scores();

   edje_object_message_send(o_edje, EDJE_MESSAGE_INT, 1, 0);

   if (sound)
     ecore_idle_enterer_add(sound_idler_cb, null);

   return 0;
}

function setup()
{
   if (shutdown == undefined || shutdown == false)
     {
        ecore_init();
        ecore_evas_init();
        edje_init();

        ee = ecore_evas_new(null, 0, 0, 720, 576, "name=Demineur;double_buffer=0;");

        evas = ecore_evas_get(ee);

        evas_image_cache_set(evas, 8192 * 1024);
        evas_font_path_prepend(evas, FN);
        evas_font_cache_set(evas, 512 * 1024);
     }
   else
     evas_object_del(eo_bg);

   ecore_idler_add(interface_builder_cb, null);
}

function main()
{
   scores = load_highscore();
   if (scores == null)
     scores = { };

   setup();

   ecore_evas_show(ee);

   ecore_main_loop_begin();

   ecore_evas_free(ee);

   edje_shutdown();
   ecore_evas_shutdown();
   ecore_shutdown();
}

if (test)
   main();


0;

