// v1.1
// Time-stamp: <26 janvier 2011, 04:51 mid>
// Tableaux from http://www.vbfrance.com/codes/NIBBLES-QBASIC_2107.aspx

var DEBUG = false;
var LEVEL = 0;
var version = 5;

var test = true;

var shutdown;

if (shutdown == undefined || shutdown == false) {
    test &= elx.load("evas");
    test &= elx.load("ecore");
    test &= elx.load("ecore-evas");
    test &= elx.load("edje");
}

test &= elx.include("SnakeBox.edj", 'scores_level');
test &= elx.include("hof_level-SnakeBox.edj", 'hof_level');

var sound = elx.load("mix");
var sample, sample_btn, sample_eat, sample_die, sample_bonus;

var FN			= "/.fonts/";
var PF_W		= 64;		// Game area width
var PF_H		= 40;		// Game area height

// Game states
var MENU		= 0;
var GAME_SETUP		= 1;
var GAME_RUN		= 2;
var GAME_NEXT		= 3;
var GAME_NEXT_SETUP	= 4;
var GAME_SETDOWN	= 5;
var HOF			= 6;

var OFFSET_X		= 40;		// X offset of game field
var OFFSET_Y		= 88;		// Y offset of game field
var BLOCK_X		= 10;		// Block width
var BLOCK_Y		= 10;		// Block height
var BONUSES = [ 'beer', 'tux', 'rasta_ball' ];	// Bonus names
var BONUSES_H = new Object;		// Bonus hash
for (var lo = 0; lo < BONUSES.length; lo++) // Loop on bonuses' array
    BONUSES_H[BONUSES[lo]] = 1;		// Fill hash

// E objects

var ee;
var evas;		// Evas Canvas
var backdrop;		// Deep background, always present
var edje_o;		// Current Edje Object
var background;		// Game background
var title;		// Menu title
var image_text;		// Game over, pause, ...
var timer;		// Main timer object

// game variables
var displaying_text = false;	// Are we displaying a text?
var playfield;			// Main game area array
var level;			// Level
var hof_tested;			//
var hi_score;			// High score
var is_game_over;		// Is game over?
var n_snakes;			// Number of snakes (1 or 2)
var l_snakes;			// Number of living snakes (0, 1 or 2)
var snakes;			// Array of snakes objects
var scores;			// Array of scores
var number;			// Value of goal bonus (1 to 10)
var main_timer;			// Timing of game (in seconds)
var dxy = { up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 } };	// Convert direction to x/y deplacement
var TO_RIGHT = { right: 1, bg: 1, hg: 1, h: 1 };	// Snake part that 'look' on right
var TO_LEFT  = { left: 1, bd: 1, hd: 1, h: 1 };		// Snake part that 'look' on left
var TO_UP    = { up: 1, bd: 1, bg: 1, v: 1 };		// Snake part that 'look' up
var TO_DOWN  = { down: 1, hd: 1, hg: 1, v: 1 };		// Snake part that 'look' down
var last_ts  = null;

// Randomize function
function rand(n)
{
    return Math.floor(Math.random() * n);
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

// Callback to delete a disappearing object
function del_obj(data, obj, sig, src)
{
    evas_object_del(obj);
}

// Make an object disappear
function make_disappear(obj)
{
    edje_object_signal_emit(obj, "play,block,disappear,slow", "js");
    edje_object_signal_callback_add(obj, "block_disappeared", "edc", del_obj, null);
}

function do_die(that)
{
    that.dead = true;
    that.bang();

    var that2 = snakes[2 - that.nb];
    if (l_snakes == 2 && that.new_x == that2.x && that.new_y == that2.y) {
	that2.dead = true;
	that2.bang();
	l_snakes--;
    }

    l_snakes--;

    if (sample_die)
	Mix_PlayChannel(-1, sample_die, 0);

    return 0;
}

// Snake object
function SNAKE(x, y, nb, direction, appear)
{
    this.x = x;
    this.new_x = x;
    this.y = y;
    this.new_y = y;
    this.level = 1;

    this.head = new BLOCK(x, y, 'h_' + direction, nb - 1, appear);
    this.tail = new BLOCK(x - dxy[direction].dx, y - dxy[direction].dy, 't_' + direction, nb - 1, appear);
    this.body = new Array();	// Pas de body au départ
    this.bodywait = 0; // Nombre de bodies en attente d'insertion

    this.nb = nb;		// Numéro du snake
    this.score = scores[nb - 1];// Snake's score
    this.direction = direction; // Direction ('up', 'left'...)
    this.old_direction = direction; // Keep track of last dir
    this.dead = false;		// Flag in case of collision
    this.appear = appear;	// Appear method (0, 1 or 2)

    this.bang = function() {
	this.level = level;	// keep that for hof

	del_block(this.x, this.y);
	var bang = set_block(this.x, this.y, 'bang');
	make_disappear(bang.obj);
	playfield[this.x][this.y] = null;
	
	for (var lo = 0; lo < this.body.length; lo++) {
	    var body = this.body[lo];
	    make_disappear(body.obj);
	    playfield[body.x][body.y] = null;
	}

	make_disappear(this.tail.obj);
	playfield[this.tail.x][this.tail.y] = null;
    }

    this.add_score = function(nb) {
	this.score += nb;
	scores[this.nb - 1] = this.score;
	edje_object_part_text_set(edje_o, "score_" + this.nb.toString(), this.score.toString());

	if (this.score > hi_score) {
	    hi_score = this.score;
	    edje_object_part_text_set(edje_o, "hi_score", hi_score.toString());
	}
    }

    this.move = function () {
	if (this.dead) {
	    return;
	}

	var last_x = this.x;
	var last_y = this.y;
	var tail_dir = this.old_direction = this.direction;

	this.x += dxy[this.direction].dx;
	this.y += dxy[this.direction].dy;

	var coll = { what: 'wall' };
	if (this.x > 0 && this.x < PF_W - 1 && this.y > 0 && this.y < PF_H - 1) {
	    coll = playfield[this.x][this.y];
	}
	
	if (coll) {	// Collision
	    if (coll.what == 'apple') {
		if (sample_eat)
		    Mix_PlayChannel(-1, sample_eat, 0);

		this.addlen(number * 2);
		this.add_score(number + Math.floor((level - 1) / 10) * 10);

		del_block(this.x, this.y);
		if (number++ == 10)
		    state = GAME_NEXT;
		else
		    niou_apple();

	    } else if (BONUSES_H[coll.what]) {	// eat bonus
		if (sample_bonus)
		    Mix_PlayChannel(-1, sample_bonus, 0);

		this.addlen(number);
		this.add_score(number + Math.floor((level - 1) / 10) * 10);

		del_block(this.x, this.y);
	    } else {
		this.new_x = this.x;
		this.new_y = this.y;
		this.x = last_x;
		this.y = last_y;

		ecore_idler_add(do_die, this); // Delay dying

		return;
	    }
	}

	this.head.move_to(this.x, this.y, 'h_' + this.direction);

	if (this.body.length || this.bodywait) {
	    var first, flwhat, new_bdir;

	    if (this.body.length)
		first = this.body[0];
	    else
		first = this.tail;

	    var flwhat = first.what.substr(2);

	    switch (this.direction) {
	    case 'left':
		if (TO_LEFT[flwhat] && this.y == first.y)
		    new_bdir = 'b_h';
		else if (TO_UP[flwhat] && this.y < first.y)
		    new_bdir = 'b_hd';
		else if (TO_DOWN[flwhat] && this.y > first.y)
		    new_bdir = 'b_bd';
		break;

	    case 'right':
		if (TO_RIGHT[flwhat] && this.y == first.y)
		    new_bdir = 'b_h';
		else if (TO_UP[flwhat] && this.y < first.y)
		    new_bdir = 'b_hg';
		else if (TO_DOWN[flwhat] && this.y > first.y)
		    new_bdir = 'b_bg';
		break;

	    case 'up':
		if (TO_UP[flwhat] && this.x == first.x)
		    new_bdir = 'b_v';
		else if (TO_LEFT[flwhat] && this.x < first.x)
		    new_bdir = 'b_bg';
		else if (TO_RIGHT[flwhat] && this.x > first.x)
		    new_bdir = 'b_bd';
		break;

	    case 'down':
		if (TO_DOWN[flwhat] && this.x == first.x)
		    new_bdir = 'b_v';
		else if (TO_LEFT[flwhat] && this.x < first.x)
		    new_bdir = 'b_hg';
		else if (TO_RIGHT[flwhat] && this.x > first.x)
		    new_bdir = 'b_hd';
		break;
	    }

	    var last;
	    if (this.bodywait) {
		last = new BLOCK(last_x, last_y, new_bdir, this.nb - 1, this.appear);
		last_x = this.tail.x;
		last_y = this.tail.y;
	    } else {
		last = this.body.pop();
		var llast_x = last.x;
		var llast_y = last.y;
		last.move_to(last_x, last_y, new_bdir);
		last_x = llast_x;
		last_y = llast_y;
	    }
	    
	    this.body.unshift(last); // last go to first place
	    
	    if (this.bodywait == 0) {
		var blast = this.body[this.body.length - 1]; // take next last
		
		flwhat = blast.what.substr(2);
		
		if (TO_RIGHT[flwhat] && last_x > blast.x)
		    tail_dir = 'left';
		else if (TO_LEFT[flwhat] && last_x < blast.x)
		    tail_dir = 'right';
		else if (TO_DOWN[flwhat] && last_y > blast.y)
		    tail_dir = 'up';
		else if (TO_UP[flwhat] && last_y < blast.y)
		    tail_dir = 'down';
	    } else
		this.bodywait--;
	}
	
	if (this.tail.x != last_x || this.tail.y != last_y) {
	    this.tail.move_to(last_x, last_y, 't_' + tail_dir);
	}
    }

    this.addlen = function (len) {
	this.bodywait += len;
    }

    this.clone = function () {
	return new SNAKE(this.x, this.y, this.nb, this.direction, this.appear);
    };
}

// block object
function BLOCK(x, y, what, nb, appear)
{
    this.x = x;			// Coordonnées grille actuelles
    this.y = y;
  
    this.what = what;		// Type de pièce
    this.nb = nb;		// Numéro de snake ou autre (1 = change color)
    this.appear = appear;

    this.obj = build_image_block_object(evas, what, 50, appear);
    if (nb)
	evas_object_color_set(this.obj, 128, 255, 255, 255);
    evas_object_move(this.obj, X(this.x), Y(this.y));
    playfield[x][y] = this;

    this.move_to = function (x, y, what) {
	playfield[this.x][this.y] = null;

	if (what != this.what) {
	    evas_object_del(this.obj);
	    this.obj = build_image_block_object(evas, what, 50, 0);
	    if (this.nb)
		evas_object_color_set(this.obj, 128, 255, 255, 255);
	    this.what = what;
	}

	this.x = x;
	this.y = y;

	evas_object_move(this.obj, X(this.x), Y(this.y));
	playfield[x][y] = this;
    }

    this.clone = function () {
	return new BLOCK(this.x, this.y, this.what, this.nb, this.appear);
    };
}

// load a block object from the edje file
// <evas> is the evas object
// <name> is the name of the object
// <level> is the plane in which the object is displayed
// <appear> is 1 for "normal" (= slow) appearing animation, 0 for immediate (fast)
function build_image_block_object(evas, name, level, appear)
{
    var o = edje_object_add(evas);
    edje_object_file_set(o, "SnakeBox.edj", name);
    evas_object_resize(o, BLOCK_X, BLOCK_Y);
    evas_object_layer_set(o, level);
    evas_object_show(o);
    if (appear == 1)
	edje_object_signal_emit(o, "play,block,appear", "js");
    else if (appear == 2)
	edje_object_signal_emit(o, "play,block,appear,slow", "js");
    else
	edje_object_signal_emit(o, "play,block,appear,fast", "js");

    return o;
}

// put a block on the screen and record its object in playfield[backfore]
// <x> and <y> are coords (in blocks)
// <what> is the filename of the block
// <appear> is 1 for "normal" (= slow) appearing animation, 0 for immediate (fast), 2 for extra slow
function set_block(x, y, what, appear)
{
    if (playfield[x][y]) {
	debug(1, "block at x=" + x + ", y=" + y);
    }

    return new BLOCK(x, y, what, 0, appear);
}

// opposite of set_block()
// <x> and <y> are coords
function del_block(x, y)
{
    var block;

    if ((block = playfield[x][y])) {
	evas_object_del(block.obj);
	playfield[x][y] = null;
    } else {
	debug(1, "No block at x=" + x + ", y=" + y);
    }
}

function play_game()
{
    for (var lo = 0; lo < n_snakes; lo++) {
	snakes[lo].move();
    }

    if (!l_snakes) {
	is_game_over = true;
	return;
    }

    if (rand(100) == 0) {
	var x, y;
	do {
	    x = rand(PF_W - 2) + 1;
	    y = rand(PF_H - 2) + 1;
	} while (playfield[x][y]);
	
	set_block(x, y, BONUSES[rand(BONUSES.length)], 1);
    }
}

function in_field(x, y)
{
    return (x >= 0 && x < PF_W && y >= 0 && y < PF_H);
}

// "key released" handler
function game_on_key_up(data, e, obj, event)
{
    switch (event.keyname) {
    case "Right":
    case "Left":
    case "Up":
    case "Down":
	break;
    default:
	break;
    }
}

// "key pressed" handler
function game_on_key_down(data, e, obj, event)
{
    var snake1dir = snakes[0].old_direction;
    var snake2dir = snakes[n_snakes - 1].old_direction;

    switch (event.keyname) {
    case "Home":
    case "equal":
    case "Escape":
	is_game_over = true;
	break;
    case "Right":
    case "FP/Right":
    case "RC/Right":
    case "RCL/Right":
    case "GP/Right":
	if (snake1dir != 'left')
	    snakes[0].direction = 'right';
	break;
    case "Left":
    case "FP/Left":
    case "RC/Left":
    case "RCL/Left":
    case "GP/Left":
	if (snake1dir != 'right')
	    snakes[0].direction = 'left';
	break;
    case "Up":
    case "FP/Up":
    case "RC/Up":
    case "RCL/Up":
    case "GP/Up":
	if (snake1dir != 'down')
	    snakes[0].direction = 'up';
	break;
    case "Down":
    case "FP/Down":
    case "RC/Down":
    case "RCL/Down":
    case "GP/Down":
	if (snake1dir != 'up')
	    snakes[0].direction = 'down';
	break;
    case "b":
    case "KP6":
	if (snake2dir != 'left')
	    snakes[n_snakes - 1].direction = 'right';
	break;
    case "x":
    case "KP4":
	if (snake2dir != 'right')
	    snakes[n_snakes - 1].direction = 'left';
	break;
    case "y":
    case "KP8":
	if (snake2dir != 'down')
	    snakes[n_snakes - 1].direction = 'up';
	break;
    case "a":
    case "KP2":
	if (snake2dir != 'up')
	    snakes[n_snakes - 1].direction = 'down';
	break;
    default:
	break;
    }
}

function setup_game_vars()
{
    main_timer = 0.2 - Math.floor((level - 1 ) / 10) / 25; // Remove 0.04 seconds for 10 levels
    number = 1;
    snakes = new Array();
    l_snakes = n_snakes;
    is_game_over = false;
    hof_tested = 0;
}

function niou_apple() // niou because 'new' causes bad emacs indentation :-(
{
    var x, y;
    do {
	x = rand(PF_W - 2) + 1;
	y = rand(PF_H - 2) + 1;
    } while (playfield[x][y]);

    var apple = set_block(x, y, 'apple');
    edje_object_signal_emit(apple.obj, "play,block,blink", "js");
}

function setup_playfield()
{
    setup_game_vars();
    reset_playfield();

    switch ((level - 1) % 10) {
    case 0:
	snakes.push(new SNAKE(26, 20, 1, 'right'));
	if (n_snakes == 2)
	    snakes.push(new SNAKE(40, 20, 2, 'left'));
	break;

    case 1:
	for (var x = 16; x <= 48; x++)
	    set_block(x, 20, 'wall');
	snakes.push(new SNAKE(16, 6,  1, 'right'));
	if (n_snakes == 2)
	    snakes.push(new SNAKE(48, 34, 2, 'left'));
	break;

    case 2:
	for (var y = 8; y <= 32; y++) {
	    set_block(16, y, 'wall');
	    set_block(48, y, 'wall');
	}
	snakes.push(new SNAKE(24, 20, 1, 'down'));
	if (n_snakes == 2)
	    snakes.push(new SNAKE(40, 20, 2, 'up'));
	break;

    case 3:
	for (var y = 1; y <= 20; y++) {
	    set_block(16,      y, 'wall');
	    set_block(48, 40 - y, 'wall');
	}
	for (var x = 1; x <= 32; x++) {
	    set_block(     x, 28, 'wall');
	    set_block(64 - x, 12, 'wall');
	}
	snakes.push(new SNAKE(16, 34, 1, 'right'));
	if (n_snakes == 2)
	    snakes.push(new SNAKE(48, 6,  2, 'left'));
	break;

    case 4:
	for (var y = 10; y <= 30; y++) {
	    set_block(16, y, 'wall');
	    set_block(48, y, 'wall');
	}
	for (var x = 18; x <= 46; x++) {
	    set_block(     x, 8,  'wall');
	    set_block(64 - x, 32, 'wall');
	}
	snakes.push(new SNAKE(24, 20, 1, 'right'));
	if (n_snakes == 2)
	    snakes.push(new SNAKE(40, 20, 2, 'left'));
	break;

    case 5:
	for (var y = 1; y <= 38; y++)
	    if (y < 16 || y > 23) {
		set_block(8,  y, 'wall');
		set_block(16, y, 'wall');
		set_block(24, y, 'wall');
		set_block(32, y, 'wall');
		set_block(40, y, 'wall');
		set_block(48, y, 'wall');
		set_block(56, y, 'wall');
	    }
	snakes.push(new SNAKE(12, 34, 1, 'up'));
	if (n_snakes == 2)
	    snakes.push(new SNAKE(52, 6,  2, 'down'));
	break;

    case 6:
	for (var xy = 4; xy <= 35; xy++) {
	    set_block(xy,      xy, 'wall');
	    set_block(xy + 24, xy, 'wall');
	}
	snakes.push(new SNAKE(4,  12, 1, 'down'));
	if (n_snakes == 2)
	    snakes.push(new SNAKE(60, 28, 2, 'up'));
	break;

    case 7:
	for (var y = 1; y < 40; y += 2)
	    set_block(32, y, 'wall');
	snakes.push(new SNAKE(12, 34, 1, 'right'));
	if (n_snakes == 2)
	    snakes.push(new SNAKE(52, 6,  2, 'left'));
	break;

    case 8:
	for (var y = 1; y < 32; y++) {
	    set_block(8,       y, 'wall');
	    set_block(16, 40 - y, 'wall');
	    set_block(24,      y, 'wall');
	    set_block(32, 40 - y, 'wall');
	    set_block(40,      y, 'wall');
	    set_block(48, 40 - y, 'wall');
	    set_block(56,      y, 'wall');
	}
	snakes.push(new SNAKE(12, 34, 1, 'up'));
	if (n_snakes == 2)
	    snakes.push(new SNAKE(52, 6,  2, 'down'));
	break;

    case 9:
	for (var y = 1; y < 38; y += 2) {
	    set_block(8,  y    , 'wall');
	    set_block(16, y + 1, 'wall');
	    set_block(24, y    , 'wall');
	    set_block(32, y + 1, 'wall');
	    set_block(40, y    , 'wall');
	    set_block(48, y + 1, 'wall');
	    set_block(56, y    , 'wall');
	}
	snakes.push(new SNAKE(12, 34, 1, 'up'));
	if (n_snakes == 2)
	    snakes.push(new SNAKE(52, 6,  2, 'down'));
	break;

    }

    niou_apple();
}

function setdown_playfield()
{
    for (var x = 0; x < PF_W; x++)
	for (var y = 0; y < PF_H; y++)
	    if (playfield[x][y])
		make_disappear(playfield[x][y].obj);
}

// (re-)initialization of playfield
function reset_playfield()
{
    playfield = new Array();

    for (var x = 0; x < PF_W; x++) {
	playfield[x] = new Array(PF_H);
	for (var y = 0; y < PF_H; y++)
	    playfield[x][y] = null;
    }
}

// main loop
function loop()
{
    if (displaying_text)
	return 1;

    switch (state) {
    case GAME_SETUP:
	setup_playfield();
	display_image_text('start');
	evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_DOWN, game_on_key_down, null);
	evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_UP,   game_on_key_up,   null);
	state = GAME_RUN;
	break;
    case GAME_RUN:
	play_game();
	break;
    case GAME_NEXT:
	state = GAME_SETUP;

	evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, game_on_key_down, null);
	evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   game_on_key_up, null);

	setdown_playfield();
	ecore_timer_interval_set(timer, main_timer);
	display_image_text('niveau_sup');
	level++;
	edje_object_part_text_set(edje_o, "level", level);

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

function setup_game(nb_snakes)
{
    scores = [ 0, 0 ];
    is_game_over = false;
    level = LEVEL ? LEVEL : 1;
    n_snakes = nb_snakes;
    edje_object_file_set(edje_o, "SnakeBox.edj", "game");
    edje_object_signal_emit(edje_o, "play,interface,appear", "js");
    edje_object_part_text_set(edje_o, "level", level);
    edje_object_signal_emit(edje_o, "play,level,appear", "js");
    edje_object_signal_emit(edje_o, "play,score,1,appear", "js");
    edje_object_part_text_set(edje_o, "score_1", "0");
    if (nb_snakes == 2) {
	edje_object_signal_emit(edje_o, "play,score,2,appear", "js");
	edje_object_part_text_set(edje_o, "score_2", "0");
    }
    edje_object_signal_emit(edje_o, "play,hi_score,appear", "js");
    edje_object_part_text_set(edje_o, "hi_score", hi_score.toString());

    state = GAME_SETUP;

    image_text = edje_object_add(evas);
    edje_object_file_set(image_text, "SnakeBox.edj", "image_text");
    evas_object_layer_set(image_text, 10);
    evas_object_resize(image_text, 720, 576);
    evas_object_show(image_text);
    edje_object_signal_callback_add(image_text, "im_text_end", "edc", end_image_text, null);

    main_timer = 0.2;
    timer = ecore_timer_add(main_timer, loop, null);

    if (sample)
	Mix_PlayChannel(1, sample, -1);
}

function hof_cb(pos, name)
{
    if (pos) {
	t_scores_a[pos] = { rank: pos, name: name, level: level, score: scores[hof_tested] };
	scores_save(t_scores_a);
    }

    if (hof_tested < n_snakes - 1 && test_hof(1))
	return;

    state = MENU;
    setup_menu();
}

function test_hof(nb)
{
    hof_tested = nb;

    var new_score_pos = 0;
    if (new_score_pos = scores_check(t_scores_a, snakes[nb].score, snakes[nb].level)) {
	state = HOF;
	hof_setup("SnakeBox", backdrop, edje_o, evas, hof_cb, t_scores_a, new_score_pos, "Joueur " + (nb + 1).toString());
	return true;
    }

    return false;
}

function setdown_game()
{
    edje_object_signal_callback_del(image_text, "im_text_end", "edc", end_image_text);
    edje_object_signal_emit(edje_o, "play,interface,disappear", "js");
    edje_object_signal_emit(edje_o, "play,level,disappear", "js");
    edje_object_signal_emit(edje_o, "play,score,1,disappear", "js");
    if (n_snakes == 2)
	edje_object_signal_emit(edje_o, "play,score,2,disappear", "js");
    edje_object_signal_emit(edje_o, "play,hi_score,disappear", "js");
    setdown_playfield();
    if (sound)
	Mix_FadeOutChannel(-1, 1000);

    if (test_hof(0) || n_snakes == 2 && test_hof(1))
	return;

    state = MENU;
    setup_menu();
}

function interface_disappeared(data, obj, sig, src)
{
    edje_object_signal_callback_del(edje_o, "interface_disappeared", "edc", interface_disappeared);
    setup_menu();
}

function background_disappeared_quit(data, e, obj, event)
{
    ecore_main_loop_quit();
}

function hof_menu_cb(pos, name)
{
    state = MENU;
    setup_menu();
}

function menu_disappeared(data, e, obj, event)
{
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, menu_on_key_down, null);
    edje_object_signal_callback_del(edje_o, "menu_disappeared", "edc", menu_disappeared);
    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 3, data);
}

function background_disappeared_hof(data, e, obj, event)
{
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, menu_on_key_down, null);
    hof_setup("SnakeBox", backdrop, edje_o, evas, hof_menu_cb, t_scores_a, 0);
    state = HOF;
}

function background_disappeared_play(data, e, obj, event)
{
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, menu_on_key_down, null);
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   menu_on_key_up, null);
    edje_object_signal_callback_del(edje_o, "background_disappeared", "edc", background_disappeared_play);
    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 3, data);
}

// On key up in menu
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
	    setup_game(msg + 1);
	else if (msg == 2) {
	    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 4, 1);
	} else if (msg == 3) {
	    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 5, 1);
	}
	break;
    };
}

function setup_menu()
{
    evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_DOWN, menu_on_key_down, null);
    evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_UP,   menu_on_key_up,   null);

    edje_object_message_handler_set(edje_o, message_cb, null);
    edje_object_signal_callback_add(edje_o, "background_disappeared_quit", "edc", background_disappeared_quit, null);
    edje_object_signal_callback_add(edje_o, "background_disappeared_hof", "edc",  background_disappeared_hof, null);
    edje_object_file_set(edje_o, "SnakeBox.edj", "menu");
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
	
	ee = ecore_evas_new(null, 0, 0, 720, 576, "name=SnakeBox");
	
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

    if (sound) {
	Mix_OpenAudio(44100, 0x9010, 2, 1024);
	sample       = Mix_LoadWAV("snakebox.ogg");
	sample_btn   = Mix_LoadWAV("bip_bouton.wav");
	sample_eat   = Mix_LoadWAV("snake_apple.wav");
	sample_die   = Mix_LoadWAV("snake_die.wav");
	sample_bonus = Mix_LoadWAV("bonus.wav");
    }

    if (!scores_init("SnakeBox")) {
	debug(1, "Could not init scores");
	return false;
    }

    t_scores_a = scores_load();
    hi_score = t_scores_a[1].score;
    if (!hi_score)
	hi_score = 0;

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
	    DEBUG = parseInt(val);
	    break;
	case 'LEVEL':
	    LEVEL = parseInt(val);
	    break;
	case 'version':
	    version = parseInt(val);
	    break;
	}
    }
    debug(1, "DEBUG: " + DEBUG);
    debug(1, "LEVEL: " + LEVEL);
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
