var FN = "/.fonts/";
var test = true;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");
test &= elx.load("edje");


elx.include("evan.edj", "Evan_List")


var o_evan_list = null;
var o_bg = null;
var win = { w: 720, h: 576 };
var texte;

function key_action_cb(data, e, obj, event)
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
      case "p":
	  texte.unshift("Item prepend");
	  evan_list_object_prepend(o_evan_list, texte);
	  break;
      case "a":
	  texte.push("Item append");
	  evan_list_object_append(o_evan_list, texte);
	  break;
      case "KP_Add":
	 indice = evan_list_object_current_item_indice_get(o_evan_list);
	  texte.splice(indice,0,"item "+indice+"'");
	  evan_list_object_insert_at(o_evan_list,indice, texte);
	  break;
      case "KP_Subtract":
      case "Delete":
	 indice = evan_list_object_current_item_indice_get(o_evan_list);
	 texte.splice(indice,1);
	  evan_list_object_remove_at(o_evan_list,indice, texte);
	  break;
     case "KP_Delete":
	  evan_list_object_remove_all(o_evan_list);
	  break;
     }
}

function _resize_cb(ee){
    var evas;
    var geom;

    evas = ecore_evas_get(ee);
    geom = evas_output_size_get(evas);
    evas_object_resize(o_bg, geom.w, geom.h);
    evas_object_resize(o_evan_list, geom.w-100, geom.h-100);
}


function main()
{
   ecore_init();
   ecore_evas_init();
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

   evas_object_event_callback_add(o_bg, EVAS_CALLBACK_KEY_UP, key_action_cb, null);
   evas_object_key_grab(o_bg, "Escape", 0, 0, 0);
   evas_object_key_grab(o_bg, "p", 0, 0, 0);
   evas_object_key_grab(o_bg, "a", 0, 0, 0);
   evas_object_key_grab(o_bg, "KP_Add", 0, 0, 0);
   evas_object_key_grab(o_bg, "KP_Subtract", 0, 0, 0);
   evas_object_key_grab(o_bg, "Delete", 0, 0, 0);
   evas_object_key_grab(o_bg, "KP_Delete", 0, 0, 0);

    var nbitems = 20;
    texte = new Array(nbitems);

    for(i=0; i<nbitems ; i++)
    {
      texte[i] = "Item "+i;
    }

    var info_liste =
    {
      name: "liste1",
      nb_items: nbitems,
      edje_file: "evanListDemo.edj",
      edje_group_item: "item",
      edje_group_cursor: "cursor",
      preload: _item_preload,
      unload: _item_unload,
      show: _item_show,
      hide: _item_hide,
      focus: _item_focus,
      unfocus: _item_unfocus,
      key_up_cb: key_up_item_cb,
      key_down_cb: key_down_item_cb,
      data: null
    };
  
   o_evan_list = evan_list_object_add(evas);
   evan_list_object_set_params(o_evan_list, info_liste);
 
   evas_object_resize(o_evan_list, win.w-100, win.h-100);
   evas_object_move(o_evan_list, 50, 50);
   
   evan_list_object_set_scroller(o_evan_list, "evanListDemo.edj", "scroller", "scroller/cursorUpScroller", "scroller/cursorDownScroller");
//    evan_list_object_layout_set(o_evan_list, "horizontal");
   
   evas_object_show(o_evan_list);

   ecore_evas_show(ee);
   ecore_main_loop_begin();
   
   evas_object_event_callback_del(o_bg, EVAS_CALLBACK_KEY_UP, key_action_cb, null);

   evas_object_del(o_evan_list);
   evas_object_del(o_bg);

   ecore_evas_free(ee);

   edje_shutdown();
   ecore_evas_shutdown();
   ecore_shutdown();
}


function _item_preload(data, obj, signal, source){
    
    elx.print("Preload de l'item  " + data + "\n");
   edje_object_part_text_set(obj,"item/text",texte[data]);    
   edje_object_preload(obj, true);
}

function _item_unload(data, obj, signal, source){
elx.print("Unload de l'item "+data + "\n");
}

function _item_show(data, obj, signal, source){
 
    indice = data;
  
    evas_object_show(obj);
    elx.print("Show "+indice + "\n");
}

function _item_hide(data, obj, signal, source){
    evas_object_hide(obj);
    elx.print("Hide "+ data + "\n");
}

function _item_focus(data, obj, signal, source){
    evas_object_focus_set(obj, 1);
    edje_object_signal_emit(obj, "mouse,in", "item/bg");
    elx.print("Focus de l'item "+data + "\n");
}

function _item_unfocus(data, obj, signal, source){
    evas_object_focus_set(obj, 0);
    edje_object_signal_emit(obj, "mouse,out", "item/bg");  
    elx.print("Unfocus de l'item "+data +"\n");
}

if (test)
  main();
  
  
function key_down_item_cb(data, o, obj, event)
{

}

function key_up_item_cb(data, e, obj, event)
{
  switch (event.keyname)
     {
      case "Ok":
      case "Return":
      	  elx.print("Click sur item :"+ data + "\n");
	 break;
      }
}