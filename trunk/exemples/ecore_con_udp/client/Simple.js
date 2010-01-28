var FN = "/.fonts/";
var test = true;

var bg = null;
var state = null;
var down = null;
var textblock = null;
var cursor = null;

var self = { count: 0 };

var handler;
var server = null;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");
test &= elx.load("ecore-con");

function _elixir_add(data, type, event)
{
   if (event.server != server)
     return 1;

   evas_object_text_text_set(state, "server add");

   return 0;
}

function _elixir_del(data, type, event)
{
   if (event.server != server)
     return 1;

   ecore_con_server_del(server);
   server = null;

   evas_object_text_text_set(state, "Download done");

   return 0;
}

function _elixir_data(data, type, event)
{
   if (event.server != server)
     return 1;

   elx.print("some data (" + event.data  +")\n");

   data.count += event.size;
   evas_object_text_text_set(down, data.count + " octets");
   evas_textblock_cursor_text_append(cursor, event.data);
}

function idler_cb(data)
{
   handler = {
      add: ecore_event_handler_add(ECORE_CON_EVENT_SERVER_ADD, _elixir_add, self),
      del: ecore_event_handler_add(ECORE_CON_EVENT_SERVER_DEL, _elixir_del, self),
      data: ecore_event_handler_add(ECORE_CON_EVENT_SERVER_DATA, _elixir_data, self)
   };

   server = ecore_con_server_connect(ECORE_CON_REMOTE_UDP, "::1", 42000, self);
   if (!server)
     evas_object_text_text_set(state, "Unable to setup connexion !");
   else
     ecore_con_server_send(server, "Rock & Roll !!");

   return 0;
}

function con_shutdown()
{
   ecore_event_handler_del(handler.add);
   ecore_event_handler_del(handler.del);
   ecore_event_handler_del(handler.data);
   handler = undefined;
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
	 con_shutdown();

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
   ecore_con_init();

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
   evas_object_text_text_set(obj, "0 octets");
   evas_object_text_style_set(obj, EVAS_TEXT_STYLE_SOFT_SHADOW);
   evas_object_text_shadow_color_set(obj, 128, 128, 128, 255);
   evas_object_resize(obj, 40, 15);
   evas_object_move(obj, 600, 50);
   evas_object_color_set(obj, 0, 255, 0, 255);
   evas_object_show(obj);
   down = obj;

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

   ecore_idler_add(idler_cb, null);

   ecore_evas_show(ee);

   ecore_main_loop_begin();

   evas_object_del(bg);
   ecore_evas_free(ee);

   ecore_con_shutdown();
   ecore_evas_shutdown();
   ecore_shutdown();
}

if (test)
  main();
