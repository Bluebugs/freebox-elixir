
var E_OBJ_NAME = "evan_list_object"
var smart = null;

var animatorCursor = null;

function evan_list_object_add(evas)
{
   if(!smart)  _smart_init();
   return evas_object_smart_add(evas, smart);
}

function _addCallbacksKeys(obj, item)
{
   var sd;
   sd = obj.data;
   
   if(!sd) return;
   evas_object_event_callback_add(item, EVAS_CALLBACK_KEY_DOWN, _key_down_cb, obj);
   if(sd.cb_key_down)
   evas_object_event_callback_add(item, EVAS_CALLBACK_KEY_DOWN, sd.cb_key_down, item.shownItem);
   
   evas_object_event_callback_add(item, EVAS_CALLBACK_KEY_UP, _key_up_cb, obj);
   
   if(sd.cb_key_up)
   evas_object_event_callback_add(item, EVAS_CALLBACK_KEY_UP, sd.cb_key_up, item.shownItem);
}

function _delCallbacksKeys(obj, item)
{
   var sd;
   sd = obj.data;
   
   if(!sd) return;
   evas_object_event_callback_del(item, EVAS_CALLBACK_KEY_DOWN, _key_down_cb, obj);
   if(sd.cb_key_down)
   evas_object_event_callback_del(item, EVAS_CALLBACK_KEY_DOWN, sd.cb_key_down, item.shownItem);
   
   evas_object_event_callback_del(item, EVAS_CALLBACK_KEY_UP, _key_up_cb, obj);
   
   if(sd.cb_key_up)
   evas_object_event_callback_del(item, EVAS_CALLBACK_KEY_UP, sd.cb_key_up, item.shownItem);
}

function _calcMinBoudingBox(obj){
   var sd;
   sd = obj.data;
   
   liste = edje_object_part_object_get(sd.obj, "liste/items");
   geom = evas_object_geometry_get(liste);
   
   x_contenant = geom.x;
   y_contenant = geom.y;
   w_contenant = geom.w;
   h_contenant = geom.h;
   
   xleft = x_contenant + w_contenant;						// Initialisation du "rectangle"
   xright = 0;								// qui va contenir tous les items
   ytop = y_contenant + h_contenant;
   ybottom = 0;
   
   for(i = 0 ; i< sd.items.length ; i++){						// Pour tous les items ajoutés
      geomItem = evas_object_geometry_get(sd.items[i]);					// On met à jour le rectangle
      xleft = Math.min(xleft, geomItem.x);
      xright = Math.max(xright, (geomItem.x + geomItem.w));
      ytop = Math.min(ytop, geomItem.y);
      ybottom = Math.max(ybottom, (geomItem.y + geomItem.h));
   }
   
   return {xleft:xleft, xright:xright, ytop:ytop, ybottom:ybottom};
}

function _goPrevious(obj){
   var sd = obj.data;
   if (sd.currentItem >= 0)
   { 
      if(sd.currentItem == 0 && sd.firstShownItem > 0){
	 if(sd.cursor)
	 _move_cursor({obj:obj, cursor:sd.cursor, item1:sd.items[sd.currentItem]});
	 _move_down(obj);
      } else if(sd.currentItem ==0) {
	 return;
      } else {
	 edje_object_signal_emit(sd.items[sd.currentItem], "unfocus", "item"+sd.items[sd.currentItem].shownItem);
	 if(sd.cursor)
	 _move_cursor({obj:obj, cursor:sd.cursor, item1:sd.items[sd.currentItem]});
	 
	 item1 = sd.items[sd.currentItem];
	 
	 if(sd.currentItem >0){
	    sd.currentItem--;
	 }
	 
	 item2 = sd.items[sd.currentItem];
	 if(sd.cursor)
	 animatorCursor = ecore_animator_add(_move_cursor, {obj:obj, cursor: sd.cursor, item1: item1, item2: item2});
      }
      _update_main(obj);
   }
}

function _goNext(obj){
   var sd = obj.data;
   if (sd.currentItem < sd.items.length)
   {
      if(sd.currentItem == sd.items.length-1 && sd.firstShownItem+ sd.currentItem +1 < sd.tailleData){
	 if(sd.cursor)
	 _move_cursor({obj:obj, cursor:sd.cursor, item1:sd.items[sd.currentItem]});
	 _move_up(obj);
      } else if (sd.currentItem == sd.items.length -1) return;
      else {
	 edje_object_signal_emit(sd.items[sd.currentItem], "unfocus", "item"+sd.items[sd.currentItem].shownItem);
	 if(sd.cursor)
	 _move_cursor({obj:obj, cursor:sd.cursor, item1:sd.items[sd.currentItem]});
	 item1 = sd.items[sd.currentItem];
	 if(sd.currentItem < sd.items.length-1)
	    sd.currentItem++;
	 
	 item2 = sd.items[sd.currentItem];
	 if(sd.cursor)
	 animatorCursor = ecore_animator_add(_move_cursor, {obj:obj, cursor: sd.cursor, item1: item1, item2: item2});
      }
      _update_main(obj);
   }
   
}

function _key_down_cb(obj, evas, source, event)
{
   var sd = obj.data;
   
    if (!sd) return;
   
   var evas = evas_object_evas_get(obj);
    evas_event_freeze(evas);

   if (sd.timestamp == event.timestamp){
     switch (event.keyname) {
      case "Home":
      case "equal":
      case "Escape":
      case "Start":
      case "Stop":
      case "period":
      case "Mute":
         evas_event_thaw(evas);
         return ;
      default:
	 ecore_idler_del(sd.key_cleanup_cb);
         sd.key_cleanup_cb = null;
         if (sd.key_count++ < 4)
           {
              evas_event_thaw(evas);
              return ;
           }
     }
   }
   
   for(i=0; i<sd.keys.length;i++)
      if(sd.keys[i].key == event.keyname) {
	 sd.keys[i].action(obj);
	 evas_event_thaw(evas);
	 return;
      }
      
         evas_event_thaw(evas);
}

function _key_up_cb(obj, e, source, event)
{
   sd = obj.data;
   if (!sd) return;
  
   sd.timestamp = event.timestamp;
   if (!sd.key_cleanup_cb)
     sd.key_cleanup_cb = ecore_idler_add(_anti_rebond_liste_cb_idle, obj);
}

function _anti_rebond_liste_cb_idle(obj)
{
   var sd;
   sd = obj.data;

   sd.key_count = 0;
   sd.key_cleanup_cb = null;
   return 0;
}

function _update_main(obj)
{
   var sd;
   var signal;
   
   sd = obj.data;
   if (!sd) return;
   
   if(sd.currentItem < 0 || sd.currentItem >= sd.items.length)    
   {
      if(sd.cursor)
      evas_object_hide(sd.cursor);
      return ;
   }
   evas_object_show(sd.obj);  
   
   edje_object_signal_emit(sd.items[sd.currentItem], "focus", "item"+sd.items[sd.currentItem].shownItem);
   
}

function _smart_calculate(obj)
{
   
   var sd;
   var x_contenant, y_contenant, w_contenant, h_contenant;
   var evas = evas_object_evas_get(obj);
   
   var refocus = 0;
   
   sd = obj.data;
   if (!sd) return;
   
   
   liste = edje_object_part_object_get(sd.obj, "liste/items");
   geom = evas_object_geometry_get(liste);
   
   
   x_contenant = geom.x;
   y_contenant = geom.y;
   w_contenant = geom.w;
   h_contenant = geom.h;
   
   
   if(edje_object_file_get(sd.obj).part == "listeV")
   h_contenant -= 20;
   else
   w_contenant -= 20;
   
   if(sd.tailleData > 0){
      
      if(sd.firstShownItem <0) {
	 sd.firstShownItem = 0;
	 sd.currentItem = 0;
	 refocus = 1;
      }
      
      var minBBox = _calcMinBoudingBox(obj);
      
      while((minBBox.xleft < x_contenant || minBBox.ytop < y_contenant || minBBox.xright > (x_contenant + w_contenant) || minBBox.ybottom > (h_contenant+y_contenant)) && sd.items.length >0){
	 
	 edje_object_signal_emit(sd.items[sd.items.length-1], "unfocus", "item"+ sd.items[sd.items.length-1].shownItem);      
	 edje_object_signal_emit(sd.items[sd.items.length-1], "hide", "item"+ sd.items[sd.items.length-1].shownItem); 
	 edje_object_part_box_remove(sd.obj, "liste/items", sd.items[sd.items.length-1]);	
	 
	 if(sd.itemN1) {
	    edje_object_signal_emit(sd.itemN1, "unload", "item"+ sd.itemN1.shownItem);
	    sd.itemN1.preloaded = 0;
	    if(sd.itemN2) {
	       edje_object_signal_callback_del(sd.itemN2, "preload", "item"+sd.itemN2.shownItem, _cb_preload_item);
	       _delCallbacksKeys(obj, sd.itemN2);
	       evas_object_del(sd.itemN2); 
	    }
	    sd.itemN2 = sd.itemN1;
	 }
	 
	 sd.itemN1 = sd.items.pop();
	 
	 edje_object_calc_force(sd.obj);
	 minBBox = _calcMinBoudingBox(obj);
	 
      }
      
      var dernierAjout = sd.items.length-1;
      var currentShown = sd.firstShownItem;
      
      while(minBBox.xleft >= x_contenant && minBBox.ytop >= y_contenant && minBBox.xright <= (x_contenant + w_contenant) && minBBox.ybottom <= (h_contenant+y_contenant) && sd.items.length < sd.tailleData +1){	// Tant qu'il reste des objets à ajouter
	 
	 if(sd.firstShownItem + sd.items.length  < sd.tailleData && sd.itemN1)
	 {
	    item = sd.itemN1;
	    if(sd.itemN2){
	       sd.itemN1 = sd.itemN2;
	       sd.itemN2 = null;
	    } else sd.itemN1 = null;
	 } else if (sd.firstShownItem + sd.items.length  >= sd.tailleData && sd.itemP1) {
	    item = sd.itemP1;
	    if(sd.itemP2){
	       sd.itemP1 = sd.itemP2;
	       sd.itemP2 = null;
	    } else sd.itemP1 = null;
	 } else {
	    item = _createEdjeItem(obj, null, currentShown, false);
	 }
	 
	 if(sd.firstShownItem + sd.items.length  < sd.tailleData)
	 {
	    edje_object_part_box_append(sd.obj, "liste/items", item);		// On l'append à la box    
	    sd.items.push(item);
	    dernierAjout = sd.items.length-1;
	 } else {
	    edje_object_part_box_prepend(sd.obj, "liste/items", item);		// On l'append à la box    
	    sd.items.unshift(item);
	    dernierAjout = 0;
	 }
	 
	 edje_object_calc_force(sd.obj);							// On recalcule les positions
	 minBBox = _calcMinBoudingBox(obj);
	 currentShown++;
      }
      
      item = sd.items[dernierAjout];
      sd.items.splice(dernierAjout, 1);
      edje_object_part_box_remove(sd.obj, "liste/items", item);	
      
      if(dernierAjout >= sd.items.length){
	 sd.itemN2 = sd.itemN1;
	 sd.itemN1 = item;
      } else if (dernierAjout == 0){
	 sd.itemP2 = sd.itemP1;
	 sd.itemP1 = item;
      }
      
      edje_object_calc_force(sd.obj);
      
      if(dernierAjout == 0) {
	 if(sd.firstShownItem != sd.tailleData - sd.items.length){
	    sd.firstShownItem = sd.tailleData - sd.items.length;
	    sd.currentItem++;
	 }
      }
      
      for(i=0; i<sd.items.length; i++){
	 sd.items[i].indice = i;
	 if(sd.items[i].shownItem != sd.firstShownItem + i) {
	    _delCallbacksKeys(obj, sd.items[i]);
	    sd.items[i].shownItem = sd.firstShownItem + i;
	    _addCallbacksKeys(obj, sd.items[i]);
	 }
	 if(!sd.items[i].preloaded){
	    edje_object_signal_callback_add(sd.items[i], "preload", "item"+sd.items[i].shownItem, _cb_preload_item, {sd:sd,affiche:sd.items[i].shownItem});
	    edje_object_signal_emit(sd.items[i], "preload", "item"+sd.items[i].shownItem);
	    sd.items[i].preloaded = 1;
	 }
	 edje_object_signal_emit(sd.items[i], "show", "item"+sd.items[i].shownItem);
      }
      
      if(sd.firstShownItem > 0)
	 sd.itemP1 = _createEdjeItem(obj, sd.itemP1, sd.firstShownItem-1, true);
      
      if(sd.firstShownItem > 1)
	 sd.itemP2 = _createEdjeItem(obj, sd.itemP2, sd.firstShownItem-2, false);
      
      if(sd.firstShownItem +sd.items.length < sd.tailleData)
	 sd.itemN1 = _createEdjeItem(obj, sd.itemN1, sd.firstShownItem + sd.items.length, true);
      
      if(sd.firstShownItem +sd.items.length +1 < sd.tailleData)
	 sd.itemN2 =_createEdjeItem(obj, sd.itemN2, sd.firstShownItem + sd.items.length +1, false);
      
      
      if(sd.currentItem > sd.items.length -1){
	 sd.currentItem = sd.items.length -1;
	 refocus = 1;
      } else if(sd.currentItem < 0) {
	 sd.currentItem = 0;
	 refocus = 1;
      }
      

      if(sd.items.length == 0){
	 evas_object_hide(sd.cursor);
	 sd.firstShownItem = -1;
	 sd.currentItem = -1;
	 _delCallbacksItem(obj, sd.itemP2);
	 _delCallbacksItem(obj, sd.itemP1);
	 _delCallbacksItem(obj, sd.itemN1);
	 _delCallbacksItem(obj, sd.itemN2);
	 sd.itemP2 = null;
	 sd.itemP1 = null;
	 sd.itemN1 = null;
	 sd.itemN2 = null;
      }else {
	 if(sd.cursor) {
	 geom = edje_object_size_min_get(sd.cursor);
	 evas_object_resize(sd.cursor, geom.w, geom.h);
	 evas_object_show(sd.cursor);
	 _move_cursor({obj:obj, cursor:sd.cursor, item1: sd.items[sd.currentItem]});
	 }
      }
      
      if(refocus)
	 _update_main(obj);
      
   }
   
   _update_scroller(obj);
}


function _createEdjeItem(obj, item, pos, preloaded){
   var sd = obj.data;	
   var evas = evas_object_evas_get(obj);
   if(item && item.shownItem != pos) {
      if(!preloaded)
	 edje_object_signal_callback_del(item, "preload", "item"+item.shownItem, _cb_preload_item);
      else
      {
	 edje_object_signal_emit(item, "unload", "item"+ item.shownItem);
	 edje_object_signal_callback_del(item, "preload", "item"+item.shownItem, _cb_preload_item);
      }
      _delCallbacksKeys(obj, item);
      evas_object_del(item);
      item = null;
   }
   if(!item) {
      item = edje_object_add(evas);
      item.shownItem = pos;
      _addCallbacksKeys(obj, item);
      edje_object_file_set(item, sd.edje_file, sd.edje_group_item);
      geom = edje_object_size_min_get(item);
      evas_object_resize(item, geom.w, geom.h);
      edje_object_signal_callback_add(item, "preload", "item"+item.shownItem, _cb_preload_item, {sd:sd,affiche:item.shownItem});
      if(preloaded) {
	 edje_object_signal_emit(item, "preload", "item"+item.shownItem);
	 item.preloaded = 1;
      } else
	 item.preloaded = 0;
   }
   if(item && item.preloaded && !preloaded) {
      edje_object_signal_emit(item, "unload", "item"+item.shownItem);
      item.preloaded = 0;
   }
   if(item && !item.preloaded && preloaded) {
      edje_object_signal_emit(item, "preload", "item"+item.shownItem);
      item.preloaded = 1;
   }
   return item;
}

function _delCallbacksItem(obj, item) {
   if(item) {
      if(item.preloaded)
	 edje_object_signal_emit(item, "unload", "item"+item.shownItem);
      edje_object_signal_callback_del(item, "preload", "item"+item.shownItem, _cb_preload_item);
      _delCallbacksKeys(obj, item);
   }
}

function _move_up(obj)
{
   var sd;
   sd = obj.data;
   
   if(!sd) return;
   
   var evas = evas_object_evas_get(obj);
   
   if(sd.firstShownItem + sd.items.length  < sd.tailleData){
      edje_object_signal_emit(sd.items[sd.items.length-1], "unfocus", "item"+sd.items[sd.items.length-1].shownItem);
      
      if(sd.itemP2) {
	 edje_object_signal_callback_del(sd.itemP2, "preload", "item"+sd.itemP2.shownItem, _cb_preload_item);
	 _delCallbacksKeys(obj, sd.itemP2);
	 evas_object_del(sd.itemP2);
	 sd.itemP2 = null;
      }
      
      if(sd.itemP1) {
	 edje_object_signal_emit(sd.itemP1, "unload", "item"+sd.itemP1.shownItem);
	 sd.itemP1.preloaded = 0;
	 sd.itemP2 = sd.itemP1;
      }
      
      edje_object_part_box_remove(sd.obj, "liste/items", sd.items[0]);
      edje_object_signal_emit(sd.items[0], "hide", "item"+(sd.items[0].shownItem));
      sd.itemP1 = sd.items.shift();
      
      
      if(sd.itemN1){
	 edje_object_part_box_append(sd.obj, "liste/items", sd.itemN1);
	 sd.items.push(sd.itemN1);
      }
      
      if(sd.itemN2) {
	 edje_object_signal_emit(sd.itemN2, "preload", "item"+sd.itemN2.shownItem);
	 sd.itemN2.preloaded = 1;
	 sd.itemN1 = sd.itemN2;
	 sd.itemN2 = null;
      } else sd.itemN1 = null;
      
      sd.firstShownItem ++;
      
      if(sd.firstShownItem +sd.items.length +1 < sd.tailleData) {
	 sd.itemN2 = _createEdjeItem(obj, sd.itemN2, sd.firstShownItem + sd.items.length +1, false);
      }else sd.itemN2 = null;
      
      edje_object_signal_emit(sd.items[sd.items.length-1], "show", "item"+(sd.items[sd.items.length-1].shownItem));
      
      _update_scroller(obj);
   }
}

function _move_down(obj)
{
   var sd;
   sd = obj.data;
   
   if(!sd) return;
   
   var evas = evas_object_evas_get(obj);
   
   if(sd.firstShownItem > 0){
      edje_object_signal_emit(sd.items[0], "unfocus", "item"+sd.items[0].shownItem);
      
      if(sd.itemN2) {
	 edje_object_signal_callback_del(sd.itemN2, "preload", "item"+sd.itemN2.shownItem, _cb_preload_item);
	 _delCallbacksKeys(obj, sd.itemN2);
	 evas_object_del(sd.itemN2);
	 sd.itemN2 = null;
      }
      
      if(sd.itemN1){
	 edje_object_signal_emit(sd.itemN1, "unload", "item"+sd.itemN1.shownItem);
	 sd.itemN1.preloaded = 0;
	 sd.itemN2 = sd.itemN1;
      }
      
      edje_object_part_box_remove(sd.obj, "liste/items", sd.items[sd.items.length-1]);
      edje_object_signal_emit(sd.items[sd.items.length-1], "hide", "item"+(sd.items[sd.items.length-1].shownItem));
      sd.itemN1 = sd.items.pop();
      
      
      if(sd.itemP1){
	 edje_object_part_box_prepend(sd.obj, "liste/items", sd.itemP1);
	 sd.items.unshift(sd.itemP1);
      }
      
      if(sd.itemP2) {
	 edje_object_signal_emit(sd.itemP2, "preload", "item"+sd.itemP2.shownItem);
	 sd.itemP2.preloaded = 1;
	 sd.itemP1 = sd.itemP2;
	 sd.itemP2 = null;
      } else sd.itemP1 = null;
      
      sd.firstShownItem --;
      
      if(sd.firstShownItem > 1) {
	 sd.itemP2 = _createEdjeItem(obj, sd.itemP2, sd.firstShownItem -2, false);
      } else sd.itemP2 = null;
      
      edje_object_signal_emit(sd.items[0], "show", "item"+(sd.items[0].shownItem));
      
      _update_scroller(obj);
   }
}



function _move_cursor(data)
{
   var sd = data.obj.data;
    
   cursor = data.cursor;
   
   geom1 = evas_object_geometry_get(data.item1);
   
   if(data.item2 == null) {
      if(animatorCursor)
	 ecore_animator_del(animatorCursor);
      animatorCursor = null;
      evas_object_move(cursor, geom1.x, geom1.y);
      evas_object_show(cursor);
      return 0;
   }
   geom2 = evas_object_geometry_get(data.item2);
   
   dx = (geom2.x - geom1.x)/5;
   dy = (geom2.y - geom1.y)/5;
   
   geomC = evas_object_geometry_get(cursor);
   
   if((dx >= 0 && geomC.x >= geom2.x) || (dx <= 0 && geomC.x <= geom2.x))
      x = geom2.x;
   else
      x = geomC.x+dx;
   
   if ((dy>=0 && geomC.y >= geom2.y) || (dy <= 0 && geomC.y <= geom2.y))
      y = geom2.y;
   else
      y= geomC.y+dy;
   
   evas_object_move(cursor, x, y);
   
   
   if(x==geom2.x && y==geom2.y) {
      animatorCursor = null;
      return 0; }
      else
	 return 1;
}



function _update_scroller(obj)
{
   var sd;
   sd = obj.data;
   
   if (!sd) return;
   
   if(sd.scroller){
      
      content = edje_object_part_object_get(sd.obj, "liste/clipScroller");
      geomClipBG = evas_object_geometry_get(content);
   
      evas_object_resize(sd.scroller, geomClipBG.w, geomClipBG.h);
      evas_object_move(sd.scroller, geomClipBG.x, geomClipBG.y);
  
       
      nElements = Math.max(1, sd.tailleData);
      longueur = sd.items.length/nElements;
      
      if(sd.firstShownItem >= 0) {
	 edje_object_part_drag_value_set(sd.scroller, sd.scroller.cursorUp, sd.firstShownItem/nElements, sd.firstShownItem/nElements);
	 edje_object_part_drag_value_set(sd.scroller, sd.scroller.cursorDown, sd.firstShownItem/nElements + longueur, sd.firstShownItem/nElements + longueur);
      } else {
	 edje_object_part_drag_value_set(sd.scroller, sd.scroller.cursorUp, 0, 0);
	 edje_object_part_drag_value_set(sd.scroller, sd.scroller.cursorDown, 1, 1);
      }
      
      
   }
}

function _smart_init()
{
   var sc=
   {
      name: "name",
      version: 4,
      add: _smart_add,
      del: _smart_del,
      move: _smart_move,
      resize: _smart_resize,
      show: _smart_show,
      hide: _smart_hide,
      color_set: _smart_color_set,
      clip_set: _smart_clip_set,
      clip_unset: _smart_clip_unset,
      calculate: _smart_calculate,
      member_add: _smart_member_add,
      member_del: _smart_member_del,
      data: null
   };
   smart = evas_smart_class_new(sc);
}

function _smart_add(obj)
{
   var sd = {};
   var o;
   
   obj.data = sd;
   
   var evas = evas_object_evas_get(obj);
   
   sd.obj = edje_object_add(evas);
   edje_object_file_set(sd.obj, "evan.edj", "listeV");
   evas_object_smart_member_add(sd.obj, obj);
   
   
   
   content = edje_object_part_object_get(sd.obj, "liste/items");
   geom = evas_object_geometry_get(content);
   
   sd.clipScroller = edje_object_part_object_get(sd.obj, "liste/clipScroller");
   evas_object_smart_member_add(sd.clipScroller, obj);
   
   sd.currentItem = -1;
   sd.firstShownItem = -1;
   
   sd.timestamp = null;
   sd.key_cleanup_cb = null;
   sd.key_count = 0;
   
   evas_object_focus_set(sd.obj, 1);
}

function _smart_del(obj)
{
   var sd;
   sd = obj.data;
   
   if (!sd) return;
   
   for(i=0 ; i< sd.items.length ; i++){
      _delCallbacksItem(obj, sd.items[i]);
      evas_object_smart_member_del(sd.items[i]);
      evas_object_del(sd.items[i]);
   }
   
   _delCallbacksItem(obj, sd.itemP2);
   _delCallbacksItem(obj, sd.itemP1);
   _delCallbacksItem(obj, sd.itemN2);
   _delCallbacksItem(obj, sd.itemN1);
   
   evas_object_del(sd.obj);
   sd = null;
   
}

function _smart_move(obj, x, y)
{
   var sd;
   sd = obj.data;
   
   if (!sd) return;
   
   evas_object_move(sd.obj, x, y);
}

function _smart_resize(obj, w, h)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   evas_object_resize(sd.obj, w, h);
   evas_object_smart_need_recalculate_set(obj, 1);
   
}

function _smart_show(obj)
{
   var sd;
   sd = obj.data;
   
   if (!sd) return;
   evas_object_smart_need_recalculate_set(obj, 1);
   evas_object_show(sd.obj);
   
}

function _smart_hide(obj)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   evas_object_hide(sd.obj);
}

function _smart_clip_set(obj, clip)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   evas_object_clip_set(sd.obj, clip);
}

function _smart_clip_unset(obj)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   evas_object_clip_unset(sd.obj);
}

function _smart_color_set(obj, r, g, b, a)
{
   ;
}

function _smart_member_add(obj, obj2)
{
   ;
}

function _smart_member_del(obj, obj2)
{
   ;
}

function evan_list_object_set_params(obj, params)
{
   var sd;
   sd = obj.data;
   
   if(!sd) return;
   
   
   sd.name = params.name;
   
   if(params.nb_items)
   sd.tailleData = params.nb_items;
   else
   sd.tailleData = 0;
   
   sd.edje_file = params.edje_file;
   sd.edje_group_item = params.edje_group_item;
   
   if(params.edje_group_cursor)
   sd.edje_group_cursor = params.edje_group_cursor;
   if(params.preload)
   sd.cb_preload = params.preload;
   if(params.unload)
   sd.cb_unload = params.unload;
   if(params.show)
   sd.cb_show = params.show;
   if(params.hide)
   sd.cb_hide = params.hide;
   if(params.focus)
      sd.cb_focus = params.focus;
   if(params.unfocus)
   sd.cb_unfocus = params.unfocus;
   if(params.key_up_cb)
   sd.cb_key_up = params.key_up_cb;
   if(params.key_down_cb)
   sd.cb_key_down = params.key_down_cb;
   if(params.data)
   sd.data = params.data;
   
   sd.items = new Array();
   sd.keys = new Array();
   
   temp = edje_file_data_get(sd.edje_file, "keyPrevious");
   if(temp)
      keyPrevious = temp.split(",");
   else
      keyPrevious = new Array("Up", "FP/Up", "RC/Up");
   
   temp = edje_file_data_get(sd.edje_file, "keyNext");
   if(temp)
      keyNext = temp.split(",");    
   else
      keyNext = new Array("Down", "FP/Down", "RC/Down");
   
   for(i = 0; i<keyPrevious.length; i++)
      sd.keys.push(new _addKey(keyPrevious[i], _goPrevious));
   
   for(i = 0; i<keyNext.length; i++)
      sd.keys.push(new _addKey(keyNext[i], _goNext));
   
   if(sd.edje_group_cursor){
   sd.cursor = edje_object_add(evas_object_evas_get(obj));
   evas_object_smart_member_add(sd.cursor, obj);
   content = edje_object_part_object_get(sd.obj, "whole");
   evas_object_clip_set(sd.cursor, content);
   evas_object_smart_member_add(sd.cursor, obj);
   
   edje_object_file_set(sd.cursor, sd.edje_file, sd.edje_group_cursor);
   edje_object_preload(sd.cursor, true);
   
   }
   
   if(sd.currentItem < 0 && sd.items.length > 0) 
   {
      sd.currentItem = 0;
      sd.firstShownItem = 0;
   }
}

function _addKey(key, action){
   this.key = key;
   this.action = action;
}

function _cb_preload_item(data, obj, signal, source){
   var sd;
   sd = data.sd;
   affiche= data.affiche;
   
   if(sd.cb_preload)
   sd.cb_preload(affiche, obj, signal, source);
   
   edje_object_signal_callback_del(obj, "preload", "item"+affiche, _cb_preload_item);
   edje_object_signal_callback_add(obj, "show", "item"+affiche, _cb_show_item, {sd:sd, affiche: affiche});
   edje_object_signal_callback_add(obj, "unload", "item"+affiche, _cb_unload_item, {sd:sd, affiche:affiche});
}

function _cb_show_item(data, obj, signal, source){
   var sd;
   sd = data.sd;
   affiche= data.affiche;
   
   if(sd.cb_show)
   sd.cb_show(affiche, obj, signal, source);
   
   edje_object_signal_callback_del(obj, "show", "item"+affiche, _cb_show_item); 
   edje_object_signal_callback_add(obj, "hide", "item"+affiche, _cb_hide_item, {sd:sd, affiche:affiche});
   if(sd.cb_focus)
   edje_object_signal_callback_add(obj, "focus", "item"+affiche, sd.cb_focus, affiche);
   if(sd.cb_unfocus)
   edje_object_signal_callback_add(obj, "unfocus", "item"+affiche, sd.cb_unfocus, affiche);
}

function _cb_hide_item(data, obj, signal, source){
   var sd;
   sd = data.sd;
   affiche= data.affiche;
   
   if(sd.cb_hide)
   sd.cb_hide(affiche,obj, signal, source);
   
   edje_object_signal_callback_del(obj, "hide", "item"+affiche, _cb_hide_item);
   if(sd.cb_focus)
   edje_object_signal_callback_del(obj, "focus", "item"+affiche, sd.cb_focus);
   if(sd.cb_unfocus)
   edje_object_signal_callback_del(obj, "unfocus", "item"+affiche, sd.cb_unfocus);
   edje_object_signal_callback_add(obj, "show", "item"+affiche, _cb_show_item, {sd:sd, affiche:affiche});
}

function _cb_unload_item(data, obj, signal, source){
   var sd;
   sd = data.sd;
   affiche= data.affiche;
   
   if(sd.cb_unload)
   sd.cb_unload(affiche , obj, signal, source);
   
   edje_object_signal_callback_del(obj, "show", "item"+affiche, _cb_show_item);
   edje_object_signal_callback_del(obj, "unload", "item"+affiche, _cb_unload_item);
   edje_object_signal_callback_del(obj, "hide", "item"+affiche, _cb_hide_item);
   if(sd.cb_focus)
   edje_object_signal_callback_del(obj, "focus", "item"+affiche, sd.cb_focus);
   if(sd.cb_unfocus)
   edje_object_signal_callback_del(obj, "unfocus", "item"+affiche, sd.cb_unfocus);
   edje_object_signal_callback_add(obj, "preload", "item"+affiche, _cb_preload_item, {sd:sd, affiche:affiche});
}

function evan_list_object_append (obj, data)
{
   var sd;
   sd = obj.data;
   
   if(!sd) return;
   sd.data = data
   sd.tailleData++;
   
   _smart_calculate(obj);
}

function evan_list_object_prepend (obj, data)
{
   var sd;
   sd = obj.data;
   
   if(!sd) return;
   sd.data = data
   sd.tailleData++;
   
   sd.firstShownItem++;
   
   for(i = 0 ; i<sd.items.length; i++){
      edje_object_signal_emit(sd.items[i], "unload", "item"+sd.items[i].shownItem);
      edje_object_signal_callback_del(sd.items[i], "preload", "item"+sd.items[i].shownItem,  _cb_preload_item);
      sd.items[i].preloaded = 0;
   }
   
   if(sd.itemN1){
      edje_object_signal_emit(sd.itemN1, "unload", "item"+sd.itemN1.shownItem);
      edje_object_signal_callback_del(sd.itemN1, "preload", "item"+sd.itemN1.shownItem,  _cb_preload_item);
      sd.itemN1.preloaded = 0;
   }
   
   if(sd.itemP1){
      edje_object_signal_emit(sd.itemP1, "unload", "item"+sd.itemP1.shownItem);
      edje_object_signal_callback_del(sd.itemP1, "preload", "item"+sd.itemP1.shownItem,  _cb_preload_item);
      sd.itemP1.preloaded = 0;
   }
   
   if(sd.itemP2){
      edje_object_signal_callback_del(sd.itemP2, "preload", "item"+sd.itemP2.shownItem,  _cb_preload_item);
   }
   
   if(sd.itemN2){
      edje_object_signal_callback_del(sd.itemN2, "preload", "item"+sd.itemN2.shownItem,  _cb_preload_item);
   }
   
   _smart_calculate(obj);
   _update_main(obj);
}



function evan_list_object_insert_at (obj, indice, data)
{
   var sd;
   sd = obj.data;
   
   if(!sd) return;
   sd.data = data
   sd.tailleData++;
   
   if(indice-sd.firstShownItem >=0)
      for(i = indice-sd.firstShownItem ; i<sd.items.length; i++){
	 edje_object_signal_emit(sd.items[i], "unload", "item"+sd.items[i].shownItem);
	 edje_object_signal_callback_del(sd.items[i], "preload", "item"+sd.items[i].shownItem,  _cb_preload_item);
	 sd.items[i].preloaded = 0;
      }
      
      if(indice < sd.firstShownItem) sd.firstShownItem++;
      
      if(indice < sd.firstShownItem -2 && sd.itemP2){
	 edje_object_signal_callback_del(sd.itemP2, "preload", "item"+sd.itemP2.shownItem,  _cb_preload_item);
	 _delCallbacksKeys(obj, sd.itemP2);
	 evas_object_del(sd.itemP2);
	 sd.itemN2 = null;
      }
      
      if(indice < sd.firstShownItem -1 && sd.itemP1 && sd.itemP1.preloaded){
	 edje_object_signal_emit(sd.itemP1, "unload", "item"+sd.itemP1.shownItem);
	 edje_object_signal_callback_del(sd.itemP1, "preload", "item"+sd.itemP1.shownItem,  _cb_preload_item);
	 sd.itemP1.preloaded = 0;
      }
      
      if(indice < sd.firstShownItem +sd.items.length && sd.itemN1 && sd.itemN1.preloaded){
	 edje_object_signal_emit(sd.itemN1, "unload", "item"+sd.itemN1.shownItem);
	 edje_object_signal_callback_del(sd.itemN1, "preload", "item"+sd.itemN1.shownItem,  _cb_preload_item);
	 sd.itemN1.preloaded = 0;
      }
      
      if(indice < sd.firstShownItem +sd.items.length +1 && sd.itemN2) {
	 edje_object_signal_callback_del(sd.itemN2, "preload", "item"+sd.itemN2.shownItem,  _cb_preload_item);
	 _delCallbacksKeys(obj, sd.itemN2);
	 evas_object_del(sd.itemN2);
	 sd.itemN2 = null;
      }

      _smart_calculate(obj);
      _update_main(obj);      
}

function evan_list_object_remove_at (obj, indice, data)
{
   var sd;
   sd = obj.data;
   
   if(!sd) return;
   sd.data = data
   sd.tailleData--;
      
   if(indice-sd.firstShownItem >=0)
      for(i = indice-sd.firstShownItem ; i<sd.items.length; i++){
	 edje_object_signal_emit(sd.items[i], "unload", "item"+sd.items[i].shownItem);
	 edje_object_signal_callback_del(sd.items[i], "preload", "item"+sd.items[i].shownItem,  _cb_preload_item);
	 sd.items[i].preloaded = 0;
      }
      
      if(indice < sd.firstShownItem) 
	 sd.firstShownItem--;
      
      if(indice < sd.firstShownItem -2 && sd.itemP2){
	 edje_object_signal_callback_del(sd.itemP2, "preload", "item"+sd.itemP2.shownItem,  _cb_preload_item);
	 _delCallbacksKeys(obj, sd.itemP2);
	 evas_object_del(sd.itemP2);
	 sd.itemN2 = null;
      }
      
      if(indice < sd.firstShownItem -1 && sd.itemP1 && sd.itemP1.preloaded){
	 edje_object_signal_emit(sd.itemP1, "unload", "item"+sd.itemP1.shownItem);
	 edje_object_signal_callback_del(sd.itemP1, "preload", "item"+sd.itemP1.shownItem,  _cb_preload_item);
	 sd.itemP1.preloaded = 0;
      }
      
      if(indice < sd.firstShownItem +sd.items.length && sd.itemN1 && sd.itemN1.preloaded){
	 edje_object_signal_emit(sd.itemN1, "unload", "item"+sd.itemN1.shownItem);
	 edje_object_signal_callback_del(sd.itemN1, "preload", "item"+sd.itemN1.shownItem,  _cb_preload_item);
	 sd.itemN1.preloaded = 0;
      }
      
      if(indice < sd.firstShownItem +sd.items.length +1 && sd.itemN2) {
	 edje_object_signal_callback_del(sd.itemN2, "preload", "item"+sd.itemN2.shownItem,  _cb_preload_item);
	 _delCallbacksKeys(obj, sd.itemN2);
	 evas_object_del(sd.itemN2);
	 sd.itemN2 = null;
      }
      
      if(indice >= sd.firstShownItem && indice < sd.firstShownItem + sd.items.length) {
	 item = sd.items[indice-sd.firstShownItem];
	 edje_object_part_box_remove(sd.obj, "liste/items", item);
	 _delCallbacksKeys(obj, item);	
	 evas_object_del(item);
	 sd.items.splice((indice-sd.firstShownItem), 1);
      }
        
        
      _smart_calculate(obj);
      _update_main(obj);
      
}

function evan_list_object_remove_all (obj){
   var sd;
   sd = obj.data;
   
   if(!sd) return;
   
   while(sd.tailleData > 0)
      evan_list_object_remove_at (obj, 0);
}

function evan_list_object_data_changed(obj)
{
   var sd;
   sd = obj.data;
   
   
   if(!sd) return;
   
   for(i = 0 ; i<sd.items.length; i++){
      edje_object_signal_emit(sd.items[i], "unload", "item"+sd.items[i].shownItem);
      edje_object_signal_emit(sd.items[i], "preload", "item"+sd.items[i].shownItem);
      edje_object_signal_emit(sd.items[i], "show", "item"+sd.items[i].shownItem);
   }
}


function evan_list_object_set_scroller(obj, edje, group, partScrollerUp, partScrollerDown)
{
var sd;
sd = obj.data;

if(!sd) return;

var evas = evas_object_evas_get(obj);

   sd.scroller = edje_object_add(evas);
   edje_object_file_set(sd.scroller, edje, group);
   content = edje_object_part_object_get(sd.obj, "liste/clipScroller");
   evas_object_clip_set(sd.scroller, content);
   
   geom = evas_object_geometry_get(content);
   evas_object_resize(sd.scroller, geom.w, geom.h);
   evas_object_move(sd.scroller, geom.x, geom.y);
   evas_object_show(sd.scroller);
 
   sd.scroller.cursorUp = partScrollerUp;
   sd.scroller.cursorDown = partScrollerDown; 
}

function evan_list_object_layout_set(obj, layout)
{
var sd;
sd = obj.data;

if(!sd) return;


   switch(layout) {
      case "horizontal":
	 edje_object_file_set(sd.obj, "evan.edj", "listeH");
	 evas_object_smart_need_recalculate_set(obj, 1);
	 break;
      default:
	 edje_object_file_set(sd.obj, "evan.edj", "listeV");
	 evas_object_smart_need_recalculate_set(obj, 1);
	 break;
   }
}

function evan_list_object_current_item_get(obj)
{
var sd;
sd = obj.data;

if(!sd) return;
   if(sd.items[sd.currentItem])
      return sd.items[sd.currentItem];
   else
      return null;
}

function evan_list_object_current_item_indice_get(obj)
{
var sd;
sd = obj.data;

if(!sd) return;


   if(sd.items[sd.currentItem].shownItem !=null)
      return sd.items[sd.currentItem].shownItem;
   else
      return -1;

}