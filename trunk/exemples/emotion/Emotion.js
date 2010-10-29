var test = true;
var shutdown;

if (shutdown == undefined || shutdown == false)
  {
     test &= elx.load("evas");
     test &= elx.load("ecore");
     test &= elx.load("ecore-evas");
     test &= elx.load("edje");
  }

test &= elx.load("emotion");
test &= elx.include("repeat.js");

var FN = "/.fonts/";

var NULL = null;

var ee;
var evas;

function anim_cb(obj)
{
   var geom = evas_object_geometry_get(obj);
   var dx, x;
   var dy, y;
   var dh, h;
   var dw, w;

   dx = evas_object_data_get(obj, "dx");
   dy = evas_object_data_get(obj, "dy");

   x = geom.x + dx;
   y = geom.y + dy;

   if (x + geom.w > 720 || x < 0)
     {
	dx = -dx;
	x += 2 * dx;

	evas_object_data_set(obj, "dx", dx);
     }

   if (y + geom.h > 576 || y < 0)
     {
	dy = -dy;
	y += 2 * dy;

	evas_object_data_set(obj, "dy", dy);
     }

   evas_object_move(obj, x, y);

   dh = evas_object_data_get(obj, "dh");
   dw = evas_object_data_get(obj, "dw");

   w = geom.w + dw;
   h = geom.h + dh;

   if (w > 400 || w < 150)
     {
	dw = -dw;
	w += 2 * dw;

	evas_object_data_set(obj, "dw", dw);
     }

   if (h > 400 || h < 150)
     {
	dh = -dh;
	h += 2 * dh;

	evas_object_data_set(obj, "dh", dh);
     }

   evas_object_resize(obj, w, h);

   return 1;
}

function key_cb(data, e, obj, event)
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
      case "space":
      case "Play":
	 emotion_object_play_set(obj, !emotion_object_play_get(obj));
	 break;
      default:
	 elx.print("key: [", event.keyname, "]\n");
     }
}

function main()
{
   var bg;
   var obj;

   ecore_init();
   ecore_evas_init();

   ecore_animator_frametime_set(1 / 20);

   ee = ecore_evas_new(null, 0, 0, 720, 576, "name=Test;alpha=1;");

   var evas = ecore_evas_get(ee);

   evas_image_cache_set(evas, 10 * 1024 * 1024);
   evas_font_path_prepend(evas, FN);
   evas_font_cache_set(evas, 512 * 1024);

   obj = evas_object_rectangle_add(evas);
   evas_object_resize(obj, 720, 576);
   evas_object_color_set(obj, 0, 0, 0, 255);
   evas_object_layer_set(obj, -2);
   evas_object_show(obj);
   bg = obj;

   obj = emotion_object_add(evas);
   // This specific line force the use of the video hardware plan on Freebox
   // Much better quality and don't use GPU fillrate at all, but not
   // possible to make it transparent and not possible to put object under it.
   evas_object_layer_set(obj, -1);
   if (!emotion_object_init(obj, null))
     throw("emotion_object_init");
   // emotion_object_vis_set(obj, EMOTION_VIS_NONE);
   // http://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4
   emotion_object_file_set(obj, "BigBuckBunny_320x180.mp4");
   // emotion_object_file_set(obj, "srv://FREEBOX TV/118");
   // emotion_object_file_set(obj, "tvperso://<id>");
   emotion_object_play_set(obj, 1);
   //emotion_object_audio_mute_set(obj, 1);
   //emotion_object_video_mute_set(obj, 1);
   evas_object_resize(obj, 250, 200);
   evas_object_move(obj, 50, 50);
   emotion_object_smooth_scale_set(obj, 1);
   evas_object_show(obj);

   repeat_catcher(obj, key_cb, null, null, null)
   evas_object_focus_set(obj, 1);

   evas_object_data_set(obj, "dx", +20);
   evas_object_data_set(obj, "dy", +10);
   evas_object_data_set(obj, "dw", +5);
   evas_object_data_set(obj, "dh", +7);
   ecore_animator_add(anim_cb, obj);

   ecore_evas_show(ee);
   ecore_main_loop_begin();

   evas_object_del(obj);
   evas_object_del(bg);

   ecore_evas_free(ee);

   ecore_evas_shutdown();
   ecore_shutdown();
}

if (test)
  main();


