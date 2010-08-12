var smartiblock = null;

function evan_inputblock_object_add(evas)
{
   if(!smartiblock)  _evan_inputblock_init();
   return evas_object_smart_add(evas, smartiblock);
}

function _evan_inputblock_init()
{
   var scinputblock=
   {
      name: "evan_inputblock",
      version: 4,
      add: _evan_inputblock_add,
      del: _evan_inputblock_del,
      move: _evan_inputblock_move,
      resize: _evan_inputblock_resize,
      show: _evan_inputblock_show,
      hide: _evan_inputblock_hide,
      color_set: _evan_inputblock_color_set,
      clip_set: _evan_inputblock_clip_set,
      clip_unset: _evan_inputblock_clip_unset,
      calculate: _evan_inputblock_calculate,
      member_add: _evan_inputblock_member_add,
      member_del: _evan_inputblock_member_del,
      data: null
   };
   smartiblock = evas_smart_class_new(scinputblock);
}

function _evan_inputblock_add(obj)
{
   var smi = {};
   
   obj.data = smi;
   
   var evas = evas_object_evas_get(obj);
   
   smi.cursorOn = true;
         
   smi.o_texte = edje_object_add(evas);  
   edje_object_file_set(smi.o_texte, "evan.edj", "textentryblock");
   evas_object_smart_member_add(smi.o_texte, obj);

   smi.o_curseur = evas_object_rectangle_add(evas);
   evas_object_color_set(smi.o_curseur, 0, 0, 0, 255);
   evas_object_smart_member_add(smi.o_curseur, obj);

   smi.touchesTelephone = new Array(10);
   smi.modes = new Array("abc", "ABC", "123");
   smi.currentMode = 0;
   
   smi.toucheEnCours = {indice: 0, touche:-1};

   smi.timerTouche;
   smi.timerCursor;
   
   smi.smartClavier = null;
   
   smi.gotFocus = false;
   
   smi.changeModeKeys = new Array("Swap");
   
   smi.timestamp = null;
   smi.key_cleanup_cb = null;
   smi.key_count = 0;
   
   etiquette = edje_object_part_object_get(smi.o_texte, "textentryblock/mode/bg");
   evas_object_hide(etiquette);
   etiquette = edje_object_part_object_get(smi.o_texte, "textentryblock/mode/text");
   evas_object_hide(etiquette);
   evas_object_hide(smi.o_curseur);
   smi.cursorOn = false;
   smi.cursor = evas_object_textblock_cursor_new(edje_object_part_object_get(smi.o_texte, "textentryblock/text"));
   
   smi.validationCB  = null;

   evas_object_event_callback_add(obj, EVAS_CALLBACK_KEY_DOWN, _key_down_cb_inputblock, obj);
   evas_object_event_callback_add(obj, EVAS_CALLBACK_KEY_UP, _key_up_cb_inputblock, obj);
   evas_object_event_callback_add(obj, EVAS_CALLBACK_FOCUS_IN, _evan_inputblock_get_focus, obj);
}

function _evan_inputblock_lose_focus(data, e, obj, event)
{
   var smi;
   smi = data.data;
   
   if (!smi) return;
    
   smi.gotFocus = false;
   
   etiquette = edje_object_part_object_get(smi.o_texte, "textentryblock/mode/bg");
   evas_object_hide(etiquette);
   etiquette = edje_object_part_object_get(smi.o_texte, "textentryblock/mode/text");
   evas_object_hide(etiquette);
   evas_object_hide(smi.o_curseur);
   smi.cursorOn = false;

   
   if(smi.timerCursor){
   ecore_timer_del(smi.timerCursor)
   smi.timerCursor = null;
   }

   for(i=0; i<smi.changeModeKeys.length ; i++)
	 evas_object_key_ungrab(obj, smi.changeModeKeys[i], 0, 0);
	 

      evas_object_event_callback_del(obj, EVAS_CALLBACK_FOCUS_OUT, _evan_inputblock_lose_focus, obj);
      evas_object_event_callback_add(obj, EVAS_CALLBACK_FOCUS_IN, _evan_inputblock_get_focus, obj);
}

function _evan_inputblock_get_focus(data, e, obj, event)
{
   
   var smi;
   smi = data.data;
   
   if (!smi) return;
   
   smi.gotFocus = true;
   
   etiquette = edje_object_part_object_get(smi.o_texte, "textentryblock/mode/bg");
   evas_object_show(etiquette);
   
   edje_object_part_text_set(smi.o_texte, "textentryblock/mode/text", smi.modes[smi.currentMode]);
   etiquette = edje_object_part_object_get(smi.o_texte, "textentryblock/mode/text");
   evas_object_show(etiquette);
   
   evas_object_show(smi.o_curseur);
   smi.cursorOn = true;
   
   _updateCursor(obj);
   
         for(i=0; i<smi.changeModeKeys.length ; i++)
               evas_object_key_grab(obj, smi.changeModeKeys[i], 0, 0, 0);
      
   
      evas_object_event_callback_del(obj, EVAS_CALLBACK_FOCUS_IN, _evan_inputblock_get_focus, obj);
      evas_object_event_callback_add(obj, EVAS_CALLBACK_FOCUS_OUT, _evan_inputblock_lose_focus, obj);

      evan_inputblock_object_input_mode_set(obj, smi.modes[smi.currentMode]);

}

function _evan_inputblock_cb_smartClavier_lose_focus(data, e, obj, event){
   var smi;
   smi = data.data;
     
   smi.gotFocus = false;
   
   if (!smi) return;
   evas_object_event_callback_del(smi.smartClavier, EVAS_CALLBACK_FOCUS_OUT, _evan_inputblock_cb_smartClavier_lose_focus, data);
   evas_object_hide(smi.smartClavier);
   evan_keyboard_object_callback_del(smi.smartClavier);
   _evan_inputblock_lose_focus(data, e, data, event);   
}

function _key_up_cb_inputblock(data, e, obj, event)
{
   var smi;
   smi = data.data;
   
   if (!smi) return;

      for(i=0; i<smi.changeModeKeys.length; i++){
        if(smi.changeModeKeys[i] == event.keyname){
        smi.currentMode = (smi.currentMode +1) % smi.modes.length;
	evan_inputblock_object_input_mode_set(data, smi.modes[smi.currentMode]);
	}
      }
      
   smi.timestamp = event.timestamp;
   if (!smi.key_cleanup_cb)
     smi.key_cleanup_cb = ecore_idler_add(_evan_inputblock_anti_rebond_cb_idle, smi);
}

function _evan_inputblock_anti_rebond_cb_idle(data)
{
   data.key_count = 0;
   data.key_cleanup_cb = null;
   return 0;
}


function _evan_inputblock_del(obj)
{
   var smi;
   smi = obj.data;
   
   if (!smi) return;
     
   if(smi.timerTouche)
      ecore_timer_del(smi.timerTouche)
   if(smi.timerCursor)
      ecore_timer_del(smi.timerCursor)
   
   
   evas_object_event_callback_del(smi.smartClavier, EVAS_CALLBACK_FOCUS_OUT, _evan_inputblock_cb_smartClavier_lose_focus, obj);
   evas_object_event_callback_del(obj, EVAS_CALLBACK_FOCUS_OUT, _evan_inputblock_lose_focus, obj);
   evas_object_event_callback_del(obj, EVAS_CALLBACK_FOCUS_IN, _evan_inputblock_get_focus, obj);

   evas_object_event_callback_del(obj, EVAS_CALLBACK_KEY_DOWN, _key_down_cb_inputblock, obj);
   evas_object_event_callback_del(obj, EVAS_CALLBACK_KEY_UP, _key_up_cb_inputblock, obj);
   
      for(i=0; i<smi.changeModeKeys.length ; i++)
         evas_object_key_ungrab(obj, smi.changeModeKeys[i], 0, 0);
   
   if(smi.o_curseur)
   evas_object_del(smi.o_curseur);
   if(smi.o_texte)
   evas_object_del(smi.o_texte);
   smi = null;

}

function _evan_inputblock_move(obj, x, y)
{
   var smi;
   smi = obj.data;
   
   if (!smi) return;
   
   evas_object_move(smi.o_texte, x, y);
   _updateCursor(obj);
}

function _evan_inputblock_resize(obj, w, h)
{
   var smi;
   
   smi = obj.data;
   if (!smi) return;
   evas_object_resize(smi.o_texte, w, h);
   evas_object_resize(smi.o_curseur, 1, 0.9*h);
   _updateCursor(obj);
   evas_object_smart_need_recalculate_set(obj, 1);  
}

function _evan_inputblock_calculate(obj)
{
   var smi;
   
   smi = obj.data;
   if (!smi) return;
   
}

function _evan_inputblock_show(obj)
{
   var smi;
   smi = obj.data;
   
   if (!smi) return;
   evas_object_show(smi.o_texte);
   
   
   if(smi.gotFocus){
      evas_object_show(smi.o_curseur);
      etiquette = edje_object_part_object_get(smi.o_texte, "textentryblock/mode/bg");
      evas_object_show(etiquette);
      edje_object_part_text_set(smi.o_texte, "textentryblock/mode/text", smi.modes[smi.currentMode]);
      etiquette = edje_object_part_object_get(smi.o_texte, "textentryblock/mode/text");
      evas_object_show(etiquette);
   } else {
      etiquette = edje_object_part_object_get(smi.o_texte, "textentryblock/mode/bg");
      evas_object_hide(etiquette);
      etiquette = edje_object_part_object_get(smi.o_texte, "textentryblock/mode/text");
      evas_object_hide(etiquette);
      
      if(smi.timerCursor){
	 ecore_timer_del(smi.timerCursor)
	 smi.timerCursor = null;
      }
      evas_object_hide(smi.o_curseur);
      
   }
   
}

function _evan_inputblock_hide(obj)
{
   var smi;
   
   smi = obj.data;
   if (!smi) return;
   
   evas_object_hide(smi.o_texte);
   evas_object_hide(smi.o_curseur);
}

function _evan_inputblock_clip_set(obj, clip)
{
   var smi;
   
   smi = obj.data;
   if (!smi) return;
   evas_object_clip_set(smi.o_texte, clip);
}

function _evan_inputblock_clip_unset(obj)
{
   var smi;
   
   smi = obj.data;
   if (!smi) return;
   evas_object_clip_unset(smi.o_texte);
}

function _evan_inputblock_color_set(obj, r, g, b, a)
{
   var smi;
   
   smi = obj.data;
   if (!smi) return;
   
   evas_object_color_set(smi.o_texte, r, g, b, a);
   
}

function _evan_inputblock_member_add(obj, obj2)
{
   ;
}

function _evan_inputblock_member_del(obj, obj2)
{
   ;
}


function _timer_touches_telephone(data)
{
   var smi;
   
   smi = data.data;
   if (!smi) return;
 
   smi.toucheEnCours.touche = -1;
   smi.toucheEnCours.indice = 0;
   smi.timerTouche = null;
   return 0;
}

function _timer_cursor(data)
{
   var smi;
   
   smi = data.data;
   if (!smi) return;

   if(!smi.cursorOn){
	 evas_object_show(smi.o_curseur);
   } else {
	 evas_object_hide(smi.o_curseur);
   }
   
   smi.cursorOn = !smi.cursorOn
   return 1;
}

function _insereCarac(obj, carac){
   var smi;
   
   smi = obj.data;
   if (!smi) return;

   text = edje_object_part_text_get(smi.o_texte, "textentryblock/text");
   evas_textblock_cursor_text_prepend(smi.cursor, carac);
   _updateCursor(obj);
}

function _effaceCarac(obj){
   var smi;
   
   smi = obj.data;
   if (!smi) return;

   text = edje_object_part_text_get(smi.o_texte, "textentryblock/text");
   
   if(evas_textblock_cursor_pos_get(smi.cursor) > 0){
   evas_textblock_cursor_char_prev(smi.cursor);
   evas_textblock_cursor_char_delete(smi.cursor);
   
   _updateCursor(obj);
   }
}

function _updateCursor(obj){
   var smi;
   
   smi = obj.data;
   if (!smi) return;

   
   if(smi.timerCursor){
      ecore_timer_del(smi.timerCursor);
      smi.timerCursor = null;
      }

   text = edje_object_part_text_get(smi.o_texte, "textentryblock/text");
      
   geom = evas_object_geometry_get(smi.o_texte);   
   geomL = evas_textblock_cursor_line_geometry_get(smi.cursor);
   
   edje_text = edje_object_part_object_get(smi.o_texte, "textentryblock/text"); 
   var geomC;
        
   if(evas_textblock_cursor_pos_get(smi.cursor) > 0){
	 evas_textblock_cursor_char_prev(smi.cursor);
	 geomC = evas_textblock_cursor_char_geometry_get(smi.cursor);
	 evas_textblock_cursor_char_next(smi.cursor);
   } else {
      geomC = {cx:1, cy:0, ch:geomL.ch, cw:0};
   }
   
   if(geomC) {
      evas_object_resize(smi.o_curseur, 1, geomL.ch);
      evas_object_move(smi.o_curseur, geom.x+geomC.cx+geomC.cw-1, geom.y+geomC.cy+0.05*geomL.ch);
   } else
      evas_object_move(smi.o_curseur, geom.x+1, geom.y+0.05*geom.h);  
   smi.cursorOn = true;
   evas_object_show(smi.o_curseur);
   
   smi.timerCursor = ecore_timer_add(0.5, _timer_cursor, obj);
}

function _actionClavierTelephone(obj, t)
{
   var smi;
   
   smi = obj.data;
   if (!smi) return;


	 if(smi.toucheEnCours.touche!=t && smi.toucheEnCours.touche >= 0 && smi.timerTouche) {
	 	 
	 ecore_timer_del(smi.timerTouche);
	 smi.timerTouche = null;
      }
      if(!smi.timerTouche){
	 smi.toucheEnCours.indice = 0;
	 smi.toucheEnCours.touche = t;
	 	 
	 _insereCarac(obj, smi.touchesTelephone[smi.toucheEnCours.touche][smi.toucheEnCours.indice]);
	 smi.timerTouche = ecore_timer_add(0.7, _timer_touches_telephone, obj);
	 }
      else {
	 smi.toucheEnCours.indice = (smi.toucheEnCours.indice+1) % smi.touchesTelephone[smi.toucheEnCours.touche].length;
	 	 
	 _effaceCarac(obj);
	 
	 _insereCarac(obj, smi.touchesTelephone[smi.toucheEnCours.touche][smi.toucheEnCours.indice])
	 	 
	 ecore_timer_delay(smi.timerTouche, 0.7 - ecore_timer_pending_get(smi.timerTouche));
	 }
}


function _key_down_cb_inputblock(data, e, obj, event)
{
   var smi;
   smi = data.data;
   
   if (!smi) return;
   
   var evas = evas_object_evas_get(obj);
    evas_event_freeze(evas);

   if (smi.timestamp == event.timestamp){
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
	 ecore_idler_del(smi.key_cleanup_cb);
         smi.key_cleanup_cb = null;
         if (smi.key_count++ < 4)
           {
              evas_event_thaw(evas);
              return ;
           }
     }
   }
   
switch (event.keyname)
     {
      case "Green":
      case "Select":
      case "KP_Enter":
      case "Return":
      case "RC/Ok":
	 if(smi.validationCB)
	    smi.validationCB(evan_inputblock_object_text_get(data), e, obj);
	    break;
      case "KP_Home" :
      case "7" :
	 _actionClavierTelephone(data, 7);
	 break;
      case "KP_Up" :
      case "8":	
	 _actionClavierTelephone(data, 8);
	 break;
      case "KP_Prior" :
      case "9" :
	 _actionClavierTelephone(data, 9);
	 break;
      case "KP_Left" :
      case "4" :
	 _actionClavierTelephone(data, 4);
	 break;
      case "KP_Begin" :
      case "5" :
	 _actionClavierTelephone(data, 5);
	 break;
      case "KP_Right" :
      case "6":
	 _actionClavierTelephone(data, 6);
	 break;
      case "KP_End" :
      case "1" :
	 _actionClavierTelephone(data, 1);
	 break;
      case "KP_Down" :
      case "2":
	 _actionClavierTelephone(data, 2);
	 break;
      case "KP_Next" :
      case "3":
	 _actionClavierTelephone(data, 3);
	 break;
      case "KP_Insert" :
      case "0":
	 _actionClavierTelephone(data, 0);
	 break;
      case "BackSpace":
      	 _effaceCarac(data);
	 break;
      case "Left":
      case "FP/Left":
      case "RC/Left":
	    
	 if(smi.timerTouche) {
	 ecore_timer_del(smi.timerTouche);
	 smi.timerTouche = null;
	 } else {
	 moveCursorLeft(data);
	 }
	    break;
      case "Right":
      case "FP/Right":
      case "RC/Right":
	    if(smi.timerTouche) {
	 ecore_timer_del(smi.timerTouche);
	 smi.timerTouche = null;
	 } else {
	 moveCursorRight(data);
	 }
	    break;
   }
   
   evas_event_thaw(evas);
}

function _appuiToucheClavier(data, e, obj, event)
{
   var smi;
   var carac = event;
   
   smi = data.data;
   if (!smi) return;
    
   	  if(carac == "\b")
	  _effaceCarac(data);
	  else if(carac == "!GOLEFT"){
	    if(smi.timerTouche) {
	    ecore_timer_del(smi.timerTouche);
	    smi.timerTouche = null;
	    } else {
	    moveCursorLeft(data);
	   }
	 }
	 else if(carac == "!GORIGHT"){
	    if(smi.timerTouche) {
	    ecore_timer_del(smi.timerTouche);
	    smi.timerTouche = null;
	    } else {
	    moveCursorRight(data);
	    }
	 }
	 else if(carac == "Ok"){
	    if(smi.validationCB)
	    smi.validationCB(evan_inputblock_object_text_get(data), e, obj);
	 }
	 else if(carac != "\t")
	  _insereCarac(data, carac);
}

function moveCursorLeft(obj)
{
   var smi;
   smi = obj.data;
   
   if (!smi) return;

   text = edje_object_part_text_get(smi.o_texte, "textentryblock/text");
   
   if(evas_textblock_cursor_pos_get(smi.cursor) == 0) {
      evas_textblock_cursor_pos_set(smi.cursor, text.length-1);
   } else {
      evas_textblock_cursor_char_prev(smi.cursor);
   }
      _updateCursor(obj);
}

function moveCursorRight(obj)
{
   var smi;
   smi = obj.data;
   
   if (!smi) return;

   text = edje_object_part_text_get(smi.o_texte, "textentryblock/text");
   
   if(evas_textblock_cursor_pos_get(smi.cursor) == text.length-1) {
      evas_textblock_cursor_pos_set(smi.cursor, 0);
   } else {
      evas_textblock_cursor_char_next(smi.cursor);
   }
      _updateCursor(obj);
}

function evan_inputblock_object_input_mode_set(obj, mode)
{
   var smi;
   smi = obj.data;
   
   if (!smi) return;
   
if(mode != "azer" && smi.smartClavier && evas_object_visible_get(smi.smartClavier)){
      evas_object_event_callback_del(smi.smartClavier, EVAS_CALLBACK_FOCUS_OUT, _evan_inputblock_cb_smartClavier_lose_focus, obj);
      evas_object_hide(smi.smartClavier);
      evan_keyboard_object_callback_del(smi.smartClavier);
      evas_object_focus_set(obj, 1);
      evas_object_event_callback_add(obj, EVAS_CALLBACK_FOCUS_OUT, _evan_inputblock_lose_focus, obj);
   }

if(mode == "azer" && !smi.smartClavier) return;

   switch(mode){
      case "abc":
	 edje_object_part_text_set(smi.o_texte, "textentryblock/mode/text", mode);
	 smi.currentMode = 0;
	 smi.touchesTelephone[0] = new Array(" ", "0");
	 smi.touchesTelephone[1] = new Array(".", ",", "?", "!", "'", "\"", "1", "-", "(", ")", "@", "/", ":", "_");
	 smi.touchesTelephone[2] = new Array("a", "b", "c", "2", "â", "ç");
	 smi.touchesTelephone[3] = new Array("d", "e", "f", "3", "é", "è", "ê", "ë");
	 smi.touchesTelephone[4] = new Array("g", "h", "i", "4", "ï", "î");
	 smi.touchesTelephone[5] = new Array("j", "k", "l", "5");
	 smi.touchesTelephone[6] = new Array("m", "n", "o", "6", "ô", "ö");
	 smi.touchesTelephone[7] = new Array("p", "q", "r", "s", "7", "$");
	 smi.touchesTelephone[8] = new Array("t", "u", "v", "8", "û", "ü");
	 smi.touchesTelephone[9] = new Array("w", "x", "y", "z", "9");
	 break;
      case "ABC":
	 edje_object_part_text_set(smi.o_texte, "textentryblock/mode/text", mode);
	 smi.currentMode = 1;
	 smi.touchesTelephone[0] = new Array(" ", "0");
	 smi.touchesTelephone[1] = new Array(".", ",", "?", "!", "'", "\"", "1", "-", "(", ")", "@", "/", ":", "_");
	 smi.touchesTelephone[2] = new Array("A", "B", "C", "2", "Â", "Ç");
	 smi.touchesTelephone[3] = new Array("D", "E", "F", "3", "É", "È", "Ê", "Ë");
	 smi.touchesTelephone[4] = new Array("G", "H", "I", "4", "Ï", "Î");
	 smi.touchesTelephone[5] = new Array("J", "K", "L", "5");
	 smi.touchesTelephone[6] = new Array("M", "N", "O", "6", "Ô", "Ö");
	 smi.touchesTelephone[7] = new Array("P", "Q", "R", "S", "7", "$");
	 smi.touchesTelephone[8] = new Array("T", "U", "V", "8", "Û", "Ü");
	 smi.touchesTelephone[9] = new Array("W", "X", "Y", "Z", "9");
	 break;
      case "123":
	 edje_object_part_text_set(smi.o_texte, "textentryblock/mode/text", mode);
	 smi.currentMode = 2;
	 smi.touchesTelephone[0] = new Array("0");
	 smi.touchesTelephone[1] = new Array("1");
	 smi.touchesTelephone[2] = new Array("2");
	 smi.touchesTelephone[3] = new Array("3");
	 smi.touchesTelephone[4] = new Array("4");
	 smi.touchesTelephone[5] = new Array("5");
	 smi.touchesTelephone[6] = new Array("6");
	 smi.touchesTelephone[7] = new Array("7");
	 smi.touchesTelephone[8] = new Array("8");
	 smi.touchesTelephone[9] = new Array("9");
	 break;
      case "azer":
	 edje_object_part_text_set(smi.o_texte, "textentryblock/mode/text", "Clav.");
      	 smi.currentMode = 3;
	 evas_object_event_callback_del(obj, EVAS_CALLBACK_FOCUS_OUT, _evan_inputblock_lose_focus, obj);
	 
	 evas_object_show(smi.smartClavier);
      	 evas_object_focus_set(smi.smartClavier, 1);

	 evan_keyboard_object_callback_set(smi.smartClavier, _appuiToucheClavier, obj);
	 evas_object_event_callback_add(smi.smartClavier, EVAS_CALLBACK_FOCUS_OUT, _evan_inputblock_cb_smartClavier_lose_focus, obj);
	 
	 break;
   }
}

function evan_inputblock_object_callback_set(obj, cb)
{
   var smi;
   smi = obj.data;
   
   if (!smi) return;
   
   smi.validationCB = cb;
}

function evan_inputblock_object_keyboard_add(obj, keyb)
{
   var smi;
   smi = obj.data;
   
   if (!smi) return;
   
   smi.smartClavier = keyb;
   smi.modes.push("azer");
}

function evan_inputblock_object_text_set(obj, text)
{
  var smi;
   smi = obj.data;
   
   if (!smi) return;
   if (text == undefined) return ;
   
   edje_object_part_text_set(smi.o_texte, "textentryblock/text", text + " ");
   evas_textblock_cursor_pos_set(smi.cursor, 0);
   moveCursorLeft(obj);
}

function evan_inputblock_object_text_get(obj)
{
  var smi;
   smi = obj.data;
   
   if (!smi) return;
   texte =edje_object_part_text_get(smi.o_texte, "textentryblock/text"); 
   return texte.substr(0, texte.length-1);
}

function evan_inputblock_style_set(obj, styleText)
{
 var smi;
   smi = obj.data;
   
   if (!smi) return;
   tb = edje_object_part_object_get(smi.o_texte, "textentryblock/text");
   style = evas_object_textblock_style_get(tb);
   pos = evas_textblock_cursor_pos_get(smi.cursor);
   evas_textblock_style_set(style, styleText);
   evas_textblock_cursor_pos_set(smi.cursor, pos)
   _updateCursor(obj);
}

function evan_inputblock_style_get(obj)
{
 var smi;
   smi = obj.data;
   
   if (!smi) return;
   tb = edje_object_part_object_get(smi.o_texte, "textentryblock/text");
   style = evas_object_textblock_style_get(tb);
   return evas_textblock_style_get(style);
}

function evan_inputblock_object_change_mode_key_set(obj, key)
{
  var smi;
   smi = obj.data;
   
   if (!smi) return;
   
   if(smi.gotFocus)
   for(i=0; i<smi.changeModeKeys.length ; i++)
         evas_object_key_ungrab(obj, smi.changeModeKeys[i], 0, 0);


   smi.changeModeKeys = key.split(',');
   
   if(smi.gotFocus)
      for(i=0; i<smi.changeModeKeys.length ; i++)
         evas_object_key_grab(obj, smi.changeModeKeys[i], 0, 0, 0); 
}

true;
