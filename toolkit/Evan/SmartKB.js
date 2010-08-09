var E_OBJ_NAME = "evan_keyboard"
var smartKB = null;

function evan_keyboard_object_add(evas)
{
   if(!smartKB)  _evan_keyboard_init();
   return evas_object_smart_add(evas, smartKB);
   
}


function _evan_keyboard_init()
{
   var sc=
   {
      name: "evan_keyboard",
      version: 4,
      add: _evan_keyboard_add,
      del: _evan_keyboard_del,
      move: _evan_keyboard_move,
      resize: _evan_keyboard_resize,
      show: _evan_keyboard_show,
      hide: _evan_keyboard_hide,
      color_set: _evan_keyboard_color_set,
      clip_set: _evan_keyboard_clip_set,
      clip_unset: _evan_keyboard_clip_unset,
      calculate: _evan_keyboard_calculate,
      member_add: _evan_keyboard_member_add,
      member_del: _evan_keyboard_member_del,
      data: null
   };
   smartKB = evas_smart_class_new(sc);
}

function _evan_keyboard_add(obj)
{
   var sd = {};

   obj.data = sd;
   
   var evas = evas_object_evas_get(obj);
   
   
   sd.o_clavier = edje_object_add(evas);
   edje_object_file_set(sd.o_clavier , "evan.edj", "clavier");
   evas_object_smart_member_add(sd.o_clavier, obj);
   
   sd.verrouMajuscule = false;
   sd.majuscule = false;
   sd.current = {};
   
   sd.alt = false;
   nLignesClavier = 5;

   sd.clavierMin = new Array(nLignesClavier);
   sd.clavierMaj = new Array(nLignesClavier);
   sd.clavierAlt = new Array(nLignesClavier);
   
    sd.clavierMin[0] = new Array("1", "2","3","4","5","6","7","8","9","0");
    sd.clavierMaj[0] = sd.clavierMin[0];
    sd.clavierAlt[0] = new Array("&","é","\"","'","(","-","è","_","ç","à");
    
    sd.clavierMin[1] = new Array("a","z","e","r","t","y","u","i","o","p");
    sd.clavierMaj[1] = new Array("A","Z","E","R","T","Y","U","I","O","P");
    sd.clavierAlt[1] = new Array(")","=","+","*","µ","°","@","²","$","£");
    
    sd.clavierMin[2] = new Array("q","s","d","f","g","h","j","k","l","m");
    sd.clavierMaj[2] = new Array("Q","S","D","F","G","H","J","K","L","M");
    sd.clavierAlt[2] = new Array("","","","","","","","","","");
    
    sd.clavierMin[3] = new Array("w","x","c","v","b","n",",",".",":","/");
    sd.clavierMaj[3] = new Array("W","X","C","V","B","N","?",";","!","%");
    sd.clavierAlt[3] = new Array("","","","","ù","%","?",";","§","!");
    
    sd.clavierMin[4] = new Array("MAJ","Espace");
    sd.clavierAlt[4] = sd.clavierMin[4];
    sd.clavierMaj[4] = sd.clavierMin[4];
    
    sd.clavierRatioW = new Array(nLignesClavier);
    sd.clavierRatioW[0] = new Array(1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
    sd.clavierRatioW[1] = new Array(1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
    sd.clavierRatioW[2] = new Array(1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
    sd.clavierRatioW[3] = new Array(1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
    sd.clavierRatioW[4] = new Array(2, 8);
    
sd.lignes = new Array();
    sd.touches = new Array();
    
   for(i=0; i<nLignesClavier; i++){
      sd.lignes[i] =  edje_object_add(evas);
      evas_object_smart_member_add(sd.lignes[i], obj);
      edje_object_file_set(sd.lignes[i] , "evan.edj", "ligneD");
      sd.touches[i] = new Array(sd.clavierMin[i].length);
      
      for(j=0;j<sd.clavierMin[i].length ; j++){
	 
	 sd.touches[i][j] = edje_object_add(evas);
	 evas_object_smart_member_add(sd.touches[i][j], obj);
	 if(sd.clavierMin[i][j] == "MAJ")
	    edje_object_file_set(sd.touches[i][j], "evan.edj", "toucheMaj");
	 else
	    edje_object_file_set(sd.touches[i][j], "evan.edj", "touche");
	    
	    
	 edje_object_part_text_set(sd.touches[i][j], "touche/text", sd.clavierMin[i][j]);
	 evas_object_show(sd.touches[i][j]);
	 edje_object_part_box_append(sd.lignes[i] , "clavier/ligne", sd.touches[i][j]);
      }
      edje_object_part_box_append(sd.o_clavier, "clavier/touches", sd.lignes[i]);
      evas_object_show(sd.lignes[i]);  
   }
   
   sd.lignesDroite = new Array();
   sd.touchesDroite = new Array();
   
   sd.lignesDroite[0] =  edje_object_add(evas);
   evas_object_smart_member_add(sd.lignesDroite[0], obj);
   edje_object_file_set(sd.lignesDroite[0] , "evan.edj", "ligneG");
   sd.touchesDroite[0] = new Array(2);
   
   sd.touchesDroite[0][0] = edje_object_add(evas);
   evas_object_smart_member_add(sd.touchesDroite[0][0], obj);
   edje_object_file_set(sd.touchesDroite[0][0], "evan.edj", "toucheFlecheG");
   edje_object_part_text_set(sd.touchesDroite[0][0], "touche/text", "!GOLEFT");
   evas_object_show(sd.touchesDroite[0][0]);
   edje_object_part_box_append(sd.lignesDroite[0] , "clavier/ligne", sd.touchesDroite[0][0]);
   
   sd.touchesDroite[0][1] = edje_object_add(evas);
   evas_object_smart_member_add(sd.touchesDroite[0][1], obj);
   edje_object_file_set(sd.touchesDroite[0][1], "evan.edj", "toucheFlecheD");
   edje_object_part_text_set(sd.touchesDroite[0][1], "touche/text", "!GORIGHT");
   evas_object_show(sd.touchesDroite[0][1]);
   edje_object_part_box_append(sd.lignesDroite[0] , "clavier/ligne", sd.touchesDroite[0][1]);
   
   edje_object_part_box_append(sd.o_clavier, "clavier/touchesDroite", sd.lignesDroite[0]);
   evas_object_show(sd.lignesDroite[0]);
   
   sd.lignesDroite[1] =  edje_object_add(evas);
   evas_object_smart_member_add(sd.lignesDroite[1], obj);
   edje_object_file_set(sd.lignesDroite[1] , "evan.edj", "ligneG");
   sd.touchesDroite[1] = new Array(1);
   
   sd.touchesDroite[1][0] = edje_object_add(evas);
   evas_object_smart_member_add(sd.touchesDroite[1][0], obj);
   edje_object_file_set(sd.touchesDroite[1][0], "evan.edj", "grosseTouche");
   edje_object_part_text_set(sd.touchesDroite[1][0], "touche/text", "&$#!");
   evas_object_show(sd.touchesDroite[1][0]);
   edje_object_part_box_append(sd.lignesDroite[1] , "clavier/ligne", sd.touchesDroite[1][0]);
   
   edje_object_part_box_append(sd.o_clavier, "clavier/touchesDroite", sd.lignesDroite[1]);
   evas_object_show(sd.lignesDroite[1]);
   
   sd.lignesDroite[2] =  edje_object_add(evas);
   evas_object_smart_member_add(sd.lignesDroite[2], obj);
   edje_object_file_set(sd.lignesDroite[2] , "evan.edj", "ligneG");
   sd.touchesDroite[2] = new Array(1);
   
   sd.touchesDroite[2][0] = edje_object_add(evas);
   evas_object_smart_member_add(sd.touchesDroite[2][0], obj);
   edje_object_file_set(sd.touchesDroite[2][0], "evan.edj", "grosseTouche");
   edje_object_part_text_set(sd.touchesDroite[2][0], "touche/text", "Suppr.");
   evas_object_text_font_set(sd.touchesDroite[2][0], "Vera", 10);
   evas_object_show(sd.touchesDroite[2][0]);
   edje_object_part_box_append(sd.lignesDroite[2] , "clavier/ligne", sd.touchesDroite[2][0]);
   
   edje_object_part_box_append(sd.o_clavier, "clavier/touchesDroite", sd.lignesDroite[2]);
   evas_object_show(sd.lignesDroite[2]);
   
   sd.lignesDroite[3] =  edje_object_add(evas);
   evas_object_smart_member_add(sd.lignesDroite[3], obj);
   edje_object_file_set(sd.lignesDroite[3] , "evan.edj", "ligneG");
   sd.touchesDroite[3] = new Array(1);
   
   sd.touchesDroite[3][0] = edje_object_add(evas);
   evas_object_smart_member_add(sd.touchesDroite[3][0], obj);
   edje_object_file_set(sd.touchesDroite[3][0], "evan.edj", "grosseTouche");
   edje_object_part_text_set(sd.touchesDroite[3][0], "touche/text", "Ok");
   evas_object_text_font_set(sd.touchesDroite[3][0], "Vera", 10);
   evas_object_show(sd.touchesDroite[3][0]);
   edje_object_part_box_append(sd.lignesDroite[3] , "clavier/ligne", sd.touchesDroite[3][0]);
   
   edje_object_part_box_append(sd.o_clavier, "clavier/touchesDroite", sd.lignesDroite[3]);
   evas_object_show(sd.lignesDroite[3]);

   sd.current.i = 0;
   sd.current.j = 0;
   sd.currentZone = "G";

   sd.timestamp = null;
   sd.key_cleanup_cb = null;
   sd.key_count = 0;
   
   sd.clickCB = _clickCB_dummy;
   
   evas_object_event_callback_add(obj, EVAS_CALLBACK_KEY_DOWN, _evan_keyboard_key_down_cb, obj);
   evas_object_event_callback_add(obj, EVAS_CALLBACK_KEY_UP, _evan_keyboard_key_up_cb, obj);
   
   evas_object_smart_need_recalculate_set(obj, 1);  
   
   edje_object_signal_emit(sd.touches[0][0], "mouse,in", "touche/bg");
}

function _anti_rebond_keyboard_cb_idle(obj)
{
   var sd;
   sd = obj.data;

   sd.key_count = 0;
   sd.key_cleanup_cb = null;
   return 0;
}

function _evan_keyboard_del(obj)
{
   var sd;
   sd = obj.data;
   
   if (!sd) return;
   evas_object_event_callback_del(obj, EVAS_CALLBACK_KEY_DOWN, _evan_keyboard_key_down_cb, obj);
   evas_object_event_callback_del(obj, EVAS_CALLBACK_KEY_UP, _evan_keyboard_key_up_cb, obj);
   
   for(i= 0; i<sd.touches.length; i++){
       edje_object_part_box_remove_all(sd.lignes[i], "clavier/ligne", 1);
   }
   edje_object_part_box_remove_all(sd.o_clavier, "clavier/touches", 1);
   
   evas_object_del(sd.o_clavier);
   sd = null;

}

function _evan_keyboard_move(obj, x, y)
{
   var sd;
   sd = obj.data;
   
   if (!sd) return;
   
   evas_object_move(sd.o_clavier, x, y);
}

function _evan_keyboard_resize(obj, w, h)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   evas_object_resize(sd.o_clavier, w, h);
   evas_object_smart_need_recalculate_set(obj, 1);  
}

function _evan_keyboard_calculate(obj)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   
   geomClavier = evas_object_geometry_get(sd.o_clavier);
      
   hmax = (geomClavier.h*0.7-6)/5;
   wmax = geomClavier.w*.6;
   
   for(i=0; i<5; i++){
      w = 0;
      for(j=0; j<sd.clavierRatioW[i].length; j++)
	    w += sd.clavierRatioW[i][j];
   
   wmax = Math.min(wmax, (geomClavier.w*0.8-12-(sd.clavierRatioW[i].length+1))/w);
   }
   
   taille = Math.min(hmax, wmax);
   for(i=0; i<5; i++){
      for(j=0; j<sd.touches[i].length; j++)
	 evas_object_resize(sd.touches[i][j], taille*sd.clavierRatioW[i][j], taille);
      evas_object_resize(sd.lignes[i], geomClavier.w*0.8, taille);
   }
   
   sd.taille = taille;
   
   evas_object_resize(sd.lignesDroite[0], geomClavier.w*0.2, taille);
   evas_object_resize(sd.lignesDroite[1], geomClavier.w*0.2, taille);
   evas_object_resize(sd.lignesDroite[2], geomClavier.w*0.2, taille);
   evas_object_resize(sd.lignesDroite[3], geomClavier.w*0.2, 2*taille);
   evas_object_resize(sd.touchesDroite[0][0], taille, taille);
   evas_object_resize(sd.touchesDroite[0][1], taille, taille);
   evas_object_resize(sd.touchesDroite[1][0], 2*taille+1, taille);
   evas_object_resize(sd.touchesDroite[2][0], 2*taille+1, taille);
   evas_object_resize(sd.touchesDroite[3][0], 2*taille+1, 2*taille);
}

function _evan_keyboard_show(obj)
{
   var sd;
   sd = obj.data;
    
   if (!sd) return;
   evas_object_show(sd.o_clavier);
   edje_object_signal_emit(sd.o_clavier, "clavier_show_up", "");
   _moveTo(obj, sd.current.i, sd.current.j, sd.currentZone);
}

function _evan_keyboard_hide(obj)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   
   edje_object_signal_emit(sd.o_clavier, "clavier_hide_down", "");
//    evas_object_hide(sd.o_clavier);
}

function _evan_keyboard_clip_set(obj, clip)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   evas_object_clip_set(sd.o_clavier, clip);
}

function _evan_keyboard_clip_unset(obj)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   evas_object_clip_unset(sd.o_clavier);
}

function _evan_keyboard_color_set(obj, r, g, b, a)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   
//    evas_object_color_set(sd.o_clavier, r, g, b, a);
   
}

function _evan_keyboard_member_add(obj, obj2)
{
   ;
}

function _evan_keyboard_member_del(obj, obj2)
{
   ;
}


function _actualiserClavier(obj){
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   
   if(sd.majuscule && !sd.alt)
      data = sd.clavierMaj;
   else
      data = sd.clavierMin;

   if(sd.alt)
      data = sd.clavierAlt;

if(sd.majuscule)
     edje_object_file_set(sd.touches[4][0], "evan.edj", "toucheMajSelec");
else
     edje_object_file_set(sd.touches[4][0], "evan.edj", "toucheMaj");

for(i=0; i<sd.touches.length; i++){
   for(j=0;j<sd.touches[i].length ; j++){
	 edje_object_part_text_set(sd.touches[i][j], "touche/text", data[i][j]);
   }
}
}

function _moveTo(obj, i, j, zone){
    var sd;
  
   sd = obj.data;
   if (!sd) return;

   if(zone == "G")
      touche = sd.touches[i][j];
   else {
      touche = sd.touchesDroite[i][j];

   }
   
   if(sd.currentZone == "G"){
      edje_object_signal_emit(sd.touches[sd.current.i][sd.current.j], "mouse,out", "touche/bg");
   } else {
      edje_object_signal_emit(sd.touchesDroite[sd.current.i][sd.current.j], "mouse,out", "touche/bg");
   }

   edje_object_signal_emit(touche, "mouse,in", "touche/bg");



   sd.current.i = i;
   sd.current.j = j;
   sd.currentZone = zone;
}

function _findTouche(obj, carac){
 var sd;
  
   sd = obj.data;
   if (!sd) return;
   
   bindings = new Array("twosuperior", "ampersand", "eacute", "quotedbl", "apostrophe", "parenleft", 
			"minus", "egrave", "underscore", "ccedilla", "agrave", "parenright", "equal", 
			"asterisk", "dollar", "ugrave", "exclam", "colon", "semicolon", "comma", "less");
   correspondances = new Array("²", "&", "é", "\"", "'", "(", "-", "è", "_", "ç", "à", ")", "=", "*", "$", "ù", "!", ":", ";", ",", "<");   
   
   for(i=0; i<bindings.length;i++){
      if(carac == bindings[i])
	 return _findTouche(obj, correspondances[i]);
   }
      
for(i=0; i<sd.touches.length; i++){
   for(j=0;j<sd.touches[0].length ; j++){
	 if(sd.clavierMin[i][j] == carac || sd.clavierMaj[i][j] == carac)
	    return {i:i, j:j, zone:"G"};
   }
}

if(carac == "BackSpace") return {i:2, j:0, zone:"D"}
if(carac == "*") return {i:1, j:0, zone:"D"}

return null;
}

function _actualiserMajuscules(obj){
var sd = obj.data;
   if (!sd) return;
   
   if(sd.alt) {
      sd.alt=false;
      _actualiserClavier(obj);
      return;
   }
   
   if(!sd.verrouMajuscule && sd.majuscule){
      sd.majuscule = false;
      _actualiserClavier(obj);
   } else if(sd.verrouMajuscule && !sd.majuscule){
      sd.majuscule = true;
      _actualiserClavier(obj);
   }
}

function _evan_keyboard_key_down_cb(data, e, touche, event)
{

   obj = data;
   sd = obj.data;
   if (!sd) return;
   
   if(sd.currentZone == "G")
      touche = sd.touches[sd.current.i][sd.current.j];
   else
      touche = sd.touchesDroite[sd.current.i][sd.current.j];
   
   var evas = evas_object_evas_get(obj);


 evas_event_freeze(evas);

   if (sd.timestamp == event.timestamp){
    switch (event.keyname) {
      case "Home":
      case "Escape":
      case "Start":
      case "Stop":
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

switch (event.keyname)
     {
      case "Green":
      case "Select":
      case "KP_Enter":
      case "Return":
      case "RC/Ok":		 
	texteTouche = edje_object_part_text_get(touche, "touche/text");
	 
	 switch (texteTouche) {
	    case "VMAJ":
	       sd.verrouMajuscule = !sd.verrouMajuscule;
	       sd.majuscule = sd.verrouMajuscule;
	       _actualiserClavier(obj);
	       position = _findTouche(obj, "VMAJ");
	       if(position != null)
	       _moveTo(obj, position.i, position.j, position.zone);
	       break;
	    case "MAJ":
	       sd.majuscule = !sd.majuscule;
	       _actualiserClavier(obj);
	       position = _findTouche(obj, "MAJ");
	       if(position != null)
	       _moveTo(obj, position.i, position.j, position.zone);
	       break;
	    case "&$#!":
	       sd.alt = !sd.alt;
	       _actualiserClavier(obj);
	       break;
	    case "Ctrl":
	    case "Alt":
	    case "Alt-Gr":
	       break;
	    case "TAB":
	       sd.clickCB(sd.clickCBdata, evas, touche, "\t");
	       break;
	    case "<-":
	    case "Suppr.":
	       sd.clickCB(sd.clickCBdata, evas, touche, "\b");
	       break;
	    case "Espace":
	       sd.clickCB(sd.clickCBdata, evas, touche, " ");
	       break;
	    default :
	    	 sd.clickCB(sd.clickCBdata, evas, touche, edje_object_part_text_get(touche, "touche/text"));
		 _actualiserMajuscules(obj);
	 }
	 break;
	 
      case "Caps_Lock":
	 sd.verrouMajuscule = !sd.verrouMajuscule;
	 sd.majuscule = sd.verrouMajuscule;
	 _actualiserClavier(obj);
	 position = _findTouche(obj, "VMAJ");
	 if(position != null)
	    _moveTo(obj, position.i, position.j, position.zone);
	 break;
      case "Shift_L":
      case "Shift_R":
	 sd.majuscule = !sd.majuscule;
	 _actualiserClavier(obj);
	 position = _findTouche(obj, "MAJ");
	if(position != null)
	    _moveTo(obj, position.i, position.j, position.zone);
	 
	 break;
      case "BackSpace":
	 position = _findTouche(obj, "BackSpace");
	 if(position != null)
	    _moveTo(obj, position.i, position.j, position.zone);
	 sd.clickCB(sd.clickCBdata, evas, sd.touches[position.i][position.j], "\b");
	 _actualiserMajuscules(obj)
	 break;
      case "Tab":
	 position = _findTouche(obj, "TAB");
	 if(position != null){
	    _moveTo(obj, position.i, position.j, position.zone);
	    sd.clickCB(sd.clickCBdata, evas, sd.touches[position.i][position.j], "\t");
	    }
	    _actualiserMajuscules(obj)
	    break;
      case "Up":
      case "FP/Up":
      case "RC/Up":
	    if(sd.current.i > 0 &&  sd.currentZone == "G"){
	    _moveTo(obj, sd.current.i-1, Math.min(sd.touches[sd.current.i-1].length-1,sd.current.j), sd.currentZone);
	    } else if(sd.current.i > 0 &&  sd.currentZone == "D"){
	    _moveTo(obj, sd.current.i-1, Math.min(sd.touchesDroite[sd.current.i-1].length-1,sd.current.j), sd.currentZone);
	    }
	    break;
      case "Down":
      case "FP/Down":
      case "RC/Down":
	    if(sd.current.i < sd.touches.length-1 && sd.currentZone == "G"){
	    _moveTo(obj, sd.current.i+1, Math.min(sd.touches[sd.current.i+1].length-1,sd.current.j), sd.currentZone);
	    } else if(sd.current.i < sd.touchesDroite.length-1 && sd.currentZone == "D"){
	    _moveTo(obj, sd.current.i+1, Math.min(sd.touchesDroite[sd.current.i+1].length-1,sd.current.j), sd.currentZone);
	    }
	    break;
      case "Left":
      case "FP/Left":
      case "RC/Left":
	    if(sd.current.j > 0){
	    _moveTo(obj, sd.current.i,sd.current.j-1, sd.currentZone);
	    } else if(sd.current.j == 0 && sd.currentZone =="D") {
	    	switch(sd.current.i){
		  case 0:
		  case 1:
		  case 2:
		     _moveTo(obj, sd.current.i,sd.touches[sd.current.i].length-1, "G");
		     break;
		  case 3:
		     _moveTo(obj, sd.current.i+1,sd.touches[sd.current.i+1].length-1, "G");
		     break;
		 }
	    }
	    break;
      case "Right":
      case "FP/Right":
      case "RC/Right":
	    if(( sd.currentZone=="G" && sd.current.j < sd.touches[sd.current.i].length-1) || ( sd.currentZone=="D" && sd.current.j < sd.touchesDroite[sd.current.i].length-1)){
	    _moveTo(obj, sd.current.i,sd.current.j+1, sd.currentZone);
	    } else if (sd.currentZone == "G" && sd.current.j == sd.clavierMin[sd.current.i].length-1) {
	       switch(sd.current.i){
		  case 0:
		  case 1:
		  case 2:
		     _moveTo(obj, sd.current.i,0, "D");
		     break;
		  case 3:
		  case 4:
		     _moveTo(obj, 3,0, "D");
		     break;
		     }
	    }
	    break;
      case "space":
      position = _findTouche(obj, "Espace");
	if(position != null)
	    _moveTo(obj, position.i, position.j, position.zone);
	 sd.clickCB(sd.clickCBdata, evas, sd.touches[position.i][position.j], " ");
	 _actualiserMajuscules(obj);
	 break;
      default :
	position = _findTouche(obj, event.keyname);
	if(position != null) {
	    _moveTo(obj, position.i, position.j, position.zone);
	    if(position.zone == "G")
	       sd.clickCB(sd.clickCBdata, evas, sd.touches[position.i][position.j], edje_object_part_text_get(sd.touches[position.i][position.j], "touche/text"));
	    else
	       sd.clickCB(sd.clickCBdata, evas, sd.touchesDroite[position.i][position.j], edje_object_part_text_get(sd.touchesDroite[position.i][position.j], "touche/text"));
	    }
	    _actualiserMajuscules(obj);
	 break;
   }
   
      evas_event_thaw(evas);
}

function _evan_keyboard_key_up_cb(data, e, obj, event)
{
  
   obj = data;
   sd = data.data;
   if (!sd) return;
  
   sd.timestamp = event.timestamp;
   if (!sd.key_cleanup_cb)
     sd.key_cleanup_cb = ecore_idler_add(_anti_rebond_keyboard_cb_idle, obj);
}

function _clickCB_dummy(data, evas, touche, text){
elx.print("Appui sur " + text+"\n");
}


function evan_keyboard_object_callback_set(obj, funCB, data)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   
   sd.clickCB = funCB;
   sd.clickCBdata = data;
}

function evan_keyboard_object_callback_del(obj)
{
   var sd;
   
   sd = obj.data;
   if (!sd) return;
   
   sd.clickCB = _clickCB_dummy;
   sd.clickCBdata = null;
}