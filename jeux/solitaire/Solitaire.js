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

var order = new Array("a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k");
var card_color = new Array("carreau", "coeur", "pique", "trefle");
var are_red = new Array(true, true, false, false);

var cards = new Array(52);
var FN = "/.fonts/";

var win = { w: 720, h: 576 };
var accessibility = 13;

var evas;

var ee;
var eo_bg;

var wait = null;
var bck = null;

var ei = null;

var cursor;
var cursor_blue;

var start = undefined;
var game = null;
var game_timer = null;
var begin = undefined;
var timestamp = 0;
var key_count = 0;

var gravity = new Array();
var won = false;
var once = false;

var explode;

var sample;
var playing = true;

function rand(n)
{
	return Math.floor(Math.random() * n + 1);
}

function split_time(timing) {
	if (timing < 0 || timing === undefined) {
		return "--:--";
	} else {
		timing /= 1000;
		var minute = String(parseInt(timing / 60));
		var seconde = String(parseInt(timing % 60));

		if (minute.length < 2)
			minute = "0" + minute;
		if (seconde.length < 2)
			seconde = "0" + seconde;

		return minute + ":" + seconde;
	}
}

function rand_extract()
{
   var item;
   var index = rand(cards.length) - 1;

   item = cards[index];
   cards.splice(index, 1);
   return item;
}

function Base()
{
   var o;

   o = edje_object_add(evas);
   edje_object_file_set(o, "Solitaire.edj", "back-card");
   evas_object_layer_set(o, 31);
   evas_object_resize(o, 75, 113);
   evas_object_hide(o);

   return o;
}

function Stack(back_count, index)
{
   var dec = 0;
   var geom;

   geom = edje_object_part_geometry_get(bck, "stack/" + index);

   this.x = geom.x;
   this.y = geom.y;

   this.stack = new Array(back_count);
   this.back = new Array(back_count);
   for (var i = 0; i < back_count; ++i) {
      this.stack[i] = rand_extract();
      this.back[i] = Base();
      evas_object_move(this.back[i], this.x, this.y + dec);
      dec += 5;
   }

   this.display = new Array();
   this.dec = this.y;
   this.active = false;

   this.run = function() {
     if (this.display.length == 0 && this.back.length > 0) {
       var tmp = this.back.pop();
       var geom;

       if (tmp === undefined) {
          this.dec = this.y;
       } else {
         geom = evas_object_geometry_get (tmp);
         evas_object_del(tmp);

         tmp = this.stack.pop();
         this.display.push(tmp);
         evas_object_move(tmp, geom.x, geom.y);
         if (this.active) evas_object_show(tmp);
         this.dec = geom.y + accessibility;
       }
     }
   }
   this.push = function(stack) {
     var tmp = new Array();
     var head = this.display[this.display.length - 1];
     var stack_index = 13;
     var stack_red = undefined;
     var popped_index, popped_prev;
     var popped_red, popped_prev_red;
     var test;
     if (head) {
        stack_index = evas_object_data_get(head, "order");
        stack_red = evas_object_data_get(head, "red");
     }

     while (stack.display.length > 0) {
       var out = stack.display.pop();

       popped_prev_red = popped_red;
       popped_red = evas_object_data_get(out, "red");

       popped_prev = popped_index;
       popped_index = evas_object_data_get(out, "order");

       if (popped_index < stack_index
           && (popped_prev === undefined || popped_prev + 1 == popped_index)
           && (popped_red != popped_prev_red)) {
          tmp.push(out);
       } else {
         popped_index = popped_prev;
         popped_red = popped_prev_red;
         stack.display.push(out);
         break;
       }
     }

     test = tmp.length != 0;

     while (tmp.length > 0) {
        var elt = tmp.pop();

        if (popped_index == stack_index - 1
            && popped_red != stack_red) {
           this.display.push(elt);
           edje_object_part_unswallow(bck, elt);
           evas_object_move(elt, this.x, this.dec);
           evas_object_layer_set(elt, 32);
           if (this.display[this.display.length - 2])
             evas_object_stack_above(elt, this.display[this.display.length - 2]);
           this.dec += accessibility;
           stack.dec -= accessibility;
        } else {
           stack.display.push(elt);
        }
     }
     if (test)
       cursor.update(this);

     stack.run();

     return test;
   }

   this.show = function() {
     for (var i in this.back)
       evas_object_show(this.back[i]);
     for (var i in this.display)
       evas_object_show(this.display[i]);
     this.active = true;
   }
   this.hide = function() {
     for (var i in this.back)
       evas_object_hide(this.back[i]);
     for (var i in this.display)
       evas_object_hide(this.display[i]);
     this.active = false;
   }
   this.clean = function() {
     for (var i in this.back) {
       evas_object_del(this.back[i]);
       evas_object_del(this.stack[i]);
     }
     for (var i in this.display)
       evas_object_del(this.display[i]);
   }
}

function Stock(index)
{
   var geom;

   geom = edje_object_part_geometry_get(bck, "stock/" + index);

   this.x = geom.x;
   this.y = geom.y - 1;

   this.dec = this.y;
   this.display = new Array();

   this.run = function() {};
   this.push = function(stack) {
     var head = this.display[this.display.length - 1];
     var put = stack.display.pop();
     var stock_index = -1;
     var stock_color = undefined;

     if (head) {
        stock_index = evas_object_data_get(head, "order");
        stock_color = evas_object_data_get(head, "color");
     }

     if (put) {
       var stack_index = evas_object_data_get(put, "order");
       var stack_color = evas_object_data_get(put, "color");

       if (stack_index == stock_index + 1 && (stock_color === undefined || stack_color == stock_color)) {
          var top = this.display[this.display.length - 1];

          edje_object_part_unswallow(bck, put);

          this.display.push(put);
          evas_object_layer_set(put, 32);
          evas_object_move(put, this.x, this.y);

          if (top === undefined)
            evas_object_raise(put);
          else
            evas_object_stack_above(put, top);

          stack.dec -= accessibility;
          stack.run();
          cursor.update(this);

          return true;
       } else {
         stack.display.push(put);
         return false;
       }
     }
   }

   this.show = function() {
     for (var i in this.display)
       evas_object_show(this.display[i]);
   }
   this.hide = function() {
     for (var i in this.display)
       evas_object_hide(this.display[i]);
   }
   this.clean = function() {
     for (var i in this.display)
       evas_object_del(this.display[i]);
   }
}

function Gets()
{
   var geom;

   geom = edje_object_part_geometry_get(bck, "gets/0");

   this.x = geom.x;
   this.y = geom.y;

   this.still = edje_object_part_swallow_get(bck, "still");

   this.gets = new Array(24);
   for (var i = 0; i < 24; ++i)
     this.gets[i] = rand_extract();

   this.dec = 0;
   this.display = new Array();

   this.generate = function() {
     var tmp = this.gets.pop();
     var i = 3;

     if (tmp === undefined)
       {
          tmp = this.display.pop();
          while (tmp) {
             edje_object_part_unswallow(bck, tmp);
             evas_object_hide(tmp);
             this.gets.push(tmp);
             tmp = this.display.pop();
          }
       }

     while (i > 0 && tmp) {
       this.display.push (tmp);
       tmp = this.gets.pop();
       --i;
     }
     if (tmp)
       this.gets.push(tmp);

     this.show();
   }

   this.show = function() {
     var j = 0;

     edje_object_signal_emit(this.still, (this.gets.length > 0) ? "show" : "hide", "javascript");

     for (var i = this.display.length - 3; i < this.display.length; i++) {
        var top = this.display[i];
        if (top) {
           var prev;

           prev = edje_object_part_swallow_get(bck, "gets/" + j);
           if (prev)
             {
                edje_object_part_unswallow(bck, prev);
                evas_object_hide(prev);
             }

           edje_object_part_unswallow(bck, top);
           edje_object_part_swallow(bck, "gets/" + j++, top);
           evas_object_show(top);
        }
     }
   }
   this.clean = function() {
     for (var i in this.display)
       evas_object_del(this.display[i]);
     for (var i in this.gets)
       evas_object_del(this.gets[i]);
   }
   this.run = this.show;
   this.push = function(stack) { return false; }
}

function GameArea()
{
   this.stack = new Array();
   for (var i = 0; i < 7; ++i)
     this.stack[i] = new Stack(i + 1, i);

   this.stock = new Array();
   for (var i = 0; i < 4; ++i)
     this.stock[i] = new Stock(i);

   this.gets = new Gets();

   this.win = function() {
     if (this.gets.display.length != 0)
       return false;
     if (this.gets.gets.length != 0)
       return false;
     for (var i in this.stack)
       if (this.stack[i].stack.length != 0)
         return false;
     return true;
   }

   this.run = function() {
     for (var i in this.stack)
       game.stack[i].run();
   }
   this.show = function() {
     evas_object_show(bck);
     for (var i in this.stack)
       this.stack[i].show();
     for (var i in this.stock)
       this.stock[i].show();
     this.gets.show();
   }
   this.hide = function() {
     evas_object_hide(bck);
     for (var i in this.stack)
       this.stack[i].hide();
     for (var i in this.stock)
       this.stock[i].hide();
   }
   this.clean = function() {
     for (var i in this.stack)
       this.stack[i].clean();
     for (var i in this.stock)
       this.stock[i].clean();
     this.gets.clean();
   }
   this.update = function(delta) {
   }
}

function Cursor(Color) {
   this.cursor = edje_object_add(evas);
   edje_object_file_set(this.cursor, "Solitaire.edj", "select/" + Color);

   this.posx = 0;
   this.posy = 0;

   this.update = function(stack) {
     var top = stack.display[stack.display.length - 1];
     var x = stack.x;
     var y = stack.y;
     var w = 76;
     var h = 113;

     edje_object_calc_force(bck);

     if (top) {

	var geom = evas_object_geometry_get(top);

        w += geom.x - x;
        h += geom.y - y;
        evas_object_stack_above(this.cursor, top);
     } else {
       if (stack.back) {
         var end = stack.back[stack.back.length - 1];
         if (end) {
            var geom = evas_object_geometry_get(end);

            w += geom.x - x;
            h += geom.y - y;
            evas_object_stack_above(this.cursor, end);
         }
       }
     }

     evas_object_move(this.cursor, x, y);
     evas_object_resize(this.cursor, w, h);
     evas_object_show(this.cursor);
     this.reverse(stack);
   };

   this.reverse = function(stack) {
     this.posy = 1;
     for (var i in game.stack)
       if (game.stack[i] == stack) {
          this.posx = parseInt(i);
          return true;
       }

     this.posy = 0;
     for (var i in game.stock)
       if (game.stock[i] == stack) {
          this.posx = parseInt(i) + 1;
          return true;
       }
     this.posx = 0;
     if (stack == game.gets)
       return true;
     return true;
   }

   this.locate = function() {
     if (this.posy == 0) {
       switch (this.posx) {
        case 0: return game.gets;
        case 1: case 2:
        case 3: case 4:
        return game.stock[this.posx - 1];
       }
     } else {
       return game.stack[this.posx];
     }
   }

   this.down = function() {
     this.posy = 1 - this.posy;
     if (this.posy == 0) {
        switch (this.posx) {
         case 0: case 1: this.posx = 0; break;
         case 2: case 3: this.posx = 1; break;
         case 4: case 5: case 6:
            this.posx = this.posx - 2;
            break;
        }
     } else {
       switch (this.posx) {
        case 0: this.posx = 1; break;
        case 1: case 2: case 3: case 4:
        this.posx = this.posx + 2;
        break;
       }
     }
     this.update(this.locate());
   };
   this.up = this.down;
   this.left = function() {
     this.posx = this.posx - 1;
     if (this.posx < 0)
       this.posx = (this.posy == 0) ? 4 : 6;
     this.update(this.locate());
   };
   this.right = function() {
     this.posx = (this.posx + 1) % (this.posy == 0 ? 5 : 7);
     this.update(this.locate());
   };
   this.over = function(posx, posy) {
     this.posx = parseInt(posx) % 2;
     this.posy = parseInt(posy) % (this.posy == 0 ? 5 : 7);
     this.update(this.locate());
   };
}

function pending() {
   for (var i in game.stack)
     if (game.stack[i].display.length > 0)
       return true;
   return false;
}

function GravityCard(image, x, y, vx, vy)
{
   var d = new Date();

   this.vx = vx;
   this.vy = vy;
   this.x = x;
   this.y = y;

   this.running = true;

   this.image = image;

   this.anim = ecore_animator_add(gravity_anim_cb, this);
   this.last = d.getTime();

   this.update = function() {
     var d = new Date();
     var delta = d.getTime() - this.last;

     this.vy += 9.81 * delta / 600;

     this.x += this.vx * delta / 200;
     this.y += this.vy * delta / 200;

     evas_object_move(this.image, this.x, this.y);
     if (this.y + 115 < 0
         || this.x + 76 < 0
         || this.y > win.h
         || this.x > win.w) {
        ecore_animator_del(this.anim);
        this.anim = null;
        evas_object_hide(this.image);
        this.update = function(delta) {};
        this.running = false;
     }
   }
   this.clean = function() {
     evas_object_del(this.image);
     if (this.anim)
       ecore_animator_del(this.anim);
   }
}

function Card(Color, Value)
{
   var o;

   o = edje_object_add(evas);
   edje_object_file_set(o, "Solitaire.edj", Color + "/" + Value);
   evas_object_resize(o, 75, 113);
   evas_object_layer_set(o, 32);

   return o;
}

function new_game()
{
   if (game) {
      game.clean();
      game = null;
   }

   if (game_timer)
     {
        ecore_timer_del(game_timer);
        game_timer = null;
     }

   for (var i in gravity) {
      gravity[i].clean();
   }
   gravity = new Array();

   j = 0;
   for (var color in card_color) {
      for (var value in order) {
         cards[j] = Card(card_color[color], order[value]);
         evas_object_data_set(cards[j], "color", card_color[color]);
         evas_object_data_set(cards[j], "order", parseInt(value));
         evas_object_data_set(cards[j], "red", are_red[color]);
         ++j;
      }
   }

   game = new GameArea();
   game.run();

   cursor.update(game.gets);
   evas_object_show(cursor.cursor);
   evas_object_hide(cursor_blue.cursor);
   won = false;

   edje_object_signal_emit(bck, "reset", "timing");
   edje_object_part_text_set(bck, "timing", "-- : --");
}

function next_main_cb(data)
{
   ecore_idler_del(ei);
   ei = null;

   evas_object_event_callback_add(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_down_game_cb, null);
   evas_object_event_callback_add(eo_bg, EVAS_CALLBACK_KEY_UP, key_up_game_cb, null);

   new_game();
   begin = undefined;
   game.show();

   key_game = true;

   return 1;
}

var key_anim = true;
function key_anim_cb(data, e, obj, event)
{
    switch (event.keyname) {
    case "Red":
    case "b":
    case "Stop":
    case "equal":
    case "Home":
    case "Escape":
    case "Start":
    case "a":
    case "Green":
       /* New game */
       if (key_anim) {
          key_anim = false;
          evas_object_event_callback_del(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_anim_cb, null);
          ei = ecore_idler_add(next_main_cb, null);
       }
       break;
   }
}

function gravity_anim_cb(data)
{
   data.update();
   return 1;
}

function final_anim_timer_cb(data)
{
   var found = false;

   if (pending()) {
      for (var i in game.stack) {
         var length = game.stack[i].display.length;

         for (var j in game.stock) {
            game.stock[j].push(game.stack[i]);
            if (game.stack[i].display.length != length)
              break;
         }
         if (game.stack[i].display.length != length)
           break;
      }
   } else {
      if (!once) {
         ecore_timer_interval_set(anim_timer, 0.1);

         var reference = game.stock[3].display[0];

         if (reference) {
            var layer  = evas_object_layer_get(reference);

            for (var ii = 4; ii > 0; --ii) {
               var i = ii - 1;
               for (var j in game.stock[i].display) {
                  var focus = game.stock[i].display[j];

                  evas_object_layer_set(focus, ++layer);
               }
            }
         }
         once = true;
      }
      for (var i in game.stock) {
         var tmp = game.stock[i].display.pop();
         if (tmp) {
            var geom = evas_object_geometry_get(tmp);

            found = true;
            gravity.push(new GravityCard(tmp, geom.x, geom.y, rand(2) > 1 ? rand(15) : - rand(15), - rand(18)));
            break;
         }
      }
      return found ? 1 : 0;
   }
   return 1;
}

function game_counter_cb(data)
{
   var d = new Date();
   var current = d.getTime();

   edje_object_part_text_set(bck, "timing", split_time(current - begin));

   return 1;
}

function game_back(test)
{
   if (!test)
     ecore_main_loop_quit();
}

var key_game = true;
function key_down_game_cb(data, e, obj, event)
{
   var know = undefined;

   if (!key_game) return ;

   if (begin === undefined) {
      var d = new Date();
      begin = d.getTime();

      game_timer = ecore_timer_add(1, game_counter_cb, null);
   }

   if (timestamp == event.timestamp && key_count++ < 2)
     return ;
   key_count = 0;

   switch (event.keyname) {
    case "b":
    case "Red":
    case "equal":
    case "Stop":
    case "Home":
    case "Escape":
    case "Start":
       edje_exit(evas, eo_bg, game_back);
       break;
    case "0": know = game.stock[2]; break;
    case "1": case "2": case "3": case "4":
    case "5": case "6": case "7":
       know = game.stack[parseInt(event.keyname) - 1];
       break;
    case "8": know = game.stock[0]; break;
    case "9": know = game.stock[1]; break;
    case "Swap":
    case "numbersign": know = game.stock[3]; break;
    case "BackSpace": know = game.gets; break;
    case "Blue":
    case "x":
       start = undefined;
       evas_object_hide(cursor_blue.cursor);
       game.gets.generate();
       cursor.update(game.gets);
       break;
    case "Green":
    case "a": /* New game */new_game(); begin = undefined; game.show(); break;
    case "FP/Left":
    case "RC/Left":
    case "RCL/Left":
    case "GP/Left":
    case "KP4":
    case "Left":
       cursor.left();
       break;
    case "KP6":
    case "Right":
    case "FP/Right":
    case "RC/Right":
    case "RCL/Right":
    case "GP/Right":
       cursor.right();
       break;
    case "KP8":
    case "Up":
    case "FP/Up":
    case "RC/Up":
    case "RCL/Up":
    case "GP/Up":
       cursor.up();
       break;
    case "KP2":
    case "Down":
    case "FP/Down":
    case "RC/Down":
    case "RCL/Down":
    case "GP/Down":
       cursor.down();
       break;
    case "Page_Up":
    case "Programe_Plus":
       know = cursor.locate();
       for (i = 0; i < 4; ++i)
         if (know == game.stock[i])
           return ;
       for (i = 0; i < 4; ++i)
         if (game.stock[i].push(know))
           {
              cursor.update(know);
              start = undefined;
              evas_object_hide(cursor_blue.cursor);
              return ;
           }
       return ;
    case "FP/Ok":
    case "RC/Ok":
    case "KP_Enter":
    case "Return":
    case "Select":
       know = cursor.locate();
       break;
    case "period":
    case "Mute":
       if (sample)
         if (playing) {
            Mix_Pause(-1);
            playing = false;
         } else {
            Mix_Resume(-1);
            playing = true;
         }
       break;
   }

   if (know) {
      if (know == game.gets && game.gets.display.length == 0) {
         start = undefined;
         evas_object_hide(cursor_blue.cursor);
         game.gets.generate();
      } else {
         if (start) {
            if (start != know)
              know.push(start);
            start = undefined;
            evas_object_hide(cursor_blue.cursor);
         } else {
            if (know.display.length > 0) {
               start = know;
               cursor_blue.update(know);
            }
         }
      }
      cursor.update(know);
   }

   if (game.win())
     {
        var d = new Date();

        key_game = false;
        evas_object_event_callback_del(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_down_game_cb, null);
        evas_object_event_callback_del(eo_bg, EVAS_CALLBACK_KEY_UP, key_up_game_cb, null);

        key_anim = true;
        evas_object_event_callback_add(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_anim_cb, null);

        won = true;
        once = false;

        // End timer
        if (game_timer) {
	    ecore_timer_del(game_timer);
	    game_timer = null;
	}

        score = parseInt((d.getTime() - begin) / 1000);

        if (save_highscore({ "timing" : score }, "Solitaire"))
          edje_object_signal_emit(edje, "highscore", "timing");

        evas_object_hide(cursor.cursor);
        evas_object_hide(cursor_blue.cursor);

        anim_timer = ecore_timer_add(0.25, final_anim_timer_cb, null);
     }
}

function key_up_game_cb(data, e, obj, event)
{
   timestamp = event.timestamp;
}

function startup_main_cb(data)
{
   ecore_idler_del(ei);
   ei = null;

   key_game = true;
   evas_object_event_callback_add(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_down_game_cb, null);
   evas_object_event_callback_add(eo_bg, EVAS_CALLBACK_KEY_UP, key_up_game_cb, null);

   evas_object_del(wait);
   evas_object_show(bck);

   game.show();

   return 1;
}

var called = true;
function key_start_cb(data, e, obj, event)
{
   if (called)
     {
        evas_object_event_callback_del(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_start_cb, null);

        ei = ecore_idler_add(startup_main_cb, null);
        called = false;
     }
}

function sound_idler_cb(data)
{
   Mix_OpenAudio(44100, 0x9010, 2, 1024);
   sample = Mix_LoadWAV("Solitaire.ogg");
   if (sample)
     Mix_PlayChannel(-1, sample, -1);

   return 0;
}

function build_main_cb(data)
{
   var tmp;

   ecore_idler_del(ei);
   ei = null;

   tmp = load_highscore();

   if (sound)
     ecore_idler_add(sound_idler_cb, null);

   o = edje_object_add(evas);
   edje_object_file_set(o, "Solitaire.edj", "main");
   evas_object_layer_set(o, 0);
   evas_object_move(o, 0, 0);
   evas_object_resize(o, win.w, win.h);
   bck = o;

   if (tmp != null)
     edje_object_part_text_set(bck, "timing", split_time(tmp));

   evas_object_event_callback_add(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_start_cb, null);

   cursor = new Cursor("red");
   cursor_blue = new Cursor("blue");

   new_game();

   return 1;
}

function interface_builder_cb(data)
{
   o = edje_object_add(evas);
   edje_object_file_set(o, "Solitaire.edj", "start");
   evas_object_layer_set(o, 1);
   evas_object_move(o, 0, 0);
   evas_object_resize(o, win.w, win.h);
   evas_object_show(o);
   wait = o;

   ei = ecore_idler_add(build_main_cb, null);

   return 0;
}

function setup()
{
//    ecore_evas_cursor_set(ee, "freebox-mouse.png", 200, 0, 0);

   o = evas_object_rectangle_add(evas);
   evas_object_move(o, 0, 0);
   evas_object_resize(o, win.w, win.h);
   evas_object_color_set(o, 0, 0, 0, 255);
   evas_object_focus_set(o, 1);
   evas_object_show(o);
   eo_bg = o;

   ei = ecore_idler_add(interface_builder_cb, null);
}

function main()
{
   if (shutdown == undefined || shutdown == false)
     {
        ecore_init();
        ecore_evas_init();
        edje_init();

        ee = ecore_evas_new(null, 0, 0, win.w, win.h, "name=Solitaire;double_buffer=0;");

        evas = ecore_evas_get(ee);
        evas_image_cache_set(evas, 8192 * 1024);
        evas_font_path_prepend(evas, FN);
        evas_font_cache_set(evas, 512 * 1024);
     }
   else
     evas_object_del(eo_bg);

   eo_bg = null;

   edje_frametime_set(1/50);

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

