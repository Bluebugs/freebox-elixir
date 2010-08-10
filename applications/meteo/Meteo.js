var FN = "/.fonts/";
var test = true;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");
test &= elx.load("ecore-con");
test &= elx.load("edje");

elx.include("Meteo.edj", "Meteo_Smart")
elx.include("Meteo.edj", "Geoloc")
elx.include("evan.edj", "Evan_Keyboard");
elx.include("evan.edj", "Evan_Input");

var shutdown;
var o_meteo = null;
var o_bg = null;
var win = { w: 720, h: 576 };
var smartClavier = null;
var smartInput = null;
var bgGris = null;
var villeEnCours = "Paris";
var mode;

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
      case "Return":
      case "RC/Ok":
      case "KP_Enter":
      case "Select":
      case "Green":
	 if(mode == "meteo"){
	    elx.print("Action \n");
	    show_input(data);
	    evas_object_key_ungrab(o_bg, "Return", 0, 0);
	    evas_object_key_ungrab(o_bg, "RC/Ok", 0, 0);
	    evas_object_key_ungrab(o_bg, "KP_Enter", 0, 0);
	    evas_object_key_ungrab(o_bg, "Select", 0, 0);
	    evas_object_key_ungrab(o_bg, "Green", 0, 0);
	    mode = "input";
	 } else {
	    mode = "meteo";
	 }
     }
     
}

function _resize_cb(ee)
{
    var evas;
    var geom;

    evas = ecore_evas_get(ee);
    geom = evas_output_size_get(evas);
    evas_object_resize(o_bg, geom.w, geom.h);
    evas_object_resize(o_meteo, geom.w, geom.h);
    if(smartClavier)
    evas_object_resize(smartClavier, geom.w-100, geom.h-200);
    if(smartInput)
    evas_object_resize(smartInput, geom.w-200, 0.05*geom.h);
    if(bgGris)
    evas_object_resize(bgGris, geom.w, geom.h);
//     evas_object_focus_set(smartInput, 1);
}

function show_when_ready(obj, data)
{
}

function main()
{
   var meteo;

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

   evas_object_event_callback_add(o_bg, EVAS_CALLBACK_KEY_UP, key_up_cb, evas);
   evas_object_focus_set(o_bg, 1);

   get_geoloc_info(done_geoloc);
   o_meteo = meteo_object_add(evas);
   meteo = meteo_object_meteo_get(o_meteo);
   meteo_code_set(meteo, "Paris");
   villeEnCours = "Paris";
   evas_object_resize(o_meteo, win.w, win.h);
   evas_object_move(o_meteo, 0, 0);
   meteo_object_ready_callback_add(o_meteo, show_when_ready, null);
   evas_object_show(o_meteo);

   mode = "meteo";

   evas_object_key_grab(o_bg, "Return", 0, 0, 0);
   evas_object_key_grab(o_bg, "RC/Ok", 0, 0, 0);
   evas_object_key_grab(o_bg, "KP_Enter", 0, 0, 0);
   evas_object_key_grab(o_bg, "Select", 0, 0, 0);
   evas_object_key_grab(o_bg, "Green", 0, 0, 0);

   evas_object_key_grab(o_bg, "b", 0, 0, 0);
   evas_object_key_grab(o_bg, "Red", 0, 0, 0);
   evas_object_key_grab(o_bg, "equal", 0, 0, 0);
   evas_object_key_grab(o_bg, "Stop", 0, 0, 0);
   evas_object_key_grab(o_bg, "Home", 0, 0, 0);
   evas_object_key_grab(o_bg, "Escape", 0, 0, 0);
   evas_object_key_grab(o_bg, "Start", 0, 0, 0);

   ecore_evas_show(ee);
   ecore_main_loop_begin();
   
   if(smartInput)
      evas_object_del(smartInput);
   if(smartClavier)
      evas_object_del(smartClavier);
   if(bgGris)
      evas_object_del(bgGris);
   evas_object_del(o_meteo);
   evas_object_del(o_bg);

   ecore_evas_free(ee);

   edje_shutdown();
   ecore_evas_shutdown();
   ecore_con_shutdown();
   ecore_con_url_shutdown();
   ecore_shutdown();
}

function show_input(evas){

   if(!bgGris) {
   bgGris = evas_object_rectangle_add(evas);
   evas_object_resize(bgGris, win.w, win.h);
   evas_object_color_set(bgGris, 50, 50, 50, 150);
   }
   evas_object_show(bgGris);

   if(!smartClavier){
   smartClavier = evan_keyboard_object_add(evas);
   evas_object_resize(smartClavier, win.w-100, win.h-200);
   evas_object_move(smartClavier, 50, 200);
   }  

   if(!smartInput){
   smartInput = evan_input_object_add(evas);
   evan_input_object_keyboard_add(smartInput, smartClavier);
   evan_input_object_text_set(smartInput, villeEnCours);
   evas_object_resize(smartInput, win.w-200, 30);
   evas_object_move(smartInput, 100, 70);
   evan_input_object_callback_set(smartInput, validation);
   evan_input_object_change_mode_key_set(smartInput, "Swap,End");
   evas_object_focus_set(smartInput, 1);
   evan_input_object_input_mode_set(smartInput, "azer");
   }
   evas_object_show(smartInput);
   
evas_object_focus_set(smartInput, 1);
}

function validation(texte){
   evas_object_hide(bgGris);
   evas_object_hide(smartInput);

   villeEnCours = texte;
   meteo_code_set(meteo, villeEnCours);
   evas_object_focus_set(o_meteo, 1);
   evas_object_key_grab(o_bg, "Return", 0, 0, 0);
   evas_object_key_grab(o_bg, "RC/Ok", 0, 0, 0);
   evas_object_key_grab(o_bg, "KP_Enter", 0, 0, 0);
   evas_object_key_grab(o_bg, "Select", 0, 0, 0);
   evas_object_key_grab(o_bg, "Green", 0, 0, 0);

}


function done_geoloc(info){

for(var i in info)
   elx.print(i + "=>" + info[i] + "\n");
meteo = meteo_object_meteo_get(o_meteo);

if(info && info.City && info.City != ""){
   villeEnCours = info.city;
   meteo_code_set(meteo, info.City);
} else {
   villeEnCours = "Fontainebleau,France";
   meteo_code_set(meteo, "Fontainebleau,France");
   }
}

if (test)
  main();
