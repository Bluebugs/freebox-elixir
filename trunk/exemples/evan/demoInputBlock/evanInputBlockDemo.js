var FN = "/.fonts/";
var test = true;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");
test &= elx.load("ecore-con");
test &= elx.load("edje");

elx.include("evan.edj", "Evan_Keyboard");
elx.include("evan.edj", "Evan_InputBlock");

var o_bg = null;
var win = { w: 720, h: 576 };
var touches;
var smartClavier;
var smartInputBlock;

function key_up_cb(data, e, obj, event)
{
   switch (event.keyname)
     {
      case "b":
      case "Red":
      case "equal":
      case "Stop":
      case "Escape":
      case "Start":
      case "Home":
	 ecore_main_loop_quit();
	 break;
     }
}

function _resize_cb(ee){
    var evas;
    var geom;

    evas = ecore_evas_get(ee);
    geom = evas_output_size_get(evas);
    evas_object_resize(o_bg, geom.w, geom.h);
    evas_object_resize(smartClavier, geom.w-100, geom.h-200);
    evas_object_resize(smartInputBlock, geom.w-200, geom.h-500);
    evas_object_focus_set(smartInputBlock, 1);
}


function main()
{
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

   evas_object_key_grab(o_bg, "Escape", 0, 0, 0);
   evas_object_key_grab(o_bg, "b", 0, 0, 0);
   evas_object_key_grab(o_bg, "Red", 0, 0, 0);
   evas_object_key_grab(o_bg, "equal", 0, 0, 0);
   evas_object_key_grab(o_bg, "Stop", 0, 0, 0);
   evas_object_key_grab(o_bg, "Start", 0, 0, 0);
   evas_object_key_grab(o_bg, "Home", 0, 0, 0);
   
   smartClavier = evan_keyboard_object_add(evas);
   evas_object_resize(smartClavier, win.w-100, win.h-200);
   evas_object_move(smartClavier, 50, 200);

   smartInputBlock = evan_inputblock_object_add(evas);
   evan_inputblock_object_keyboard_add(smartInputBlock, smartClavier);
   evan_inputblock_object_text_set(smartInputBlock, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. \
Donec posuere malesuada varius. Donec sit amet porta nisi. Curabitur vel sem justo, ut malesuada diam. \
Ut ligula odio, tincidunt non vestibulum eget, elementum sed felis. Cras eleifend arcu eu urna egestas \
pharetra.");
   evas_object_resize(smartInputBlock, win.w-200, 100);
   evas_object_move(smartInputBlock, 100, 50);
   evas_object_show(smartInputBlock);
      
   evan_inputblock_object_change_mode_key_set(smartInputBlock, "Swap,End");

   evan_inputblock_object_callback_set(smartInputBlock, validation);

   evas_object_focus_set(smartInputBlock, 1);

   ecore_evas_show(ee);
   ecore_main_loop_begin();
   
   evas_object_key_ungrab(o_bg, "Escape", 0, 0);
   evas_object_key_ungrab(o_bg, "b", 0, 0);
   evas_object_key_ungrab(o_bg, "Red", 0, 0);
   evas_object_key_ungrab(o_bg, "equal", 0, 0);
   evas_object_key_ungrab(o_bg, "Stop", 0, 0);
   evas_object_key_ungrab(o_bg, "Start", 0, 0);
   evas_object_key_ungrab(o_bg, "Home", 0, 0);
   
   evas_object_event_callback_del(o_bg, EVAS_CALLBACK_KEY_UP, key_up_cb, null);
   

   evas_object_del(smartInputBlock);
   evas_object_del(smartClavier);
   evas_object_del(o_bg);

   ecore_evas_free(ee);

   edje_shutdown();
   ecore_evas_shutdown();
   ecore_con_shutdown();
   ecore_shutdown();
}
 
function validation(texte)
{
   elx.print("<<" + texte +">>"+"\n");
   
   currentStyle = evan_inputblock_style_get(smartInputBlock);
   elx.print(evan_inputblock_style_get(smartInputBlock)+"\n");
   
   var style = "";
   if(currentStyle.indexOf("#00") > 0)
      style = "DEFAULT='valign=middle color=#ff0000 wrap=word font_size=17.000000 font=Vera'";
   else
      style = "DEFAULT='valign=middle color=#000000 wrap=word font_size=15.000000 font=Vera'";

   evan_inputblock_style_set(smartInputBlock, style);
}

if (test)
  main();