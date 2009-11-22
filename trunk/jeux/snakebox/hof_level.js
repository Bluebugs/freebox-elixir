// helper for Hall Of Fame

var hof_edje_o;
var hof_evas;
var hof_backdrop;
var hof_editing, hof_nb, hof_pos, hof_timer, hof_last_ts, hof_idler_t;
var hof_displaying_text = false;
var hof_come_back_cb;
var hof_cur_name, hof_maj_min, hof_cur_l;
var hof_sms = [
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

var hof_sound = elx.load("mix");
var hof_sample, hof_sample_btn;
if (hof_sound) {
    Mix_OpenAudio(44100, 0x9010, 2, 1024);
    hof_sample = Mix_LoadWAV("hall_of_fame.ogg");
    hof_sample_btn = Mix_LoadWAV("bip_bouton.wav");
}

// HOF setup
function hof_setup(game_name, backdrop, edje_o, evas, come_back_cb, scores_a, pos, option_text)
{
    hof_edje_o = edje_o;
    hof_backdrop = backdrop;
    hof_evas = evas;
    hof_come_back_cb = come_back_cb;
    hof_cur_name = "";

    evas_object_event_callback_add(hof_backdrop, EVAS_CALLBACK_KEY_DOWN, hof_on_key_down,   null);
    evas_object_event_callback_add(hof_backdrop, EVAS_CALLBACK_KEY_UP,   hof_pre_on_key_up, null);

    edje_object_file_set(hof_edje_o, "hof_level-" + game_name + ".edj", "hof");
    evas_object_layer_set(hof_edje_o, 0);
    evas_object_move(hof_edje_o, 0, 0);
    evas_object_resize(hof_edje_o, 720, 576);
    evas_object_show(hof_edje_o);
    edje_object_signal_emit(hof_edje_o, "hof,background,appear", "js");

    edje_object_part_text_set(hof_edje_o, "rank_col",  "Rang");
    edje_object_part_text_set(hof_edje_o, "name_col",  "Nom");
    edje_object_part_text_set(hof_edje_o, "score_col", "Score");
    edje_object_part_text_set(hof_edje_o, "level_col", "Niv.");

    edje_object_signal_emit(hof_edje_o,   "hof,rank_col,appear",  "js");
    edje_object_signal_emit(hof_edje_o,   "hof,name_col,appear",  "js");
    edje_object_signal_emit(hof_edje_o,   "hof,score_col,appear", "js");
    edje_object_signal_emit(hof_edje_o,   "hof,level_col,appear", "js");

    if (option_text) {
	edje_object_part_text_set(hof_edje_o, "option_col",  option_text);
	edje_object_signal_emit(hof_edje_o,   "hof,option_col,appear",  "js");
    }

    for (var lo = 1; lo <= 10; lo++)
	hof_set_score(scores_a[lo]);

    if (pos) {
	hof_timer = null;
	hof_cur_l = '_';
	hof_editing = pos;
	hof_nb = -1;
	hof_pos = 0;
	hof_emit_signal(pos, "blink");
	hof_display_image_text("nouveau_score");
	edje_object_part_text_set(hof_edje_o, "name_"  + pos, '_');
	hof_maj_min = true;
    } else
	hof_editing = false;

    if (hof_sample)
	Mix_PlayChannel(-1, hof_sample, -1);
}

function hof_background_disappeared(data, e, obj, event)
{
    edje_object_signal_callback_del(hof_edje_o, "hof_background_disappeared", "edc", hof_background_disappeared);
    hof_come_back_cb(hof_editing, hof_cur_name);
}

// HOF setdown
function hof_setdown()
{
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, hof_on_key_down, null);
    for (var lo = 0; lo <= 10; lo++)
	hof_emit_signal(lo, "disappear");

    edje_object_signal_emit(hof_edje_o,   "hof,rank_col,disappear",   "js");
    edje_object_signal_emit(hof_edje_o,   "hof,name_col,disappear",   "js");
    edje_object_signal_emit(hof_edje_o,   "hof,score_col,disappear",  "js");
    edje_object_signal_emit(hof_edje_o,   "hof,level_col,disappear",  "js");
    edje_object_signal_emit(hof_edje_o,   "hof,option_col,disappear", "js");

    edje_object_signal_callback_add(hof_edje_o, "hof_background_disappeared", "edc", hof_background_disappeared, null);
    edje_object_signal_emit(hof_edje_o, "hof,background,disappear", "js");
    if (hof_sample)
	Mix_FadeOutChannel(-1, 1000);
}

function hof_set_score(score_o)
{
    var num = score_o.rank;
    var rank = num;
    if (num == 1)
	num += 'er';
    else
	num += 'e';
    
    edje_object_part_text_set(hof_edje_o, "rank_"  + rank, num);
    edje_object_part_text_set(hof_edje_o, "name_"  + rank, score_o.name);
    edje_object_part_text_set(hof_edje_o, "score_" + rank, score_o.score);
    edje_object_part_text_set(hof_edje_o, "level_" + rank, score_o.level);
    hof_emit_signal(rank, "appear")
}

function hof_emit_signal(rank, signal)
{
    edje_object_signal_emit(hof_edje_o,   "hof,rank_"  + rank + "," + signal, "js");
    edje_object_signal_emit(hof_edje_o,   "hof,name_"  + rank + "," + signal, "js");
    edje_object_signal_emit(hof_edje_o,   "hof,score_" + rank + "," + signal, "js");
    edje_object_signal_emit(hof_edje_o,   "hof,level_" + rank + "," + signal, "js");
}

function hof_end_image_text()
{
    edje_object_signal_callback_del(edje_o, "hof_im_text_end", "edc", hof_end_image_text);
    hof_displaying_text = false;
}

function hof_display_image_text(name)
{
    hof_displaying_text = true;
    edje_object_signal_callback_add(edje_o, "hof_im_text_end", "edc", hof_end_image_text, null);
    edje_object_signal_emit(edje_o, name, "js");
}

function set_letter_timeout()
{
    if (hof_cur_l != '_') {
	hof_cur_name += hof_cur_l;
	if (hof_cur_l == ' ' || hof_cur_l == '-')
	    hof_maj_min = true;
	else
	    hof_maj_min = false;
    }

    if (hof_cur_name.length < 10)
	hof_cur_l = '_';
    else
	hof_cur_l = '';

    if (hof_maj_min)
	hof_nb = -1;
    else
	hof_nb = -2;

    edje_object_part_text_set(hof_edje_o, "name_"  + hof_editing, hof_cur_name + hof_cur_l);

    hof_timer = null;
    return 0;
}

function set_letter(letter)
{
    var nb = 1;
    var nb_pos = letter.search(/\d$/);
    nb = letter.substring(nb_pos);
    
    if (hof_timer) {
	ecore_timer_del(hof_timer);
	hof_timer = null;
    }
    hof_timer = ecore_timer_add(1, set_letter_timeout, null);

    if (nb == hof_nb) {
	hof_cur_l = hof_sms[nb][++hof_pos % hof_sms[nb].length];
	if (hof_maj_min)
	    hof_cur_l = hof_cur_l.toUpperCase();
    } else if (hof_cur_name.length < 10) {
	if (hof_cur_l != '_')
	    hof_cur_name += hof_cur_l;

	if (hof_cur_name.length < 10)
	    hof_cur_l = hof_sms[nb][0];
	else
	    hof_cur_l = '';

	hof_pos = 0;

	if (hof_nb == -1 || hof_cur_name.substring(hof_cur_name.length - 1).match(/-| |\d/))
	    hof_maj_min = true;
	else
	    hof_maj_min = false;

	if (hof_maj_min)
	    hof_cur_l = hof_cur_l.toUpperCase();

    } else {
	hof_pos = 0;
    }
    
    hof_nb = nb;

    edje_object_part_text_set(hof_edje_o, "name_"  + hof_editing, hof_cur_name + hof_cur_l);
    debug(1, hof_cur_name + hof_cur_l);
}

function hof_on_key_up(keyname)
{
    hof_idler_t = null;
    return 0;
}

function hof_pre_on_key_up(data, e, obj, event)
{
    hof_last_ts = event.timestamp;
    hof_idler_t = ecore_idler_add(hof_on_key_up, event.keyname);
}

function hof_on_key_down(data, e, obj, event)
{
    if (event.timestamp == hof_last_ts) {
	if (hof_idler_t) {
	    ecore_idler_del(hof_idler_t);
	    hof_idler_t = null;
	}
	return;
    }

    if (hof_editing)
	switch (event.keyname) {
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
	    if (hof_sample_btn)
		Mix_PlayChannel(-1, hof_sample_btn, 0);
	    set_letter(event.keyname);
	    break;
	case "BackSpace":
	    if (hof_timer) {
		ecore_timer_del(hof_timer);
		hof_timer = null;
	    }

	    if (hof_sample_btn)
		Mix_PlayChannel(-1, hof_sample_btn, 0);

	    if (hof_cur_l == '_' || hof_cur_l == '')
		hof_cur_name = hof_cur_name.substring(0, Math.max(0, hof_cur_name.length - 1));
	    hof_cur_l = '_';

	    edje_object_part_text_set(hof_edje_o, "name_"  + hof_editing, hof_cur_name + hof_cur_l);

	    if (!hof_cur_name.length || hof_cur_name.substring(hof_cur_name.length - 1).match(/-| |\d/))
		hof_maj_min = true;
	    else
		hof_maj_min = false;

	    if (hof_maj_min)
		hof_nb = -1;
	    else
		hof_nb = -2;

	    break;
	case "x":
	case "y":
	case "a":
	case "b":
	case "KP_Enter":
	case "Return":
	case "Select":
	case "FP/Ok":
	case "RC/Ok":
	case "RCL/Ok":
	case "Red":
	case "Yellow":
	case "Green":
	case "Blue":
	case "Home":
	case "equal":
	case "Escape":
	case "Stop":
	case "Start":
	    hof_setdown();
	    break;
	}
    else
	switch (event.keyname) {
	case "x":
	case "y":
	case "a":
	case "b":
	case "KP_Enter":
	case "Return":
	case "Select":
	case "FP/Ok":
	case "RC/Ok":
	case "RCL/Ok":
	case "Red":
	case "Yellow":
	case "Green":
	case "Blue":
	case "Home":
	case "equal":
	case "Escape":
	case "Stop":
	case "Start":
	    hof_setdown();
	    break;
	}
}

true;
