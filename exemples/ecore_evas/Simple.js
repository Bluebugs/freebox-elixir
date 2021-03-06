var FN = "/.fonts/";
var test = true;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");

function anim_cb(obj)
{
   var geom = evas_object_geometry_get(obj);
   var dx, x;
   var dy, y;

   dx = evas_object_data_get(obj, "dx");
   dy = evas_object_data_get(obj, "dy");

   x = geom.x + dx;
   y = geom.y + dy;

   if (x + 250 > 720 || x < 0)
     {
	dx = -dx;
	x += 2 * dx;

	evas_object_data_set(obj, "dx", dx);
     }

   if (y + 200 > 576 || y < 0)
     {
	dy = -dy;
	y += 2 * dy;

	evas_object_data_set(obj, "dy", dy);
     }

   evas_object_move(obj, x, y);

   return 1;
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
     }
}

function main()
{
   var bg;
   var obj;

   ecore_init();
   ecore_evas_init();

   ecore_animator_frametime_set(1 / 20);

   ee = ecore_evas_new(null, 0, 0, 720, 576, "name=Test;");

   var evas = ecore_evas_get(ee);

   evas_image_cache_set(evas, 10 * 1024 * 1024);
   evas_font_path_prepend(evas, FN);
   evas_font_cache_set(evas, 512 * 1024);

   obj = evas_object_rectangle_add(evas);
   evas_object_resize(obj, 720, 576);
   evas_object_color_set(obj, 0, 0, 0, 255);
   evas_object_show(obj);
   bg = obj;

   evas_object_event_callback_add(bg, EVAS_CALLBACK_KEY_UP, key_up_cb, null);
   evas_object_focus_set(bg, 1);

   obj = evas_object_rectangle_add(evas);
   evas_object_resize(obj, 250, 200);
   evas_object_color_set(obj, 128, 64, 0, 180);
   evas_object_move(obj, 50, 50);
   evas_object_show(obj);

   evas_object_data_set(obj, "dx", +20);
   evas_object_data_set(obj, "dy", +10);
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
