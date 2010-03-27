var sl_editing; /* cursor position in screen */
var sl_next_pos = 0; /* next position to display in the searchlist */
var sl_last_pos = 0; /* last visible position in the searchlist */
var sl_edj_o = null; /* global edje object for the searchlist */
var sl_nb, sl_pos, sl_timer, sl_last_ts, sl_idler_t;
var sl_cur_name, sl_maj_min, sl_cur_l;
var sl_sms = [
	      [ ' ', '-', '0' ],
	      [ '1' ],
	      [ 'a', 'b', 'c', '2' ],
	      [ 'd', 'e', 'f', '3' ],
	      [ 'g', 'h', 'i', '4' ],
	      [ 'j', 'k', 'l', '5' ],
	      [ 'm', 'n', 'o', '6' ],
	      [ 'p', 'q', 'r', 's', '7' ],
	      [ 't', 'u', 'v', '8' ],
	      [ 'w', 'x', 'y', 'z', '9' ],
	      ];

function sl_handle_move(position)
{
    var moved = false;
    if (position == sl_last_pos + 1 && sl_last_pos < 8) {
	position = 10;
	moved = true;
    } 
    if (!moved && position == 11) {
	position = 0;
	moved = true;
    } 
    if (!moved && position < 0) {
	position = 10;
	moved = true;
    }
    if (!moved && position == 9 && sl_last_pos < 9) {
	position = sl_last_pos;
    }
    if (position < 10) {
	edje_object_signal_emit(sl_edj_o, "selecting", "file" + position);
    }
    else if (position == 10)
	edje_object_signal_emit(sl_edj_o, "selecting", "query");

    sl_editing = position;
    sl_timer = null;
    sl_cur_l = "_";
    sl_cur_name = "";
    sl_nb = -1;
    sl_pos = 0;
}

function sl_set_letter_timeout()
{
    if (sl_cur_l != '_') {
	sl_cur_name += sl_cur_l;
	//	if (sl_cur_l == ' ' || sl_cur_l == '-')
	//	    sl_maj_min = true;
	//	else
	//	    sl_maj_min = false;
    }

    if (sl_editing == 10 && sl_cur_name.length < 10)
	sl_cur_l = '_';
    else
	sl_cur_l = '';

    if (sl_maj_min)
	sl_nb = -1;
    else
	sl_nb = -2;

    if (sl_editing == 10)
	edje_object_part_text_set(sl_edj_o, "query", sl_cur_name + sl_cur_l);
      

    sl_timer = null;
    return 0;
}

function sl_set_letter(letter)
{
    var nb = 1;
    var nb_pos = letter.search(/\d$/);
    nb = letter.substring(nb_pos);
    
    if (sl_timer) {
	ecore_timer_del(sl_timer);
	sl_timer = null;
    }
    sl_timer = ecore_timer_add(1, sl_set_letter_timeout, null);

    if (nb == sl_nb) {
	sl_cur_l = sl_sms[nb][++sl_pos % sl_sms[nb].length];
	if (sl_maj_min)
	    sl_cur_l = sl_cur_l.toUpperCase();
    } else if (sl_editing == 10 && sl_cur_name.length < 10) {
	if (sl_cur_l != '_')
	    sl_cur_name += sl_cur_l;

        if (sl_editing == 10 && sl_cur_name.length < 10)
	    sl_cur_l = sl_sms[nb][0];
	else
	    sl_cur_l = '';

	sl_pos = 0;

	//	if (sl_nb == -1 || sl_cur_name.substring(sl_cur_name.length - 1).match(/-| |\d/))
	//	    sl_maj_min = true;
	//	else
	//	    sl_maj_min = false;

	if (sl_maj_min)
	    sl_cur_l = sl_cur_l.toUpperCase();

    } else {
	sl_pos = 0;
    }
    
    sl_nb = nb;

    if (sl_editing == 10)
	edje_object_part_text_set(sl_edj_o, "query", sl_cur_name + sl_cur_l);
}

function on_query_select()
{
    sl_editing = 10;
}

function on_fileN_select(n)
{
    sl_editing = n;
}

function search_setup()
{
    sl_evas = evas;
    sl_bg = bg;
    files_a = new Array;

    app_state = State.SEARCH;
    evas_object_event_callback_add(sl_bg, EVAS_CALLBACK_KEY_DOWN, sl_on_key_down,   null);
    evas_object_event_callback_add(sl_bg, EVAS_CALLBACK_KEY_UP,   sl_pre_on_key_up, null);

    sl_edj_o = edje_object_add(sl_evas);
    edje_object_file_set(sl_edj_o, "MPD-client.edj", "search");
    evas_object_layer_set(sl_edj_o, 0);
    evas_object_move(sl_edj_o, 0, 0);
    evas_object_resize(sl_edj_o, w, h);
    evas_object_show(sl_edj_o);

    mpc_search(server_o, "\"\"");
    edje_object_signal_emit(sl_edj_o, "show", "js");
  
    for (var i = 0; i < 10; i++)
	edje_object_signal_callback_add(sl_edj_o, "selecting", "file" + i, on_fileN_select, i);
    edje_object_signal_callback_add(sl_edj_o, "selecting", "query", on_query_select, null);

    sl_editing = 10; /* set focus on query */
    sl_cur_name = "";
    sl_timer = null;
    sl_cur_l = "_";
    sl_nb = -1;
    sl_pos = 0;
    sl_maj_min = false;
    sl_handle_move(sl_editing);
}

function search_setdown()
{
    evas_object_event_callback_del(sl_bg, EVAS_CALLBACK_KEY_UP, sl_pre_on_key_up, null);
    evas_object_event_callback_del(sl_bg, EVAS_CALLBACK_KEY_DOWN, sl_on_key_down, null);
    for (var i = 0; i < 10; i++)
	edje_object_signal_callback_del(sl_edj_o, "selecting", "file" + i, on_fileN_select);
    edje_object_signal_callback_del(sl_edj_o, "selecting", "query", on_query_select);
    edje_object_signal_emit(sl_edj_o, "hide", "js");
    evas_object_del(sl_edj_o);
    delete files_a;

}

function sl_clean_message(data)
{
    edje_object_signal_emit(sl_edj_o, "hide", "msg");
    edje_object_part_text_set(sl_edj_o, "msg", "");
    return false;
}

function sl_display_message(message)
{
    edje_object_part_text_set(sl_edj_o, "msg", message);
    edje_object_signal_emit(sl_edj_o, "show", "msg");
    ecore_timer_add(2, sl_clean_message, null);
}

function display_searchlist (fresh) {
    var i;
    if (fresh) {
	sl_next_pos = 0;
    }
    for (i = sl_next_pos; (i - sl_next_pos < 10) && (i < (files_a?files_a.length:0)); i++) {
	edje_object_part_text_set(sl_edj_o, "file" + (i - sl_next_pos), files_a[i]);
    }
    sl_last_pos = i - sl_next_pos - 1;
    while(i - sl_next_pos < 10) { /* pad to 10 */
	edje_object_part_text_set(sl_edj_o, "file" + (i - sl_next_pos), "");
	i++;
    }
    sl_next_pos = i; /* handle next page for another call */

    if (sl_editing < 10) {
	if (sl_editing > sl_last_pos) {
	    sl_editing = sl_last_pos;
	    edje_object_signal_emit(sl_edj_o, "selecting", "file" + sl_editing);
	}
	else if (sl_editing == 10)
	    edje_object_signal_emit(sl_edj_o, "selecting", "query");
    }
}
function sl_on_key_up(keyname)
{
    sl_idler_t = null;
    return 0;
}

function sl_pre_on_key_up(data, e, obj, ev)
{
    sl_last_ts = ev.timestamp;
    sl_idler_t = ecore_idler_add(sl_on_key_up, ev.keyname);
}

function sl_on_key_down (data, e, obj, ev) {

    if (ev.timestamp == sl_last_ts) {
	if (sl_idler_t) {
	    ecore_idler_del(sl_idler_t);
	    sl_idler_t = null;
	}
	return;
    }
    switch (ev.keyname) {
    case "Escape":
    case "b":
    case "Red":
	search_setdown();
	pl_setup();
	break;
    case "Home":
	search_setdown();
	mpc_shutdown();
	ecore_main_loop_quit();
	break;
    case "x":
    case "Blue": /* next 10 items of the playlist */
	if (sl_next_pos < files_a.length) /* avoid going over list top */
	    display_searchlist(false);
	break;
    case "y":
    case "Yellow": /* next 10 items of the playlist */
	if (sl_next_pos > 10) { /* avoid going under list bottom */
	    sl_next_pos -= 20; /* rewind, keep in mind sl_next_pos is +10 */
	    display_searchlist(false);
	}
	break;
    case "Up":
    case "Left":
    case "FP/Up":
    case "RC/Up":
    case "FP/Left":
    case "RC/Left":
	sl_editing--;
	sl_handle_move(sl_editing);
	break;
    case "Down":
    case "Right":
    case "FP/Down":
    case "RC/Down":
    case "FP/Right":
    case "RC/Right":
	sl_editing++;
	sl_handle_move(sl_editing);
	break;
    case "Return":
    case "FP/Ok":
    case "RC/Ok":
    case "RCL/Ok":
	/* in searchlist selection */
	var pos = sl_next_pos + sl_editing - 10;
	if (sl_editing < 10) {
	    mpc_add(server_o, files_a[pos]); /* keep in mind sl_next_pos is + 10 */
	    var basename = files_a[pos].replace(/^.*[\/\\]/g, '');
	    sl_display_message(basename + " ajouté");
	} else {
	    var query = edje_object_part_text_get(sl_edj_o, "query").replace(/_+$/, '');
	    mpc_search(server_o, query);
	}
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
	if (sl_editing == 10) {
	    sl_set_letter(ev.keyname);
	    break;
	}
    case "BackSpace":
	if (sl_editing == 10) {
	    if (sl_timer) {
		ecore_timer_del(sl_timer);
		sl_timer = null;
	    }
	    if (sl_cur_l == '_' || sl_cur_l == '')
		sl_cur_name = sl_cur_name.substring(0, Math.max(0, sl_cur_name.length - 1));
	    sl_cur_l = '_';
	    edje_object_part_text_set(sl_edj_o, "query", sl_cur_name + sl_cur_l);

	    //      if (!sl_cur_name.length || sl_cur_name.substring(sl_cur_name.length - 1).match(/-| |\d/))
	    //        sl_maj_min = true;
	    //      else
	    //        sl_maj_min = false;

	    if (sl_maj_min)
		sl_nb = -1;
	    else
		sl_nb = -2;
	}
	break;
    default:
	break;
    }
}

true;
