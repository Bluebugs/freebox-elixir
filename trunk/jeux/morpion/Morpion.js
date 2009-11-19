var test = true;

var sound = elx.load("fws");

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

var win = { w: 720, h: 576};

var evas;

var eo_bg;
var ee;
var edje = null;
var wait;

var count = [ 0, 0 ];

var CROSS = 1;
var ROND = -1;
var DRAW = 0;

var bd = null;
var x = 0;
var y = 0;

var timestamp = 0;
var retry = 0;

var callback = null;
var start_callback = null;

var memoizer = function(memo, fundamental) {
  var shell = function(n) {
    var result = memo[n];
    if (result === undefined) {
       result = fundamental(shell, n);
       memo[n] = result;
    }
    return result;
  };
  return shell;
};

var fact = memoizer([1, 1], function(shell, n) {
    return n * shell(n - 1);
  });

var table = { "nnnnnnnnn" : null };
var mm = {};

function Board(copy)
{
   if (copy) {
      this.col = copy.col;
      this.play = copy.play;
      this.go = copy.go;
   } else {
      this.col = CROSS;
      this.play = "nnnnnnnnn";
      this.go = 9;
   }

   this.change = function(at, code) {
     var tmp;

     if (at == 0)
       tmp = code + this.play.slice(at + 1);
     else if (at == 8)
       tmp = this.play.slice(0, 8) + code;
     else
       tmp = this.play.slice(0, at) + code + this.play.slice(at + 1);
//      elx.print(this.play, " => ", tmp, "\n");
     this.play = tmp;
   }

   this.set = function(x, y) {
     var tmp;

//      elx.print("play: ", x, ", ", y, "\n");

     if (this.col == ROND)
       this.change(x + y * 3, "r");
     else
       this.change(x + y * 3, "c");
     this.go--;
   }

   this.unset = function(x, y) {
     this.change(x + y * 3, "n");
     this.go++;
   }

   this.empty = function(x, y) {
//      elx.print("empty (", x, ", ", y, ") : ", this.play.charAt(x + y * 3) == "n", "\n");
     elx.print("playground: (", this.play, ") at ", x + y * 3," '", this.play.charAt(x + y * 3),"'\n");
     return this.play.charAt(x + y * 3) == "n";
   }

   this.color = function() {
     this.col = (this.col == CROSS) ? ROND : CROSS;
   }

   this.many = function() {
     return this.go;
   }

   this.count = function() {
     return fact(this.go);
   }

   this.check = function() {
     var gamechecks = [
         [ [ 0, 0 ], [ 0, 1 ], [ 0, 2 ] ],
         [ [ 0, 0 ], [ 1, 0 ], [ 2, 0 ] ],
         [ [ 0, 0 ], [ 1, 1 ], [ 2, 2 ] ],
         [ [ 0, 1 ], [ 1, 1 ], [ 2, 1 ] ],
         [ [ 0, 2 ], [ 1, 2 ], [ 2, 2 ] ],
         [ [ 1, 0 ], [ 1, 1 ], [ 1, 2 ] ],
         [ [ 2, 0 ], [ 2, 1 ], [ 2, 2 ] ],
         [ [ 2, 0 ], [ 1, 1 ], [ 0, 2 ] ]
     ];

     var cache = table[this.play];

     if (cache !== undefined) {
	return cache;
     }

     var result = this.go == 0 ? DRAW : null;

     for (var i in gamechecks) {
        var c1 = this.play.charAt(gamechecks[i][0][0] + gamechecks[i][0][1] * 3);
        var c2 = this.play.charAt(gamechecks[i][1][0] + gamechecks[i][1][1] * 3);
        var c3 = this.play.charAt(gamechecks[i][2][0] + gamechecks[i][2][1] * 3);

        if (c1 != "n" && c1 == c2 && c2 == c3) {
	   if (c1 == "r") cache = ROND;
	   else cache = CROSS;

	   table[this.play] = cache;
	   return cache;
        }
     }

     table[this.play] = result;
     return result;
   };
}

function mouse_wait_cb(data, e, obj, event)
{
   evas_object_event_callback_del(wait, EVAS_CALLBACK_MOUSE_DOWN, mouse_wait_cb);
   evas_object_event_callback_del(wait, EVAS_CALLBACK_KEY_DOWN, key_wait_cb);
   evas_object_del(wait);
   wait = null;

   evas_object_focus_set(eo_bg, 1);

   reset(edje);
}
function key_wait_cb(data, e, obj, event)
{
   if (timestamp == event.timestamp)
     return ;

   evas_object_event_callback_del(wait, EVAS_CALLBACK_MOUSE_DOWN, mouse_wait_cb);
   evas_object_event_callback_del(wait, EVAS_CALLBACK_KEY_DOWN, key_wait_cb);
   evas_object_del(wait);
   wait = null;

   evas_object_focus_set(eo_bg, 1);

   reset(edje);
}

function reset(obj)
{
   bd = new Board();

   for (var ix = 0; ix < 3; ++ix)
     for (var iy = 0; iy < 3; ++iy)
       {
          var o;

          o = edje_object_part_swallow_get(obj, ix + "/" + iy);
          edje_object_signal_emit(o, "default", "js");
       }

   if (callback && start_callback)
     start_callback(obj);
}

function ending(obj, callback)
{
   var result = bd.check();

   if (result != null)
     {
        var part = null;
        var val = -1;
        var o;

        switch (result)
          {
           case DRAW:
              edje_object_signal_emit(obj, "draw", "end");
              break;
           case CROSS:
              count[0]++;
              part = "text/croix";
              val = count[0];
              edje_object_signal_emit(obj, "croix", "end");
              break;
           case ROND:
              count[1]++;
              part = "text/rond";
              val = count[1];
              edje_object_signal_emit(obj, "rond", "end");
              break;
          }

        if (part != null)
          {
             var str;

             if (val > 9)
               str = "" + val;
             else
               str = "0" + val;

             edje_object_part_text_set(obj, part, str);
          }

        o = evas_object_rectangle_add(evas);
        evas_object_move(o, 0, 0);
        evas_object_resize(o, win.w, win.h);
        evas_object_color_set(o, 0, 0, 0, 1);
        evas_object_event_callback_add(o, EVAS_CALLBACK_MOUSE_DOWN, mouse_wait_cb, null);
        evas_object_event_callback_add(o, EVAS_CALLBACK_KEY_DOWN, key_wait_cb, null);
        evas_object_focus_set(o, 1);
        evas_object_show(o);

        wait = o;

        return true;
     }

   return false;
}

function disp(value)
{
   elx.print("[ ");

   for (var x = 0; x < 3; ++x)
     {
        elx.print("[ ");

        for (var y = 0; y < 3; ++y)
          {
             elx.print(bd.play[x][y]);
             if (y != 2)
               elx.print(", ");
          }
        elx.print(" ] ");
        if (x != 2)
          elx.print(", ");
     }
   elx.print("] == ", value, "\n");
}

var total = 0;

function minmax(nbd)
{
   var sum = [ 0, 0, 0 ];
   var result = mm[nbd.play];

   if (result !== undefined) {
      return result;
   }

   nbd.color();
   for (var i = 0; i < 3; ++i)
     for (var j = 0; j < 3; ++j)
       if (nbd.empty(i, j))
         {
            var tmp;

            nbd.set(i, j);

            tmp = nbd.check();

            if (tmp == DRAW)
              sum[2] += 1;
            else
              if (tmp != null)
                 sum[0] += nbd.count();
              else
                {
                   var tmp = minmax(nbd);
                   var count;

                   sum[0] += tmp[1];
                   sum[1] += tmp[0];
                   sum[2] += tmp[2];
                }

            nbd.unset(i, j);

//             count = sum[0] + sum[1] + sum[2];
//             if (count > 30) {
//                if (sum[0] / count > 0.4999) {
//                   nbd.color();

// 		  mm[nbd.play] = sum;
//                   return sum;
//                }
//             }
         }
   nbd.color();

   mm[nbd.play] = sum;
   return sum;
}

function next()
{
   var max = 1.1;
   var coord = [ -1, -1 ];
   var nbd = new Board(bd);

   if (bd.count() > 5000)
     {
        var list = new Array();
	elx.print("random case\n");

        for (var x = 0; x < 3; ++x)
          for (var y = 0; y < 3; ++y)
            if (nbd.empty(x, y))
              list.push([x, y]);

        return list[rand(list.length - 1)];
     }

   for (var x = 0; x < 3; ++x)
     for (var y = 0; y < 3; ++y)
       if (nbd.empty(x, y))
         {
            var tmp;

            nbd.set(x, y);

            tmp = nbd.check();
            if (tmp != null)
              {
                 if (tmp != DRAW)
                   return [ x, y ];
                 else
                   if (max > 1)
                     {
                        max = 1;
                        coord = [ x, y ];
                     }
              }
            else
              {
                 var mm = minmax(nbd);
                 var score = mm[0] / (mm[0] + mm[1] + mm[2]);

                 if (score < max)
                   {
                      max = score;
                      coord = [ x, y ];
                   }
               }

            nbd.unset(x, y);
         }

   return coord;
}

function local_game_cb(data, obj, sig, src)
{
   // Swallow object event
   var pos = src.substring(7).split("/");

   var lx = parseInt(pos[0]);
   var ly = parseInt(pos[1]);

   if (!bd.empty(lx, ly))
       return ;

   var o = edje_object_part_swallow_get(obj, pos[0] + "/" + pos[1]);

   edje_object_signal_emit(o, bd.col == ROND ? "rond" : "croix", "js");

   bd.set(lx, ly);
   bd.color();

   ending(obj, local_game_cb);
}

function ai_game_start(obj)
{
   if (rand(2) > 1)
   {
      bd.col = CROSS;

      coord = next();

      var o = edje_object_part_swallow_get(obj, coord[0] + "/" + coord[1]);
      edje_object_signal_emit(o, "croix", "js");

      bd.set(parseInt(coord[0]), parseInt(coord[1]));
      bd.color();

      ending(obj, ai_game_cb);
   }
}

function ai_idler_cb(data)
{
   coord = next();

   o = edje_object_part_swallow_get(data, coord[0] + "/" + coord[1]);
   edje_object_signal_emit(o, "croix", "js");

   bd.set(coord[0], coord[1]);
   bd.color();

   ending(data, ai_game_cb);

   return 0;
}

function ai_game_cb(data, obj, sig, src)
{
   // Swallow object event
   var pos = src.substring(7).split("/");

   var lx = parseInt(pos[0]);
   var ly = parseInt(pos[1]);

   if (!bd.empty(lx, ly))
     return ;

   bd.col = ROND;

   var o = edje_object_part_swallow_get(obj, pos[0] + "/" + pos[1]);
   edje_object_signal_emit(o, "rond", "js");

   bd.set(lx, ly);
   bd.color();

   if (ending(obj, ai_game_cb))
     return ;

   ecore_idler_add(ai_idler_cb, obj);
}

function network_game_cb(data, obj, sig, src)
{
}

function mouse_signal_cb(data, obj, sig, src)
{
   var pos = src.substring(7).split("/");

   if (pos.length == 2)
     {
        x = parseInt(pos[0]);
        y = parseInt(pos[1]);

        edje_object_message_send(edje, EDJE_MESSAGE_INT_SET, 4, [ x, y ]);
     }
}

function signal_cb(data, obj, sig, src)
{
   callback = null;
   start_callback = null;
   var coord;

   edje_object_signal_callback_del(obj, "mouse,clicked,*", "*", signal_cb);

   switch (src)
     {
      case "text/ai":
              callback = ai_game_cb;
              start_callback = ai_game_start;
      break;
      case "text/local": callback = local_game_cb; break;
      case "text/network": callback = network_game_cb; break;
      case "text/leave": ecore_main_loop_quit(); break;
   }

   if (callback)
     {
        edje_object_file_set(obj, "Morpion.edj", "game");
        edje_object_signal_callback_add(obj, "mouse,clicked,*", "*", callback, null);
        edje_object_signal_callback_add(obj, "mouse,in", "detect-*", mouse_signal_cb, null);
        edje_object_message_send(edje, EDJE_MESSAGE_INT_SET, 4, [ x, y ]);

        bd = new Board();
        count = [ 0, 0 ];

	if (start_callback)
	  start_callback(obj);

     }
}

var mouse_call = true;
function mouse_move_cb(data, e, obj, event)
{
   if (mouse_call)
     {
        mouse_call = false;

        evas_object_event_callback_del(eo_bg, EVAS_CALLBACK_MOUSE_MOVE, mouse_move_cb);

        ecore_evas_cursor_set(ee, "freebox-mouse.png", 200, 0, 0);

        evas_object_stack_below(eo_bg, edje);
     }
}

function menu_back(test)
{
   if (!test)
     {
        key_up = key_menu_up;
        key_down = key_menu_down;
        edje_object_signal_callback_del(edje, "mouse,clicked,*", "*", callback);
        edje_object_signal_callback_del(edje, "mouse,in", "detect-*", mouse_signal_cb);
        edje_object_file_set(edje, "Morpion.edj", "menu");
        edje_object_signal_callback_add(edje, "mouse,clicked,*", "*", signal_cb, null);
        edje_object_message_send(edje, EDJE_MESSAGE_INT, 1, 0);
     }
}

var e_timer = null;
var d = { x: 0, y: 0 };
function move_cursor()
{
   x += d.x;
   if (x < 0) x = 2;
   if (x > 2) x = 0;

   y += d.y;
   if (y < 0) y = 2;
   if (y > 2) y = 0;

   edje_object_message_send(edje, EDJE_MESSAGE_INT_SET, 4, [ x, y ]);
}

function key_game_cb_repeat(data)
{
   ecore_timer_interval_set(e_timer, 0.2);

   if (d.x == 0
       && d.y == 0)
     {
        ecore_timer_del(e_timer);
        e_timer = null;
     }

   move_cursor();
   return 1;
}

function key_game_down(event)
{
   retry++;
   if (timestamp == event.timestamp) {
      if (retry < 3)
	return ;
   } else {
      retry = 0;
   }

   switch (event.keyname)
     {
      case "KP4":
      case "Left":
      case "FP/Left":
      case "RC/Left":
      case "RCL/Left":
      case "GP/Left":
         if (!e_timer)
           e_timer = ecore_timer_add(0.4, key_game_cb_repeat, null);
         d.x = -1;
         move_cursor();
         break;
      case "KP6":
      case "Right":
      case "FP/Right":
      case "RC/Right":
      case "RCL/Right":
      case "GP/Right":
         if (!e_timer)
           e_timer = ecore_timer_add(0.4, key_game_cb_repeat, null);
         d.x = 1;
         move_cursor();
         break;
      case "KP8":
      case "Up":
      case "FP/Up":
      case "RC/Up":
      case "RCL/Up":
      case "GP/Up":
         if (!e_timer)
           e_timer = ecore_timer_add(0.4, key_game_cb_repeat, null);
         d.y = -1;
         move_cursor();
         break;
      case "KP2":
      case "Down":
      case "FP/Down":
      case "RC/Down":
      case "RCL/Down":
      case "GP/Down":
         if (!e_timer)
           e_timer = ecore_timer_add(0.4, key_game_cb_repeat, null);
         d.y = 1;
         move_cursor();
         break;
      case "a":
      case "Green":
      case "Select":
      case "KP_Enter":
      case "Return":
      case "RC/Ok":
         callback(null, edje, "mouse,clicked,1", "detect-" + x + "/" + y);
         break;
      case "Home":
      case "equal":
      case "Escape":
      case "Start":
      case "Stop":
         edje_exit(evas, eo_bg, menu_back);
         break;
     }
}
function key_menu_down(event)
{
   switch (event.keyname)
     {
      case "KP8":
      case "Up":
      case "FP/Up":
      case "RC/Up":
      case "RCL/Up":
      case "GP/Up":
         edje_object_message_send(edje, EDJE_MESSAGE_INT, 1, -1);
         e_timer = ecore_timer_add(0.4, key_menu_cb_repeat, -1);
         break;
      case "KP2":
      case "Down":
      case "FP/Down":
      case "RC/Down":
      case "RCL/Down":
      case "GP/Down":
         edje_object_message_send(edje, EDJE_MESSAGE_INT, 1, 1);
         e_timer = ecore_timer_add(0.4, key_menu_cb_repeat, +1);
         break;
      case "RC/Ok":
      case "Return":
      case "KP_Enter":
      case "Green":
      case "Select":
      case "a":
         key_down = key_game_down;
         key_up = key_game_up;
         edje_object_message_send(edje, EDJE_MESSAGE_INT, 2, 1);
         break;
      case "Home":
      case "equal":
      case "Escape":
      case "Start":
      case "Stop":
         ecore_main_loop_quit();
         break;
     }
}
var key_down = key_menu_down;

function key_game_up(event)
{
   switch (event.keyname)
     {
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
         d.x = 0;
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
         d.y = 0;
         break;
     }
}
function key_menu_up(event)
{
   if (e_timer)
     {
        ecore_timer_del(e_timer);
        e_timer = null;
     }
}
var key_up = key_menu_up;
var old_up;

function key_menu_cb_repeat(data)
{
   edje_object_message_send(edje, EDJE_MESSAGE_INT, 1, data);
   ecore_timer_interval_set(e_timer, 0.2);

   return 1;
}
function key_cb_down(data, e, obj, event)
{
   if (e_timer)
     {
        ecore_timer_del(e_timer);
        e_timer = null;
     }

   if (key_down)
     key_down(event);
}
function key_cb_up(data, e, obj, event)
{
   timestamp = event.timestamp;

   if (key_up)
     key_up(event);
}

function sound_idler_cb(data)
{
   fws.stream_open(0, "file://Morpion.mp3");
   fws.stream_loop_set(0, FWS_SET);
   fws.stream_play(0);

   return 0;
}

function setup()
{
   o = evas_object_rectangle_add(evas);
   evas_object_move(o, 0, 0);
   evas_object_resize(o, win.w, win.h);
   evas_object_color_set(o, 0, 0, 0, 1);
   evas_object_event_callback_add(o, EVAS_CALLBACK_MOUSE_MOVE, mouse_move_cb, null);
   evas_object_event_callback_add(o, EVAS_CALLBACK_KEY_DOWN, key_cb_down, null);
   evas_object_event_callback_add(o, EVAS_CALLBACK_KEY_UP, key_cb_up, null);
   evas_object_focus_set(o, 1);
   evas_object_show(o);
   eo_bg = o;

   o = edje_object_add(evas);
   edje_object_file_set(o, "Morpion.edj", "menu");
   evas_object_layer_set(o, 0);
   evas_object_move(o, 0, 0);
   evas_object_resize(o, win.w, win.h);
   evas_object_show(o);

   edje_object_signal_callback_add(o, "mouse,clicked,*", "*", signal_cb, null);

   edje = o;

   edje_object_message_send(edje, EDJE_MESSAGE_INT, 3, 0);

   evas_object_stack_above(eo_bg, edje);

   if (sound)
     ecore_idle_enterer_add(sound_idler_cb, null);
}

function main()
{
   if (shutdown == undefined || shutdown == false)
     {
        ecore_init();
        ecore_evas_init();
        edje_init();

        ee = ecore_evas_new(null, 0, 0, win.w, win.h, "name=Morpion;double_buffer=0;");

        evas = ecore_evas_get(ee);

        evas_image_cache_set(evas, 8192 * 1024);
        evas_font_path_prepend(evas, FN);
        evas_font_cache_set(evas, 512 * 1024);
     }
   else
     evas_object_del(eo_bg);

   setup();

   ecore_evas_show(ee);

   ecore_main_loop_begin();

   edje_shutdown();
   ecore_evas_shutdown();
   ecore_shutdown();
};

if (test)
	main();
