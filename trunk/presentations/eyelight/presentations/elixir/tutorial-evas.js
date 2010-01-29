var FN = "/.fonts/";
var test = true;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");

var sound = elx.load("mix");
var music_sound = null;

var pause = false;
var animator = null;

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
   /* data is the rectangle we passed */
   switch (event.keyname)
     {
      case "b":
      case "Red":
      case "equal":
      case "Stop":
      case "Home":
      case "Escape":
	 ecore_main_loop_quit();
	 break;
      case "Start":
      case "p":
         pause = !pause;
         if (pause)
           {
              if (sound) Mix_HaltChannel(-1);
              ecore_animator_del(animator);
              animator = null;
           }
           else
           {
              animator = ecore_animator_add(anim_cb, data);
              if (sound) Mix_PlayChannel(-1, music_sound, -1);
           }
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

   obj = evas_object_rectangle_add(evas);
   evas_object_resize(obj, 250, 200);
   evas_object_color_set(obj, 128, 64, 0, 180);
   evas_object_move(obj, 50, 50);
   evas_object_show(obj);

   evas_object_data_set(obj, "dx", +20);
   evas_object_data_set(obj, "dy", +10);
   animator = ecore_animator_add(anim_cb, obj);

   evas_object_event_callback_add(bg, EVAS_CALLBACK_KEY_UP, key_up_cb, obj);
   evas_object_focus_set(bg, 1);

   ecore_evas_show(ee);
   
   if (sound)
     {
        Mix_OpenAudio(44100, 0x9010, 1, 512);
        music_sound = Mix_LoadWAV("tutorial-music.ogg");
        if (!music_sound)
          {
             elx.print("failed loading music\n");
             sound = false;
          }
          else if (Mix_PlayChannel(-1, music_sound, -1) == -1)
          {
             elx.print("failed playing music\n");
          }
     }

   ecore_main_loop_begin();

   evas_object_del(obj);
   evas_object_del(bg);

   ecore_evas_free(ee);

   ecore_evas_shutdown();
   ecore_shutdown();
}

if (test)
  main();
