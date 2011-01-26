// v1.1
// Time-stamp: <26 janvier 2011, 04:19 mid>

var DEBUG = false;
var SOLVABLE = false;
var version = 5;

var test = true;

var shutdown;

if (shutdown == undefined || shutdown == false) {
    test &= elx.load("evas");
    test &= elx.load("ecore");
    test &= elx.load("ecore-evas");
    test &= elx.load("edje");
}

test &= elx.include("ShisenBox.edj", 'scores_time');
test &= elx.include("hof_time-ShisenBox.edj", 'hof_time');

var sound = elx.load("mix");

var FN			= "/.fonts/";
var PF_W		= 24;
var PF_H		= 12;
var MENU		= 0;
var GAME_SETUP		= 1;
var GAME_RUN		= 2;
var GAME_SETDOWN	= 3;
var HOF			= 4;
var OFFSET_X		= 60;
var OFFSET_Y		= 78;
var BLOCK_X		= 25;
var BLOCK_Y		= 35;

// E objects

var ee;
var evas;		// Evas Canvas
var backdrop;		// deep background, always present
var edje_o;		// Current Edje Object
var background;		// game background
var title;		// menu title
var image_text;		// game over, pause, ...
var timer;
var sample, sample_btn;

// game variables
var t_scores_a;
var displaying_text = false;
var displaying_cnx = false;
var playfield, pf_rnd;
var tiles;
var click_tile;
var CX_TO_RIGHT = { cx_right: 1, cx_bg: 1, cx_hg: 1 };
var CX_TO_LEFT  = { cx_left: 1, cx_bd: 1, cx_hd: 1 };
var CX_TO_UP    = { cx_up: 1, cx_bd: 1, cx_bg: 1 };
var CX_TO_DOWN  = { cx_down: 1, cx_hd: 1, cx_hg: 1 };
var with_mouse;
var frame = {};
var has_won, has_lost, has_cheated, is_game_over;
var by10, cur_time, best_time;
var last_ts = null;	// timestamp for key repeat we don't want
var cnt_ts = 0;

function rand(n)
{
    return Math.floor(Math.random() * n + 1);
}

// X(), Y() calc gfx coords
function X(x)
{
    return OFFSET_X + BLOCK_X * x;
}

function Y(y)
{
    return OFFSET_Y + BLOCK_Y * y;
}

function show_cnx(p)
{
    displaying_cnx = true;
    var prev = p[0];
    var prev_name = '';
    var cur, dx, dy, ddx, ddy;
    var name;

    for (var lo = 1; lo < p.length; lo++) {
	cur = p[lo];
	ddx = cur.x - prev.x;
	ddy = cur.y - prev.y;
	dx = ddx > 0 ? 1 : ddx < 0 ? -1 : 0;
	dy = ddy > 0 ? 1 : ddy < 0 ? -1 : 0;
	var nb = ddx ? Math.abs(ddx) : Math.abs(ddy);

	if (lo == 1) {
	    switch (dx + ':' + dy) {
	    case '1:0':
		name = 'cx_right';
		break;
	    case '-1:0':
		name = 'cx_left';
		break;
	    case '0:1':
		name = 'cx_down';
		break;
	    case '0:-1':
		name = 'cx_up';
		break;
	    }
	} else {
	    switch (dx + ':' + dy) {
	    case '1:0':
		if (CX_TO_UP[prev_name])
		    name = 'cx_hg';
		else if (CX_TO_DOWN[prev_name])
		    name = 'cx_bg';
		else
		    debug(1, "BUG!");
		break;
	    case '-1:0':
		if (CX_TO_UP[prev_name])
		    name = 'cx_hd';
		else if (CX_TO_DOWN[prev_name])
		    name = 'cx_bd';
		else
		    debug(1, "BUG!");
		break;
	    case '0:1':
		if (CX_TO_RIGHT[prev_name])
		    name = 'cx_hd';
		else if (CX_TO_LEFT[prev_name])
		    name = 'cx_hg';
		else
		    debug(1, "BUG!");
		break;
	    case '0:-1':
		if (CX_TO_RIGHT[prev_name])
		    name = 'cx_bd';
		else if (CX_TO_LEFT[prev_name])
		    name = 'cx_bg';
		else
		    debug(1, "BUG!");
		break;
	    }
	}

	prev.obj = build_image_block_object(evas, name, 100, 1);
	evas_object_move(prev.obj, X(prev.x), Y(prev.y));

	if (--nb) {
	    var hv = ddx ? 'cx_h' : 'cx_v';
	    prev.line = Array();
		
	    for (var lo2 = 1; lo2 <= nb; lo2++) {
		var obj = build_image_block_object(evas, hv, 100, 1);
		var new_x = prev.x + dx * lo2;
		var new_y = prev.y + dy * lo2;
		evas_object_move(obj, X(new_x), Y(new_y));
		prev.line.push(obj);
	    }
	}

	prev = cur;
	prev_name = name;
    }

    switch (dx + ':' + dy) {
    case '1:0':
	name = 'cx_left';
	break;
    case '-1:0':
	name = 'cx_right';
	break;
    case '0:1':
	name = 'cx_up';
	break;
    case '0:-1':
	name = 'cx_down';
	break;
    }

    cur.obj = build_image_block_object(evas, name, 100, 1);
    evas_object_move(cur.obj, X(cur.x), Y(cur.y));

    timer = ecore_timer_add(1, hide_cnx, p);
}

function del_obj(data, obj, sig, src)
{
    evas_object_del(obj);
}

function make_disappear(obj)
{
    edje_object_signal_emit(obj, "play,tile,disappear,slow", "js");
    edje_object_signal_callback_add(obj, "tile_disappeared", "edc", del_obj, null);
}

function hide_cnx(p)
{
    for (var lo = 0; lo < p.length; lo++) {
	make_disappear(p[lo].obj);
	var inline = p[lo].line;
	if (inline)
	    for (var lo2 = 0; lo2 < inline.length; lo2++)
		make_disappear(inline[lo2]);
    }

    make_disappear(playfield[p[0].x][p[0].y].obj);
    make_disappear(playfield[p[p.length - 1].x][p[p.length - 1].y].obj);

    playfield[p[0].x][p[0].y] = null;
    playfield[p[p.length - 1].x][p[p.length - 1].y] = null;

    if (!some_tiles_left(playfield)) {
	if (has_cheated)
	    has_lost = true;
	else
	    has_won  = true;
	is_game_over = true;
    } else if (!get_hint4game([])) {
	has_lost     = true;
	is_game_over = true;
    }

    displaying_cnx = false;
    return 0;
}

function check_reveal(tile1, tile2)
{
    var p = new Array();

    if (find_path(playfield, tile1.x, tile1.y, tile2.x, tile2.y, p)) {
	show_cnx(p);
    }
}

function click_enter(data)
{
    if (sample_btn)
	Mix_PlayChannel(-1, sample_btn, 0);
    if (click_tile && (click_tile.x != data.x || click_tile.y != data.y) && click_tile.what == data.what) {
	check_reveal(click_tile, data);
	edje_object_signal_emit(click_tile.obj, "play,tile,appear", "js");
	click_tile = null;
    } else {
	if (click_tile)
	    edje_object_signal_emit(click_tile.obj, "play,tile,appear", "js");
	click_tile = data;
	edje_object_signal_emit(click_tile.obj, "play,tile,blink", "js");
    }
}

function on_clicked_cb(data, e, obj, event)
{
    if (displaying_cnx || displaying_text)
	return;

    switch(event.button) {
    case 1:
	click_enter(data);
	break;
    case 2:
    case 3:
	if (click_tile) {
	    edje_object_signal_emit(click_tile.obj, "play,tile,appear", "js");
	    click_tile = null;
	}
	break;
    }
}

// tile object (background block or man or diamond
function TILE(x, y, what, appear)
{
    this.x = x;			// Coordonnées grille actuelles
    this.y = y;
  
    this.what = what;		// Type de pièce
    this.appear = appear;

    this.obj = build_image_block_object(evas, what, 50, appear);
    if (with_mouse)
	evas_object_event_callback_add(this.obj, EVAS_CALLBACK_MOUSE_DOWN, on_clicked_cb, this);

    this.clone = function () {
	return new TILE(this.x, this.y, this.what, this.appear);
    };
}

// load a tile object from the edje file
// <evas> is the evas object
// <name> is the name of the object
// <level> is the plane in which the object is displayed
// <appear> is 1 for "normal" (= slow) appearing animation, 0 for immediate (fast)
function build_image_block_object(evas, name, level, appear)
{
    var o = edje_object_add(evas);
    edje_object_file_set(o, "ShisenBox.edj", name);
    evas_object_resize(o, BLOCK_X, BLOCK_Y);
    evas_object_layer_set(o, level);
    evas_object_show(o);
    if (appear == 1)
	edje_object_signal_emit(o, "play,tile,appear", "js");
    else if (appear == 2)
	edje_object_signal_emit(o, "play,tile,appear,slow", "js");
    else
	edje_object_signal_emit(o, "play,tile,appear,fast", "js");

    return o;
}

// put a block on the screen and record its object in playfield
// <x> and <y> are coords (in blocks)
// <what> is the filename of the block
// <appear> is 1 for "normal" (= slow) appearing animation, 0 for immediate (fast), 2 for extra slow
function set_block(x, y, what, appear)
{
    var block = new TILE(x, y, what, appear);

    if (playfield[x][y]) {
	debug(1, "block at x=" + x + ", y=" + y);
    }

    playfield[x][y] = block;
    evas_object_move(block.obj, X(block.x), Y(block.y));
}

function set_frame(x, y)
{
    if (frame.x != -1)
	evas_object_del(frame.obj);
    frame.obj = build_image_block_object(evas, "frame", 60);
    frame.x = x;
    frame.y = y;
    evas_object_move(frame.obj, X(frame.x), Y(frame.y));
    edje_object_signal_emit(frame.obj, "play,tile,blink", "js");
}

// opposite of set_block()
// <x> and <y> are coords
function del_block(x, y)
{
    var tile;

    if ((tile = playfield[x][y])) {
	evas_object_del(tile.obj);
	playfield[x][y] = null;
    } else {
	debug(1, "No block at x=" + x + ", y=" + y);
    }
}

function tiles_left(pf)
{
    var left = 0;

    for (var x = 0; x < PF_W; x++)
	for (var y = 0; y < PF_H; y++)
	    if (pf[x][y])
		left++;

    return left;
}

function some_tiles_left(pf)
{
    for (var x = 0; x < PF_W; x++)
	for (var y = 0; y < PF_H; y++)
	    if (pf[x][y])
		return true;

    return false;
}

function solvable(pf)
{
    var p = new Array();

    while (get_hint(pf, p)) {
	var front = p.shift();
	var back  = p.pop();

	pf[front.x][front.y] = null;
	pf[back.x][back.y] = null;
	p = new Array();
    }

    return !some_tiles_left(pf);
}

function get_hint(pf, p)
{
    var done = {};
    for(var lo = 0; lo < tiles.length; lo++ )
	done[tiles[lo].what] = 0;
    
    for (var x = 0; x < PF_W; x++) {
	for (var y = 0; y < PF_H; y++) {
	    var tile = pf[x][y];
	    if (tile && done[tile] != 4) {
		// for all these types of tile search path's
		for (var xx = 0; xx < PF_W; xx++)
		    for (var yy = 0; yy < PF_H; yy++)
			if (xx != x || yy != y)
			    if (pf[xx][yy] == tile)
				if (find_path(pf, x, y, xx, yy, p))
				    return true;

		done[tile]++;
	    }
	}
    }
    
    return false;
}

function get_hint4game(p)
{
    var done = {};
    for(var lo = 0; lo < tiles.length; lo++ )
	done[tiles[lo].what] = 0;
    
    for (var x = 0; x < PF_W; x++) {
	for (var y = 0; y < PF_H; y++) {
	    var shuf = pf_rnd[x][y];
	    var new_x = shuf.x;
	    var new_y = shuf.y;
	    if (!playfield[shuf.x][shuf.y])
		continue;
	    var tile = playfield[shuf.x][shuf.y].what;
	    if (tile && done[tile] != 4) {
		// for all these types of tile search path's
		for (var xx = 0; xx < PF_W; xx++)
		    for (var yy = 0; yy < PF_H; yy++)
			if (xx != shuf.x || yy != shuf.y)
			    if (playfield[xx][yy] && playfield[xx][yy].what == tile)
				if (find_path(playfield, shuf.x, shuf.y, xx, yy, p))
				    return true;

		done[tile]++;
	    }
	}
    }
    
    return false;
}

function get_pf(pf, x, y)
{
    if (x == -1 || x == PF_W || y == -1 || y == PF_H)
	return null;

    return pf[x][y];
}

// Can we make a path between two tiles with a single line?
function can_make_path(pf, x1, y1, x2, y2)
{
    if (x1 == x2) {
	for (var lo = Math.min(y1, y2) + 1; lo < Math.max(y1, y2); lo++)
	    if (get_pf(pf, x1, lo))
		return false;
	return true;
    }

    if (y1 == y2) {
	for (var lo = Math.min(x1, x2) + 1; lo < Math.max(x1, x2); lo++)
	    if (get_pf(pf, lo, y1))
		return false;
	return true;
    }

    return false;
}

function find_path(pf, x1, y1, x2, y2, p)
{
    if (find_simple_path(pf, x1, y1, x2, y2, p))
	return true;

    // Find a path of 3 segments
    var dx = [ 1, 0, -1, 0 ];
    var dy = [ 0, 1, 0, -1 ];

    for (var lo = 0; lo < 4; lo++) {
	var new_x = x1 + dx[lo];
	var new_y = y1 + dy[lo];

	while (new_x >= -1 && new_x <= PF_W &&
	       new_y >= -1 && new_y <= PF_H &&
	       !get_pf(pf, new_x, new_y)) {

	    if (find_simple_path(pf, new_x, new_y, x2, y2, p)) {
		p.unshift({ x: x1, y: y1 });
		return true;
	    }

	    new_x += dx[lo];
	    new_y += dy[lo];
	}
    }
    
    return false;
}

// Find a path of 1 or 2 segments between tiles. Returns whether
// a path was found, and if so, the path is returned via 'p'.
function find_simple_path(pf, x1, y1, x2, y2, p)
{
    // Find direct line (path of 1 segment)
    if (can_make_path(pf, x1, y1, x2, y2)) {
	p.push({ x: x1, y: y1 });
	p.push({ x: x2, y: y2 });
	return true;
    }
    
    // If the tiles are in the same row or column, then a
    // a 'simple path' cannot be found between them
    if(x1 == x2 || y1 == y2)
	return false;

    // Find path of 2 segments (route A)
    if (!get_pf(pf, x2, y1) && can_make_path(pf, x1, y1, x2, y1) && can_make_path(pf, x2, y1, x2, y2)) {
	p.push({ x: x1, y: y1 });
	p.push({ x: x2, y: y1 });
	p.push({ x: x2, y: y2 });
	return true;
    }

    // Find path of 2 segments (route B)
    if(!get_pf(pf, x1, y2) && can_make_path(pf, x1, y1, x1, y2) && can_make_path(pf, x1, y2, x2, y2)) {
	p.push({ x: x1, y: y1 });
	p.push({ x: x1, y: y2 });
	p.push({ x: x2, y: y2 });
	return true;
    }

    return false;
}

function hint_me()
{
    if (!DEBUG)
	has_cheated = true;

    if (sample_btn)
	Mix_PlayChannel(-1, sample_btn, 0);

    var p = new Array();

    if (!get_hint4game(p)) {
	debug(1, "bug hint!");
	return;
    }

    var front = p.shift();
    var back  = p.pop();

    check_reveal(front, back);
}

function check_pf(x, y)
{
    if (!in_field(x, y) || !playfield[x][y])
	return false;

    set_frame(x, y);
    return true;
}

function in_field(x, y)
{
    return (x >= 0 && x < PF_W && y >= 0 && y < PF_H);
}

function move_frame(x, y)
{
    var new_frame = { x: frame.x + x, y: frame.y + y };
    if (!in_field(new_frame.x, new_frame.y))
	return;

    var beg, end, beg2, d, on_x;
    switch (x + ":" + y) {
    case "1:0":
	beg = new_frame.x;
	beg2 = new_frame.y;
	end = PF_W;
	d = 1;
	on_x = true;
	break;
    case "-1:0":
	beg = new_frame.x;
	beg2 = new_frame.y;
	end = -1;
	d = -1;
	on_x = true;
	break;
    case "0:1":
	beg = new_frame.y;
	beg2 = new_frame.x;
	end = PF_H;
	d = 1;
	on_x = false;
	break;
    case "0:-1":
	beg = new_frame.y;
	beg2 = new_frame.x;
	end = -1;
	d = -1;
	on_x = false;
	break;
    default:
	break;
    }

    // Technique de "la brasse"...
    var max = Math.abs(end - beg);

    // Impulsion de départ : on pousse en avant loin au début...
    for (var lo = 0; lo != max + 1; lo++) {
	if (on_x) {
	    if (check_pf(beg + d * lo, beg2))
		return;
	} else {
	    if (check_pf(beg2,         beg + d * lo))
		return;
	}
    }

    // De plus en plus en avant...
    for (var lo = 0; lo <= max; lo++) {
	// On pousse sur les côtés...
	for (var lo2 = 1; lo2 <= lo; lo2++) {
	    if (on_x) {
		if (check_pf(beg + d * lo, beg2 + lo2))
		    return;
		if (check_pf(beg + d * lo, beg2 - lo2))
		    return;
	    } else {
		if (check_pf(beg2 + lo2, beg + d * lo))
		    return;
		if (check_pf(beg2 - lo2, beg + d * lo))
		    return;
	    }
	}

	// Et on ramène en arrière...
	for (var lo2 = 1; lo2 <= lo; lo2++) {
	    if (on_x) {
		if (check_pf(beg + d * (lo - lo2), beg2 + lo))
		    return;
		if (check_pf(beg + d * (lo - lo2), beg2 - lo))
		    return;
	    } else {
		if (check_pf(beg2 + lo, beg + d * (lo - lo2)))
		    return;
		if (check_pf(beg2 - lo, beg + d * (lo - lo2)))
		    return;
	    }
	}
    }

    // Sinon on coule...
}

// "key released" handler for RC game
function game_rc_on_key_up(data, e, obj, event)
{
    last_ts = event.timestamp;
}

// "key pressed" handler for RC game
function game_rc_on_key_down(data, e, obj, event)
{
    if (displaying_cnx || displaying_text)
	return;

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
    case "F2":
        if (version == 6)
            is_game_over = true;
        break;
    case "Right":
    case "FP/Right":
    case "RC/Right":
    case "RCL/Right":
    case "GP/Right":
	move_frame(1, 0);
	break;
    case "Left":
    case "FP/Left":
    case "RC/Left":
    case "RCL/Left":
    case "GP/Left":
	move_frame(-1, 0);
	break;
    case "Up":
    case "FP/Up":
    case "RC/Up":
    case "RCL/Up":
    case "GP/Up":
	move_frame(0, -1);
	break;
    case "Down":
    case "FP/Down":
    case "RC/Down":
    case "RCL/Down":
    case "GP/Down":
	move_frame(0, 1);
	break;
    case "y":
    case "Yellow":
	hint_me();
	break;
    case "x":
    case "Blue":
    case "A":
    case "Green":
    case "b":
    case "Red":
    case "KP_Enter":
    case "Return":
    case "Select":
    case "FP/Ok":
    case "RC/Ok":
    case "RCL/Ok":
	var f_tile = playfield[frame.x][frame.y];
	if (f_tile)
	    click_enter(f_tile);
	break;
    default:
	break;
    }
}

// "key pressed" handler for mouse game
function game_mouse_on_key_down(data, e, obj, event)
{
    if (displaying_cnx || displaying_text)
	return;

    switch (event.keyname) {
    case "Home":
    case "equal":
    case "Escape":
    case "Stop":
    case "Start":
	is_game_over = true;
	break;
    case "y":
    case "Yellow":
	hint_me();
	break;
    default:
	break;
    }
}

function setup_board()
{
    var pf_ini = new Array();
    pf_rnd = new Array();
    reset_playfield(pf_ini);
    reset_playfield(pf_rnd);

    for (var x = 0; x < PF_W; x++)
	for (var y = 0; y < PF_H; y++) {
	    pf_ini[x][y] = tiles[(y * PF_W + x) % tiles.length ].what;
	    pf_rnd[x][y] = { x: x, y: y };
	}

    // shuffle the fields
    for (var x = 0; x < PF_W; x++)
	for (var y = 0; y < PF_H; y++) {
	    var t;
	    var tx = rand(PF_W) - 1;
	    var ty = rand(PF_H) - 1;

	    t = pf_ini[x][y];
	    pf_ini[x][y] = pf_ini[tx][ty];
	    pf_ini[tx][ty] = t;

	    t = pf_rnd[x][y];
	    pf_rnd[x][y] = pf_rnd[tx][ty];
	    pf_rnd[tx][ty] = t;
	}

    if (SOLVABLE) {
	var tpos = new Array();
	var ttiles = new Array();
	var pf_ini_work = new Array();
	reset_playfield(pf_ini_work);
	copy_playfield(pf_ini, pf_ini_work);

	while (!solvable(pf_ini_work)) {
	    var num_tiles = 0;

	    for (var x = 0; x < PF_W; x++)
		for (var y = 0; y < PF_H; y++)
		    if (pf_ini_work[x][y]) {
			tpos[num_tiles] = { x: x, y: y };
			ttiles[num_tiles] = pf_ini_work[x][y];
			num_tiles++;
		    }

	    debug(1, 'num_tiles = ' + num_tiles);

	    // redistribute unsolved tiles
	    while (num_tiles > 0) {
		// get a random tile
		var r1 = rand(num_tiles) - 1;
		var r2 = rand(num_tiles) - 1;

		var tile = ttiles[r1];
		var apos = tpos[r2];
	    
		// truncate list
		ttiles[r1] = ttiles[num_tiles - 1];
		tpos[r2]   = tpos[num_tiles - 1];
		num_tiles--;
	    
		// put this tile on the new position
		pf_ini_work[apos.x][apos.y] = tile;
		pf_ini[apos.x][apos.y] = tile;
	    }
	}
    }
    
    playfield = new Array();
    reset_playfield(playfield);

    for (var x = 0; x < PF_W; x++)
	for (var y = 0; y < PF_H; y++)
	    set_block(x, y, pf_ini[x][y]);

    return true;
}

// copy of a playfield
function copy_playfield(pf_src, pf_dst)
{
    for (var x = 0; x < PF_W; x++)
	for (var y = 0; y < PF_H; y++)
	    pf_dst[x][y] = pf_src[x][y];
}

// initialization of playfield
function reset_playfield(pf)
{
    for (var x = 0; x < PF_W; x++) {
	pf[x] = new Array(PF_H);
	for (var y = 0; y < PF_H; y++)
	    pf[x][y] = null;
    }
}

function setup_tiles()
{
    var lo;
    tiles = new Array();

    for (lo = 1; lo <= 9; lo++) {
	tiles.push({ what: 'b' + lo, nb: lo});
	tiles.push({ what: 'p' + lo, nb: lo});
	tiles.push({ what: 'n' + lo, nb: lo});
    }

    tiles.push({ what: 'c', nb: lo++ });
    tiles.push({ what: 'f', nb: lo++ });
    tiles.push({ what: 'p', nb: lo++ });
    tiles.push({ what: 't1', nb: lo++ });
    tiles.push({ what: 't2', nb: lo++ });
    tiles.push({ what: 'bamboo', nb: lo++ });
    tiles.push({ what: 'orchid', nb: lo++ });
    tiles.push({ what: 'plum', nb: lo++ });
    tiles.push({ what: 'mum', nb: lo++ });
}

function to0(x)
{
    if (x < 10)
	return "0" + x;
    return x;
}

function to_hms(s)
{
    var h  = Math.floor(s / 3600);
    s -= h  * 3600;
    var mn = Math.floor(s / 60);
    s -= mn * 60;

    return to0(h) + ':' + to0(mn) + ':' + to0(s);
}

// main loop
function loop()
{
    if (displaying_text)
	return 1;

    switch (state) {
    case GAME_SETUP:
	if (setup_board()) {
	    display_image_text('start');
	    if (with_mouse)
		evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_DOWN, game_mouse_on_key_down, null);
	    else {
		evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_DOWN, game_rc_on_key_down,    null);
		evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_UP,   game_rc_on_key_up,      null);
	    }
	    state = GAME_RUN;
	}
	cur_time = by10 = 0;
	break;
    case GAME_RUN:
	if (++by10 == 10) {
	    by10 = 0;
	    cur_time++;
	    edje_object_part_text_set(edje_o, "time", "Temps : " + to_hms(cur_time));
	}
	break;
    case GAME_SETDOWN:
	setdown_game();
	return 0;
	break;
    }

    if (is_game_over) {
	if (has_won)
	    display_image_text('won');
	else if (has_lost)
	    display_image_text('lost');
	else
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

function setup_game(btn)
{
    with_mouse = btn == 1;
    is_game_over = false;
    click_tile = null;
    edje_object_file_set(edje_o, "ShisenBox.edj", "game");
    edje_object_signal_emit(edje_o, "play,fond,appear", "js");
    state = GAME_SETUP;
    image_text = edje_object_add(evas);
    edje_object_file_set(image_text, "ShisenBox.edj", "image_text");
    evas_object_layer_set(image_text, 100);
    evas_object_resize(image_text, 720, 576);
    evas_object_show(image_text);
    edje_object_signal_callback_add(image_text, "im_text_end", "edc", end_image_text, null);
    edje_object_signal_emit(edje_o, "play,time,appear", "js");
    edje_object_signal_emit(edje_o, "play,best_time,appear", "js");
    edje_object_part_text_set(edje_o, "time", "Temps : 00:00:00");
    edje_object_part_text_set(edje_o, "best_time", "Meilleur : " + to_hms(best_time));

    if (with_mouse)
	ecore_evas_cursor_set(ee, "freebox-mouse.png", 200, 0, 0);
    else {
	frame.x = frame.y = -1;
	set_frame(0, 0);
    }

    timer = ecore_timer_add(0.1, loop, null);

    is_game_over = has_won = has_lost = has_cheated = false;

    if (sample)
	Mix_PlayChannel(1, sample, -1);
}

function hof_cb(pos, name)
{
    if (pos) {
	t_scores_a[pos] = { rank: pos, name: name, time: cur_time };
	scores_save(t_scores_a);
    }
    state = MENU;
    setup_menu();
}

function setdown_game()
{
    edje_object_signal_callback_del(image_text, "im_text_end", "edc", end_image_text);
    if (with_mouse) {
        evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, game_mouse_on_key_down, null);
	ecore_evas_cursor_set(ee, null, 0, 0, 0);
    } else {
        evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, game_rc_on_key_down, null);
	evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   game_rc_on_key_up, null);
    }
    evas_object_del(image_text);
    if (!with_mouse)
	evas_object_del(frame.obj);

    for (var y = 0; y < PF_H; y++)
	for (var x = 0; x < PF_W; x++)
	    if (playfield[x][y])
		make_disappear(playfield[x][y].obj);

    if (sound)
	Mix_FadeOutChannel(-1, 1000)

    if (has_won && (new_score_pos = scores_check(t_scores_a, cur_time))) {
	state = HOF;
	hof_setup("ShisenBox", backdrop, edje_o, evas, hof_cb, t_scores_a, new_score_pos);
    } else {
	state = MENU;
	setup_menu();
    }
}

function fond_disappeared(data, obj, sig, src)
{
    setup_menu();
}

function background_disappeared_quit(data, e, obj, event)
{
    ecore_main_loop_quit();
}

function background_disappeared_hof(data, e, obj, event)
{
    edje_object_signal_callback_del(edje_o, "background_disappeared_hof", "edc",  background_disappeared_hof);
    hof_setup("ShisenBox", backdrop, edje_o, evas, hof_cb, t_scores_a, 0);
}

function menu_disappeared(data, e, obj, event)
{
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, menu_on_key_down, null);
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   menu_on_key_up, null);
    edje_object_signal_callback_del(edje_o, "menu_disappeared", "edc", menu_disappeared);
    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 3, data);
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
    case "FP/Up":
    case "RC/Up":
    case "RCL/Up":
    case "GP/Up":
    case "KP8":
    case "Up":
	edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 1, 0);
	if (sample_btn)
	    Mix_PlayChannel(-1, sample_btn, 0);
	break;
    case "KP2":
    case "FP/Down":
    case "RC/Down":
    case "RCL/Down":
    case "GP/Down":
    case "Down":
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
	edje_object_signal_callback_add(edje_o, "menu_disappeared", "edc", menu_disappeared, 1);
	if (sample_btn)
	    Mix_PlayChannel(-1, sample_btn, 0);
	break;
    case "Red":
    case "b":
    case "Yellow":
    case "y":
    case "Green":
    case "a":
    case "Blue":
    case "x":
    case "h":
	edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 2, 1);
	edje_object_signal_callback_add(edje_o, "menu_disappeared", "edc", menu_disappeared, 2);
	if (sample_btn)
	    Mix_PlayChannel(-1, sample_btn, 0);
	break;
    case "F1":
    case "F2":
    case "F3":
    case "F4":
        if (version == 6) {
            edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 2, 1);
            edje_object_signal_callback_add(edje_o, "menu_disappeared", "edc", menu_disappeared, 2);
            if (sample_btn)
                Mix_PlayChannel(-1, sample_btn, 0);
        }
        break;
    case "Home":
    case "equal":
    case "Escape":
	ecore_main_loop_quit();
	break;
    }
}

function message_cb(data, obj, type, id, msg)
{
    switch (id) {
    case 1:
	if (msg < 2)
	    setup_game(msg);
	else if (msg == 2) {
	    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 4, 1);
	} else if (msg == 3) {
	    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 5, 1);
	}
	break;
    };
}

// menu setup
function setup_menu()
{
    evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_DOWN, menu_on_key_down, null);
    evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_UP,   menu_on_key_up  , null);

    edje_object_message_handler_set(edje_o, message_cb, null);
    edje_object_signal_callback_add(edje_o, "fond_disappeared", "edc", fond_disappeared, null);
    edje_object_signal_callback_add(edje_o, "background_disappeared_quit", "edc", background_disappeared_quit, null);
    edje_object_signal_callback_add(edje_o, "background_disappeared_hof", "edc",  background_disappeared_hof, null);
    edje_object_file_set(edje_o, "ShisenBox.edj", "menu");
    evas_object_layer_set(edje_o, 0);
    evas_object_move(edje_o, 0, 0);
    evas_object_resize(edje_o, 720, 576);
    evas_object_show(edje_o);

    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 1, 2);
}

function setup()
{
    if (shutdown == undefined || shutdown == false) {
	ecore_init();
	ecore_evas_init();
	edje_init();

	ee = ecore_evas_new(null, 0, 0, 720, 576, "name=ShisenBox");

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

    if (!scores_init("ShisenBox")) {
	debug(1, "Could not init scores");
	return false;
    }

    t_scores_a = scores_load();
    best_time = t_scores_a[1].time;

    if (sound) {
	Mix_OpenAudio(44100, 0x9010, 2, 1024);
	sample = Mix_LoadWAV("shinzen.ogg");
	sample_btn = Mix_LoadWAV("bip_bouton.wav");
    }

    setup_tiles();
    setup_menu();

    return true;
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
	case 'SOLVABLE':
	    SOLVABLE = val;
	    break;
	case 'version':
	    version = parseInt(val);
            if (version > 5)
                SOLVABLE = true; // always solvable on v6
	    break;
	}
    }
    debug(1, "DEBUG: " + DEBUG);
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

    if (setup()) {
	
	ecore_evas_show(ee);
	
	ecore_main_loop_begin();
    }

    edje_shutdown();
    ecore_evas_shutdown();
    ecore_shutdown();
}

if (test)
    main();
