var FN = "/.fonts/";
var test = true;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");
test &= elx.load("ecore-con");
test &= elx.load("edje");

elx.include("EWeather.edj", "EWeather_Smart")

var o_weather = null;
var o_bg = null;
var win = { w: 720, h: 576 };

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
     }
}

function _resize_cb(ee)
{
    var evas;
    var geom;

    evas = ecore_evas_get(ee);
    geom = evas_output_size_get(evas);
    evas_object_resize(o_bg, geom.w, geom.h);
    evas_object_resize(o_weather, geom.w, geom.h);
}

function show_when_ready(obj, data)
{
}

function main()
{
   var eweather;

   ecore_init();
   ecore_evas_init();
   ecore_con_init();
   edje_init();

   ecore_animator_frametime_set(1 / 20);

   ee = ecore_evas_new(null, 0, 0, win.w, win.h, "name=Test;");
   ecore_evas_callback_resize_set (ee, _resize_cb);

   var evas = ecore_evas_get(ee);

   evas_image_cache_set(evas, 10 * 1024 * 1024);
   evas_font_path_prepend(evas, FN);
   evas_font_cache_set(evas, 512 * 1024);

   o_bg = evas_object_rectangle_add(evas);
   evas_object_resize(o_bg, win.w, win.h);
   evas_object_color_set(o_bg, 0, 0, 0, 255);
   evas_object_show(o_bg);

   evas_object_event_callback_add(o_bg, EVAS_CALLBACK_KEY_UP, key_up_cb, null);
   evas_object_focus_set(o_bg, 1);

   o_weather = eweather_object_add(evas);
   eweather = eweather_object_eweather_get(o_weather);
   eweather_code_set(eweather, "Paris");
   evas_object_resize(o_weather, win.w, win.h);
   evas_object_move(o_weather, 0, 0);
   eweather_object_ready_callback_add(o_weather, show_when_ready, null);
   evas_object_show(o_weather);

   ecore_evas_show(ee);
   ecore_main_loop_begin();

   evas_object_del(o_weather);
   evas_object_del(o_bg);

   ecore_evas_free(ee);

   edje_shutdown();
   ecore_evas_shutdown();
   ecore_con_shutdown();
   ecore_shutdown();
}

if (test)
  main();
