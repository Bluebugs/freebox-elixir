/*****************************************************************************
 * TetriBox : Tetris clone for elixir
 *****************************************************************************/

/*
 * Runtime declarations
 */

//elx.tracker(true);

var test = true;

var sound = elx.load("mix");

var shutdown;

if (shutdown == undefined || shutdown == false)
{
    test &= elx.load("evas");
    test &= elx.load("ecore");
    test &= elx.load("ecore-evas");
    test &= elx.load("edje");
}

test &= elx.include("edje-helper.edj", "score-helper");
test &= elx.include("edje-helper.edj", "edje-helper");
test &= elx.include("edje-helper.edj", "ecore-job-helper");
test &= elx.include("edje-helper.edj", "math_helper");

var FN = "/.fonts/";

var NULL = null;


/*
 * TetriBox constants
 */

var WIN = { w: 720, h: 576 };
var EDJE_FILE = "TetriBox.edj";
var BLOCK_SIZE   = 20;
var PF_W         = 10;
var PF_H         = 20;
var LEVEL_LINES  = 10;
var START_PERIOD = 0.5;
var PAUSE_PERIOD = 1.0;


/*
 * TetriBox globals
 */

var ee;
var evas;
var o_bg;
var grid;
var key_timer = null;
var fall_timer = null;
var bonus_timer = null;
var current_period;
var pause_me;
var check_again;

var preview_grid;
var game_grid;
var grid;
var lines;

var cur_piece = null, next_piece = null;

var score = 0, level = 1, high_score = 0, nb_lines = 0;
var shadow = true, bonus = true;

var timestamp = 0;
var timecount = 0;

/* sounds */
var line_sound;
var level_sound;
var bomb_sound;
var change_sound;
var toilet_sound;
var mirror_sound;
var over_sound;


/*
 * Helpers
 */

function key_cb_up(data, e, obj, event)
{
    if (key_timer)
    {
        ecore_timer_del(key_timer);
        key_timer = null;
    }

    timestamp = event.timestamp;
}

function key_cb_repeat(data)
{
    data.func(data.arg);
    ecore_timer_interval_set(key_timer, 0.1);

    return 1;
}


/*
 * Cube handlers
 */

var colors = ["cyan", "blue", "yellow", "black", "red", "orange", "green",
              "pink"];

function set_cube(field, x, y, color, dirty, bonus, fade)
{
    if (fade == undefined) fade = false;

    if (field[x][y].color != color)
    {
        var action;

        if (!color)
        {
            if (fade)
                action = field[x][y].color + "/fadeout";
            else
                action = "default";
        }
        else
        {
            if (fade)
                action = color + "/fade";
            else
                action = color;
        }

        if (field == game_grid)
        {
            if (!field[x][y].color)
                lines[y]++;
            if (!color)
                lines[y]--;
        }

        field[x][y].color = color;
        edje_object_signal_emit(field[x][y].obj, action, "code");
    }
    if (field[x][y].dirty != dirty)
    {
        field[x][y].dirty = dirty;
        edje_object_signal_emit(field[x][y].obj,
                                "dirty/" + (dirty ? dirty : "default"), "code");
    }
    if (field[x][y].bonus != bonus)
    {
        field[x][y].bonus = bonus;
        edje_object_signal_emit(field[x][y].obj,
                                "bonus/" + (bonus ? bonus : "default"), "code");
    }
}

function set_circle(x, y, r, color, dirty, bonus)
{
    for (var dr = - r; dr <= r; dr++)
    {
        /* horizontal line */
        if (x + dr >= 0 && x + dr < PF_W)
        {
            if (y - r >= 0)
                set_cube(game_grid, x + dr, y - r,
                         color == "-" ? game_grid[x + dr][y - r].color : color,
                         dirty == "-" ? game_grid[x + dr][y - r].dirty : dirty,
                         bonus == "-" ? game_grid[x + dr][y - r].bonus : bonus);
            if (y + r < PF_H)
                set_cube(game_grid, x + dr, y + r,
                         color == "-" ? game_grid[x + dr][y + r].color : color,
                         dirty == "-" ? game_grid[x + dr][y + r].dirty : dirty,
                         bonus == "-" ? game_grid[x + dr][y + r].bonus : bonus);
        }

        /* vertical line */
        if (y + dr >= 0 && y + dr < PF_H && dr != 0)
        {
            if (x - r >= 0)
                set_cube(game_grid, x - r, y + dr,
                         color == "-" ? game_grid[x - r][y + dr].color : color,
                         dirty == "-" ? game_grid[x - r][y + dr].dirty : dirty,
                         bonus == "-" ? game_grid[x - r][y + dr].bonus : bonus);
            if (x + r < PF_W)
                set_cube(game_grid, x + r, y + dr,
                         color == "-" ? game_grid[x + r][y + dr].color : color,
                         dirty == "-" ? game_grid[x + r][y + dr].dirty : dirty,
                         bonus == "-" ? game_grid[x + r][y + dr].bonus : bonus);
        }
    }
}

function dirty_circle(x, y, r)
{
    for (var dr = - r + 1; dr <= r - 1; dr++)
    {
        /* horizontal line */
        if (x + dr >= 0 && x + dr < PF_W)
        {
            if (y - r >= 0 && game_grid[x + dr][y - r].color)
                set_cube(game_grid, x + dr, y - r,
                         game_grid[x + dr][y - r].color,
                         "bottom", game_grid[x + dr][y - r].bonus);
            if (y + r < PF_H && game_grid[x + dr][y + r].color)
                set_cube(game_grid, x + dr, y + r,
                         game_grid[x + dr][y + r].color,
                         "top", game_grid[x + dr][y + r].bonus);
        }

        /* vertical line */
        if (y + dr >= 0 && y + dr < PF_H)
        {
            if (x - r >= 0 && game_grid[x - r][y + dr].color)
                set_cube(game_grid, x - r, y + dr,
                         game_grid[x - r][y + dr].color,
                         "right", game_grid[x - r][y + dr].bonus);
            if (x + r < PF_W && game_grid[x + r][y + dr].color)
                set_cube(game_grid, x + r, y + dr,
                         game_grid[x + r][y + dr].color,
                         "left", game_grid[x + r][y + dr].bonus);
        }
    }
}

function switch_cubes(p1, p2)
{
    var c1 = game_grid[p1.x][p1.y];
    var c2 = game_grid[p2.x][p2.y];
    var save = {color: c1.color, dirty: c1.dirty, bonus: c1.bonus};
    set_cube(game_grid, p1.x, p1.y, c2.color, c2.dirty, c2.bonus, true);
    set_cube(game_grid, p2.x, p2.y, save.color, save.dirty, save.bonus, true);
}

function find_highest_cube()
{
    for (var y = 0; y < PF_H; y++)
        if (lines[y])
            return y;

    return PF_H - 1;
}

function change_random_block(b_add, keep_y)
{
    var h = find_highest_cube();

    var what_to_check = b_add ? PF_W : 0;

    /* Check that it is at all possible */
    for (var y = h; y < PF_H; y++)
        if (lines[y] != what_to_check && y != keep_y)
            break;
    if (y == PF_H && (!b_add || --h < 0))
        return false;

    var y =  h + rand(PF_H - h) - 1;
    while (lines[y] == what_to_check || y == keep_y)
    {
        y++;
        if (y == PF_H)
            y = h;
    }

    what_to_check = b_add ? true : false;

    var x = rand(PF_W) - 1;
    while (Boolean(game_grid[x][y].color) == what_to_check)
    {
        x++;
        if (x == PF_W)
            x = 0;
    }

    if (!b_add)
        set_cube(game_grid, x, y, "", "", "", true);
    else
        set_cube(game_grid, x, y, colors[rand(colors.length) - 1], "", "",
                 true);

    return true;
}

function shrink_line(y)
{
    edje_object_signal_emit(grid, "shrink/" + y, "code");
}

function unshrink_line(y)
{
    edje_object_signal_emit(grid, "unshrink/" + y, "code");
}


/*
 * Pieces handlers
 */

var pieces = [
    {w: 4, h: 1, gx: 1, gy: 0, color:
     [["green", "green", "green", "green"],
      ["", "", "", ""],
      ["", "", "", ""],
      ["", "", "", ""]]},
    {w: 3, h: 2, gx: 1, gy: 1, color:
     [["cyan", "", "", ""],
      ["cyan", "cyan", "cyan", ""],
      ["", "", "", ""],
      ["", "", "", ""]]},
    {w: 3, h: 2, gx: 1, gy: 1, color:
     [["", "", "blue", ""],
      ["blue", "blue", "blue", ""],
      ["", "", "", ""],
      ["", "", "", ""]]},
    {w: 2, h: 2, gx: 0, gy: 0, color:
     [["yellow", "yellow", "", ""],
      ["yellow", "yellow", "", ""],
      ["", "", "", ""],
      ["", "", "", ""]]},
    {w: 3, h: 2, gx: 1, gy: 1, color:
     [["", "pink", "", ""],
      ["pink", "pink", "pink", ""],
      ["", "", "", ""],
      ["", "", "", ""]]},
    {w: 3, h: 2, gx: 1, gy: 0, color:
     [["red", "red", "", ""],
      ["", "red", "red", ""],
      ["", "", "", ""],
      ["", "", "", ""]]},
    {w: 3, h: 2, gx: 1, gy: 0, color:
     [["", "orange", "orange", ""],
      ["orange", "orange", "", ""],
      ["", "", "", ""],
      ["", "", "", ""]]},
];

var empty_array =
    [["", "", "", ""],
     ["", "", "", ""],
     ["", "", "", ""],
     ["", "", "", ""]];

var bonuses = ["bomb", "ghost", "plus", "mirror", "toilet", "random"];

function duplicate_2d(old_array)
{
    var new_array = new Array(old_array.length);
    for (var i = 0; i < old_array.length; i++)
        new_array[i] = old_array[i].slice(0);

    return new_array;
}

function new_piece()
{
    var old_piece = pieces[rand(pieces.length) - 1];

    return {w: old_piece.w, h: old_piece.h, gx: old_piece.gx, gy: old_piece.gy,
             color: duplicate_2d(old_piece.color),
             dirty: duplicate_2d(empty_array),
             bonus: duplicate_2d(empty_array)};
}

function display_preview(piece)
{
    var xoffset = 0;
    if (piece.w < 3) xoffset = 1;

    for (var y = 0; y < 2; y++)
    {
        for (var x = 0; x < 4; x++)
        {
            if (x >= xoffset && piece.color[y][x - xoffset])
                set_cube(preview_grid, x, y, piece.color[y][x - xoffset],
                         piece.dirty[y][x - xoffset],
                         piece.bonus[y][x - xoffset]);
            else
                set_cube(preview_grid, x, y, "", "", "");
        }
    }
}

function display_piece(piece, dry_run)
{
    var xoffset = piece.x - piece.gx;
    var yoffset = piece.y - piece.gy;

    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 4; x++)
        {
            if (piece.color[y][x])
            {
                if (dry_run)
                    game_grid[x + xoffset][y + yoffset].color
                        = piece.color[y][x];
                else
                    set_cube(game_grid, x + xoffset, y + yoffset,
                             piece.color[y][x], piece.dirty[y][x],
                             piece.bonus[y][x]);
            }
        }
    }
}

function display_shadow(piece, dry_run)
{
    if (!shadow) return;

    var xoffset = piece.x - piece.gx;
    var shadowyoffset = piece.shadow_y - piece.gy;

    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 4; x++)
        {
            if (piece.color[y][x])
            {
                if (dry_run)
                    game_grid[x + xoffset][y + shadowyoffset].color
                        = piece.color[y][x] + "/shadow";
                else
                    set_cube(game_grid, x + xoffset, y + shadowyoffset,
                             piece.color[y][x] + "/shadow", "", "");
            }
        }
    }
}

function hide_piece(piece, dry_run)
{
    var xoffset = piece.x - piece.gx;
    var yoffset = piece.y - piece.gy;

    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 4; x++)
        {
            if (piece.color[y][x])
            {
                if (dry_run)
                    game_grid[x + xoffset][y + yoffset].color = "";
                else
                    set_cube(game_grid, x + xoffset, y + yoffset, "", "", "");
            }
        }
    }
}

function hide_shadow(piece, dry_run)
{
    if (!shadow) return;

    var xoffset = piece.x - piece.gx;
    var shadowyoffset = piece.shadow_y - piece.gy;

    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 4; x++)
        {
            if (piece.color[y][x])
            {
                if (dry_run)
                    game_grid[x + xoffset][y + shadowyoffset].color = "";
                else
                    set_cube(game_grid, x + xoffset, y + shadowyoffset,
                             "", "", "");
            }
        }
    }
}

function check_piece(piece, xnew, ynew)
{
    var xoffset = xnew - piece.gx;
    var yoffset = ynew - piece.gy;

    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 4; x++)
        {
            if (piece.color[y][x]
                 && (x + xoffset < 0 || y + yoffset < 0
                      || x + xoffset >= PF_W || y + yoffset >= PF_H
                      || game_grid[x + xoffset][y + yoffset].color))
                return false;
        }
    }

    return true;
}

function throw_shadow(piece)
{
    for (var y = piece.y + 1; y < PF_H; y++)
    {
        if (!check_piece(piece, piece.x, y))
        {
            piece.shadow_y = y - 1;
            return;
        }
    }

    piece.shadow_y = PF_H - 1;
}

function move_piece(direction)
{
    var piece = cur_piece;
    var newx, newy;

    if (!piece)
        return false;

    hide_piece(piece, true);
    hide_shadow(piece, true);
    newx = piece.x;
    newy = piece.y;

    switch (direction)
    {
        case "down": newy++; break;
        case "left": newx--; break;
        case "right": newx++; break;
        default: /* this should not happen */
            display_shadow(piece, true);
            display_piece(piece, true);
            return false;
    }

    if (!check_piece(piece, newx, newy))
    {
        display_shadow(piece, true);
        display_piece(piece, true);
        return false;
    }
    display_shadow(piece, true);
    display_piece(piece, true);

    edje_freeze();
    hide_piece(piece, false);
    if (piece.x != newx)
        hide_shadow(piece, false);

    if (piece.x != newx)
    {
        piece.x = newx;
        piece.y = newy;

        throw_shadow(piece);
        display_shadow(piece, false);
    }
    else
    {
        piece.x = newx;
        piece.y = newy;
    }
    display_piece(piece, false);
    edje_thaw();
    return true;
}

function down_piece()
{
    var piece = cur_piece;

    if (!piece)
        return false;

    edje_freeze();
    hide_piece(piece, false);
    piece.y = piece.shadow_y;
    display_piece(piece, false);
    edje_thaw();
}

function rotate_array(old_array, w, h, dir)
{
    var new_array = Array(4);
    for (var y = 0; y < 4; y++)
        new_array[y] = Array(4);

    for (var y = 0; y < h; y++)
    {
        for (var x = 0; x < w; x++)
        {
            if (dir == "right")
                new_array[x][h - 1 - y] = old_array[y][x];
            else
                new_array[w - 1 - x][y] = old_array[y][x];
        }
    }

    return new_array;
}

function rotate_piece(dir)
{
    var piece = cur_piece;
    var new_piece;

    if (!piece)
        return false;

    hide_piece(piece, true);
    hide_shadow(piece, true);

    if (piece.gx == 0 && piece.gy == 0)
    {
        /* Slight hack for square */
        new_piece = {w: piece.h, h: piece.w, x: piece.x, y: piece.y,
                     gx: 0, gy: 0,
                     color: rotate_array(piece.color, piece.w, piece.h, dir),
                     dirty: rotate_array(piece.dirty, piece.w, piece.h, dir),
                     bonus: rotate_array(piece.bonus, piece.w, piece.h, dir)};
    }
    else
    {
        new_piece = {w: piece.h, h: piece.w, x: piece.x, y: piece.y,
                     gx: dir == "right" ? piece.h - 1 - piece.gy : piece.gy,
                     gy: dir == "right" ? piece.gx : piece.w - 1 - piece.gx,
                     color: rotate_array(piece.color, piece.w, piece.h, dir),
                     dirty: rotate_array(piece.dirty, piece.w, piece.h, dir),
                     bonus: rotate_array(piece.bonus, piece.w, piece.h, dir)};
    }

    if (!check_piece(new_piece, new_piece.x, new_piece.y))
    {
        display_shadow(piece, true);
        display_piece(piece, true);
        return false;
    }
    display_shadow(piece, true);
    display_piece(piece, true);

    edje_freeze();
    hide_piece(piece, false);
    hide_shadow(piece, false);

    throw_shadow(new_piece);
    display_shadow(new_piece, false);
    display_piece(new_piece, false);
    edje_thaw();

    cur_piece = new_piece;
    return true;
}

function add_bonus(piece)
{
    if (!bonus || level < 2 || rand(Math.max(12 - level, 1)) != 1)
       return;

    var bx, by;

    do
    {
        bx = rand(piece.w) - 1;
        by = rand(piece.h) - 1;
    }
    while (!piece.color[by][bx]);

    piece.bonus[by][bx] = bonuses[rand(bonuses.length) - 1];
}


/*
 * Game implementation
 */

function add_score(nb)
{
    score += nb;
    edje_object_part_text_set(o_bg, "score", score);
    if (score > high_score)
    {
        high_score = score;
        edje_object_part_text_set(o_bg, "high-score", high_score);
    }
}

function add_level(nb)
{
    nb_lines += nb;

    if (nb_lines >= LEVEL_LINES)
    {
        nb_lines = 0;
        level++;
        current_period = START_PERIOD * 10 / (9 + level);
        ecore_timer_interval_set(fall_timer, current_period);
        edje_object_part_text_set(o_bg, "level", level);
        edje_object_signal_emit(o_bg, "next", "code");
        if (sound && Mix_PlayChannel(-1, level_sound, 0) == -1)
            elx.print("failed playing level\n");
    }
}

function bomb_cb(coord)
{
    edje_freeze();
    if (coord.step == 1)
    {
        dirty_circle(coord.x, coord.y, coord.current + 1);
        set_circle(coord.x, coord.y, coord.current, "yellow", "", "boom");
    }
    else
    {
        set_circle(coord.x, coord.y, coord.current, "", "", "");
    }
    edje_thaw();

    coord.current++;
    if (coord.current > coord.max)
    {
        if (coord.step == 1)
        {
            /* Now clear the blocks */
            coord.step = 2
            coord.current = 1;
        }
        else
        {
            set_cube(game_grid, coord.x, coord.y,
                     game_grid[coord.x][coord.y].color,
                     game_grid[coord.x][coord.y].dirty, "");
            bonus_timer = null;
            return 0; /* The end */
        }
    }

    return 1;
}

function change_cb(coord)
{
    var result = change_random_block(coord.b_add, coord.y);

    coord.current++;
    if (coord.current > coord.max || !result)
    {
        set_cube(game_grid, coord.x, coord.y,
                 game_grid[coord.x][coord.y].color,
                 game_grid[coord.x][coord.y].dirty, "");
        bonus_timer = null;
        return 0; /* The end */
    }

    return 1;
}

function toilet_cb(coord)
{
    var h = find_highest_cube();
    for (var y = h; y < h + coord.lines && y < PF_H; y++)
        for (var x = 0; x < PF_W; x++)
            set_cube(game_grid, x, y, "", "", "", true);

    if (y >= PF_H)
    {
        bonus_timer = null;
        return 0;
    }

    return 1;
}

function mirror_horizontal()
{
    for (var y = 0; y < PF_H; y++)
    {
        if (!lines[y]) continue;

        for (var x = 0; x < PF_W / 2; x++)
            switch_cubes({x: x, y: y}, {x: PF_W - x - 1, y: y});
    }
}

function mirror_vertical()
{
    var h = find_highest_cube();
    var l = (PF_H - 1 - h) / 2;

    for (var y = h; y < h + l; y++)
        for (var x = 0; x < PF_W; x++)
            switch_cubes({x: x, y: y}, {x: x, y: PF_H - 1 - (y - h)});
}

function bonus_cb(coord)
{
    var x = coord.x, y = coord.y;
    bonus_timer = null;

    edje_freeze();
    switch (game_grid[x][y].bonus)
    {
    case "bomb/flash":
        /* First explode all concentric circles of blocks one by one */
        coord.max = rand(3);
        coord.current = 1;
        coord.step = 1;
        add_score(coord.max * 2);

        dirty_circle(x, y, 1);
        set_cube(game_grid, x, y, game_grid[x][y].color, "right",
                 game_grid[x][y].bonus);
        if (coord.current <= coord.max)
            bonus_timer = ecore_timer_add(0.12, bomb_cb, coord);
        break;

    case "plus/flash":
        coord.b_add = true;
        /* pass-through */
    case "ghost/flash":
        if (coord.b_add == undefined)
            coord.b_add = false;

        coord.max = rand(3) + 1;
        coord.current = 1;
        add_score(coord.max * 2);

        if (change_random_block(coord.b_add, coord.y)
             && coord.current <= coord.max)
            bonus_timer = ecore_timer_add(0.12, change_cb, coord);
        else
            set_cube(game_grid, coord.x, coord.y,
                     game_grid[coord.x][coord.y].color,
                     game_grid[coord.x][coord.y].dirty, "");
        break;

    case "mirror/flash":
        set_cube(game_grid, coord.x, coord.y,
                 game_grid[coord.x][coord.y].color,
                 game_grid[coord.x][coord.y].dirty, "");
        if (rand(2) == 1)
            mirror_vertical();
        else
            mirror_horizontal();
        break;

    case "toilet/flash":
        var h = find_highest_cube();
        coord.lines = Math.floor((PF_H - h + 3) / 4);

        for (var y = h; y < h + coord.lines && y < PF_H; y++)
            for (var x = 0; x < PF_W; x++)
                set_cube(game_grid, x, y, "", "", "", true);

        if (y < PF_H)
            bonus_timer = ecore_timer_add(0.12, toilet_cb, coord);
        break;

    default:
        /* This should not happen */
        elx.print("spurious bonus ", game_grid[coord.x][coord.y].bonus,
                  " (x=", coord.x, ", y=", coord.y, ")\n");
        set_cube(game_grid, coord.x, coord.y,
                 game_grid[coord.x][coord.y].color,
                 game_grid[coord.x][coord.y].dirty, "");
        break;
    }
    edje_thaw();

    return 0;
}

function handle_bonus(x, y)
{
    switch (game_grid[x][y].bonus)
    {
    case "random":
        game_grid[x][y].bonus = bonuses[rand(bonuses.length - 1) - 1];
        return handle_bonus(x, y);

    case "bomb":
        if (sound && Mix_PlayChannel(-1, bomb_sound, 0) == -1)
            elx.print("failed playing bomb.wav\n");
        break;

    case "plus":
    case "ghost":
        if (sound && Mix_PlayChannel(-1, change_sound, 0) == -1)
            elx.print("failed playing change.wav\n");
        break;

    case "mirror":
        if (sound && Mix_PlayChannel(-1, mirror_sound, 0) == -1)
            elx.print("failed playing mirror.wav\n");
        break;

    case "toilet":
        if (sound && Mix_PlayChannel(-1, toilet_sound, 0) == -1)
            elx.print("failed playing toilet.wav\n");
        break;

    default:
        /* This should not happen */
        elx.print("spurious bonus ", game_grid[x][y].bonus,
                  " (x=", x, ", y=", y, ")\n");
        set_cube(game_grid, x, y, game_grid[x][y].color, game_grid[x][y].dirty,
                 "");
        return;
    }

    set_cube(game_grid, x, y, game_grid[x][y].color, game_grid[x][y].dirty,
             game_grid[x][y].bonus + "/flash");
    bonus_timer = ecore_timer_add(0.12, bonus_cb, {x: x, y: y});
}

function shrink_lines()
{
    var intra = false;

    edje_freeze();
    for (var y = 0; y < PF_H; y++)
    {
        if (lines[y] == PF_W)
        {
            for (var x = 0; x < PF_W; x++)
                set_cube(game_grid, x, y, "white", "", "", true);

            shrink_line(y);
            add_score(10);
            add_level(1);
        }
        else if (lines[y] == 0 && intra)
            shrink_line(y);
        else if (lines[y] != 0)
            intra = true;
    }
    edje_thaw();
}

function remove_lines()
{
    var h = find_highest_cube();
    var reset_grid = false;
    var ynew = PF_H - 1;

    edje_freeze();
    for (var y = PF_H - 1; y >= 0; y--)
    {
        if (lines[y] == PF_W || (lines[y] == 0 && y > h))
        {
            /* Line y + 1 becomes y */
            unshrink_line(y);
            reset_grid = true;
            continue;
        }

        if (reset_grid)
        {
            for (var x = 0; x < PF_W; x++)
                set_cube(game_grid, x, ynew, game_grid[x][y].color,
                         game_grid[x][y].dirty, game_grid[x][y].bonus);
        }

        ynew--;
    }

    /* Blank out upper lines */
    for (; ynew >= 0; ynew--)
    {
        lines[ynew] = 0;
        for (var x = 0; x < PF_W; x++)
            set_cube(game_grid, x, ynew, "", "", "");
    }
    edje_thaw();

    return reset_grid;
}

function check_lines()
{
    var play_sound = false;

    for (var y = 0; y < PF_H; y++)
    {
        if (lines[y] == PF_W)
        {
            play_sound = true;

            for (var x = 0; x < PF_W; x++)
            {
                if (game_grid[x][y].bonus)
                {
                    handle_bonus(x, y);
                    return true;
                }
            }
        }
    }

    if (sound && play_sound && Mix_PlayChannel(-1, line_sound, 0) == -1)
        elx.print("failed playing line.wav\n");

    shrink_lines();
    return false;
}

function timer_cb()
{
    if (cur_piece != null)
    {
        if (!move_piece("down"))
        {
            add_score(1);
            cur_piece = null;
            check_again = check_lines();

            ecore_timer_interval_set(fall_timer, PAUSE_PERIOD);
        }
    }
    else if (check_again)
    {
        check_again = check_lines();
    }
    else
    {
        remove_lines();

        cur_piece = next_piece;
        cur_piece.x = PF_W / 2;
        cur_piece.y = cur_piece.gy;
        if (!check_piece(cur_piece, cur_piece.x, cur_piece.y))
        {
            game_over();
            return 0;
        }

        throw_shadow(cur_piece);
        edje_freeze();
        display_shadow(cur_piece, false);
        display_piece(cur_piece, false);
        next_piece = new_piece();
        add_bonus(next_piece);  
        display_preview(next_piece);
        edje_thaw();

        ecore_timer_interval_set(fall_timer, current_period);
    }

    return 1;
}

function key_game_cb_down(data, e, obj, event)
{
    if (key_timer)
    {
        ecore_timer_del(key_timer);
        key_timer = null;
    }
    switch (event.keyname)
    {
    case "Home":
    case "equal": /* stop */
    case "Stop":
        if (!pause_me)
        {
            pause_me = true;
            pause_game();
        }
        edje_exit(evas, o_bg, leave_game);
        break;

    case "Start":
    case "Escape": /* start */
        game_over();
        break;

    case "Select":
    case "Return": /* select */
    case "Play":
    case "greater": /* play/pause */
        if (event.timestamp != timestamp)
	    if (pause_me = !pause_me) // affectation
	        pause_game();
	    else
	        resume_game();
        break;

    case "l":
    case "x":
    case "Blue":
        if (!pause_me && event.timestamp != timestamp)
        {
            rotate_piece("left");
            key_timer = ecore_timer_add(0.2, key_cb_repeat,
                                        {func: rotate_piece, arg: "left"});
        }
        break;

    case "r":
    case "b":
    case "Red":
        if (!pause_me && event.timestamp != timestamp)
        {
            rotate_piece("right");
            key_timer = ecore_timer_add(0.2, key_cb_repeat,
                                        {func: rotate_piece, arg: "right"});
        }
        break;

    case "KP2":
    case "FP/Down":
    case "RC/Down":
    case "RCL/Down":
    case "GP/Down":
    case "Down":
        if (!pause_me)
        {
            move_piece("down");
            key_timer = ecore_timer_add(0.2, key_cb_repeat,
                                        {func: move_piece, arg: "down"});
        }
        break;

    case "KP4":
    case "FP/Left":
    case "RC/Left":
    case "RCL/Left":
    case "GP/Left":
    case "Left":
        if (!pause_me && (event.timestamp != timestamp || timecount++ > 1))
        {
            move_piece("left");
            key_timer = ecore_timer_add(0.2, key_cb_repeat,
                                        {func: move_piece, arg: "left"});
        }
        break;

    case "KP6":
    case "FP/Right":
    case "RC/Right":
    case "RCL/Right":
    case "GP/Right":
    case "Right":
        if (!pause_me && (event.timestamp != timestamp || timecount++ > 1))
        {
            move_piece("right");
            key_timer = ecore_timer_add(0.2, key_cb_repeat,
                                        {func: move_piece, arg: "right"});
        }
        break;

    case "Green":
    case "a":
        if (!pause_me)
            down_piece();
        break;

    default:
        break;
    }

    if (timestamp != event.timestamp) timecount = 0;
}

function pause_game()
{
    edje_object_signal_emit(o_bg, "pause", "code");
    if (fall_timer)
        ecore_timer_freeze(fall_timer);
    if (bonus_timer)
        ecore_timer_freeze(bonus_timer);
    if (key_timer)
    {
        ecore_timer_del(key_timer);
        key_timer = null;
    }
}

function resume_game()
{
    edje_object_signal_emit(o_bg, "resume", "code");
    ecore_timer_thaw(fall_timer);
}

function key_over_cb_up(data, e, obj, event)
{
    switch (event.keyname)
    {
    case "Home":
    case "equal":
    case "Stop":
        edje_exit(evas, o_bg, leave_game);
        break;

    case "Start":
    case "Escape": /* start */
    case "Select":
    case "Return": /* select */
    case "Play":
    case "greater": /* play/pause */
    case "l":
    case "r":
    case "Blue":
    case "x":
    case "Yellow":
    case "y":
    case "Red":
    case "b":
    case "Green":
    case "a":
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
        evas_object_event_callback_del(o_bg, EVAS_CALLBACK_KEY_UP,
                                       key_over_cb_up, null);
        clean_game();
        start_game();
        break;
    }
}

function over_cb()
{
    evas_object_event_callback_add(o_bg, EVAS_CALLBACK_KEY_UP,
                                   key_over_cb_up, null);
    return 0;
}

function game_over()
{
    if (key_timer)
    {
        ecore_timer_del(key_timer);
        key_timer = null;
    }
    if (fall_timer)
    {
        ecore_timer_del(fall_timer);
        fall_timer = null;
    }

    cur_piece = next_piece = null;

    evas_object_event_callback_del(o_bg, EVAS_CALLBACK_KEY_DOWN,
                                   key_game_cb_down, null);
    evas_object_event_callback_del(o_bg, EVAS_CALLBACK_KEY_UP,
                                   key_cb_up, null);
    edje_object_signal_emit(o_bg, "over", "code");

    if (sound && Mix_PlayChannel(-1, over_sound, 0) == -1)
        elx.print("failed playing over.wav\n");

    ecore_timer_add(1.0, over_cb, null);
}

function start_game()
{
    level = 1;
    score = 0;
    pause_me = false;
    check_again = false;
    current_period = START_PERIOD;
    edje_object_part_text_set(o_bg, "level", level);
    edje_object_part_text_set(o_bg, "score", score);
    edje_object_part_text_set(o_bg, "high-score", high_score);

    next_piece = new_piece();
    add_bonus(next_piece);  
    display_preview(next_piece);
    cur_piece = new_piece();
    add_bonus(cur_piece);  
    cur_piece.x = PF_W / 2;
    cur_piece.y = cur_piece.gy;
    throw_shadow(cur_piece);
    display_shadow(cur_piece, false);
    display_piece(cur_piece, false);

    fall_timer = ecore_timer_add(current_period, timer_cb, null);

    evas_object_event_callback_add(o_bg, EVAS_CALLBACK_KEY_DOWN,
                                   key_game_cb_down, null);
    evas_object_event_callback_add(o_bg, EVAS_CALLBACK_KEY_UP,
                                   key_cb_up, null);
    edje_object_signal_emit(o_bg, "start", "code");
}

function clean_game()
{
    for (var x = 0; x < PF_W; x++)
        for (var y = 0; y < PF_H; y++)
            set_cube(game_grid, x, y, "", "", "");

    for (var y = 0; y < PF_H; y++)
        lines[y] = 0;
}

function game_setup()
{
    edje_freeze();

    edje_object_file_set(o_bg, "TetriBox.edj", "game");
    grid = edje_object_part_swallow_get(o_bg, "grid");
    var preview = edje_object_part_swallow_get(o_bg, "preview");

    game_grid = new Array(PF_W);
    for (var x = 0; x < PF_W; x++)
        game_grid[x] = new Array(PF_H);

    for (var y = 0; y < PF_H; y++)
    {
        var line = edje_object_part_swallow_get(grid, y);

        for (var x = 0; x < PF_W; x++)
        {
            var o = edje_object_part_swallow_get(line, x);
            game_grid[x][y] =  {obj: o, color: "", bonus: "", dirty: ""};
        }
    }

    preview_grid = new Array(4);
    for (var x = 0; x < 4; x++)
    {
        preview_grid[x] = new Array(2);
        for (var y = 0; y < 2; y++)
        {
            var o = edje_object_part_swallow_get(preview, x + "/" + y);
            preview_grid[x][y] = {obj: o, state: "", bonus: "", dirty: ""};
        }
    }

    lines = new Array(PF_H);
    for (var y = 0; y < PF_H; y++)
        lines[y] = 0;

    start_game();

    edje_thaw();
}

function leave_game(test)
{
    if (score > high_score)
        save_highscore({score: score}, "TetriBox");

    if (!test)
        ecore_main_loop_quit();
}


/*
 * Welcome menu handlers
 */

function message_cb(data, obj, type, id, msg)
{
    if (id == 1)
    {
        evas_object_event_callback_del(o_bg, EVAS_CALLBACK_KEY_DOWN,
                                       key_menu_cb_down, null);
        evas_object_event_callback_del(o_bg, EVAS_CALLBACK_KEY_UP,
                                       key_cb_up, null);
        edje_object_message_handler_set(o, null, null);
        /* msg = btn */
        switch (msg)
        {
        case 0:
            /* Play */
            game_setup();
            break;
        case 1:
            ecore_main_loop_quit();
            break;
        }
    }
}

function menu_send_message(data)
{
    edje_object_message_send(o_bg, EDJE_MESSAGE_INT, 1, data);
}

function key_menu_cb_down(data, e, obj, event)
{
    if (key_timer)
    {
        ecore_timer_del(key_timer);
        key_timer = null;
    }

    switch (event.keyname)
    {
    case "a":
    case "Green":
        edje_object_signal_emit(o_bg, bonus ? "bonus-no" : "bonus-yes",
                                "code");
        bonus = !bonus;
        break;

    case "Red":
    case "b":
        edje_object_signal_emit(o_bg, shadow ? "shadow-no" : "shadow-yes",
                                "code");
        shadow = !shadow;
        break;

    case "KP8":
    case "Up":
    case "FP/Up":
    case "RC/Up":
    case "RCL/Up":
    case "GP/Up":
        menu_send_message(-1);
        key_timer = ecore_timer_add(0.2, key_cb_repeat,
                                    {func: menu_send_message, arg: -1});
        break;

    case "KP2":
    case "Down":
    case "FP/Down":
    case "RC/Down":
    case "RCL/Down":
    case "GP/Down":
        menu_send_message(1);
        key_timer = ecore_timer_add(0.2, key_cb_repeat,
                                    {func: menu_send_message, arg: +1});
        break;

    case "KP_Enter":
    case "Return":
    case "Select":
    case "FP/Ok":
    case "RC/Ok":
        edje_object_message_send(o_bg, EDJE_MESSAGE_INT, 2, 1);
        break;

    case "Home":
    case "equal":
    case "Escape":
    case "Start":
    case "Stop":
        ecore_main_loop_quit();
        break;

    default:
    }
}


/*
 * Core functions
 */

function sound_idler_cb(data)
{
    Mix_OpenAudio(44100, 0x9010, 1, 512);
    line_sound = Mix_LoadWAV("line.wav");
    level_sound = Mix_LoadWAV("level.wav");
    bomb_sound = Mix_LoadWAV("bomb.wav");
    change_sound = Mix_LoadWAV("change.wav");
    toilet_sound = Mix_LoadWAV("toilet.wav");
    mirror_sound = Mix_LoadWAV("mirror.wav");
    over_sound = Mix_LoadWAV("over.wav");
    var musiq_sound = Mix_LoadWAV("TetriBox.ogg");
    if (!line_sound || !level_sound || !bomb_sound || !change_sound ||
        !toilet_sound || !mirror_sound || !over_sound || !musiq_sound)
    {
        sound = false;
    }
    else
    {
        Mix_VolumeChunk(line_sound, 127);
        Mix_VolumeChunk(level_sound, 127);
        Mix_VolumeChunk(bomb_sound, 127);
        Mix_VolumeChunk(change_sound, 127);
        Mix_VolumeChunk(toilet_sound, 127);
        Mix_VolumeChunk(mirror_sound, 127);
        Mix_VolumeChunk(over_sound, 127);
        Mix_VolumeChunk(musiq_sound, 64);
        if (Mix_PlayChannel(-1, musiq_sound, -1) == -1)
            elx.print("failed playing musiq\n");
    }

    return 0;
}

function main()
{
    var scores = load_highscore();
    if (scores != null)
        high_score = scores.score;

    if (shutdown == undefined || shutdown == false)
    {
        ecore_init();
        ecore_evas_init();
        edje_init();

        ee = ecore_evas_new(null, 0, 0, WIN.w, WIN.h, "name=TetriBox;double_buffer=0;");

        evas = ecore_evas_get(ee);
        evas_image_cache_set(evas, 8192 * 1024);
        evas_font_path_prepend(evas, FN);
        evas_font_cache_set(evas, 512 * 1024);
    }
    else
        evas_object_del(eo_bg);

    edje_freeze();

    edje_frametime_set(25.0);
    ecore_animator_frametime_set(1.0 / 25.0);

    o = edje_object_add(evas);
    edje_object_file_set(o, EDJE_FILE, "menu");
    evas_object_layer_set(o, 1);
    evas_object_move(o, 0, 0);
    evas_object_resize(o, WIN.w, WIN.h);
    evas_object_focus_set(o, 1);
    evas_object_show(o);
    edje_object_message_handler_set(o, message_cb, null);
    evas_object_event_callback_add(o, EVAS_CALLBACK_KEY_DOWN,
                                   key_menu_cb_down, null);
    evas_object_event_callback_add(o, EVAS_CALLBACK_KEY_UP,
                                   key_cb_up, null);
    o_bg = o;

    edje_object_message_send(o_bg, EDJE_MESSAGE_INT, 1, 0);

    if (sound)
        ecore_idler_add(sound_idler_cb, null);

    ecore_evas_show(ee);

    edje_thaw();

    ecore_main_loop_begin();

    ecore_evas_free(ee);

    edje_shutdown();
    ecore_evas_shutdown();
    ecore_shutdown();
}

if (test)
    main();

true;
