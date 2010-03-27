var prefs_edje_o;
var prefs_evas;
var prefs_bg;
var prefs_editing, prefs_nb, prefs_pos, prefs_timer, prefs_last_ts, prefs_idler_t;
var prefs_come_back_cb;
var prefs_cur_name, prefs_maj_min, prefs_cur_l;
var prefs_sms = [
	       [ ' ', '-', '0' ],
	       [ '1' ],
	       [ '2', 'a', 'b', 'c' ],
	       [ '3', 'd', 'e', 'f' ],
	       [ '4', 'g', 'h', 'i' ],
	       [ '5', 'j', 'k', 'l' ],
	       [ '6', 'm', 'n', 'o' ],
	       [ '7', 'p', 'q', 'r', 's' ],
	       [ '8', 't', 'u', 'v' ],
	       [ '9', 'w', 'x', 'y', 'z' ],
	       ];

function prefs_handle_move(position)
{
  if (position > 6)
    position = 1;
  if (position < 1)
    position = 6;

  if (position && position < 5)
    edje_object_signal_emit(prefs_edje_o, "selecting", "host" + position);
  else if (position == 5)
    edje_object_signal_emit(prefs_edje_o, "selecting", "port");
  else if (position == 6)
    edje_object_signal_emit(prefs_edje_o, "selecting", "ok");

  prefs_timer = null;
  prefs_cur_l = "_";
  prefs_cur_name = "";
  prefs_nb = -1;
  prefs_pos = 0;
}

function on_hostN_select(n)
{
  prefs_editing = n;
}

function on_port_select()
{
  prefs_editing = 5;
}

function on_ok_select()
{
  prefs_editing = 6;
}

function pref_gen()
{
  var pref = { };
  pref.host1 = edje_object_part_text_get(prefs_edje_o, "host1").replace(/_+$/, '');
  pref.host2 = edje_object_part_text_get(prefs_edje_o, "host2").replace(/_+$/, '');
  pref.host3 = edje_object_part_text_get(prefs_edje_o, "host3").replace(/_+$/, '');
  pref.host4 = edje_object_part_text_get(prefs_edje_o, "host4").replace(/_+$/, '');
  pref.port = edje_object_part_text_get(prefs_edje_o, "port").replace(/_+$/, '');
  return pref;
}

function prefs_setup(position)
{
  app_state = State.PREFS;
  prefs_evas = evas;
  prefs_bg = bg;
  prefs_edje_o = edj_o;
  prefs_cur_name = "";
  prefs_pos = position;

  evas_object_event_callback_add(prefs_bg, EVAS_CALLBACK_KEY_DOWN, prefs_on_key_down,   null);
  evas_object_event_callback_add(prefs_bg, EVAS_CALLBACK_KEY_UP,   prefs_pre_on_key_up, null);

  prefs_edje_o = edje_object_add(prefs_evas);
  edje_object_file_set(prefs_edje_o, "MPD-client.edj", "prefs");
  evas_object_layer_set(prefs_edje_o, 0);
  evas_object_move(prefs_edje_o, 0, 0);
  evas_object_resize(prefs_edje_o, w, h);
  evas_object_show(prefs_edje_o);

  if (!db_init("MPD_client")) {
    elx.print("Could not init prefs\n");
    return false;
  }

  var prefs = db_load();
  edje_object_part_text_set(prefs_edje_o, "host1",  prefs[1].host1);
  edje_object_part_text_set(prefs_edje_o, "host2",  prefs[1].host2);
  edje_object_part_text_set(prefs_edje_o, "host3",  prefs[1].host3);
  edje_object_part_text_set(prefs_edje_o, "host4",  prefs[1].host4);
  edje_object_part_text_set(prefs_edje_o, "port",  prefs[1].port);
  edje_object_signal_emit(prefs_edje_o,   "show", "js");
  
  for (var i = 1; i < 5; i++)
    edje_object_signal_callback_add(prefs_edje_o, "selecting", "host" + i, on_hostN_select, i);

  edje_object_signal_callback_add(prefs_edje_o, "selecting", "port", on_port_select, null);
  edje_object_signal_callback_add(prefs_edje_o, "selecting", "ok", on_ok_select, null);

  if (prefs_pos) {
    prefs_timer = null;
    prefs_cur_l = "_";
    prefs_editing = prefs_pos;
    prefs_nb = -1;
    prefs_pos = 0;
    prefs_handle_move(prefs_pos);
    prefs_maj_min = false;
  } else
    prefs_editing = false;
}

function prefs_setdown()
{
  evas_object_event_callback_del(prefs_bg, EVAS_CALLBACK_KEY_DOWN, prefs_on_key_down, null);
  evas_object_event_callback_del(prefs_bg, EVAS_CALLBACK_KEY_UP, prefs_pre_on_key_up, null);
  for (var i = 1; i < 5; i++)
    edje_object_signal_callback_del(prefs_edje_o, "selecting", "host" + i, on_hostN_select);
  edje_object_signal_callback_del(prefs_edje_o, "selecting", "port", on_port_select);
  edje_object_signal_callback_del(prefs_edje_o, "selecting", "ok", on_ok_select);
  edje_object_signal_emit(prefs_edje_o, "hide", "js");
  evas_object_del(prefs_edje_o);
}

function set_letter_timeout()
{
    if (prefs_cur_l != '_') {
	prefs_cur_name += prefs_cur_l;
//	if (prefs_cur_l == ' ' || prefs_cur_l == '-')
//	    prefs_maj_min = true;
//	else
//	    prefs_maj_min = false;
    }

    if ((prefs_editing < 5 && prefs_cur_name.length < 3) || (prefs_editing == 5 && prefs_cur_name.length < 4))
	prefs_cur_l = '_';
    else
	prefs_cur_l = '';

    if (prefs_maj_min)
	prefs_nb = -1;
    else
	prefs_nb = -2;

    if (prefs_editing < 5)
      edje_object_part_text_set(prefs_edje_o, "host"  + prefs_editing, prefs_cur_name + prefs_cur_l);
    else if (prefs_editing == 5)
      edje_object_part_text_set(prefs_edje_o, "port", prefs_cur_name + prefs_cur_l);
      

    prefs_timer = null;
    return 0;
}

function set_letter(letter)
{
    var nb = 1;
    var nb_pos = letter.search(/\d$/);
    nb = letter.substring(nb_pos);
    
    if (prefs_timer) {
	ecore_timer_del(prefs_timer);
	prefs_timer = null;
    }
    prefs_timer = ecore_timer_add(1, set_letter_timeout, null);

    if (nb == prefs_nb) {
	prefs_cur_l = prefs_sms[nb][++prefs_pos % prefs_sms[nb].length];
	if (prefs_maj_min)
	    prefs_cur_l = prefs_cur_l.toUpperCase();
    } else if ((prefs_editing < 5 && prefs_cur_name.length < 3) || (prefs_editing == 5 && prefs_cur_name.length < 4)) {
	if (prefs_cur_l != '_')
	    prefs_cur_name += prefs_cur_l;

        if ((prefs_editing < 5 && prefs_cur_name.length < 3) || (prefs_editing == 5 && prefs_cur_name.length < 4))
	    prefs_cur_l = prefs_sms[nb][0];
	else
	    prefs_cur_l = '';

	prefs_pos = 0;

//	if (prefs_nb == -1 || prefs_cur_name.substring(prefs_cur_name.length - 1).match(/-| |\d/))
//	    prefs_maj_min = true;
//	else
//	    prefs_maj_min = false;

	if (prefs_maj_min)
	    prefs_cur_l = prefs_cur_l.toUpperCase();

    } else {
	prefs_pos = 0;
    }
    
    prefs_nb = nb;

    if (prefs_editing < 5)
      edje_object_part_text_set(prefs_edje_o, "host"  + prefs_editing, prefs_cur_name + prefs_cur_l);
    else if (prefs_editing == 5)
      edje_object_part_text_set(prefs_edje_o, "port", prefs_cur_name + prefs_cur_l);
}

function prefs_on_key_up(keyname)
{
    prefs_idler_t = null;
    return 0;
}

function prefs_pre_on_key_up(data, e, obj, ev)
{
    prefs_last_ts = ev.timestamp;
    prefs_idler_t = ecore_idler_add(prefs_on_key_up, ev.keyname);
}

function translate(key)
{
    switch (key) {
    case "KP_Insert":
    case "agrave":
	return "0";
    case "KP_End":
    case "ampersand":
	return "1";
    case "KP_Down":
    case "eacute":
	return "2";
    case "KP_Next":
    case "quotedbl":
	return "3";
    case "KP_Left":
    case "apostrophe":
	return "4";
    case "KP_Begin":
    case "parenleft":
	return "5";
    case "KP_Right":
    case "minus":
	return "6";
    case "KP_Home":
    case "egrave":
	return "7";
    case "KP_Up":
    case "underscore":
	return "8";
    case "KP_Prior":
    case "ccedilla":
	return "9";
    default:
	return key;
    }
}

function prefs_on_key_down(data, e, obj, ev)
{
  if (ev.timestamp == prefs_last_ts) {
    if (prefs_idler_t) {
      ecore_idler_del(prefs_idler_t);
      prefs_idler_t = null;
    }
    return;
  }
  elx.print(ev.keyname + "\n");
  switch (ev.keyname) {
    case "Escape":
    case "b":
    case "q":
    case "Red":
    case "Home":
    prefs_setdown();
    ecore_main_loop_quit();
    break;
    case "KP1":
    case "1":
    case "KP2":
    case "2":
    case "KP3":
    case "3":
    case "KP4":
    case "4":
    case "KP5":
    case "5":
    case "KP6":
    case "6":
    case "KP7":
    case "7":
    case "KP8":
    case "8":
    case "KP9":
    case "9":
    case "KP0":
    case "0":
    case "KP_Insert":
    case "agrave":
    case "KP_End":
    case "ampersand":
    case "KP_Down":
    case "eacute":
    case "KP_Next":
    case "quotedbl":
    case "KP_Left":
    case "apostrophe":
    case "KP_Begin":
    case "parenleft":
    case "KP_Right":
    case "minus":
    case "KP_Home":
    case "egrave":
    case "KP_Up":
    case "underscore":
    case "KP_Prior":
    case "ccedilla":
    if (prefs_editing && (prefs_editing < 6)) {
	set_letter(translate(ev.keyname));
      break;
    }
    case "BackSpace":
    if (prefs_editing && (prefs_editing < 6)) {
      if (prefs_timer) {
        ecore_timer_del(prefs_timer);
        prefs_timer = null;
      }
      if (prefs_cur_l == '_' || prefs_cur_l == '')
        prefs_cur_name = prefs_cur_name.substring(0, Math.max(0, prefs_cur_name.length - 1));
      prefs_cur_l = '_';
      if (prefs_editing < 5)
        edje_object_part_text_set(prefs_edje_o, "host"  + prefs_editing, prefs_cur_name + prefs_cur_l);
      else if (prefs_editing == 5)
        edje_object_part_text_set(prefs_edje_o, "port", prefs_cur_name + prefs_cur_l);

//      if (!prefs_cur_name.length || prefs_cur_name.substring(prefs_cur_name.length - 1).match(/-| |\d/))
//        prefs_maj_min = true;
//      else
//        prefs_maj_min = false;

      if (prefs_maj_min)
        prefs_nb = -1;
      else
        prefs_nb = -2;

       break;
    }
    case "Up":
    case "Left":
    case "FP/Up":
    case "RC/Up":
    case "FP/Left":
    case "RC/Left":
    prefs_editing--;
    prefs_handle_move(prefs_editing);
    break;
    case "Down":
    case "Right":
    case "FP/Down":
    case "RC/Down":
    case "FP/Right":
    case "RC/Right":
    prefs_editing++;
    prefs_handle_move(prefs_editing);
    break;
    case "Return":
    case "FP/Ok":
    case "RC/Ok":
    case "RCL/Ok":
    case "space":
    if (prefs_editing && (prefs_editing == 6)) {
      db_save(pref_gen());
      db_close();
      prefs_setdown();
      main_setup();
    }
    break;
    default:
    break;
  }
}

true;
