var FN = "/.fonts/";
var test = true;
var bg = null;
var state = null;
var down = null;
var up = null;
var textblock = null;
var azer = null;
var cursor = null;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");
test &= elx.load("ecore-con");

function url_complete_cb(data, type, event)
{
   var message;

   message = "Complete '" + ecore_con_url_data_get(event.url_con) + "' with status: " + event.status;
   evas_object_text_text_set(state, message);

   return 0;
}

function url_data_cb(data, type, event)
{
   evas_object_text_text_set(state, event.size + " data for '" + ecore_con_url_data_get(event.url_con) + "'\n");
   // As we will get html with markup, we can feed it in the markup stuff (this will display garbage, but who cares ?)
   evas_textblock_cursor_text_append(cursor, event.data);

   return 0;
}

function url_progress_cb(data, type, event)
{
   evas_object_text_text_set(down, event.down.now + "/" + event.down.total);
   evas_object_text_text_set(up, event.up.now + "/" + event.up.total);
   evas_object_text_text_set(state, "Progress for '" + ecore_con_url_data_get(event.url_con) + "'");

   return 0;
}

function idler_cb(data)
{
   azer = ecore_con_url_new("http://www.google.com/");
   ecore_con_url_data_set(azer, "azer");
   ecore_con_url_send(azer, null, null);

   evas_object_text_text_set(state, "Starting url request.");

   return 0;
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
	 if (azer) ecore_con_url_destroy(azer);
	 azer = null;

	 ecore_main_loop_quit();
	 break;
     }
}

function main()
{
   var obj;
   var ee;
   var evas;
   var st;
   var hd, hc, hp;

   ecore_init();
   ecore_evas_init();
   ecore_con_url_init();

   ee = ecore_evas_new(null, 0, 0, 720, 576, "name=test;double_buffer=0;");

   evas = ecore_evas_get(ee);

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

   obj = evas_object_image_add(evas);
   evas_object_resize(obj, 640, 50);
   evas_object_move(obj, 40, 40);
   evas_object_image_file_set(obj, "round_box.png", null);
   evas_object_image_fill_set(obj, 0, 0, 640, 50);
   evas_object_image_border_set(obj, 8, 8, 8, 8);
   evas_object_image_border_center_fill_set(obj, EVAS_BORDER_FILL_NONE);
   evas_object_color_set(obj, 255, 0, 0, 255);
   evas_object_show(obj);

   obj = evas_object_text_add(evas);
   evas_object_text_font_set(obj, "Vera", 30);
   evas_object_text_text_set(obj, "WARMUP !!");
   evas_object_text_style_set(obj, EVAS_TEXT_STYLE_SOFT_SHADOW);
   evas_object_text_shadow_color_set(obj, 128, 128, 128, 255);
   evas_object_resize(obj, 540, 30);
   evas_object_move(obj, 50, 50);
   evas_object_show(obj);
   state = obj;

   obj = evas_object_text_add(evas);
   evas_object_text_font_set(obj, "Vera", 10);
   evas_object_text_text_set(obj, "100000 / 100000");
   evas_object_text_style_set(obj, EVAS_TEXT_STYLE_SOFT_SHADOW);
   evas_object_text_shadow_color_set(obj, 128, 128, 128, 255);
   evas_object_resize(obj, 40, 15);
   evas_object_move(obj, 600, 50);
   evas_object_color_set(obj, 0, 255, 0, 255);
   evas_object_show(obj);
   down = obj;

   obj = evas_object_text_add(evas);
   evas_object_text_font_set(obj, "Vera", 10);
   evas_object_text_text_set(obj, "100000 / 100000");
   evas_object_text_style_set(obj, EVAS_TEXT_STYLE_SOFT_SHADOW);
   evas_object_text_shadow_color_set(obj, 128, 128, 128, 255);
   evas_object_resize(obj, 40, 15);
   evas_object_move(obj, 600, 65);
   evas_object_color_set(obj, 0, 0, 2550, 255);
   evas_object_show(obj);
   up = obj;

   obj = evas_object_image_add(evas);
   evas_object_resize(obj, 640, 400);
   evas_object_move(obj, 40, 100);
   evas_object_image_file_set(obj, "round_box.png", null);
   evas_object_image_fill_set(obj, 0, 0, 640, 400);
   evas_object_image_border_set(obj, 8, 8, 8, 8);
   evas_object_image_border_center_fill_set(obj, EVAS_BORDER_FILL_NONE);
   evas_object_color_set(obj, 255, 0, 0, 255);
   evas_object_show(obj);

   st = evas_textblock_style_new();
   evas_textblock_style_set(st, "DEFAULT='font=Vera,Kochi font_size=8 align=left color=#FFFFFF wrap=word'")

   obj = evas_object_textblock_add(evas);
   evas_object_resize(obj, 620, 480);
   evas_object_move(obj, 50, 110);
   evas_object_textblock_style_set(obj, st);
   evas_textblock_style_free(st);
   evas_object_textblock_clear(obj);
   evas_object_show(obj);
   textblock = obj;

   cursor = evas_object_textblock_cursor_new(obj);

   hd = ecore_event_handler_add(ECORE_CON_EVENT_URL_DATA, url_data_cb, null);
   hc = ecore_event_handler_add(ECORE_CON_EVENT_URL_COMPLETE, url_complete_cb, null);
   hp = ecore_event_handler_add(ECORE_CON_EVENT_URL_PROGRESS, url_progress_cb, null);

   ecore_idler_add(idler_cb, null);

   ecore_evas_show(ee);

   ecore_main_loop_begin();

   ecore_event_handler_del(hd);
   ecore_event_handler_del(hc);
   ecore_event_handler_del(hp);

   evas_object_del(bg);
   ecore_evas_free(ee);

   ecore_con_url_shutdown();
   ecore_evas_shutdown();
   ecore_shutdown();
}

if (test)
  main();
