var FN = "/.fonts/";
var test = true;
var State = { PREFS : 1, PLAY : 2, PLAYLIST : 3, SEARCH : 4 }; /* state type */
var app_state; /* application state */
var idler_t, last_ts;

test &= elx.load("evas");
test &= elx.load("ecore");
test &= elx.load("ecore-evas");
test &= elx.load("ecore-con");
test &= elx.load("edje");
test &= elx.include("MPD-client.edj", "mpc");
test &= elx.include("MPD-client.edj", "db");
test &= elx.include("MPD-client.edj", "prefs");
test &= elx.include("MPD-client.edj", "playlist");
test &= elx.include("MPD-client.edj", "search");

var status_o = null;
var inside = false;	/* inside on_key_up callback: prevent multiple calls */
var playbutton;		/* reference to the "play" edje part */
var whole_data = "";

var w = 720;
var h = 576;
var ee;
var evas;
var bg;
var edj_o = null;
var playlist_o = null;
var files_a = null;
var timer_handle = null;
var editing = 0;

function on_srv_add(data, type, ev)
{
    elx.print("Setting connection up.\n");
    if (!server_o || ev.server != server_o) {
        return 1;
    }
    mpc_status(ev.server);
    mpc_currentsong(ev.server);
    return 0;
}

function on_srv_del(data, type, ev)
{
    elx.print("Shutting connection down.\n");
    if (!server_o || ev.server != server_o) {
        return 1;
    }
    ecore_con_server_send(server_o, "close\n");
    ecore_con_server_del(server_o);
    server_o = null;
    return 0;
}

function parse(lines) {
    switch (lines[0].substring(0,3)) {
    case "fil":
	/* currentsong or playlistinfo or search reply */
	switch (app_state) {
	case State.PLAY:
	    song = mpc_parse_song(lines);
	    edje_object_part_text_set(edj_o, "artist", song.artist);
	    edje_object_part_text_set(edj_o, "title", song.title);
	    break;
	case State.PLAYLIST:
	    delete playlist_o;
	    playlist_o = mpc_parse_playlist(lines);
	    display_playlist(true);
	    break;
	case State.SEARCH:
	    delete file_a;
	    files_a = mpc_parse_search(lines);
	    display_searchlist(true);
	    break;
	default:
	    break;
	}
	break;
    case "vol":
	/* status reply */
	switch (app_state) {
	case State.PLAY:
	    delete status_o;
	    status_o = mpc_parse_status(lines);
	    edje_object_signal_emit(edj_o, status_o.state, "play");
	    if (status_o.repeat)
	        edje_object_signal_emit(edj_o, "repeat", "repeat");
	    else
	        edje_object_signal_emit(edj_o, "once", "repeat");
	    if (status_o.random)
	        edje_object_signal_emit(edj_o, "random", "random");
	    else
	        edje_object_signal_emit(edj_o, "linear", "random");
	    break;
	}
	break;
    }
}

function on_srv_data(data, type, ev)
{
    if (!server_o || ev.server != server_o)
	return false;

    whole_data += ev.data;
    var lines = whole_data.split(/\n/);
    var beg = 0, rest = 0;
    if (lines[0].match(/^OK MPD/)) {
	beg = 1;
	if (lines.length > 1 && lines[1].match(/^$/))
	    beg = 2;
    }
    for (var lo = beg; lo < lines.length; lo++) {
	if (lines[lo].match(/^OK$/)) {
	    rest = lo + 1;
	    if (lo != beg)
		parse(lines.slice(beg, lo));
	    else {
		switch (app_state) {
		case State.PREFS:
		case State.PLAY:
		    break;
		case State.PLAYLIST:
		    delete playlist_o;
		    playlist_o = null;
		    display_playlist(true);
		    break;
		case State.SEARCH:
		    break;
		default:
		    break;
		}
	    }
	    beg = lo + 1;
	}
    }
    
    whole_data = lines.slice(rest, lines.length).join("\n");

    return true;
}

function on_play_pressed(data, edj_o, signal, source)
{
    if (signal != "pressed" && source != "play")
	return;
    if (status_o && status_o.state == "play") {
	mpc_pause(server_o);
    } else {
	mpc_play(server_o, -1);
    }
    mpc_status(server_o);
    mpc_currentsong(server_o);
}

function on_repeat_pressed(data, edj_o, signal, source)
{
    if (signal != "pressed" && source != "repeat")
	return;
    if (status_o && !status_o.repeat) {
	mpc_repeat(server_o);
    } else {
	mpc_once(server_o);
    }
    mpc_status(server_o);
}

function on_random_pressed(data, edj_o, signal, source)
{
    if (signal != "pressed" && source != "random")
	return;
    if (status_o && !status_o.random) {
	mpc_random(server_o);
    } else {
	mpc_linear(server_o);
    }
    mpc_status(server_o);
}

function on_timer(data)
{
    mpc_status(server_o);
    mpc_currentsong(server_o);
    return true; /* always reschedule, even on network error */
}

function app_signal_exit(data, type, ev)
{
    ecore_main_loop_quit();
}

function main_setdown()
{
    evas_object_event_callback_del(bg, EVAS_CALLBACK_KEY_UP, pre_on_key_up, null);
    evas_object_event_callback_del(bg, EVAS_CALLBACK_KEY_DOWN, on_key_down, null);
    edje_object_signal_callback_del(edj_o, "pressed", "play", on_play_pressed);
    edje_object_signal_callback_del(edj_o, "pressed", "repeat", on_repeat_pressed);
    edje_object_signal_callback_del(edj_o, "pressed", "random", on_random_pressed);
    ecore_timer_del(timer_handle);
    edje_object_signal_emit(edj_o, "hide", "js");
}

function handle_move(position)
{
  if (position > 3) /* there are 3 buttons: 1=repeat, 2=random, 3=list */
    position = 1;
  if (position < 1)
    position = 3;

  if (position == 1)
    edje_object_signal_emit(edj_o, "selecting", "repeat");
  else if (position == 2)
    edje_object_signal_emit(edj_o, "selecting", "random");
  else if (position == 3)
    edje_object_signal_emit(edj_o, "selecting", "list");
  editing = position;
}

function on_key_up(keyname)
{
    idler_t = null;
    return 0;
}

function pre_on_key_up(data, e, obj, ev)
{
    last_ts = ev.timestamp;
    idler_t = ecore_idler_add(on_key_up, ev.keyname);
}

function on_key_down(data, e, obj, ev)
{
    if (ev.timestamp == last_ts) {
        if (idler_t) {
            ecore_idler_del(idler_t);
            idler_t = null;
        }
        return;
    }

    switch (ev.keyname) {
    case "b":
    case "Red":
    case "Home":
    case "Escape":
    case "Start":
        ecore_main_loop_quit();
        break;
    case "space":
    case "Play":
        if (status_o && status_o.state != "play") {
            mpc_play(server_o, -1);
        }
        else if (status_o) {
            mpc_pause(server_o);
        }
        mpc_status(server_o); /* refresh status */
        mpc_currentsong(server_o);
        break;
    case "Stop":
    case "s":
        mpc_stop(server_o);
        edje_object_signal_emit(edj_o, "stopped", "play");
        mpc_status(server_o); /* refresh status */
        break;
    case "n":
    case "Next":
        mpc_next(server_o);
        mpc_status(server_o);
        mpc_currentsong(server_o);
        break;
    case "p":
    case "Previous":
        mpc_prev(server_o);
        mpc_status(server_o);
        mpc_currentsong(server_o);
        break;
    case "Volume_Plus":
    case "plus":
    case "equal":
        mpc_volplus(server_o);
        break;
    case "Volume_Minus":
    case "minus":
        mpc_volminus(server_o);
        break;
    case "List":
    case "l":
        main_setdown();
        pl_setup();
        break;
    case "Up":
    case "Left":
    case "FP/Up":
    case "RC/Up":
    case "FP/Left":
    case "RC/Left":
        editing--;
        handle_move(editing);
        break;
    case "Down":
    case "Right":
    case "FP/Down":
    case "RC/Down":
    case "FP/Right":
    case "RC/Right":
        editing++;
        handle_move(editing);
        break;
    case "Return":
    case "FP/Ok":
    case "RC/Ok":
    case "RCL/Ok":
        if (editing == 1) {
            if (status_o && !status_o.repeat) {
                mpc_repeat(server_o);
            } else {
                mpc_once(server_o);
            }
            mpc_status(server_o);
        }
        else if (editing == 2) {
            if (status_o && !status_o.random) {
                mpc_random(server_o);
            } else {
                mpc_linear(server_o);
            }
            mpc_status(server_o);
        }
        else if (editing == 3) {
            main_setdown();
            pl_setup();
        }
    break;
    default:
        break;
    }
}

function main_setup()
{
    app_state = State.PLAY;
    editing = 3; /* place cursor under list button */
    evas_object_event_callback_add(bg, EVAS_CALLBACK_KEY_DOWN, on_key_down,   null);
    evas_object_event_callback_add(bg, EVAS_CALLBACK_KEY_UP,   pre_on_key_up, null);

    edj_o = edje_object_add(evas);
    edje_object_file_set(edj_o, "MPD-client.edj", "main");
    evas_object_move(edj_o, 0, 0);
    evas_object_resize(edj_o, w, h);
    ecore_evas_resize(ee, w, h);
    evas_object_show(edj_o);
    ecore_evas_show(ee);

    edje_object_signal_callback_add(edj_o, "pressed", "play", on_play_pressed, null);
    edje_object_signal_callback_add(edj_o, "pressed", "repeat", on_repeat_pressed, null);
    edje_object_signal_callback_add(edj_o, "pressed", "random", on_random_pressed, null);
    if (!db_init("MPD_client")) {
      elx.print("Could not init prefs\n");
      return false;
    }

    prefs = db_load();
    db_close();
    host = "" + prefs[1].host1 + ":" + prefs[1].host2 + ":" + prefs[1].host3 + ":" + prefs[1].host4 + ":" + prefs[1].host5 + ":" + prefs[1].host6 + ":" + prefs[1].host7 + ":" + prefs[1].host8;
    port = prefs[1].port;
    if (!server_o)
      mpc_init(host, port);
    else {
      mpc_status(server_o);
      mpc_currentsong(server_o);
    }
    timer_handle = ecore_timer_add(3, on_timer, null); /* fetch song title every 3 sec */
    edje_object_signal_emit(edj_o, "selecting", "list");
    return true;
}

function main()
{

    ecore_init();
    ecore_event_handler_add(ECORE_EVENT_SIGNAL_EXIT, app_signal_exit, null);
    ecore_evas_init();

    ee = ecore_evas_new(null, 0, 0, 720, 576, "name=MPD-client");
    ecore_evas_title_set(ee, "Freebox MPD Client");
    ecore_evas_borderless_set(ee, 0);
    ecore_evas_shaped_set(ee, 0);
    ecore_evas_show(ee);

    evas = ecore_evas_get(ee);

    evas_image_cache_set(evas, 10 * 1024 * 1024)
    evas_font_path_prepend(evas, FN);
    evas_font_cache_set(evas, 512 * 1024);

    bg = evas_object_rectangle_add(evas);

    evas_object_resize(bg, 720, 576);
    evas_object_color_set(bg, 255, 255, 255, 255);
    evas_object_show(bg);
    evas_object_focus_set(bg, 1);

    edje_init();
    ecore_con_init();

    prefs_setup(10);
 
    ecore_main_loop_begin();

    if (edj_o)
      evas_object_del(edj_o);
    evas_object_del(bg);
    ecore_evas_free(ee);

    mpc_shutdown();
    ecore_con_shutdown();
    edje_shutdown();
    ecore_evas_shutdown();
    ecore_shutdown();
}
if (test)
    main();
