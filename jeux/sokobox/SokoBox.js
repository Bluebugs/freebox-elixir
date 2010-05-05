// v1.0beta13
// Time-stamp: <26 avril 2010, 22:31 mid>

var DEBUG = false;
var LEVEL = false;

//var usid = elx.usid();
var usid = 'dd3788b8d3f6cbe9804043395721338f72a21549d19d45b44b73cf94b';
var test = true;
var shutdown;

if (shutdown == undefined || shutdown == false) {
    test &= elx.load("evas");
    test &= elx.load("ecore");
    test &= elx.load("ecore-evas");
    test &= elx.load("edje");
}

test &= elx.load("sqlite");

var sound = elx.load("mix");

var FN			= "/.fonts/";
var PF_W		= 20;
var PF_H		= 17;
var MENU		= 0;
var GAME_SETUP		= 1;
var GAME_RUN		= 2;
var GAME_NEXT		= 3;
var GAME_NEXT_SETUP	= 4;
var GAME_SETDOWN	= 5;
var OFFSET_X		= 94;
var OFFSET_Y		= 0;
var BLOCK_SIZE		= 28;
var BACKGROUND		= 0;
var FOREGROUND		= 1;
var FLORGROUND		= 2;
var BACKOBJ = { goal: 1, wall: 1 };
var FOREOBJ = { man: 1, object: 1 };
var GLOWOBJ = { object: 1, goal: 1 };

// E objects

var ee;
var evas;		// Evas Canvas
var backdrop;		// deep background, always present
var edje_o;		// Current Edje Object
var background;		// game background
var title;		// menu title
var image_text;		// game over, pause, ...
var timer;

// game variables
var displaying_text = false;
var playfield, preplayfield_x, preplayfield_y;
var level, level_max;
var man;
var goals;
var undo;
var sample, sample_push, sample_win, sample_btn;
var last_ts = null;

if (sound) {
    Mix_OpenAudio(44100, 0x9010, 2, 1024);
    sample = Mix_LoadWAV("Sokobox.ogg");
    sample_push = Mix_LoadWAV("Pousser_objet.wav");
    sample_win  = Mix_LoadWAV("sokobox_win.wav");
    sample_btn = Mix_LoadWAV("bip_bouton.wav");
}

function rand(n)
{
    return Math.floor(Math.random() * n + 1);
}

// X(), Y() calc gfx coords
function X(x)
{
    return OFFSET_X + BLOCK_SIZE * x;
}

function Y(y)
{
    return OFFSET_Y + BLOCK_SIZE * y;
}

// figure object (background block or man or diamond
function FIG(x, y, what, appear)
{
    this.x = x;			// Coordonnées grille actuelles
    this.y = y;

    this.what = what;		// Type de pièce
    this.backfore = BACKOBJ[what] ? BACKGROUND : FOREGROUND;
    this.appear = appear;

    var level = this.backfore ? 50 : 25;

    this.obj = build_image_block_object(evas, what, level, appear);

    if (GLOWOBJ[what])
	this.glowobj = build_image_block_object(evas, what + '_glow', level + 10, appear, 1);

    this.clone = function () {
	return new FIG(this.x, this.y, this.what, this.appear);
    };
}

// load an figure object from the edje file
// <evas> is the evas object
// <name> is the name of the object
// <level> is the plane in which the object is displayed
// <appear> is 1 for "normal" (= slow) appearing animation, 0 for immediate (fast)
// <glow> is 1 for glowing objects
function build_image_block_object(evas, name, level, appear, glow)
{
    var o = edje_object_add(evas);
    edje_object_file_set(o, "SokoBox.edj", name);
    evas_object_resize(o, BLOCK_SIZE, BLOCK_SIZE);
    evas_object_layer_set(o, level);
    evas_object_show(o);
    if (appear == 1)
	edje_object_signal_emit(o, "play,fig,appear", "js");
    else if (appear == 2)
	edje_object_signal_emit(o, "play,fig,appear,slow", "js");
    else
	edje_object_signal_emit(o, "play,fig,appear,fast", "js");

    if (glow == 1)
	edje_object_signal_emit(o, "play,fig,blink", "js");

    return o;
}

// put a block on the screen and record its object in playfield[backfore]
// <x> and <y> are coords (in blocks)
// <what> is the filename of the block
// <appear> is 1 for "normal" (= slow) appearing animation, 0 for immediate (fast), 2 for extra slow
function set_block(x, y, what, appear)
{
    var block = new FIG(x, y, what, appear);

    if (playfield[block.backfore][x][y]) {
	debug(1, "block at x=" + x + ", y=" + y);
    }

    playfield[block.backfore][x][y] = block;
    evas_object_move(block.obj, X(block.x), Y(block.y));

    if (block.glowobj)
	evas_object_move(block.glowobj, X(block.x), Y(block.y));
}

function check_win()
{
    for (var lo = 0; lo < goals.length; lo++) {
	var obj = playfield[FOREGROUND][goals[lo].x][goals[lo].y];
	if (!(obj && obj.what == 'object'))
	    return false;
    }

    next_level();

    if (sample_win)
	Mix_PlayChannel(-1, sample_win, 0);
    return true;
}

function next_level()
{
    state = GAME_NEXT;
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, game_on_key_down, null);
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   game_on_key_up, null);
    level++;
    if (level > level_max) {
	level_max = level;
	max_level_save();
    }
}

function prev_level()
{
    state = GAME_NEXT_SETUP;
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, game_on_key_down, null);
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   game_on_key_up, null);
    level--;
}

function in_field(x, y)
{
    return (x >= 0 && x < PF_W && y >= 0 && y < PF_H);
}

function move_man(dx, dy)
{
    if (displaying_text)
	return true;

    var new_man = { x: man.x + dx, y: man.y + dy };
    var pushed = false;

    if (!in_field(new_man.x, new_man.y)) {
	debug(1, "Bugman: " + new_man);
	return;
    }

    var what_back = playfield[BACKGROUND][new_man.x][new_man.y];
    var what_fore = playfield[FOREGROUND][new_man.x][new_man.y];

    if (what_back && what_back.what == 'wall')
	return false;
    else if (what_fore && what_fore.what == 'object') {
	var new_obj = { x: new_man.x + dx, y: new_man.y + dy };
	if (in_field(new_obj.x, new_obj.y)) {
	    var new_back = playfield[BACKGROUND][new_obj.x][new_obj.y];
	    var new_fore = playfield[FOREGROUND][new_obj.x][new_obj.y];
	    if (new_back && new_back.what == 'wall' || new_fore)
		return false;
	    
	    evas_object_move(what_fore.obj, X(new_obj.x), Y(new_obj.y));
	    evas_object_move(what_fore.glowobj, X(new_obj.x), Y(new_obj.y));
	    playfield[FOREGROUND][new_obj.x][new_obj.y] = what_fore;
	    playfield[FOREGROUND][new_man.x][new_man.y] = null;
	    what_fore.x += dx;
	    what_fore.y += dy;
	    pushed = true;
	} else
	    return false;
    }
    
    evas_object_move(playfield[FOREGROUND][man.x][man.y].obj, X(new_man.x), Y(new_man.y));
    playfield[FOREGROUND][new_man.x][new_man.y] = playfield[FOREGROUND][man.x][man.y];
    playfield[FOREGROUND][man.x][man.y] = null;
    man = new_man;

    undo.push({ x: dx, y: dy, pushed: pushed });

    if (pushed && sample_push)
	Mix_PlayChannel(-1, sample_push, 0);

    return check_win();
}

function undo_man()
{
    if (displaying_text)
	return true;

    if (undo.length == 0)
	return true;

    var u_path = undo.pop();
    var dx = u_path.x;
    var dy = u_path.y;

    var old_man = man;
    var new_man = { x: man.x - dx, y: man.y - dy };
    evas_object_move(playfield[FOREGROUND][man.x][man.y].obj, X(new_man.x), Y(new_man.y));
    playfield[FOREGROUND][new_man.x][new_man.y] = playfield[FOREGROUND][man.x][man.y];
    playfield[FOREGROUND][man.x][man.y] = null;
    man = new_man;

    if (u_path.pushed) {
	var old_obj = { x: old_man.x + dx, y: old_man.y + dy };
	var obj_obj = playfield[FOREGROUND][old_obj.x][old_obj.y];
	evas_object_move(obj_obj.obj, X(old_man.x), Y(old_man.y));
	evas_object_move(obj_obj.glowobj, X(old_man.x), Y(old_man.y));
	playfield[FOREGROUND][old_man.x][old_man.y] = obj_obj;
	playfield[FOREGROUND][old_obj.x][old_obj.y] = null;
	obj_obj.x -= dx;
	obj_obj.y -= dy;

	if (sample_push)
	    Mix_PlayChannel(-1, sample_push, 0);
    }

    if (undo.length == 0)
	return true;

    return false;
}

// "key released" handler for game
function game_on_key_up(data, e, obj, event)
{
    last_ts = event.timestamp;
}

// "key pressed" handler for game
function game_on_key_down(data, e, obj, event)
{
    if (event.timestamp == last_ts) {
	if (cnt_ts++ < 5)
	    return;
    } else
	cnt_ts = 0;

    switch (event.keyname) {
    case "Home":
    case "equal":
    case "Escape":
    case "Stop":
    case "Start":
	is_game_over = true;
	break;
    case "KP6":
    case "Right":
    case "FP/Right":
    case "RC/Right":
    case "RCL/Right":
    case "GP/Right":
	move_man(1, 0);
	break;
    case "KP4":
    case "Left":
    case "FP/Left":
    case "RC/Left":
    case "RCL/Left":
    case "GP/Left":
	move_man(-1, 0);
	break;
    case "KP8":
    case "Up":
    case "FP/Up":
    case "RC/Up":
    case "RCL/Up":
    case "GP/Up":
	move_man(0, -1);
	break;
    case "KP2":
    case "Down":
    case "FP/Down":
    case "RC/Down":
    case "RCL/Down":
    case "GP/Down":
	move_man(0, 1);
	break;
    case "y":
    case "Yellow":
	undo_man();
	break;
    case "Red":
    case "n":
    case "b":
	if (level < level_max || DEBUG)
	    next_level();
	break;
    case "Blue":
    case "p":
    case "x":
	if (level > 0)
	    prev_level();
	break;
    default:
	break;
    }
}

function set_floor(x, y)
{
    var block = new FIG(x, y, 'chemin');

    if (playfield[FLORGROUND][x][y]) {
	debug(1, "floor at x=" + x + ", y=" + y);
    }

    playfield[FLORGROUND][x][y] = block;
    evas_object_move(block.obj, X(block.x), Y(block.y));
    evas_object_layer_set(block.obj, 10);
}

function testwall(x, y)
{
    if (x >= 0 && x < PF_W && y >= 0 && y < PF_H) {
	var fig = playfield[BACKGROUND][x][y];
	if ((!fig || fig.what != 'wall') && !playfield[FLORGROUND][x][y])
	    return true;
    }

    return false;
}

function postdisplay(x, y)
{
    set_floor(x, y);
    if (testwall(   x,     y - 1))
	postdisplay(x,     y - 1);
    if (testwall(   x,     y + 1))
	postdisplay(x,     y + 1);
    if (testwall(   x - 1, y    ))
	postdisplay(x - 1, y    );
    if (testwall(   x + 1, y    ))
	postdisplay(x + 1, y    );
}

function display()
{
    for (var y = 0; y < PF_H; y++)
	for (var x = 0; x < PF_W; x++) {
	    if (preplayfield_y[x][y] == '#') {
		set_block(x, y, 'wall');
		continue;
	    }

	    switch (preplayfield_x[x][y]) {
	    case '#':
		set_block(x, y, 'wall');
		break;
	    case '@':
		set_block(x, y, 'man');
		man = { x: x, y: y };
		break;
	    case '+':
		set_block(x, y, 'man');
		man = { x: x, y: y };
		set_block(x, y, 'goal');
		break;
	    case '$':
		set_block(x, y, 'object');
		break;
	    case '*':
		set_block(x, y, 'object');
		set_block(x, y, 'goal');
		goals.push({ x: x, y: y });
		break;
	    case '.':
		set_block(x, y, 'goal');
		goals.push({ x: x, y: y });
		break;
	    case ' ':
		// Nothing (floor)
		break;
	    default:
		debug(1, "ERREUR, caractère inconnu : " + preplayfield[x][y]);
		break;
	    }
	}
}

// 'pre'-compute playfield to remove extra walls and compute offsets
function predisplay()
{
    for (var y = 0; y < PF_H; y++)
	for (var x = 0; x < PF_W; x++)
	    if (!preplayfield_x[x][y])
		preplayfield_x[x][y] = preplayfield_y[x][y] = ' ';

    var old_in_wall, in_wall, new_in_wall;

    var max_x = 0, min_x = PF_W - 1;
    var max_y = 0, min_y = PF_H - 1;

    // first: detect and erase up to borders

    for (var y = 0; y < PF_H; y++) {
	in_wall = preplayfield_x[0][y] == '#';
	for (var x = 1; x < PF_W; x++) {
	    new_in_wall = preplayfield_x[x][y] == '#';
	    old_in_wall = in_wall;
	    if (in_wall)
		if (new_in_wall)
		    preplayfield_x[x - 1][y] = ' ';
		else {
		    if (x < min_x)
			min_x = x;
		    break;
		}
	    in_wall = new_in_wall;
	}
	if (new_in_wall && old_in_wall)
	    preplayfield_x[PF_W - 1][y] = ' ';

	in_wall = preplayfield_x[PF_W - 1][y] == '#';
	for (var x = PF_W - 2; x > -1; x--) {
	    new_in_wall = preplayfield_x[x][y] == '#';
	    old_in_wall = in_wall;
	    if (in_wall)
		if (new_in_wall)
		    preplayfield_x[x + 1][y] = ' ';
		else {
		    if (x > max_x)
			max_x = x;
		    break;
		}
	    in_wall = new_in_wall;
	}
	if (new_in_wall && old_in_wall)
	    preplayfield_x[0][y] = ' ';
    }

    for (var x = 0; x < PF_W; x++) {
	in_wall = preplayfield_y[x][0] == '#';
	for (var y = 1; y < PF_H; y++) {
	    new_in_wall = preplayfield_y[x][y] == '#';
	    old_in_wall = in_wall;
	    if (in_wall)
		if (new_in_wall)
		    preplayfield_y[x][y - 1] = ' ';
		else {
		    if (y < min_y)
			min_y = y;
		    break;
		}
	    in_wall = new_in_wall;
	}
	if (new_in_wall && old_in_wall)
	    preplayfield_y[x][PF_H - 1] = ' ';

	in_wall = preplayfield_y[x][PF_H - 1] == '#';
	for (var y = PF_H - 2; y > -1; y--) {
	    new_in_wall = preplayfield_y[x][y] == '#';
	    old_in_wall = in_wall;
	    if (in_wall)
		if (new_in_wall)
		    preplayfield_y[x][y + 1] = ' ';
		else {
		    if (y > max_y)
			max_y = y;
		    break;
		}
	    in_wall = new_in_wall;
	}
	if (new_in_wall && old_in_wall)
	    preplayfield_y[x][0] = ' ';
    }

    min_x--; min_y--; max_x++; max_y++;

    // next: re-offset the fields
    var wx = max_x - min_x;
    var wy = max_y - min_y;
    var ox = Math.floor((PF_W - wx) / 2);
    var oy = Math.floor((PF_H - wy) / 2);
    var beg_x = 0, end_x = 0, dx = 1;
    var beg_y = 0, end_y = 0, dy = 1;

    if (ox != min_x || oy != min_y) {
	if (ox > min_x) {
	    beg_x = wx;
	    dx = -1;
	} else
	    end_x = wx;
	
	if (oy > min_y) {
	    beg_y = wy;
	    dy = -1;
	} else
	    end_y = wy;
    
	for (var y = beg_y; y != end_y + dy; y += dy)
	    for (var x = beg_x; x != end_x + dx; x += dx ) {
		preplayfield_x[x + ox][y + oy] = preplayfield_x[x + min_x][y + min_y];
		preplayfield_x[x + min_x][y + min_y] = ' ';
		preplayfield_y[x + ox][y + oy] = preplayfield_y[x + min_x][y + min_y];
		preplayfield_y[x + min_x][y + min_y] = ' ';
	    }
    }
}

// initialization of level from DB
function setup_level()
{
    function cb(obj, row) {
	obj.level = row.level;
	obj.author = row.author;
	return 0;
    }


    db = sqlite3_open("Levels.db");
    if (!db || typeof(db) == "number") {
	elx.print("Levels DB not found.\n");
	return false;
    }

    var retour = new Object;
    sqlite3_exec(db, "SELECT level, author FROM levels WHERE id='" + level + "';", cb, retour);

    sqlite3_close(db);

    var level_str = retour.level;
    goals = new Array();

    preplayfield_x = new Array(PF_W);
    preplayfield_y = new Array(PF_W);
    for (var x = 0; x < PF_W; x++) {
	preplayfield_x[x] = new Array(PF_H);
	preplayfield_y[x] = new Array(PF_H);
    }

    var y = 0;
    while (level_str.length) {
	var line_end = level_str.search(/\n/);
	var line = level_str.substring(0, line_end);
	line = line.replace(/\s+$/, "");
	level_str = level_str.substr(line_end + 1);
	var x = 0, car;
	for (var pos = 0; pos < line.length; pos++) {
	    var nb = 1;
	    var nb_str = '';
	    var nb_char;
	    while (nb_char = line.substr(pos, 1).match(/\d/)) {
		nb_str += nb_char;
		pos++;
	    }
	    if (nb_str.length)
		nb = nb_str;

	    car = line.substr(pos, 1);

	    for (;nb; nb--, x++)
		preplayfield_x[x][y] = preplayfield_y[x][y] = car;
	}
	for (;x < PF_W; x++)
	    preplayfield_x[x][y] = preplayfield_y[x][y] = car;
	y++;
    }

    undo = new Array();

    predisplay();
    display();
    postdisplay(man.x, man.y);

    edje_object_part_text_set(edje_o, "level", "Niveau : " + level);
    edje_object_part_text_set(edje_o, "author", "Auteur : " + retour.author);
    return true;
}

// initialization of playfield
function setup_playfield()
{
    playfield = new Array(3);

    for (var lo = 0; lo < 3; lo++) {
	playfield[lo] = new Array(PF_W);
	for (var x = 0; x < PF_W; x++) {
	    playfield[lo][x] = new Array(PF_H);
	    for (var y = 0; y < PF_H; y++)
		playfield[lo][x][y] = null;
	}
    }
}

function setdown_playfield()
{
    for (var x = 0; x < PF_W; x++)
	for (var y = 0; y < PF_H; y++) {
	    var back = playfield[BACKGROUND][x][y];
	    var fore = playfield[FOREGROUND][x][y];
	    var flor = playfield[FLORGROUND][x][y];
	    if (back) {
		evas_object_del(back.obj);
		if (back.glowobj)
		    evas_object_del(back.glowobj);
	    }
	    if (fore) {
		evas_object_del(fore.obj);
		if (fore.glowobj)
		    evas_object_del(fore.glowobj);
	    }
	    if (flor)
		evas_object_del(flor.obj);
	}
}

// main loop
function loop()
{
    if (displaying_text)
	return 1;

    switch (state) {
    case GAME_SETUP:
	if (setup_level()) {
	    display_image_text('start');
	    evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_DOWN, game_on_key_down, null);
	    evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_UP,   game_on_key_up,   null);
	    state = GAME_RUN;
	}
	break;
    case GAME_RUN:
	break;
    case GAME_NEXT:
	display_image_text('niveau_sup');
	state = GAME_NEXT_SETUP;
	break;
    case GAME_NEXT_SETUP:
	state = GAME_SETUP;
	setdown_playfield();
	setup_playfield();
	break;
    case GAME_SETDOWN:
	setdown_game();
	return 0;
	break;
    }

    if (is_game_over) {
	display_image_text('over');
	state = GAME_SETDOWN;
    }

    return 1;
}

function end_image_text()
{
    displaying_text = false;
}

function display_image_text(name)
{
    displaying_text = true;
    edje_object_signal_emit(image_text, name, "js");
}

function setup_game()
{
    is_game_over = false;
    edje_object_file_set(edje_o, "SokoBox.edj", "game");
    edje_object_signal_emit(edje_o, "play,fond,appear", "js");
    edje_object_signal_emit(edje_o, "play,level,appear", "js");
    edje_object_signal_emit(edje_o, "play,author,appear", "js");
    edje_object_part_text_set(edje_o, "level", 1);
    edje_object_part_text_set(edje_o, "score", 0);
    setup_playfield();
    state = GAME_SETUP;
    image_text = edje_object_add(evas);
    edje_object_file_set(image_text, "SokoBox.edj", "image_text");
    evas_object_layer_set(image_text, 100);
    evas_object_resize(image_text, 720, 576);
    evas_object_show(image_text);
    edje_object_signal_callback_add(image_text, "im_text_end", "edc", end_image_text, null);
    timer = ecore_timer_add(0.1, loop, null);
    level = LEVEL ? LEVEL : level_max;

    if (sample)
	Mix_PlayChannel(-1, sample, -1);
}

function setdown_game()
{
    edje_object_signal_callback_del(image_text, "im_text_end", "edc", end_image_text);
    setdown_playfield();
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, game_on_key_down, null);
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   game_on_key_up,   null);
    evas_object_del(image_text);
    state = MENU;
    setup_menu();

    if (sound)
	Mix_FadeOutChannel(-1, 1000)
}

function background_disappeared(data, e, obj, event)
{
    ecore_main_loop_quit();
}

function menu_disappeared(data, e, obj, event)
{
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, menu_on_key_down, null);
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   menu_on_key_up,   null);
    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 3, 0);
}

// On key down in menu
function menu_on_key_up(data, e, obj, event)
{
    last_ts = event.timestamp;
}

// On key down in menu
function menu_on_key_down(data, e, obj, event)
{
    if (event.timestamp == last_ts)
	return;

    switch (event.keyname) {
    case "KP8":
    case "Up":
    case "FP/Up":
    case "RC/Up":
    case "RCL/Up":
    case "GP/Up":
    case "KP2":
    case "Down":
    case "FP/Down":
    case "RC/Down":
    case "RCL/Down":
    case "GP/Down":
    case "KP4":
    case "Left":
    case "FP/Left":
    case "RC/Left":
    case "RCL/Left":
    case "GP/Left":
    case "KP6":
    case "Right":
    case "FP/Right":
    case "RC/Right":
    case "RCL/Right":
    case "GP/Right":
	edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 1, 1);
	if (sample_btn)
	    Mix_PlayChannel(-1, sample_btn, 0);
	break;
    case "KP_Enter":
    case "Return":
    case "Select":
    case "FP/Ok":
    case "RC/Ok":
    case "RCL/Ok":
	edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 2, 1);
	edje_object_signal_callback_add(edje_o, "menu_disappeared", "edc", menu_disappeared, null);
	if (sample_btn)
	    Mix_PlayChannel(-1, sample_btn, 0);
	break;
    case "Home":
    case "equal":
    case "Escape":
    case "Stop":
    case "Start":
	ecore_main_loop_quit();
	break;
    }
}

function message_cb(data, obj, type, id, msg)
{
    switch (id) {
    case 1:
	if (msg == 0)
	    setup_game();
	else if (msg == 1) {
	    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 4, 1);
	}
	break;
    };
}

// menu setup
function setup_menu()
{
    evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_DOWN, menu_on_key_down, null);
    evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_UP,   menu_on_key_up,   null);

    edje_object_message_handler_set(edje_o, message_cb, null);
    edje_object_signal_callback_add(edje_o, "background_disappeared", "edc", background_disappeared, null);
    edje_object_file_set(edje_o, "SokoBox.edj", "menu");
    evas_object_layer_set(edje_o, 0);
    evas_object_move(edje_o, 0, 0);
    evas_object_resize(edje_o, 720, 576);
    evas_object_show(edje_o);

    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 1, 0);
}

function setup()
{
    if (shutdown == undefined || shutdown == false) {
	ecore_init();
	ecore_evas_init();
	edje_init();

	ee = ecore_evas_new(null, 0, 0, 720, 576, "name=SokoBox;double_buffer=0;");

	evas = ecore_evas_get(ee);

	evas_image_cache_set(evas, 8192 * 1024);
	evas_font_path_prepend(evas, FN);
	evas_font_cache_set(evas, 512 * 1024);
    } else
	evas_object_del(eo_bg);

    var o = evas_object_rectangle_add(evas);
    evas_object_move(o, 0, 0);
    evas_object_resize(o, 720, 576);
    evas_object_color_set(o, 0, 0, 0, 255);
    evas_object_focus_set(o, 1);
    evas_object_show(o);
    backdrop = o;

    edje_o = edje_object_add(evas);

    max_level_load();

    setup_menu();
}

function test_and_create_db(level_db)
{
    if (!level_db || typeof(level_db) == "number")
	return false;

    function level_test_func(obj, row) {
	obj.ok = 1;
	return 0;
    }
    
    var level_obj = {};
    sqlite3_exec(level_db, "SELECT maxi FROM level;", level_test_func, level_obj);

    if (!level_obj.ok)
	sqlite3_exec(level_db, "CREATE TABLE level (maxi varchar(50) PRIMARY KEY NOT NULL);", null, null);

    return true;
}

function max_level_save()
{
    var level_db = sqlite3_open('SokoBox_Level.db');
    var level_crypted;

    for (var lo = 0; lo < rand(10) + 5; lo++)
	level_crypted += c_chars.charAt(rand(52) - 1);

    level_crypted += level_max.toString();

    for (var lo = 0; lo < rand(10) + 5; lo++)
	level_crypted += c_chars.charAt(rand(52) - 1);

    sqlite3_exec(level_db, "DELETE FROM level;", null, null);
    sqlite3_exec(level_db, "INSERT INTO level (maxi) VALUES ('" + de_crypt(level_crypted) + "');", null, null);
    sqlite3_close(level_db);
}

function max_level_load()
{
    var level_max_load = { maxi: "1" };

    var level_db = sqlite3_open('SokoBox_Level.db');
    test_and_create_db(level_db);

    function get_row(obj, row) {
	obj.maxi = de_crypt(row.maxi);
	return 0;
    }

    sqlite3_exec(level_db, "SELECT maxi FROM level;", get_row, level_max_load);
    sqlite3_close(level_db);

    var matched_arr = level_max_load.maxi.match(/^[^\d]*(\d+)[^\d]*$/);
    if (matched_arr)
	level_max = parseInt(matched_arr[1]);
    else
	level_max = 1;
}

var c_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
function symbol(x, y)
{
    var symboled;

    symboled = c_chars.substring(c_chars.length - y, c_chars.length) + c_chars.substring(0, c_chars.length - y);
    symboled = symboled.charAt(x);

    return symboled;
}

function de_crypt(text)
{
    var de_crypted = "", key = "", n;

    for (n = 0; n < Math.floor(text.length / usid.length); n++)
	key += usid;

    key += usid.substring(0, text.length - n * usid.length);

    for (n = 0; n < text.length; n++) {
	var c1 = c_chars.indexOf(key.charAt(n));
	var c2 = c_chars.indexOf(text.charAt(n));
	de_crypted += symbol(c1, c2);
    }

    return de_crypted;
}

// read env for debug
function read_env()
{
    for (var conf in elx.env) {
	var val = elx.env[conf];
	switch (conf) {
	case 'DEBUG':
	    DEBUG = val;
	    break;
	case 'LEVEL':
	    LEVEL = parseInt(val);
	    break;
	}
    }
    debug(1, "DEBUG: " + DEBUG + ', LEVEL: ' + LEVEL);
}

// print <str> if debug level >= <lvl>
function debug(lvl, str)
{
    if (DEBUG >= lvl)
	elx.print('*** [' + lvl + '] ' + str + "\n");
}

function main()
{
    read_env();

    setup();

    ecore_evas_show(ee);

    ecore_main_loop_begin();

    edje_shutdown();
    ecore_evas_shutdown();
    ecore_shutdown();
}

if (test)
    main();

0;
