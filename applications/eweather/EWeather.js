var FN = "/.fonts/";
var test = true;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");
test &= elx.load("ecore-con");
test &= elx.load("edje");

elx.include("EWeather.edj", "EWeather_Smart")
elx.include("EWeather.edj", "Geoloc")

var shutdown;
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

   if (shutdown === undefined || shutdown == false)
     {
        ecore_init();
        ecore_evas_init();
        edje_init();

        ee = ecore_evas_new(null, 0, 0, 720, 576, "name=EWeather;double_buffer=0;");

        evas = ecore_evas_get(ee);

        evas_image_cache_set(evas, 8192 * 1024);
        evas_font_path_prepend(evas, FN);
        evas_font_cache_set(evas, 512 * 1024);
     }
   else
     evas_object_del(eo_bg);

   ecore_con_url_init();
   ecore_con_init();

   ecore_animator_frametime_set(1 / 20);

   ecore_evas_callback_resize_set (ee, _resize_cb);

   o_bg = evas_object_rectangle_add(evas);
   evas_object_resize(o_bg, win.w, win.h);
   evas_object_color_set(o_bg, 0, 0, 0, 255);
   evas_object_show(o_bg);

   evas_object_event_callback_add(o_bg, EVAS_CALLBACK_KEY_UP, key_up_cb, null);
   evas_object_focus_set(o_bg, 1);

   get_geoloc_info(done_geoloc);
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
   ecore_con_url_shutdown();
   ecore_shutdown();
}

function done_geoloc(info){

for(var i in info)
   elx.print(i + "=>" + info[i] + "\n");
eweather = eweather_object_eweather_get(o_weather);

if(info && info.City && info.City != "")
   eweather_code_set(eweather, info.City);
else
   eweather_code_set(eweather, "Fontainebleau,France");
}

if (test)
  main();
