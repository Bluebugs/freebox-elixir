var test = true;

var sound = elx.load("mix");
test &= elx.include("/opt/games/helper/evas_helper.js");
test &= elx.include("/opt/games/helper/math_helper.js");

var FN = "/opt/games/fonts/";
var IM = "/opt/games/solitaire/";

var evas;
var win_w, win_h;

var user_end = 1;

var order = new Array("a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k");
var card_color = new Array("carreau", "coeur", "pique", "trefle");
var are_red = new Array(true, true, false, false);

var cards = new Array(52);
var stock;

var last = 0;

var once = false;
var gravity = new Array();
var explode;

function Stock(x, y)
{
	this.x = x;
	this.y = y - 1;

	this.dec = y;
	this.display = new Array();

	this.run = function() {};
	this.push = function(put) {
           var head = this.display[this.display.length - 1];
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

                 this.display.push(put);
                 evas_object_move(put, x, y);

                 if (top === undefined)
                   evas_object_raise(put);
                 else
                   evas_object_stack_above(put, top);
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
	this.update = function(delta) {
	}
}

function GravityCard(image, x, y, vx, vy)
{
	this.vx = vx;
	this.vy = vy;
	this.x = x;
	this.y = y;

	this.running = true;

	this.image = image;

	this.update = function(delta) {
		this.vy += 9.81 * delta / 600;

		this.x += this.vx * delta / 100;
		this.y += this.vy * delta / 100;

		evas_object_move(this.image, this.x, this.y);
		if (this.y + 115 < 0
		 || this.x + 76 < 0
		 || this.y > win_h
		 || this.x > win_w) {
			evas_object_hide(this.image);
			this.update = function(delta) {};
			this.running = false;
		}
	}
	this.clean = function() {
		evas_object_del(this.image);
	}
}


function loop()
{
   var d = new Date();
   var current = d.getTime();
   var delta;

   if (current - last > 200) {
      if (!once) {
         var reference = stock[3].display[0];

         if (reference) {
            var layer  = evas_object_layer_get(reference);

            for (var ii = 4; ii > 0; --ii) {
               var i = ii - 1;
               for (var j in stock[i].display) {
                  var focus = stock[i].display[j];

                  evas_object_layer_set(focus, ++layer);
               }
            }
         }
         once = true;
      }
      for (var i in stock) {
         var tmp = stock[i].display.pop();
            if (tmp) {
               var geom = evas_object_geometry_get(tmp);

               gravity.push(new GravityCard(tmp, geom.x, geom.y, rand(2) > 1 ? rand(15) : - rand(15), - rand(18)));
               break;
            }
      }

      last = current;
   }

   delta = current - explode;
   for (var i in gravity)
     gravity[i].update(delta);
   explode = current;
}

function setup()
{
	var j;

	if (sound)
          {
             Mix_OpenAudio(44100, 0x9010, 2, 1024);
             sample=Mix_LoadWAV(IM + "Solitaire.wav");
             Mix_PlayChannel(-1, sample, -1);
          }

	evas_font_path_prepend(evas, FN);
	evas_font_cache_set(evas, 1024 * 1024);

        screen_clip = evas_object_rectangle_add(evas);
        evas_object_move(screen_clip, 0, 0);
        evas_object_resize(screen_clip, win_w, win_h);
        evas_object_color_set(screen_clip, 255, 255, 255, 255);
        evas_object_show(screen_clip);

	main = build_image_object(evas, "interface.jpg", 0);
	evas_object_show(main);

	text = evas_object_text_add(evas);
	evas_object_text_font_set(text, "VeraBd", 24);
	evas_object_text_text_set(text, "00:00");
	evas_object_layer_set(text, 31);
	evas_object_color_set(text, 0, 51, 0, 255);
	evas_object_text_shadow_color_set(text, 0, 0, 0, 255);
	evas_object_text_style_set(text, EVAS_TEXT_STYLE_SHADOW);
	evas_object_move(text, 120, 177);
	evas_object_show(text);

        stock = new Array();
	for (var i = 0; i < 4; ++i)
          stock[i] = new Stock(319 + i * 81, 55);

        j = 0;
	for (var color in card_color) {
           for (var value in order) {
              var ob = build_image_object(evas, "cartes/" + card_color[color] + "_" + order[value] + ".png", 32);
              evas_object_data_set(ob, "color", card_color[color]);
              evas_object_data_set(ob, "order", parseInt(value));
              evas_object_data_set(ob, "red", are_red[color]);
              evas_object_clip_set(ob, screen_clip);
              evas_object_show(ob);

              stock[j].push(ob);
           }
           ++j;
	}
}

function main()
{
	var end = 1;
	var i;

	evas_init();
	evas = evas_new();
	evas_output_init(evas, "sdl", 720, 576);
	win_w = 720; win_h = 576;
	setup();

        var d = new Date();
        explode = d.getTime();

	while(end && user_end)
	{
		end = get_event(evas);
		if (end) {
			loop();
			evas_render(evas);
		}
 	}
	evas_free(evas);
	evas_shutdown();
};

if (test)
	main();

