var FN = "/.fonts/";
var test = true;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");
test &= elx.load("edje");

function toggle_end_cb(data, obj, emission, source)
{
   obj.toggling = false;
}

function anim_cb(obj)
{
   var x;
   var y;

   x = obj.x + obj.dx;
   y = obj.y + obj.dy;

   if (x + obj.w > obj.constrain.x + obj.constrain.w || x < obj.constrain.x)
     {
	obj.dx = - obj.dx;
	x += 2 * obj.dx;
     }

   if (y + obj.h > obj.constrain.y + obj.constrain.h || y < obj.constrain.y)
     {
	obj.dy = - obj.dy;
	y += 2 * obj.dy;
     }

   evas_object_move(obj, x, y);
   obj.x = x;
   obj.y = y;

   return true;
}

function key_up_cb(data, e, obj, event)
{
   switch (event.keyname)
     {
      case "b":
      case "Red":
      case "equal":
      case "Stop":
      case "Home":
      case "Escape":
      case "Start":
	 ecore_main_loop_quit();
	 break;
      case "x":
	 if (!obj.toggling)
	   {
	      edje_object_signal_emit(obj, "toggle", "js");
	      obj.toggling = true;
	   }
	 break;
     }
}

function main()
{
   var background;
   var text;
   var obj;

   ecore_init();
   ecore_evas_init();

   ecore_animator_frametime_set(1 / 20);

   ee = ecore_evas_new(null, 0, 0, 720, 576, "name=Test;");

   var evas = ecore_evas_get(ee);

   evas_image_cache_set(evas, 10 * 1024 * 1024);
   evas_font_path_prepend(evas, FN);
   evas_font_cache_set(evas, 512 * 1024);

   obj = edje_object_add(evas);
   edje_object_file_set(obj, "elixir.edj", "main");
   edje_object_signal_callback_add(obj, "toggle", "end", toggle_end_cb, null);
   evas_object_resize(obj, 720, 576);
   evas_object_show(obj);
   background = obj;

   evas_object_event_callback_add(background, EVAS_CALLBACK_KEY_UP, key_up_cb, null);
   evas_object_focus_set(background, 1);
   background.toggling = false;

   obj = evas_object_text_add(evas);
   evas_object_text_text_set(obj, "Hello World !");
   evas_object_text_font_set(obj, "Vera", 30);
   evas_object_text_style_set(obj, EVAS_TEXT_STYLE_SOFT_SHADOW);
   evas_object_text_shadow_color_set(obj, 128, 128, 128, 255);
   evas_object_color_set(obj, 128, 64, 0, 180);
   evas_object_resize(obj, 200, 50);
   evas_object_show(obj);

   obj.dx = +20;
   obj.dy = +10;
   obj.w = 200;
   obj.h = 50;
   obj.constrain = edje_object_part_geometry_get(background, "constrain");

   obj.x = obj.constrain.x + 10;
   obj.y = obj.constrain.y + 10;
   evas_object_move(obj, obj.x, obj.y);

   ecore_animator_add(anim_cb, obj);

   ecore_evas_show(ee);
   ecore_main_loop_begin();

   evas_object_del(obj);
   evas_object_del(background);

   ecore_evas_free(ee);

   ecore_evas_shutdown();
   ecore_shutdown();
}

if (test)
  main();
