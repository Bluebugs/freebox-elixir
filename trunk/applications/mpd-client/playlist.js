var pl_editing = 0;  /* cursor position in screen */
var pl_next_pos = 0; /* next posiiont (padded) */
var pl_last_pos = 0; /* last position displayed */
var pl_edj_o = null; /* global edje object for the playlist */
var pl_idler_t, pl_last_ts;
var first_display = false;

function pl_clean_message(data)
{
    edje_object_signal_emit(pl_edj_o, "hide", "msg");
    edje_object_part_text_set(pl_edj_o, "msg", "");
    return false;
}

function pl_display_message(message)
{
    edje_object_part_text_set(pl_edj_o, "msg", message);
    edje_object_signal_emit(pl_edj_o, "show", "msg");
    ecore_timer_add(2, pl_clean_message, null);
}

/* display 10 items of the playlist_o global */
function display_playlist(same)
{ 
    var i = 0;
    if (same && !first_display)
	pl_next_pos -= 10;
    
    first_display = false;

    if (playlist_o && playlist_o.length == pl_next_pos)
	pl_next_pos -= 10;

    if (playlist_o && playlist_o.length)
	for (i = pl_next_pos; (i - pl_next_pos < 10) && (i < playlist_o.length); i++) {
	    edje_object_part_text_set(pl_edj_o, "pos" + (i - pl_next_pos), parseInt(playlist_o[i].pos) + 1);
	    edje_object_part_text_set(pl_edj_o, "file" + (i - pl_next_pos), playlist_o[i].artist + " - " + playlist_o[i].title);
	}
    pl_last_pos = i - pl_next_pos - 1; /* last position in screen */
    while(i - pl_next_pos < 10) { /* pad to 10 */
	edje_object_part_text_set(pl_edj_o, "pos" + (i - pl_next_pos), "");
	edje_object_part_text_set(pl_edj_o, "file" + (i - pl_next_pos), "");
	i++;
    }
    pl_next_pos = i; /* handle next page for another call */

    if (playlist_o && playlist_o.length) {
	if (pl_editing > pl_last_pos)
	    pl_editing = pl_last_pos;
	edje_object_signal_emit(pl_edj_o, "selecting", "pos" + pl_editing);
    } else
	edje_object_signal_emit(pl_edj_o, "hide", "cursor");
}

function pl_handle_move(position)
{
    if (pl_last_pos < 0)
	return;

    if (position > pl_last_pos) {
	position = 0;
    } 
    if (position < 0) {
	position = pl_last_pos;
    }
    edje_object_signal_emit(pl_edj_o, "selecting", "pos" + position);
    pl_editing = position;
}

function pl_on_key_up(keyname)
{
    pl_idler_t = null;
    return 0;
}

function pl_pre_on_key_up(data, e, obj, ev)
{
    pl_last_ts = ev.timestamp;
    pl_idler_t = ecore_idler_add(pl_on_key_up, ev.keyname);
}

function pl_on_key_down(data, e, obj, ev)
{
    if (ev.timestamp == pl_last_ts) {
	if (pl_idler_t) {
	    ecore_idler_del(pl_idler_t);
	    pl_idler_t = null;
	}
	return;
    }

    switch (ev.keyname) {
    case "Escape":
    case "b":
    case "Red":
	pl_setdown();
	main_setup();
	break;
    case "Home":
	pl_setdown();
	mpc_shutdown();
	ecore_main_loop_quit();
	break;
    case "a":
    case "Green": /* remove an element from the playlist */
	var pos = pl_next_pos + pl_editing - 10; /* keep in mind pl_next_pos is + 10 */
	mpc_del(server_o, pos);
	pl_display_message(playlist_o[pos].title + " retiré");
	mpc_playlist(server_o);
	break;
    case "x":
    case "Blue": /* next 10 items of the playlist */
	if (pl_next_pos < playlist_o.length) /* avoid going over list top */
	    display_playlist(false);
	break;
    case "y":
    case "Yellow": /* next 10 items of the playlist */
	if (pl_next_pos > 10) { /* avoid going under list bottom */
	    pl_next_pos -= 20; /* rewind, keep in mind pl_next_pos is +10 */
	    display_playlist(false);
	}
	break;
    case "Up":
    case "Left":
    case "FP/Up":
    case "RC/Up":
    case "FP/Left":
    case "RC/Left":
	pl_editing--;
	pl_handle_move(pl_editing);
	break;
    case "Down":
    case "Right":
    case "FP/Down":
    case "RC/Down":
    case "FP/Right":
    case "RC/Right":
	pl_editing++;
	pl_handle_move(pl_editing);
	break;
    case "Return":
    case "FP/Ok":
    case "RC/Ok":
    case "RCL/Ok":
	/* in playlist selection */
	mpc_play(server_o, (pl_next_pos + pl_editing - 10)); /* keep in mind pl_next_pos is + 10 */
	pl_setdown();
	main_setup();
	break;
    case "s":
    case "Select":
	pl_setdown();
	search_setup();
	break;
    default:
	break;
    }
}

function pl_setup()
{

    pl_evas = evas;
    pl_bg = bg;

    app_state = State.PLAYLIST;
    first_display = true;
    pl_next_pos = 0;
    evas_object_event_callback_add(pl_bg, EVAS_CALLBACK_KEY_DOWN, pl_on_key_down,   null);
    evas_object_event_callback_add(pl_bg, EVAS_CALLBACK_KEY_UP,   pl_pre_on_key_up, null);

    pl_edj_o = edje_object_add(pl_evas);
    edje_object_file_set(pl_edj_o, "MPD-client.edj", "playlist");
    evas_object_layer_set(pl_edj_o, 0);
    evas_object_move(pl_edj_o, 0, 0);
    evas_object_resize(pl_edj_o, w, h);
    evas_object_show(pl_edj_o);

    mpc_playlist(server_o);
    edje_object_signal_emit(pl_edj_o, "show", "js");
  
    pl_editing = 0; /* set focus on first track */
}

function pl_setdown()
{
    evas_object_event_callback_del(pl_bg, EVAS_CALLBACK_KEY_UP, pl_pre_on_key_up, null);
    evas_object_event_callback_del(pl_bg, EVAS_CALLBACK_KEY_DOWN, pl_on_key_down, null);
    edje_object_signal_emit(pl_edj_o, "hide", "js");
    evas_object_del(pl_edj_o);
}

true;
