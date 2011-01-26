// v1.1beta1
// Time-stamp: <25 janvier 2011, 23:02 mid>

var DEBUG = false;
var DEBUG_LEVEL = 1;
var DEBUG_BONUS = false;
var DEBUG_PIECE = false;
var DEBUG_FAST  = false;
var DEBUG_CHEAT = false;
var version = 5;

//elx.tracker(true);

var test = true;
var shutdown;

test &= elx.include("TetriBox-Mid.edj", 'scores_level');
test &= elx.include("hof_level-TetriBox-Mid.edj", 'hof_level');

if (shutdown == undefined || shutdown == false) {
    test &= elx.load("evas");
    test &= elx.load("ecore");
    test &= elx.load("ecore-evas");
    test &= elx.load("edje");
}
var sound = elx.load("mix");
var sample, sample_line, sample_next, sample_bonus, sample_btn, sample_rebond, sample_boom;
if (sound) {
    Mix_OpenAudio(44100, 0x9010, 2, 1024);
    sample = Mix_LoadWAV("tetribox.ogg");
    sample_next = Mix_LoadWAV("tetris_win.wav");
    sample_line = Mix_LoadWAV("tetris_line.wav");
    sample_bonus = Mix_LoadWAV("bonus.wav");
    sample_btn = Mix_LoadWAV("bip_bouton.wav");
    sample_rebond = Mix_LoadWAV("rebond.wav");
    sample_boom = Mix_LoadWAV("boom.wav");
}

var FN           = "/.fonts/";
var IM           = "./share/";

var BL_BLANC     = "cube_blanc";
var BL_BLEU      = "cube_bleu";
var BL_BLEU2     = "cube_bleu2";
var BL_ROUGE     = "cube_rouge";
var BL_ROUGE2    = "cube_rouge2";
var BL_VIOLET    = "cube_violet";
var BL_JAUNE     = "cube_jaune";
var BL_VERT      = "cube_vert";
var BL_NOIR      = "cube_noir";
var BALLE        = "ball";
var CRADO_R      = "crado_1";
var CRADO_U      = "crado_2";
var CRADO_L      = "crado_3";
var CRADO_D      = "crado_4";
var BOOM         = "boom";
var BOMB         = "bomb";
var INTERRO      = "intero";
var BBALL        = "bonus_ball";
var PLUS         = "plus";
var GHOST        = "fantome";

var colors_a     = [ BL_BLEU, BL_BLEU2, BL_ROUGE, BL_ROUGE2, BL_VIOLET, BL_JAUNE, BL_VERT ];
var bonus_a      = [ BOMB, BBALL, PLUS, GHOST, INTERRO ];
var inter_a      = [ BOMB, BBALL, PLUS, GHOST ];

var XXX          = 'X';
var OOO          = ' ';

var OFFSET_X     = 270;
var OFFSET_Y     = 110;
var NOFFSET_X    = 520;
var NOFFSET_Y    = 100;
var BLOCK_SIZE   = 20;
var PF_W         = 10;
var PF_H         = 20;
var MAX_LOOP     = 12;
var V_SPEED      = BLOCK_SIZE / 10;
var V_SPEED_MED  = BLOCK_SIZE / 4;
var V_SPEED_MAX  = BLOCK_SIZE / 2;
var V_SPEED_TOP  = BLOCK_SIZE;
var H_SPEED      = BLOCK_SIZE / 4;
var LEVEL_LINES  = 8;
var MENU         = 0;
var GAME         = 1;
var BREAKOUT     = 2;
var HOF		 = 3;

var PLAY         = 0;
var QUIT         = 1;

var BIG_NUMBER = 99999;

var cur_piece;
var next_piece;
var baballe;
var t_scores_a;
var score;
var hi_score;
var level;
var level_ob;
var play_ob;
var play_over_ob;
var quit_ob;
var quit_over_ob;
var user_end = 1;
var pause_me = false;
var selected = false;
var nb_lines;

// pieces' definition
var piece = [
	     new PIECE(PF_W / 2 - 2, 0,
		       4, 1,
		       1, 0,
		       0, 0,
		       0, 0,
		       "barre",
		       BL_VERT,
		       [
			[ XXX, XXX, XXX, XXX ],
			[ OOO, OOO, OOO, OOO ],
			[ OOO, OOO, OOO, OOO ],
			[ OOO, OOO, OOO, OOO ],
			]),
	     new PIECE(PF_W / 2 - 1, 0,
		       3, 2,
		       1, 1,
		       0, 0,
		       0, 0,
		       "j",
		       BL_BLEU,
		       [
			[ XXX, OOO, OOO, OOO ],
			[ XXX, XXX, XXX, OOO ],
			[ OOO, OOO, OOO, OOO ],
			[ OOO, OOO, OOO, OOO ],
			]),
	     new PIECE(PF_W / 2 - 1, 0,
		       3, 2,
		       1, 1,
		       0, 0,
		       0, 0,
		       "l",
		       BL_BLEU2,
		       [
			[ OOO, OOO, XXX, OOO ],
			[ XXX, XXX, XXX, OOO ],
			[ OOO, OOO, OOO, OOO ],
			[ OOO, OOO, OOO, OOO ],
			]),
	     new PIECE(PF_W / 2 - 1, 0,
		       2, 2,
		       0, 0,
		       0, 0,
		       0, 0,
		       "carre",
		       BL_JAUNE,
		       [
			[ XXX, XXX, OOO, OOO ],
			[ XXX, XXX, OOO, OOO ],
			[ OOO, OOO, OOO, OOO ],
			[ OOO, OOO, OOO, OOO ],
			]),
	     new PIECE(PF_W / 2 - 1, 0,
		       3, 2,
		       1, 1,
		       0, 0,
		       0, 0,
		       "t",
		       BL_VIOLET,
		       [
			[ OOO, XXX, OOO, OOO ],
			[ XXX, XXX, XXX, OOO ],
			[ OOO, OOO, OOO, OOO ],
			[ OOO, OOO, OOO, OOO ],
			]),
	     new PIECE(PF_W / 2 - 1, 0,
		       3, 2,
		       1, 0,
		       0, 0,
		       0, 0,
		       "z",
		       BL_ROUGE,
		       [
			[ XXX, XXX, OOO, OOO ],
			[ OOO, XXX, XXX, OOO ],
			[ OOO, OOO, OOO, OOO ],
			[ OOO, OOO, OOO, OOO ],
			]),
	     new PIECE(PF_W / 2 - 1, 0,
		       3, 2,
		       1, 0,
		       0, 0,
		       0, 0,
		       "s",
		       BL_ROUGE2,
		       [
			[ OOO, XXX, XXX, OOO ],
			[ XXX, XXX, OOO, OOO ],
			[ OOO, OOO, OOO, OOO ],
			[ OOO, OOO, OOO, OOO ],
			])
];

var raquette = new PIECE(PF_W / 2 - 1, 0,
			 2, 1,
			 0, 0,
			 0, 0,
			 0, 0,
			 "raquette",
			 BL_NOIR,
			 [
			  [ XXX, XXX, OOO, OOO ],
			  [ OOO, OOO, OOO, OOO ],
			  [ OOO, OOO, OOO, OOO ],
			  [ OOO, OOO, OOO, OOO ],
			  ]);

var balle = new PIECE(PF_W / 2 - 1, 0,
		      1, 1,
		      0, 0,
		      0, 0,
		      0, 0,
		      "balle",
		      BALLE,
		      [
		       [ XXX, OOO, OOO, OOO ],
		       [ OOO, OOO, OOO, OOO ],
		       [ OOO, OOO, OOO, OOO ],
		       [ OOO, OOO, OOO, OOO ],
		       ]);

// state and command variables

var state;			// state of game
var menu_state;			// state of menu
var game_timer;			// timer of the game
var loop_cnt = 0;		// time left when is_blocked_down()
var cmd_dx = 0;			// right / left command
var cmd_dy = V_SPEED;		// down command
var cmd_r = 0;			// rotate command (-1 = left, +1 = right)
var cmd_b = 0;			// breakout command
var cmd_np = 0;			// new piece command
var cmd_nxp = 0;		// new piece = barre command (cheat mode, key=i)
var old_dx = 0;			// remember last x-coord move
var is_game_over = false;	// end of game
var is_game_really_over = false;// end of game
var b_is_game_over = false;	// end of breakout
var bb_dx, bb_dy;		// baballe real dx and dy
var checking_lines = 0;		// Are we currently checking lines?
var doing_bonuses;		// Are we currently displaying bonus animations?
var blinking_bonuses = 0;	// Are there blinking bonuses?
var displaying_text = false;	// Are we displaying an image text?
var removing_playfield = false; // Are we currently removing blocks?

// E objects

var shutdown;
var ee;
var evas;		// evas canvas
var backdrop;		// deep background, always present
var edje_o;		// current Edje Object
var background;		// game background
var title;		// menu title
var image_text;		// game over, pause, ...
var last_ts = null;	// timestamp for key repeat we don't want
var idler_t = false;	// idler trick for key repeat we don't want

// game state arrays

var playfield;		// where are the pieces' blocks objects
var playfield_bonus;	// bonuses objects
var type_bonus;		// bonuses types
var playfield_crado;	// crado objects
var playfield_fx;	// FX flags
var fx_nb;		// number of FX
var boom_nb;		// boom FX number
var nextfield;		// next piece's blocks

function rand(n)
{
    return Math.floor(Math.random() * n + 1);
}

// OX(), OY() calc coords with offset
function OX(x, dx)
{
    return OFFSET_X + BLOCK_SIZE * (x) + (dx);
}

function OY(y, dy)
{
    return OFFSET_Y + BLOCK_SIZE * (y) + (dy);
}

// X(), Y() calc coords without offset
function X(x)
{
    return OX(x, 0);
}

function Y(y)
{
    return OY(y, 0);
}

// X(), Y() calc coords in 'next' field
function NX(x)
{
    return NOFFSET_X + BLOCK_SIZE * (x);
}

function NY(y)
{
    return NOFFSET_Y + BLOCK_SIZE * (y);
}

// crado or bonus object
function CRABO(x, y, type)
{
    this.x     = x;
    this.y     = y;
    this.type  = type;
    this.clone = function () {
	return new CRABO(this.x, this.y, this.type);
    };
}

// moving piece object
function PIECE(x, y, w, h, gx, gy, dx, dy, ox, oy, what, color, shape)
{
    this.x = x;			// Coordonnées
    this.y = y;
  
    this.w = w;			// Taille
    this.h = h;

    this.gx = gx;			// Centre de gravité
    this.gy = gy;
  
    this.dx = dx;			// Vecteur vitesse
    this.dy = dy;

    this.ox = ox;			// Offset par rapport à une case
    this.oy = oy;

    this.what    = what;		// Type de pièce
    this.color   = color;		// Type de bloc

    this.bonus = new CRABO();	// Bonus
    this.crado = new CRABO();	// Résidus d'explosion

    this.shape = shape;		// Forme

    this.clone = function () {
	var shape;

	shape = new Array(4);
	for (var y = 0; y < 4; y++) {
	    shape[y] = new Array(4);
	    for (var x = 0; x < 4; x++) {
		shape[y][x] = this.shape[y][x];
	    }
	}
    
	var nouv_piece = new PIECE(this.x, this.y, this.w, this.h, this.gx, this.gy, this.dx, this.dy, this.ox, this.oy, this.what, this.color, shape);
	nouv_piece.bonus = this.bonus.clone();
	nouv_piece.crado = this.crado.clone();

	return nouv_piece;
    };
}

// load an object from the edje file
// <evas> is the evas object
// <name> is the name of the object
// <level> is the plane in which the object is displayed
// <appear> is 1 for "normal" (= slow) appearing animation, 0 for immediate (fast)
function build_image_cube_object(evas, name, level, appear)
{
    var o = edje_object_add(evas);
    edje_object_file_set(o, "TetriBox-Mid.edj", name);
    evas_object_resize(o, BLOCK_SIZE, BLOCK_SIZE);
    evas_object_layer_set(o, level);
    evas_object_show(o);
    if (appear == 1)
	edje_object_signal_emit(o, "play,cube,appear", "js");
    else if (appear == 2)
	edje_object_signal_emit(o, "play,cube,appear,slow", "js");
    else
	edje_object_signal_emit(o, "play,cube,appear,fast", "js");

    return o;
}

// put a block on the screen and record its object in playfield
// <x> and <y> are coords (in blocks)
// <color> is the filename of the block (different blocks for different colors)
// <bonus> is bonus type (not required, defaults to 'no bonus')
// <crado> is crado type (not required, defaults to 'no crado')
// <where> is either 'main' or 'next'  (not required, defaults to 'main')
// <appear> is 1 for "normal" (= slow) appearing animation, 0 for immediate (fast)
function set_block(x, y, color, bonus, crado, where, appear)
{
    var ob;

    if (!where)
	where = 'main';
  
    ob = build_image_cube_object(evas, color, 2, appear);
  
    if (where == 'main')
	evas_object_move(ob, X(x), Y(y));
    else
	evas_object_move(ob, NX(x), NY(y));
  
    if (where == 'main') {
	if (playfield[x][y]) {
	    debug(1, "Block at x=" + x + ", y=" + y);
	}
	playfield[x][y] = ob;

	if (bonus) {
	    ob = build_image_cube_object(evas, bonus, 3, appear);
	    evas_object_move(ob, X(x), Y(y));
	    evas_object_show(ob);
	    playfield_bonus[x][y] = ob;
	    type_bonus[x][y] = bonus;
	}
     
	if (crado) {
	    ob = build_image_cube_object(evas, crado, 4, appear);
	    evas_object_move(ob, X(x), Y(y));
	    evas_object_show(ob);
	    playfield_crado[x][y] = ob;
	}
    } else
	nextfield[x][y] = ob;
}

function do_del_obj(obj)
{
    evas_object_del(obj);
    return 0;
}

function del_obj(data, obj, sig, src)
{
    ecore_idler_add(do_del_obj, obj);
}

function set_del(ob, disappear)
{
    if (disappear == 1) {
	edje_object_signal_emit(ob, "play,cube,disappear", "js");
	edje_object_signal_callback_add(ob, "cube_disappeared", "edc", del_obj, null);
    } else if (disappear == 2) {
	edje_object_signal_emit(ob, "play,cube,disappear,slow", "js");
	edje_object_signal_callback_add(ob, "cube_disappeared", "edc", del_obj, null);
    } else
	evas_object_del(ob);
}

// opposite of set_block()
// <x> and <y> are coords
// <ex_bonus> is 'except bonus', don't try to remove bonus
// <ex_crado> is 'except crado', don't try to remove crado
function del_block(x, y, ex_bonus, ex_crado, disappear)
{
    var ob;

    if ((ob = playfield[x][y])) {
	set_del(ob, disappear);
	playfield[x][y] = null;
    } else {
	debug(1, "No block at x=" + x + ", y=" + y);
    }

    if (!ex_bonus && (ob = playfield_bonus[x][y])) {
	set_del(ob, disappear);
	playfield_bonus[x][y] = null;
	type_bonus[x][y] = null;
    }

    if (!ex_crado && (ob = playfield_crado[x][y])) {
	set_del(ob, disappear);
	playfield_crado[x][y] = null;
    }
}

// display a piece
// <what> is the piece to display (not required, defaults to cur_piece on 'main' playfield and next_piece on 'next' playfield
// <where> is 'main' or <next' and selects the playfield (not required, defaults to 'main')
function disp_piece(what, where, appear)
{
    var ob;

    if (!where)
	where = 'main';

    if (!what)
	if (where == 'main')
	    what = cur_piece;
	else
	    what = next_piece;

    if (where == 'next')
	for (var y = 0; y < 4; y++)
	    for (var x = 0; x < 4; x++)
		if ((ob = nextfield[x][y])) {
		    edje_object_signal_emit(ob, "play,cube,disappear", "js");
		    nextfield[x][y] = null;
		}


    for (var y = 0; y < what.h; y++)
	for (var x = 0; x < what.w; x++)
	    if (what.shape[y][x] == XXX) {
		var bonus = null;
		var crado = null;

		if (where == 'main') {
		    if (what.bonus.type && what.bonus.x == x && what.bonus.y == y)
			bonus = what.bonus.type;
	  
		    if (what.crado.type && what.crado.x == x && what.crado.y == y)
			crado = what.crado.type;

		    set_block(what.x + x, what.y + y, what.color, bonus, crado, where, appear);
		} else {
		    set_block(x, y, what.color, null, null, where, appear);
		}
	    }
}

// opposite of disp_piece
// <what> is the piece to remove (not required, defaults cur_piece)
function del_piece(what)
{
  if (!what)
    what = cur_piece;
  
  for (var y = 0; y < what.h; y++)
    for (var x = 0; x < what.w; x++)
      if (what.shape[y][x] == XXX)
	del_block(what.x + x, what.y + y);
}

// opposite of disp_piece(next_piece, 'next')
function del_next_piece()
{
    for (var y = 0; y < next_piece.h; y++)
	for (var x = 0; x < next_piece.w; x++)
	    if (next_piece.shape[y][x] == XXX) {
		edje_object_signal_emit(nextfield[x][y], "play,cube,disappear", "js");
		nextfield[x][y] = null;
	    }
}

// check if the game is over
function check_game_over()
{
  for (var y = 0; y < cur_piece.h; y++)
    for (var x = 0; x < cur_piece.w; x++)
      if (cur_piece.shape[y][x] == XXX && playfield[cur_piece.x + x][cur_piece.y + y])
	is_game_over = true;
}

// create a new piece
function nouv_piece()
{
    var piece_nb;

    cur_piece = next_piece;
    cur_piece.x = PF_W / 2 - 2;
  
    check_game_over();
  
    if (is_game_over)
    	return;
  
    if (DEBUG && DEBUG_PIECE)
	piece_nb = DEBUG_PIECE - 1;
    else if (cmd_nxp) {				// cheat mode: next piece = barre (key 'i')
	piece_nb = 0;
	cmd_nxp = 0;
    } else
	piece_nb = rand(7) - 1;

    next_piece = piece[piece_nb].clone();

    if (DEBUG && DEBUG_BONUS || level > 1 && rand(Math.max(12 - level, 1)) == 1) {
	var bx;
	var by;
    
	do {
	    bx = rand(cur_piece.w) - 1;
	    by = rand(cur_piece.h) - 1;
	} while (cur_piece.shape[by][bx] != XXX);
    
	cur_piece.bonus.x = bx;
	cur_piece.bonus.y = by;
	//cur_piece.bonus.type = bonus_a[0];
	//cur_piece.bonus.type = bonus_a[rand(2) - 1];
	cur_piece.bonus.type = bonus_a[rand(bonus_a.length) - 1];
    }
  
    disp_piece(next_piece, 'next', true);
    disp_piece(null, null, true);
    cmd_dy = cur_piece.dy = V_SPEED;
}

// initialization of playfields
function setup_playfield()
{
    playfield       = new Array(PF_W);
    playfield_bonus = new Array(PF_W);
    type_bonus      = new Array(PF_W);
    playfield_crado = new Array(PF_W);
    playfield_fx    = new Array(PF_W);

    for (var x = 0; x < PF_W; x++) {
	playfield[x]       = new Array(PF_H);
	playfield_bonus[x] = new Array(PF_H);
	type_bonus[x]      = new Array(PF_H);
	playfield_crado[x] = new Array(PF_H);
	playfield_fx[x]    = new Array(PF_H);

	for (var y = 0; y < PF_H; y++) {
	    playfield[x][y]       = null;
	    playfield_bonus[x][y] = null;
	    type_bonus[x][y]      = null;
	    playfield_crado[x][y] = null;
	    playfield_fx[x][y]    = false;
	}
    }

    nextfield = new Array(4);

    for (var x = 0; x < 4; x++) {
	nextfield[x] = new Array(4);
	for (var y = 0; y < 4; y++)
	    nextfield[x][y] = null;
    }
}

// test if cur_piece can move on right or left or down
function check_moves()
{
    var dx = cur_piece.dx > 0 ? 1 : cur_piece.dx < 0 ? -1 : 0;
    var ox = cur_piece.ox > 0 ? 1 : cur_piece.ox < 0 ? -1 : 0;
    var dy = cur_piece.dy > 0 ? 1 : 0;
    var oy = cur_piece.oy > 0 ? 1 : 0;
    var tx = dx * (ox && ox == dx ? 2 : 1);
    var ty = oy && oy == dy ? 2 : 1;
    var new_dx = dx * ((BLOCK_SIZE - Math.abs(cur_piece.ox)) % (BLOCK_SIZE));
    var new_dy = (BLOCK_SIZE - cur_piece.oy) % (BLOCK_SIZE);
    var res = 0;

    if (cur_piece.x + tx < 0 || (cur_piece.x + cur_piece.w - 1 + tx >= PF_W)) {
	if (Math.abs(new_dx) < Math.abs(cur_piece.dx))
	    cur_piece.dx = new_dx;
	res |= 1;
    } else {
	var beg_x = 0;
	var end_x = 0;
	var inc_x = 1;

	if (dx == 1) {
	    beg_x = cur_piece.w - 1;
	    inc_x = -1;
	} else
	    end_x = cur_piece.w - 1;
	
	if (dx)											// test only if moving right or left
	    for (var y = cur_piece.h - 1; y >= 0; y--) {
		var ytest  = cur_piece.y + y;
		
		for (var x = beg_x; x != end_x + inc_x; x += inc_x) {
		    if (cur_piece.shape[y][x] == XXX) {
			var xtest = cur_piece.x + x + tx;
			
			// check immediate side
			if (playfield[xtest][ytest]) {
			    if (Math.abs(new_dx) < Math.abs(cur_piece.dx))
				cur_piece.dx = new_dx;
			    res |= 1;
			}
			
			// Check diagonal
			if ((y == cur_piece.h - 1 || x == beg_x || cur_piece.shape[y + 1][x - inc_x] != XXX) && ytest + 1 < PF_H &&
			    playfield[xtest][ytest + 1]) {
			    
			    if (oy) {
				res |= 1;
				if (Math.abs(new_dx) < Math.abs(cur_piece.dx))
				    cur_piece.dx = new_dx;
			    } else
				res |= 2;
			}

			break;
		    }		    
		}
	    }
    }
    
    if (cur_piece.y + cur_piece.h == PF_H - oy) {
	if (new_dy < cur_piece.dy)
	    cur_piece.dy = new_dy;
	res |= 4;
    } else {
	beg_x = end_x = 0;
	if (ox > 0) {
	    beg_x = cur_piece.w - 1;
	    inc_x = -1;
	} else {
	    end_x = cur_piece.w - 1;
	    inc_x = 1;
	}

	for (var x = beg_x; x != end_x + inc_x; x += inc_x) {
	    for (var y = cur_piece.h - 1; y >= 0; y--)
		if (cur_piece.shape[y][x] == XXX) {
		    var xtest  = cur_piece.x + x;
		    var ytest  = cur_piece.y + y + ty;
		    
		    // check below
		    if (playfield[xtest][ytest]) {
			if (new_dy < cur_piece.dy)
			    cur_piece.dy = new_dy;
			res |= 4;
		    }
		    
		    // check below a bit on side
		    if (ox) {
			xtest += ox;
			if (xtest >= 0 && xtest < PF_W && ytest < PF_H) {
			    if ((y == cur_piece.h - 1 || x == beg_x || cur_piece.shape[y + 1][x - inc_x] != XXX) &&
				playfield[xtest][ytest]) {
				if (new_dy < cur_piece.dy)
				    cur_piece.dy = new_dy;
				res |= 4;
			    }
			}
		    }

		    break;
		}
	    
	    if (res & 4)
		break;
	}
    }

    return res;
}

function set_pl(x, y, x2, y2)
{
    if (playfield[x][y]) {
	debug(1, "block at x=" + x + ", y=" + y + ", x2=" + x2 + ", y2=" + y2 + ".");
	while (1)
	    elx.sleep(1);
    }
    playfield[x][y] = playfield[x2][y2];
}

// move piece's blocks on playfield
// <what> is what to move (not required, defaults to cur_piece)
// <dx> and <dy> are x and y deltas
function move_piece_blocks(what, dx, dy)
{
    var beg_x, end_x, beg_y, end_y, inc_x, inc_y;

    if (dx == 0 && dy == 0) {
	debug(1, 'Warning: trying to move_piece_blocks(what, 0, 0)');
	return;
    }

    if (!what)
	what = cur_piece;

    beg_x = end_x = what.x;
    beg_y = end_y = what.y;

    if (dx > 0) {
	beg_x += what.w - 1;
	inc_x = -1;
    } else
	if (dx <= 0) {
	    end_x += what.w - 1;
	    inc_x = 1;
	}

    if (dy > 0) {
	beg_y += what.h - 1;
	inc_y = -1;
    } else
	if (dy <= 0) {
	    end_y += what.h - 1;
	    inc_y = 1;
	}

    for (var y = beg_y; y != end_y + inc_y; y += inc_y)
	for (var x = beg_x; x != end_x + inc_x; x += inc_x)
	    if (what.shape[y - what.y][x - what.x] == XXX) {
		var ob;

		//	playfield[x][y] = playfield[x - dx][y - dy];
		set_pl(x, y, x - dx, y - dy);
		playfield[x - dx][y - dy] = null;
		evas_object_move(playfield[x][y], OX(x, what.ox), OY(y, what.oy));
	
		if (ob = playfield_bonus[x - dx][y - dy]) {
		    playfield_bonus[x][y] = playfield_bonus[x - dx][y - dy];
		    playfield_bonus[x - dx][y - dy] = null;

		    type_bonus[x][y] = type_bonus[x - dx][y - dy];
		    type_bonus[x - dx][y - dy] = null;

		    evas_object_move(playfield_bonus[x][y], OX(x, what.ox), OY(y, what.oy));
		}

		if (ob = playfield_crado[x - dx][y - dy]) {
		    playfield_crado[x][y] = playfield_crado[x - dx][y - dy];
		    playfield_crado[x - dx][y - dy] = null;
		    evas_object_move(playfield_crado[x][y], OX(x, what.ox), OY(y, what.oy));
		}
	    }
}

// move a piece
// <what> is the piece to move (not required, defaults to cur_piece)
// <move_x> and <move_y> are whether we move x and / or y ways (not required, defaults to true)
function move_piece(what, move_x, move_y)
{
    if (!what)
	what = cur_piece;

    if (move_x === undefined)
	move_x = true;

    if (move_y === undefined)
	move_y = true;

    if (move_x) {
	what.ox += what.dx;
	while (Math.abs(what.ox) >= BLOCK_SIZE) {
	    var dx = what.ox > 0 ? 1 : -1;
	    what.x += dx;
	    what.ox -= dx * BLOCK_SIZE;

	    move_piece_blocks(what, dx, 0);

	    if (!what.x && what.ox < 0 ||
		what.x == PF_W - 1 && what.ox > 0)
		what.ox = 0;
	}
    }

    if (move_y) {
	what.oy += what.dy;
	while (Math.abs(what.oy) >= BLOCK_SIZE) {
	    var dy = what.oy > 0 ? 1 : -1;
	    what.y += dy;
	    what.oy -= dy * BLOCK_SIZE;

	    move_piece_blocks(what, 0, dy);

	    if (!what.y && what.oy < 0 ||
		what.y == PF_H - 1 && what.oy > 0)
		what.oy = 0;
	}
    }

    for (var y = 0; y < what.h; y++)
	for (var x = 0; x < what.w; x++)
	    if (what.shape[y][x] == XXX) {
		var ob;
	
		evas_object_move(playfield[what.x + x][what.y + y], OX(what.x + x, what.ox), OY(what.y + y, what.oy));
	
		if (ob = playfield_bonus[what.x + x][what.y + y])
		    evas_object_move(ob, OX(what.x + x, what.ox), OY(what.y + y, what.oy));
	
		if (ob = playfield_crado[what.x + x][what.y + y])
		    evas_object_move(ob, OX(what.x + x, what.ox), OY(what.y + y, what.oy));
	    }
}

// reset fx playfield
function reset_playfield_fx()
{
    playfield_fx = new Array(PF_W);

    for (var x = 0; x < PF_W; x++) {
	playfield_fx[x] = new Array(PF_H);

	for (var y = 0; y < PF_H; y++)
	    playfield_fx[x][y] = 0;
    }
}

function dec_fx_nb()
{
    if (!(--fx_nb) && !blinking_bonuses)
	doing_bonuses = false;
}

function end_fx(data, obj, sig, src)
{
    playfield_fx[data.x][data.y] = 0;

    dec_fx_nb();

    //    debug(1, "--fx_nb=" + fx_nb + '(' + data.type + (data.type == 'boom' ? ':' + data.nb : '') + ') (' + data.x + ', ' + data.y + ') db=' + doing_bonuses + ', bb=' + blinking_bonuses);
}

function unboom(data)
{
    for (var lo = 0; lo < data.arr.length; lo++) {
	var elem = data.arr[lo];
	if (elem.type == 'boom') {
	    var x = elem.x;
	    var y = elem.y;
	    
	    if (x < 0 || x >= PF_W ||
		y < 0 || y >= PF_H ||
		state == BREAKOUT && baballe.x == x && baballe.y == y) // avoid killing ourselves
		continue;
	    
	    if (playfield_fx[x][y] == data.nb) {
		edje_object_signal_callback_add(playfield[x][y], "cube_disappeared", "edc", end_fx, { x: x, y: y });
		del_block(x, y, false, false, 2);
	    }
	}
    }

    return 0;
}

function idle_boom(data)
{
    ecore_timer_add((rand(75) + 125) / 100, unboom, data);

    return 0;
}

function boom(data)
{
    for (var lo = 0; lo < data.arr.length; lo++) {
	var elem = data.arr[lo];
	var x = elem.x;
	var y = elem.y;
	var ob;

	if (x < 0 || x >= PF_W ||
	    y < 0 || y >= PF_H ||
	    state == BREAKOUT && baballe.x == x && baballe.y == y) // avoid killing ourselves
	    continue;

	if (elem.type == 'boom') {
	    if (playfield_fx[x][y])
		continue;
	    playfield_fx[x][y] = data.nb;
	    fx_nb++;
	    if (ob = playfield[x][y])
		del_block(x, y, false, false, 2);
	    set_block(x, y, BL_JAUNE, BOOM, false, null, 2);
	} else
	    cradoize(x, y, elem.type);
    }
    
    ecore_idler_add(idle_boom, data);

    return 0;
}
    
// crado effect (for one block)
// <x> and <y> are coords
// <crado_type> is for type of crado (left, up, down or right)
function cradoize(x, y, crado_type)
{
    var ob;

    if (x < 0 || x >= PF_W ||
	y < 0 || y >= PF_H ||
	!playfield[x][y] ||
	state == BREAKOUT && baballe.x == x && baballe.y == y) // avoid cradoizing ourselves
	return;

    if (ob = playfield_crado[x][y]) {
	evas_object_del(ob);
	playfield_crado[x][y] = null;
    }
    
    ob = build_image_cube_object(evas, crado_type, 4);
    evas_object_move(ob, X(x), Y(y));
    evas_object_show(ob);
    playfield_crado[x][y] = ob;
}

function bonus_blinked(data, obj, sig, src)
{
    evas_object_del(obj);
    ecore_timer_add(rand(50) / 100, do_bonus, data);
}

// First pass: animation loop
function cl_first_pass_loop(data)
{
    for (var y = PF_H - 1, lo = 0, yl = data.e_line[lo++]; y >= 0; y--) {
	if (y == yl) {
	    for (var x = 0; x < PF_W; x++) {
		if (state == BREAKOUT && baballe.x == x && baballe.y == y)
		    continue; // Avoid animating baballe
		if (playfield[x][y]) {
		    evas_object_resize(playfield[x][y], BLOCK_SIZE, data.size);
		}
		if (playfield_crado[x][y]) {
		    evas_object_resize(playfield_crado[x][y], BLOCK_SIZE, data.size);
		}
	    }
		    
	    if (lo <= data.e_lines)
		yl = data.e_line[lo++];
	    else
		yl = -1; // no more lines to del
	}

	for (var x = 0; x < PF_W; x++) {
	    if (state == BREAKOUT && baballe.x == x && baballe.y == y)
		continue; // Avoid animating baballe
	    if (playfield[x][y])
		evas_object_move(playfield[x][y],       X(x), OY(y, (BLOCK_SIZE - data.size) * (lo - 1)));
	    if (playfield_bonus[x][y])
		evas_object_move(playfield_bonus[x][y], X(x), OY(y, (BLOCK_SIZE - data.size) * (lo - 1)));
	    if (playfield_crado[x][y])
		evas_object_move(playfield_crado[x][y], X(x), OY(y, (BLOCK_SIZE - data.size) * (lo - 1)));
	}
    }

    data.size -= V_SPEED;

    if (data.size >= 0)
	return 1;

    cl_second_pass(data);
    checking_lines--;
    return 0;
}

// First pass: animation
function cl_first_pass(data)
{
    data.size = BLOCK_SIZE;
    ecore_timer_add(0.05, cl_first_pass_loop, data);
}

function cl_wait_bonuses(data)
{
    if (doing_bonuses)
	return 1;

    cl_first_pass(data);
    return 0;
}

// bonus blinker
// <x> and <y> are coords
function do_blink_bonus(data)
{
    var ob = playfield_bonus[data.x][data.y];

    edje_object_signal_callback_add(ob, "bonus_blinked", "edc", bonus_blinked, data);
    edje_object_signal_emit(ob, "play,bonus,blink", "js");

    return 0;
}

// bonus blink
// <x> and <y> are coords
function blink_bonus(x, y)
{
    blinking_bonuses++;
    playfield_fx[x][y] = BIG_NUMBER;
    //    debug(1, "blinking " + x + ", " + y + " = " + blinking_bonuses);
    ecore_timer_add(rand(50) / 100, do_blink_bonus, {x: x, y: y });
    if (sample_bonus)
	Mix_PlayChannel(-1, sample_bonus, 0);
}

// find the highest block in playfield (the lowest 'y')
function find_highest()
{
    for (var y = 0; y < PF_H; y++)
	for (var x = 0; x < PF_W; x++)
	    if (state == GAME || state == BREAKOUT && y > 0 && (baballe.x != x || baballe.y != y))
		if (playfield[x][y])
		    return y;

    return PF_H - 1;
}

function do_bonus(data)
{    
    var x = data.x;
    var y = data.y;
    var type = type_bonus[x][y];

    //    debug(1, "doing " + x + ", " + y + " = " + blinking_bonuses);
    blinking_bonuses--;
    playfield_bonus[x][y] = null;
    type_bonus[x][y] = null;

    switch (type) {
    case INTERRO:				// interrogation point: choose randomly another bonus
	var newtype = inter_a[rand(inter_a.length) - 1];

	var ob2 = build_image_cube_object(evas, newtype, 3);
	evas_object_move(ob2, X(x), Y(y));
	evas_object_show(ob2);

	playfield_bonus[x][y] = ob2;
	type_bonus[x][y] = newtype;
	add_score(5);

	blink_bonus(x, y);
	break;
    case BOMB:				// explode with random size
	if (sample_boom)
	    Mix_PlayChannel(-1, sample_boom, 0);
	var max = rand(3);
	add_score(max * 2);
	var lo;
	var xl;
	var xr;
	var yu;
	var yd;
	boom_nb++;

	playfield_fx[x][y] = 0;

	var boom_arr = [];

	boom_arr.push({ delay: 1, arr: [ { type: 'boom', x: x, y: y } ] });

	for (lo = 1; lo <= max; lo++) {
	    xl = x - lo;
	    xr = x + lo;
	    yu = y - lo;
	    yd = y + lo;
	    
	    var arr = [];

	    arr.push({ type: 'boom', x: xl, y: y  });
	    arr.push({ type: 'boom', x: xr, y: y  });

	    arr.push({ type: 'boom', x: x,  y: yu });
	    arr.push({ type: 'boom', x: x,  y: yd });

	    arr.push({ type: 'boom', x: xl, y: yu });
	    arr.push({ type: CRADO_D, x: xl,     y: yu - 1});
	    arr.push({ type: CRADO_R, x: xl - 1, y: yu    });

	    arr.push({ type: 'boom', x: xr, y: yu });
	    arr.push({ type: CRADO_D, x: xr,     y: yu - 1});
	    arr.push({ type: CRADO_L, x: xr + 1, y: yu    });

	    arr.push({ type: 'boom', x: xl, y: yd });
	    arr.push({ type: CRADO_U, x: xl    , y: yd + 1});
	    arr.push({ type: CRADO_R, x: xl - 1, y: yd    });

	    arr.push({ type: 'boom', x: xr, y: yd });
	    arr.push({ type: CRADO_U, x: xr    , y: yd + 1});
	    arr.push({ type: CRADO_L, x: xr + 1, y: yd    });

	    boom_arr.push({ delay: 30 * lo, arr: arr });
	}

	var last_arr = [];
	last_arr.push({ type: CRADO_R, x: x - lo, y: y     });
	last_arr.push({ type: CRADO_L, x: x + lo, y: y     });
	last_arr.push({ type: CRADO_D, x: x     , y: y - lo});
	last_arr.push({ type: CRADO_U, x: x     , y: y + lo});
	boom_arr.push({ delay: 30 * lo, arr: last_arr });

	for (var lo = 0; lo < boom_arr.length; lo++)
	    ecore_timer_add(boom_arr[lo].delay / 100, boom, { nb: boom_nb, arr: boom_arr[lo].arr });

	break;
    case BBALL:				// bonus ball => breakout
	if (state == BREAKOUT)
	    del_block(x, y, false, false, 2);
	playfield_fx[x][y] = 0;
	breakout_mode();
	fx_nb++;
	dec_fx_nb();
	//	debug(1, "breakout");
	break;
    case PLUS:				// plus => add random count of random blocks
	var tries = 30;
	var max = rand(3) + 1;
	add_score(max * 2);
	var ht = find_highest();
	for (var lo = 0; lo < max && tries; lo++) {
	    var xx, yy;

	    do {
		xx = rand(PF_W) - 1;
		yy = Math.min(Math.max(ht + rand(8) - 4, 4), PF_H - 1);
	    } while (--tries && (playfield[xx][yy] || playfield_fx[xx][yy]));

	    if (!tries)
		break;

	    playfield_fx[xx][yy] = BIG_NUMBER;
	    fx_nb++;
	    //	    debug(1, "plus:fx_nb++=" + fx_nb);
	    set_block(xx, yy, colors_a[rand(colors_a.length) - 1], false, false, null, 2);
	    edje_object_signal_callback_add(playfield[xx][yy], "cube_appeared", "edc", end_fx, { x: xx, y: yy, type: 'plus' });
	}

	playfield_fx[x][y] = 0;

	if (state == BREAKOUT)
	    del_block(x, y, false, false, 2);

	break;
    case GHOST:				// ghost => delete random count of random blocks
	var tries = 30;
	var max = rand(3) + 1;
	add_score(max * 2);
	var ht = find_highest();
	for (var lo = 0; lo < max && tries; lo++) {
	    var xx, yy;

	    do {
		xx = rand(PF_W) - 1;
		yy = PF_H - rand(PF_H - ht);
	    } while (--tries && (!playfield[xx][yy] || playfield_fx[xx][yy]));

	    if (!tries)
		break;

	    playfield_fx[xx][yy] = BIG_NUMBER;
	    fx_nb++;
	    //	    debug(1, "ghost:fx_nb++=" + fx_nb);
	    edje_object_signal_callback_add(playfield[xx][yy], "cube_disappeared", "edc", end_fx, { x: xx, y: yy, type: 'ghost' });
	    del_block(xx, yy, false, false, 2);
	}

	playfield_fx[x][y] = 0;

	if (state == BREAKOUT)
	    del_block(x, y, false, false, 2);

	break;
    default:
	break;
    }

    return 0;
}

function end_image_text()
{
    edje_object_signal_callback_del(image_text, "im_text_end", "edc", end_image_text);
    displaying_text = false;
}

function display_image_text(name)
{
    displaying_text = true;
    edje_object_signal_callback_add(image_text, "im_text_end", "edc", end_image_text, null);
    edje_object_signal_emit(image_text, name, "js");
}

// add <nb> lines to line counter and test if we reached enough lines to change level
function test_level(nb)
{
    nb_lines += nb;
    if (nb_lines >= LEVEL_LINES + 2 * (level - 1)) {
	nb_lines = 0;
	level++;
        edje_object_part_text_set(edje_o, "level", level);
        ecore_timer_interval_set(game_timer, (5.25 - level / 4) / 100);
	display_image_text('next');
	if (sample_next)
	    Mix_PlayChannel(-1, sample_next, 0);
    }
}

// Second pass: playfields modification
function cl_second_pass(data)
{
    var lo2 = 0;

    for (var y = PF_H - 1; y >= 0; y--) {
	for (lo = 0; lo < data.e_lines; lo++) {
	    if (y == data.e_line[lo]) {
		for (lo2 = 0; lo2 < data.f_lines; lo2++) {
		    if ((yl = data.f_line[lo2]) < y)
			break;
		}
		    
		if (lo2 == data.f_lines) // no more lines to copy
		    break;
		    
		for (x = 0; x < PF_W; x++) {
		    var is_baballe = false;;

		    if (state == BREAKOUT && baballe.x == x && baballe.y == y) {
			del_piece(baballe);
			baballe.y = yl; // baballe will jump!
			is_baballe = true;
		    } else 
			if (playfield[x][y])
			    del_block(x, y);
	      
		    playfield[x][y] = playfield[x][yl];
		    playfield[x][yl] = null;
	    
		    playfield_bonus[x][y] = playfield_bonus[x][yl];
		    playfield_bonus[x][yl] = null;
	    
		    type_bonus[x][y] = type_bonus[x][yl];
		    type_bonus[x][yl] = null;
	    
		    playfield_crado[x][y] = playfield_crado[x][yl];
		    playfield_crado[x][yl] = null;

		    if (is_baballe)
			disp_piece(baballe);
		}
		    
		data.f_line[lo2] = PF_H;
		data.e_line[lo] = yl;
	    }
	}
	if (lo2 == data.f_lines) // no more lines to copy
	    break;
    }

    if (sample_line)
	Mix_PlayChannel(-1, sample_line, 0);
    test_level(data.e_lines);
    check_lines();
}

function cl_check_bonus(data)
{
    boom_nb = fx_nb = blinking_bonuses = 0;
    reset_playfield_fx();

    for (var lo = 0; lo < data.e_lines; lo++) {
	var yl = data.e_line[lo];
	for (var x = 0; x < PF_W; x++)
	    if (playfield_bonus[x][yl]) {
		doing_bonuses = true;
		blink_bonus(x, yl);
	    }
    }
	
    ecore_timer_add(0.1, cl_wait_bonuses, data);

    return 0;
}

function fade_block_blanc(x, y)
{
    del_block(x, y, true, true, 1);
    set_block(x, y, BL_BLANC, false, false, null, 1);
}

// check lines for removing with animation
function check_lines()
{
    var e_line = new Array(PF_H); // emptied lines (were real full)
    var f_line = new Array(PF_H); // 'full' lines (not really full)
    var yl;
    var lo;
    var e_lines = 0;
    var f_lines = 0;
    //  var flag = -1;
    var ob;

    checking_lines++;

    for (y = PF_H - 1; y >= 0; y--) {
	for (var x = 0; x < PF_W; x++)
	    if (!playfield[x][y])
		break;
	
	if (x == PF_W)		// not broken ?
	    e_line[e_lines++] = y;	//  it was full => empty
	else
	    f_line[f_lines++] = y;	// almost full
    }

    e_line[e_lines] = f_line[f_lines] = -1;

    if (e_lines) {
	add_score(10 * e_lines);
	
	anim({ e_line: e_line, e_lines: e_lines, f_line: f_line, f_lines: f_lines, yl: e_line[0], interval: 0.05, min_x: 0, min_y: 0, max_x: PF_W, max_y: PF_H, next_x: function(data) { return ++data.x }, next_y: function(data) { return (data.yl = e_line[++data.y]) >= 0 ? 0 : PF_H }, testfunc: function(data) { return 1 }, payload_func: function(data) { fade_block_blanc(data.x, data.yl) }, after_interval: 0.5, after_func: cl_check_bonus });

	return;
    }

    checking_lines--;
}

// piece rotation
// <right> is a flag: 1 = rotate right, !=1 = rotate left
function rotate(right)
{
    var tpiece = cur_piece.clone(); // temp piece

    tpiece.w = cur_piece.h;
    tpiece.h = cur_piece.w;

    var dx = cur_piece.ox > 0 ? 1 : cur_piece.ox < 0 ? -1 : 0;
    var dy = cur_piece.oy > 0 ? 1 : cur_piece.oy < 0 ? -1 : 0;

    if (right == 1) {
	tpiece.gy = cur_piece.gx;
	tpiece.gx = cur_piece.h - 1 - cur_piece.gy;

	if (tpiece.bonus.type) {
	    tpiece.bonus.x =  cur_piece.h - 1 - cur_piece.bonus.y;
	    tpiece.bonus.y =  cur_piece.bonus.x;
	}
    } else {
	tpiece.gy = cur_piece.w - 1 - cur_piece.gx;
	tpiece.gx = cur_piece.gy;

	if (tpiece.bonus.type) {
	    tpiece.bonus.x =  cur_piece.bonus.y;
	    tpiece.bonus.y =  cur_piece.w - 1 - cur_piece.bonus.x;
	}
    }
  
    var dgx = 0;		// Déplacement centre de gravité
    var dgy = 0;

    if (cur_piece.what != 'carre') {
	dgx = cur_piece.gx - tpiece.gx;
	dgy = cur_piece.gy - tpiece.gy;
    }

    if (cur_piece.y + dgy      + cur_piece.w > PF_H ||
	cur_piece.y + dgy                    < 0 ||
	cur_piece.x + dgx      + cur_piece.h > PF_W ||
	cur_piece.x + dgx                    < 0 ||
	cur_piece.y + dgy + dy + cur_piece.w > PF_H ||
	cur_piece.y + dgy + dy               < 0 ||
	cur_piece.x + dgx + dx + cur_piece.h > PF_W ||
	cur_piece.x + dgx + dx               < 0)
	return;

    del_piece(null);

    for (var y = 0; y < cur_piece.h; y++)
	for (var x = 0; x < cur_piece.w; x++)
	    if (right == 1) {
		var h1y = cur_piece.h - 1 - y;
		if ((tpiece.shape[x][h1y] = cur_piece.shape[y][x]) == XXX)
		    if (            playfield[tpiece.x      + dgx + h1y][tpiece.y      + dgy + x] ||
			dy &&       playfield[tpiece.x      + dgx + h1y][tpiece.y + dy + dgy + x] ||
			dx &&       playfield[tpiece.x + dx + dgx + h1y][tpiece.y      + dgy + x] ||
			dx && dy && playfield[tpiece.x + dx + dgx + h1y][tpiece.y + dy + dgy + x]) {
			disp_piece(null);
			return;
		    }
	    } else {
		var w1x = cur_piece.w - 1 - x;
		if ((tpiece.shape[w1x][y] = cur_piece.shape[y][x]) == XXX)
		    if (            playfield[tpiece.x      + dgx + y][tpiece.y      + dgy + w1x] ||
			dy &&       playfield[tpiece.x      + dgx + y][tpiece.y + dy + dgy + w1x] ||
			dx &&       playfield[tpiece.x + dx + dgx + y][tpiece.y      + dgy + w1x] ||
			dx && dy && playfield[tpiece.x + dx + dgx + y][tpiece.y + dy + dgy + w1x]) {
			disp_piece(null);
			return;
		    }
	    }
   
    cur_piece = tpiece.clone();

    if (dgx)
	cur_piece.x += dgx;
    if (dgy)
	cur_piece.y += dgy;

    disp_piece(null);
}

// keybd callback
function goto_down()
{
    if (cmd_dy == V_SPEED)
	cmd_dy = V_SPEED_MED;
    else
	cmd_dy = V_SPEED_MAX;
}

// keybd callback
function rotate_right()
{
    cmd_r = 1;
}

// keybd callback
function rotate_left()
{
    cmd_r = -1;
}

// keybd callback
function goto_right()
{
    cmd_dx = H_SPEED;
}

// keybd callback
function goto_left()
{
    cmd_dx = -H_SPEED;
}

// keybd callback
function end_goto_right_left()
{
    cmd_dx = 0;
}

// "key released" handler
function game_on_key_up(keyname)
{
    switch (keyname) {
    case "Right":
    case "FP/Right":
    case "RC/Right":
    case "RCL/Right":
    case "GP/Right":
    case "Left":
    case "FP/Left":
    case "RC/Left":
    case "RCL/Left":
    case "GP/Left":
	end_goto_right_left();
	break;
    default:
	break;
    }

    idler_t = null;
    return 0;
}

function game_pre_on_key_up(data, e, obj, event)
{
    last_ts = event.timestamp;
    idler_t = ecore_idler_add(game_on_key_up, event.keyname);
}

// switch to breakout mode
function breakout_mode()
{
    if (state == GAME)
	cmd_b = 1;
}

function pause()
{
    if (displaying_text)
	return;

    if (pause_me = !pause_me) // affectation
	edje_object_signal_emit(image_text, "pause", "js");
    else
	edje_object_signal_emit(image_text, "resume", "js");
}

// "key pressed" handler
function game_on_key_down(data, e, obj, event)
{
    if (event.timestamp == last_ts) {
	if (idler_t) {
	    ecore_idler_del(idler_t);
	    idler_t = null;
	}
	return;
    }

    switch (event.keyname) {
    case "Home":
    case "equal":
    case "Escape":
    case "Stop":
    case "Start":
	pause_me = false;
	if (state == GAME)
	    is_game_over = true;
	else
	    b_is_game_over = true;
	break;
    case "F2":
        if (version == 6) {
            pause_me = false;
            if (state == GAME)
                is_game_over = true;
            else
                b_is_game_over = true;
        }
        break;
    case "p":
    case "greater":
    case "Play":
	pause();
	break;
    case "b":
    case "Red":
    case "r":
	rotate_right();
	break;
    case "Up":
    case "F4":
        if (version == 6)
            rotate_right();
	break;
    case "F3":
        if (version == 6)
            rotate_left();
	break;
    case "a":
    case "Green":
	goto_down();
	break;
    case "m":
	if (DEBUG)
	    breakout_mode();
	break;
    case "s":
	if (DEBUG_CHEAT)
	    add_score(DEBUG_CHEAT);
	break;
    case "Right":
    case "FP/Right":
    case "RC/Right":
    case "RCL/Right":
    case "GP/Right":
	goto_right();
	break;
    case "Left":
    case "FP/Left":
    case "RC/Left":
    case "RCL/Left":
    case "GP/Left":
	goto_left();
	break;
    case "x":
    case "Blue":
    case "l":
	rotate_left();
	break;
    case "y":
    case "Yellow":
	if (state == GAME) {
	    ecore_timer_interval_set(game_timer, 0.005);
	    cmd_dy = V_SPEED_TOP;
	}
	break;
    case "Down":
        if (version == 6 && state == GAME) {
	    ecore_timer_interval_set(game_timer, 0.005);
	    cmd_dy = V_SPEED_TOP;
        }
	break;
    case "i":
    case "Info":
        if (DEBUG)
            cmd_nxp = 1;
        break;
    default:
	break;
    }
}

function move_cmd()
{
    if (cmd_dx)
	cur_piece.dx = old_dx = cmd_dx;
    else if (!cur_piece.ox)			// Stop only on BLOCK_SIZE grid
	cur_piece.dx = old_dx = 0;
    else
	cur_piece.dx = old_dx;			// continue moving if not on grid and user released key
}

// main function for normal game movements
function move_it()
{
    var moves;					// forbidden moves

    if (DEBUG && DEBUG_FAST) {
	cmd_r  = rand(5) - 1 ? 0 : rand(3) - 2;
	cmd_dx = (rand(3) - 2) * H_SPEED;
	cmd_dy = rand(2) - 1 ? V_SPEED_MAX : V_SPEED_MED;
    }
    
    if (cmd_r) {
	rotate(cmd_r);
	cmd_r = 0;
    }

    cur_piece.dy = cmd_dy;
    move_cmd();
    moves = check_moves();
    
    if (cur_piece.dy) {
	move_piece(null, false, true);
	move_cmd();
	moves = check_moves();
    }

    if (cur_piece.dx) {
	move_piece(null, true, false);
	moves = check_moves();
    }

    if (moves & 4 && !(cur_piece.oy)) {
	if (++loop_cnt >= MAX_LOOP && !cur_piece.ox) {
	    cmd_np = true;
	    check_lines();
	}
    } else
	loop_cnt = 0;
}

function PF(xy, oxy)
{
    return xy * BLOCK_SIZE + oxy;
}

function PF_I(xy)
{
    return Math.floor(xy / BLOCK_SIZE);
}

function b_del_piece(x, y)
{
    if (playfield_bonus[x][y] && type_bonus[x][y] != BOOM) {
	doing_bonuses = true;
	blink_bonus(x, y);
    } else {
	if (!playfield_fx[x][y])
	    del_block(x, y, false, false, 2);
	add_score(1);
    }
}

function check_rebond()
{
    var touched_x = false;
    var touched_y = false;
    var dx = baballe.dx > 0 ? 1 : baballe.dx < 0 ? -1 : 1;
    var dy = baballe.dy > 0 ? 1 : baballe.dy < 0 ? -1 : 1;
    var ox = baballe.ox > 0 ? 1 : baballe.ox < 0 ? -1 : 0;
    var oy = baballe.oy > 0 ? 1 : baballe.oy < 0 ? -1 : 0;
    var bb_gx = PF(baballe.x, baballe.ox) + BLOCK_SIZE / 2;
    var bb_gy = PF(baballe.y, baballe.oy) + BLOCK_SIZE / 2;
    var bb_tx = bb_gx + dx * (BLOCK_SIZE / 2 - 1);
    var bb_ty = bb_gy + dy * (BLOCK_SIZE / 2 - 1);
    var pf_tx = PF_I(bb_tx);
    var pf_ty = PF_I(bb_ty);
    var new_dx = (dx * BLOCK_SIZE - baballe.ox) % BLOCK_SIZE;
    var new_dy = (dy * BLOCK_SIZE - baballe.oy) % BLOCK_SIZE;
    var pf_testx = pf_tx + dx;
    var pf_testy = pf_ty + dy;
    var pf_osx = pf_tx - dx; // other side x
    var pf_osy = pf_ty - dy; // other side y

    // check x borders
    if (dx && (pf_tx == 0 || pf_tx == PF_W - 1)) {
	if (ox) {
	    if (Math.abs(new_dx) < Math.abs(baballe.dx))
		baballe.dx = new_dx;
	} else if (new_dx == 0)
	    touched_x = true;
    }

    // check y borders
    if (dy && (pf_ty == 1 || pf_ty == PF_H - 1)) {
	if (oy) {
	    if (Math.abs(new_dy) < Math.abs(baballe.dy))
		baballe.dy = new_dy;
	} else if (new_dy == 0)
	    touched_y = true;
    }

    // check x cubes
    if (dx && (pf_testx >= 0 && pf_testx < PF_W)) {
	if (playfield[pf_testx][pf_ty]) {
	    if (ox) {
		if (Math.abs(new_dx) < Math.abs(baballe.dx))
		    baballe.dx = new_dx;
	    } else if (new_dx == 0) {
		touched_x = true;
		b_del_piece(pf_testx, pf_ty);
	    }
	}
	if (pf_osy >= 1 && pf_osy < PF_H && playfield[pf_testx][pf_osy]) {
	    if (ox) {
		if (Math.abs(new_dx) < Math.abs(baballe.dx))
		    baballe.dx = new_dx;
	    } else if (new_dx == 0) {
		touched_x = true;
		b_del_piece(pf_testx, pf_osy);
	    }
	}
    }

    // check y cubes
    if (dy && (pf_testy >= 1 && pf_testy < PF_H)) {
	if (playfield[pf_tx][pf_testy]) {
	    if (oy) {
		if (Math.abs(new_dy) < Math.abs(baballe.dy))
		    baballe.dy = new_dy;
	    } else if (new_dy == 0) {
		touched_y = true;
		b_del_piece(pf_tx, pf_testy);
	    }
	}
	if (pf_osx >= 0 && pf_osx < PF_W && playfield[pf_osx][pf_testy]) {
	    if (oy) {
		if (Math.abs(new_dy) < Math.abs(baballe.dy))
		    baballe.dy = new_dy;
	    } else if (new_dy == 0) {
		touched_y = true;
		b_del_piece(pf_osx, pf_testy);
	    }
	}
    }

    // check x+1 & y+1 cube
    if (!touched_x && !touched_y && dx && dy) {
	if (pf_testx >= 0 && pf_testx < PF_W && pf_testy >= 1 && pf_testy < PF_H) {
	    if (playfield[pf_testx][pf_testy]) {
		if (ox || oy) {
		    if (ox) {
			if (Math.abs(new_dx) < Math.abs(baballe.dx))
			    baballe.dx = new_dx;
		    }
		    if (oy) {
			if (Math.abs(new_dy) < Math.abs(baballe.dy))
			    baballe.dy = new_dy;
		    }
		} else if (new_dx == 0 && new_dy == 0) {
		    touched_x = touched_y = true;
		    b_del_piece(pf_testx, pf_testy);
		}
	    }
	}
    }

    if (touched_x) {
	bb_dx = -bb_dx;
	baballe.dx = -baballe.dx;
    }

    if (touched_y) {
	bb_dy = -bb_dy;
	baballe.dy = -baballe.dy;
	if (pf_ty == 1) {
	    raquettize_dx();
	    if (Math.abs(bb_dx) > BLOCK_SIZE / 2 + 4)
		b_is_game_over = true;
	}
    }

    if ((touched_x || touched_y) && sample_rebond)
	Mix_PlayChannel(-1, sample_rebond, 0);

}

function raquettize_dx()
{
    bb_dx = Math.floor((OX(baballe.x, baballe.ox) + BLOCK_SIZE / 2 - OX(cur_piece.x + 1, cur_piece.ox)) / 2);
    bb_dx += rand(5) - 3; // Just for fun

    var new_x = PF(baballe.x, baballe.ox) + bb_dx;
    if (new_x <= 0 || new_x >= BLOCK_SIZE * (PF_W - 1))
	bb_dx = -bb_dx;
    baballe.dx = bb_dx;
}

// main function for ball & racket movement in breakout mode
function move_b()
{
    cur_piece.dx = cmd_dx;
    var dx = cur_piece.dx > 0 ? 1 : cur_piece.dx < 0 ? -1 : 0;
    var ox = cur_piece.ox > 0 ? 1 : cur_piece.ox < 0 ? -1 : 0;
    var tx = dx * (ox && ox == dx ? 2 : 1);

    if (dx < 0 && cur_piece.x + tx < 0 || dx > 0 && (cur_piece.x + cur_piece.w - 1 + tx >= PF_W)) {
	var new_dx = (dx * BLOCK_SIZE - cur_piece.ox) % BLOCK_SIZE;
	if (Math.abs(new_dx) < Math.abs(cur_piece.dx))
	    cur_piece.dx = new_dx;
    }
  
    move_piece(null);

    baballe.dx = bb_dx;
    baballe.dy = bb_dy;

    if (!doing_bonuses)
	boom_nb = 0;

    check_rebond();
    move_piece(baballe);
}

// setup of breakout mode
function setup_breakout()
{
  state = BREAKOUT;

  b_is_game_over = false;

  cur_piece = raquette.clone();
  cur_piece.x = PF_W / 2 - 1;
  disp_piece(null);

  baballe = balle.clone();
  baballe.x = PF_W / 2 - (rand(2) - 1);
  baballe.ox = (rand(BLOCK_SIZE) - 1) - BLOCK_SIZE / 2;
  baballe.y = 1;
  baballe.oy = 1;
  baballe.dy = baballe.dx = 0;
  disp_piece(baballe);
  move_piece(baballe);
  bb_dy = BLOCK_SIZE / 2;
  raquettize_dx();
  blinking_bonuses = 0;
  ecore_timer_interval_set(game_timer, (5.25 - level / 4) / 100);
  display_image_text('breakout');
}

// end of breakout mode, go back to normal game
function setdown_breakout()
{
  //  fade_image(ROCK_N_ROLL, 50, true, true);

  del_piece(null);
  del_piece(baballe);

  state = GAME;
}

function set_nouv_piece()
{
    cmd_np = false;
    nouv_piece();
    loop_cnt = 0;
    ecore_timer_interval_set(game_timer, (5.25 - level / 4) / 100);
}

// main loop
function loop()
{
    if (pause_me || displaying_text || removing_playfield)
	return 1;

    switch (state) {
    case GAME:
	if (!checking_lines) {
	    if (cmd_np) {
		if (cmd_b) {
		    cmd_b = 0;
		    setup_breakout();
		    return 1;
		} else {
		    set_nouv_piece();
		    add_score(1);
		}
	    }
	    if (is_game_really_over) {
		setdown_game();
		return 0;
	    }
	    if (is_game_over) {
		display_image_text('over');
		is_game_really_over = true;
		setdown_playfield();
		del_next_piece();
		if (sound)
		    Mix_FadeOutChannel(-1, 1000);
		return 1;
	    }

	    move_it();
	}

	break;
    case BREAKOUT:
	move_b();

	if (b_is_game_over) {
	    setdown_breakout();
	    set_nouv_piece();
	    display_image_text('start');
	}
	break;
    case MENU:
	break;
    }

    return 1;
}

function setup_game()
{
    score = checking_lines = loop_cnt = 0;
    doing_bonuses = false;
    is_game_over = is_game_really_over = false;
    edje_object_file_set(edje_o, "TetriBox-Mid.edj", "game");
    edje_object_signal_emit(edje_o, "play,fond,appear", "js");
    edje_object_signal_emit(edje_o, "play,score,appear", "js");
    edje_object_signal_emit(edje_o, "play,level,appear", "js");
    edje_object_signal_emit(edje_o, "play,high-score,appear", "js");
    setup_playfield();
    if (DEBUG && DEBUG_PIECE)
	next_piece = piece[DEBUG_PIECE - 1].clone();
    else
	next_piece = piece[rand(7) - 1].clone();
    disp_piece(next_piece, 'next');
    nouv_piece();
    evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_DOWN, game_on_key_down,   null);
    evas_object_event_callback_add(backdrop, EVAS_CALLBACK_KEY_UP,   game_pre_on_key_up, null);
    state = GAME;
    level = 1;
    nb_lines = 0;
    image_text = edje_object_add(evas);
    edje_object_file_set(image_text, "TetriBox-Mid.edj", "image_text");
    evas_object_layer_set(image_text, 100);
    evas_object_resize(image_text, 720, 576);
    evas_object_show(image_text);
    edje_object_part_text_set(edje_o, "high-score", hi_score);
    edje_object_part_text_set(edje_o, "level", 1);
    edje_object_part_text_set(edje_o, "score", 0);
    display_image_text('start');

    if (sample)
	Mix_PlayChannel(-1, sample, -1);
    //	Mix_FadeInChannel(1, sample, -1, 1000);

    if (DEBUG && DEBUG_FAST)
	game_timer = ecore_timer_add(0.01, loop, null);
    else
	game_timer = ecore_timer_add(0.05, loop, null);
}

function cube_disappeared(data, obj, sig, src)
{
    evas_object_del(obj);
}

function fond_disappeared(data, obj, sig, src)
{
    setup_menu();
}

function setdown_playfield_done()
{
    for (var x = 0; x < PF_W; x++)
	for (var y = 0; y < PF_H; y++)
	    if (playfield[x][y])
		del_block(x, y);

    removing_playfield = false;
    return 0;
}

function anim_loop(data)
{
    while (!data.testfunc(data))
	if (!anim_get_next(data)) {
	    ecore_timer_add(data.after_interval, data.after_func, data);
	    return 0;
	}
    
    data.payload_func(data);

    if (anim_get_next(data))
	return 1;
    else {
	ecore_timer_add(data.after_interval, data.after_func, data);
	return 0;
    }
}

// Get next coord for reusable animation routine
function anim_get_next(data)
{
    if (data.next_x(data) >= data.max_x) {
	data.x = data.min_x;
	if (data.next_y(data) >= data.max_y)
	    return 0;
    }

    return 1;
}

// Reusable animation routine
function anim(data)
{
    data.x = data.min_x;
    data.y = data.min_y;

    ecore_timer_add(data.interval, anim_loop, data);
}

function setdown_payload(data)
{
    var o;

    edje_object_signal_emit(data.obj, "play,cube,disappear", "js");

    if (o = playfield_bonus[data.x][data.y])
	edje_object_signal_emit(o, "play,cube,disappear", "js");

    if (o = playfield_crado[data.x][data.y])
	edje_object_signal_emit(o, "play,cube,disappear", "js");
}

// animated removing of playfields
function setdown_playfield()
{
    removing_playfield = true;
    anim({ interval: 0.02, min_x: 0, min_y: 0, max_x: PF_W, max_y: PF_H, next_x: function(data) { return ++data.x }, next_y: function(data) { return ++data.y }, testfunc: function(data) { return (data.obj = playfield[data.x][data.y]) }, payload_func: setdown_payload, after_interval: 0.8, after_func: setdown_playfield_done });
}

function hof_cb(pos, name)
{
    if (pos) {
	t_scores_a[pos] = { rank: pos, name: name, level: level, score: score };
	scores_save(t_scores_a);
    }
    state = MENU;
    setup_menu();
}

function setdown_game()
{
    edje_object_signal_emit(edje_o, "play,fond,disappear", "js");
    edje_object_signal_emit(edje_o, "play,score,disappear", "js");
    edje_object_signal_emit(edje_o, "play,level,disappear", "js");
    edje_object_signal_emit(edje_o, "play,high-score,disappear", "js");

    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, game_on_key_down, null);
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   game_on_key_up, null  );
    evas_object_del(image_text);

    var new_score_pos = 0;
    if (new_score_pos = scores_check(t_scores_a, score, level)) {
	state = HOF;
	hof_setup("TetriBox-Mid", backdrop, edje_o, evas, hof_cb, t_scores_a, new_score_pos);
    } else
	state = MENU;
}

function background_disappeared_quit(data, e, obj, event)
{
    ecore_main_loop_quit();
}

function background_disappeared_hof(data, e, obj, event)
{
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, menu_on_key_down, null);
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   menu_on_key_up, null);
    hof_setup("TetriBox-Mid", backdrop, edje_o, evas, hof_cb, t_scores_a, 0);
    state = HOF;
}

function menu_disappeared(data, e, obj, event)
{
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_DOWN, menu_on_key_down, null);
    evas_object_event_callback_del(backdrop, EVAS_CALLBACK_KEY_UP,   menu_on_key_up, null);
    edje_object_signal_callback_del(edje_o, "menu_disappeared", "edc", menu_disappeared);
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
	} else if (msg == 2) {
	    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 5, 1);
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
    edje_object_signal_callback_add(edje_o, "cube_disappeared", "edc", cube_disappeared, null);
    edje_object_signal_callback_add(edje_o, "fond_disappeared", "edc", fond_disappeared, null);
    edje_object_signal_callback_add(edje_o, "background_disappeared_quit", "edc", background_disappeared_quit, null);
    edje_object_signal_callback_add(edje_o, "background_disappeared_hof", "edc", background_disappeared_hof, null);
    edje_object_file_set(edje_o, "TetriBox-Mid.edj", "menu");
    evas_object_layer_set(edje_o, 0);
    evas_object_move(edje_o, 0, 0);
    evas_object_resize(edje_o, 720, 576);
    evas_object_show(edje_o);

    edje_object_message_send(edje_o, EDJE_MESSAGE_INT, 1, 0);
}

// main setup
function setup()
{
    if (shutdown == undefined || shutdown == false) {
	ecore_init();
	ecore_evas_init();
	edje_init();
	
	ee = ecore_evas_new(null, 0, 0, 720, 576, "name=TetriBox");
	
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

    if (!scores_init("TetriBox")) {
	debug(1, "Could not init scores");
	return false;
    }

    t_scores_a = scores_load();
    hi_score = t_scores_a[1].score;

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
	case 'DEBUG_PIECE':
	    DEBUG_PIECE = val;
	    break;
	case 'DEBUG_BONUS':
	    DEBUG_BONUS = val;
	    break;
	case 'DEBUG_FAST':
	    DEBUG_FAST = val;
	    break;
	case 'DEBUG_CHEAT':
	    DEBUG_CHEAT = parseInt(val);
	    break;
	case 'version':
	    version = parseInt(val);
	    break;
	}
    }
    debug(1, "DEBUG: " + DEBUG + ", DEBUG_PIECE: " + DEBUG_PIECE + ", DEBUG_BONUS: " + DEBUG_BONUS + ", DEBUG_FAST: " + DEBUG_FAST + ", DEBUG_CHEAT: " + DEBUG_CHEAT);
}

// print <str> if debug level >= <lvl>
function debug(lvl, str)
{
    if (DEBUG >= lvl)
	elx.print('*** [' + lvl + '] ' + str + "\n");
}

// add a number to the score and display it (possibly sets and displays high score too if needed)
// <nb> value to add to the score
function add_score(nb)
{
  score += nb;
  edje_object_part_text_set(edje_o, "score", score);

  if (score > hi_score) {
    hi_score = score;
    edje_object_part_text_set(edje_o, "high-score", score);
  }
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
