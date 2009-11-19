/*****************************************************************************
 * BomberBox.js : BomberMan clone for elixir
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


/*
 * BomberBox constants
 */

var win = { w: 720, h: 576 };
var NB_TILES_X = 12;
var NB_TILES_Y = 8;
var TILE_SQUARE = 48;
var NB_BRICKS = 30;
var NB_CEMENT = 10;
var BONUS_PROB = 2;
var DEFAULT_STEP = 8;
var DEFAULT_RADIUS = 1;
var DEFAULT_BOMBS = 1;
var DEFAULT_TIME = 120000;
var SHRINK_TIME = 60000;
var EXPLOSION_TIME = 0.320;

var UP = 1;
var DOWN = 2;
var LEFT = 4;
var RIGHT = 8;

var EMPTY = 0;
var CEMENT = 1;
var BRICK = 2;
var BONUS_SHIFT = 2;
var BONUS_BOMB = 4;
var BONUS_DELAY = 8;
var BONUS_GLOVE = 16;
var BONUS_RADIUS = 32;
var BONUS_SPEED = 64;
var BONUS_COUNT = 5;
var MAX_STATE = 127;
var BOMB = 128;
var EXPLOSION = 256;
var DIRTY_SHIFT = 9;
var DIRTY_LEFT = (LEFT << DIRTY_SHIFT);
var DIRTY_RIGHT = (RIGHT << DIRTY_SHIFT);

var state_to_tile = Array();
state_to_tile[EMPTY] = "empty";
state_to_tile[CEMENT] = "cement";
state_to_tile[BRICK] = "brick";
state_to_tile[BONUS_BOMB] = "bonus-bomb";
state_to_tile[BONUS_DELAY] = "bonus-delay";
state_to_tile[BONUS_GLOVE] = "bonus-glove";
state_to_tile[BONUS_RADIUS] = "bonus-radius";
state_to_tile[BONUS_SPEED] = "bonus-speed";

var state_to_dirty = Array();
state_to_dirty[0] = "dirty-none";
state_to_dirty[LEFT] = "dirty-left";
state_to_dirty[RIGHT] = "dirty-right";
state_to_dirty[LEFT | RIGHT] = "dirty-all";

var NOT_ENTERABLE = BRICK | CEMENT | BOMB;
var BONUS = BONUS_BOMB | BONUS_DELAY | BONUS_GLOVE | BONUS_RADIUS | BONUS_SPEED;
var BREAKABLE = BRICK | BONUS;
var BLOCK = BRICK | CEMENT;

var PLACE_BOMB = 1;
var DO_ACTION = 2;
var CAN_DELAY = 4;
var HAS_GLOVE = 8;
var DEAD = 16;


/*
 * Variable declarations
 */

var evas;
var ee;
var eo_bg;
var geom;

var objects = null;
var time_obj;
var score_obj;

var grid_backup = [ [-1,-1,0,0,0,0,0,0,0,0,-1,-1], [-1,1,0,0,0,0,0,0,0,0,1,-1], [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0], [-1,1,0,0,0,0,0,0,0,0,1,-1], [-1,-1,0,0,0,0,0,0,0,0,-1,-1] ];
var grid;
var players;
var bombs;
var time;
var scores = [0, 0];

var timer_anim = null;
var timer_time = null;
var timer_game_over = null;
var timer_shrink = null;
var is_paused = false;

/* sounds */
var die_sound;
var bomb_sound;
var move_bomb_sound;
var MUSIQ_CHANNEL = 0;
var BOMB_CHANNEL = 1;
var MOVE_BOMB_CHANNEL = 2;
var DIE_CHANNEL = 3;


/*
 * Helper functions
 */

function insert_into_list(list, obj)
{
    var i;

    for (i = 0; i < list.length; i++)
    {
        if (!list[i])
        {
            list[i] = obj;
            return i;
        }
    }

    list.push(obj);
    return list.length - 1;
}

function change_dirty(x, y, nand, or)
{
    grid[y][x] &= ~(nand << DIRTY_SHIFT);
    grid[y][x] |= or << DIRTY_SHIFT;
    edje_object_signal_emit(objects[y][x],
                            state_to_dirty[grid[y][x] >> DIRTY_SHIFT], "js");
}

function is_enterable(x, y)
{
    if (x < 0 || y < 0 || x >= NB_TILES_X || y >= NB_TILES_Y)
        return false;

    return !(grid[y][x] & NOT_ENTERABLE);
}

function is_breakable(x, y)
{
    if (x < 0 || y < 0 || x >= NB_TILES_X || y >= NB_TILES_Y)
        return false;

    return (!grid[y][x]) || (grid[y][x] & BREAKABLE);
}

function is_block(x, y)
{
    if (x < 0 || y < 0 || x >= NB_TILES_X || y >= NB_TILES_Y)
        return false;

    return (grid[y][x] & BLOCK);
}

function is_bomb(x, y)
{
    if (x < 0 || y < 0 || x >= NB_TILES_X || y >= NB_TILES_Y)
        return false;

    return (grid[y][x] & BOMB);
}

function is_empty(x, y)
{
    if (x < 0 || y < 0 || x >= NB_TILES_X || y >= NB_TILES_Y)
        return false;

    return !(grid[y][x]);
}

function move_player(obj, x, y)
{
    obj.x += x;
    obj.y += y;
    obj.obj_x += x;
    obj.obj_y += y;
    obj.tx = Math.floor(obj.x / TILE_SQUARE);
    obj.ty = Math.floor(obj.y / TILE_SQUARE);
    obj.cx = obj.x - (TILE_SQUARE / 2) - obj.tx * TILE_SQUARE;
    obj.cy = obj.y - (TILE_SQUARE / 2) - obj.ty * TILE_SQUARE;

    evas_object_move(obj.obj, obj.obj_x, obj.obj_y);
}

function animate_player(obj, anim)
{
    if (obj.state != anim)
        edje_object_signal_emit(obj.obj, anim, "js");

    obj.state = anim;
}

function deanimate_player(obj)
{
    var transitions =
    {
        up: "up-suspend",
        down: "down-suspend",
        left: "left-suspend",
        right: "right-suspend"
    };

    if (transitions[obj.state] != undefined)
        animate_player(obj, transitions[obj.state]);
}


/*
 * Game implementation
 */

function bomb_clean(obj)
{
    grid[obj.y][obj.x] &= ~(EXPLOSION | DIRTY_LEFT | DIRTY_RIGHT);
    bombs[obj.index] = null;

    return 0;
}

function bomb_explode(obj)
{
    if (obj.current == 0)
    {
        evas_object_del(obj.obj);
        obj.obj = null;
        obj.player.current_bombs--;

        grid[obj.y][obj.x] = EXPLOSION;
        edje_object_signal_emit(objects[obj.y][obj.x], "empty/explode", "js");

        obj.current = 1;
        obj.directions = UP | DOWN | LEFT | RIGHT;
        ecore_timer_interval_set(obj.timer, 0.120);

        var obj_clean = Object();
        obj_clean.x = obj.x;
        obj_clean.y = obj.y;
        obj_clean.timer = ecore_timer_add(EXPLOSION_TIME, bomb_clean,
                                          obj_clean);
        obj_clean.index = insert_into_list(bombs, obj_clean);

        if (sound)
        {
            Mix_HaltChannel(BOMB_CHANNEL);
            if (Mix_PlayChannel(BOMB_CHANNEL, bomb_sound, 0) == -1)
                elx.print("failed playing bomb\n");
        }
    }
    else
    {
        for (var dir = 1; dir <= 8; dir <<= 1)
        {
            var x, y;

            if (!(obj.directions & dir))
                continue;

            switch (dir)
            {
            case UP:
                x = obj.x;
                y = obj.y - obj.current;
                break;
            case DOWN:
                x = obj.x;
                y = obj.y + obj.current;
                break;
            case LEFT:
                x = obj.x - obj.current;
                y = obj.y;
                break;
            case RIGHT:
                x = obj.x + obj.current;
                y = obj.y;
                break;
            }

            if (is_breakable(x, y))
            {
                var bonus = EMPTY;

                if (grid[y][x])
                {
                    obj.directions &= ~dir;

                    if (grid[y][x] == BRICK && rand(BONUS_PROB) == BONUS_PROB)
                        bonus = 1 << (rand(BONUS_COUNT) + BONUS_SHIFT - 1);
                }

                grid[y][x] = bonus | EXPLOSION;
                edje_object_signal_emit(objects[y][x],
                                        state_to_tile[bonus] + "/explode",
                                        "js");

                var obj_clean = Object();
                obj_clean.x = x;
                obj_clean.y = y;
                obj_clean.timer = ecore_timer_add(EXPLOSION_TIME, bomb_clean,
                                                  obj_clean);
                obj_clean.index = insert_into_list(bombs, obj_clean);

                if (is_block(x - 1, y - 1))
                    change_dirty(x - 1, y - 1, 0, RIGHT);
                if (is_block(x + 1, y - 1))
                    change_dirty(x + 1, y - 1, 0, LEFT);
                if (is_block(x, y - 1))
                    change_dirty(x, y - 1, 0, LEFT | RIGHT);
            }
            else if (is_bomb(x, y))
            {
                obj.directions &= ~dir;

                for (index in bombs)
                {
                    if (bombs[index] && bombs[index].x == x
                         && bombs[index].y == y)
                    {
                        if (bombs[index].timer)
                            ecore_timer_del(bombs[index].timer);
                        bombs[index].timer = ecore_timer_add(0.0, bomb_explode,
                                                             bombs[index]);
                    }
                }
            }
            else
            {
                obj.directions &= ~dir;
            }
        }

        obj.current++;
        if (obj.current > obj.radius || !obj.directions)
        {
            bombs[obj.index] = null;
            return 0;
        }
    }

    return 1;
}

function place_bomb(player, x, y)
{
    var obj = Object(), o;
    obj.x = x;
    obj.y = y;
    obj.radius = player.radius;
    obj.current = 0;

    o = edje_object_add(evas);
    edje_object_file_set(o, "BomberBox.edj", "bomb");
    evas_object_layer_set(o, 0);
    evas_object_move(o, geom.x + x * TILE_SQUARE - 1,
                     geom.y + y * TILE_SQUARE - 1);
    evas_object_resize(o, 50, 50);
    obj.obj = o;
    obj.obj_swallowed = edje_object_part_swallow_get(o, "main");

    grid[y][x] |= BOMB;
    player.current_bombs++;
    obj.player = player;

    if (player.flags & CAN_DELAY)
    {
        edje_object_signal_emit(obj.obj_swallowed, "button", "js");
        obj.timer = null;
    }
    else
    {
        edje_object_signal_emit(obj.obj_swallowed, "bomb", "js");
        obj.timer = ecore_timer_add(3.0, bomb_explode, obj);
    }
    evas_object_show(obj.obj);

    obj.index = insert_into_list(bombs, obj);
}

function move_bomb(player, x, y, dir)
{
    if (!(player.flags & HAS_GLOVE) || !is_bomb(x, y))
        return false;

    for (var index = 0; index < bombs.length; index++)
    {
        if (bombs[index] && bombs[index].x == x && bombs[index].y == y)
            break;
    }
    if (index == bombs.length)
        return false; /* This should not happen */

    var obj = bombs[index];
    var anim = null;

    switch (dir)
    {
    case UP:
        if (is_enterable(x, y - 1))
        {
            anim = "up-1";
            y = y - 1;
        }
        else if (is_block(x, y - 1) && is_empty(x, y - 2))
        {
            anim = "up-2";
            y = y - 2;
        }
        break;

    case DOWN:
        if (is_enterable(x, y + 1))
        {
            anim = "down-1";
            y = y + 1;
        }
        else if (is_block(x, y + 1) && is_empty(x, y + 2))
        {
            anim = "down-2";
            y = y + 2;
        }
        break;

    case LEFT:
        if (is_enterable(x - 1, y))
        {
            anim = "left-1";
            x = x - 1;
        }
        else if (is_block(x - 1, y) && is_empty(x - 2, y))
        {
            anim = "left-2";
            x = x - 2;
        }
        break;

    case RIGHT:
        if (is_enterable(x + 1, y))
        {
            anim = "right-1";
            x = x + 1;
        }
        else if (is_block(x + 1, y) && is_empty(x + 2, y))
        {
            anim = "right-2";
            x = x + 2;
        }
        break;
    }

    if (!anim)
        return false;

    grid[obj.y][obj.x] &= ~BOMB;
    obj.x = x;
    obj.y = y;
    grid[obj.y][obj.x] |= BOMB;
    evas_object_move(obj.obj, geom.x + x * TILE_SQUARE - 1,
                     geom.y + y * TILE_SQUARE - 1);
    edje_object_signal_emit(obj.obj, anim, "js");

    if (sound)
    {
        Mix_HaltChannel(MOVE_BOMB_CHANNEL);
        if (Mix_PlayChannel(MOVE_BOMB_CHANNEL, move_bomb_sound, 0) == -1)
            elx.print("failed playing move_bomb\n");
    }

    return true;
}

function shrink_cb(obj)
{
    var blocks = [{x: 0, y: 7}, {x: 0, y: 6}, {x: 0, y: 5}, {x: 0, y: 4},
                  {x: 0, y: 3}, {x: 0, y: 2}, {x: 0, y: 1}, {x: 0, y: 0}, 

                  {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0},
                  {x: 5, y: 0}, {x: 6, y: 0}, {x: 7, y: 0}, {x: 8, y: 0},
                  {x: 9, y: 0}, {x: 10, y: 0}, {x: 11, y: 0},

                  {x: 11, y: 1}, {x: 11, y: 2}, {x: 11, y: 3}, {x: 11, y: 4},
                  {x: 11, y: 5}, {x: 11, y: 6}, {x: 11, y: 7}, 

                  {x: 10, y: 7}, {x: 9, y: 7}, {x: 8, y: 7}, {x: 7, y: 7},
                  {x: 6, y: 7}, {x: 5, y: 7}, {x: 4, y: 7}, {x: 3, y: 7},
                  {x: 2, y: 7}, {x: 1, y: 7}, 

                  {x: 1, y: 6}, {x: 1, y: 5}, {x: 1, y: 4}, {x: 1, y: 3},
                  {x: 1, y: 2}, {x: 1, y: 1},

                  {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}, {x: 5, y: 1},
                  {x: 6, y: 1}, {x: 7, y: 1}, {x: 8, y: 1}, {x: 9, y: 1},
                  {x: 10, y: 1},

                  {x: 10, y: 2}, {x: 10, y: 3}, {x: 10, y: 4}, {x: 10, y: 5},
                  {x: 10, y: 6},

                  {x: 9, y: 6}, {x: 8, y: 6}, {x: 7, y: 6}, {x: 6, y: 6},
                  {x: 5, y: 6}, {x: 4, y: 6}, {x: 3, y: 6}, {x: 2, y: 6}];

    if (blocks[obj.step] == undefined)
    {
        timer_shrink = null;
        return 0;
    }

    var x = blocks[obj.step].x;
    var y = blocks[obj.step].y;

    for (index in bombs)
    {
        if (bombs[index] && bombs[index].x == x
             && bombs[index].y == y)
        {
            if (bombs[index].obj)
            {
                /* unexploded bomb */
                if (bombs[index].timer)
                    ecore_timer_del(bombs[index].timer);

                evas_object_del(bombs[index].obj);
                bombs[index].obj = null;
                bombs[index].player.current_bombs--;
                bombs[index].current = 1;
                bombs[index].directions = UP | DOWN | LEFT | RIGHT;

                bombs[index].timer = ecore_timer_add(0.120, bomb_explode,
                                                     bombs[index]);
            }
            else if (bombs[index].current == undefined)
            {
                /* obj_clean */
                ecore_timer_del(bombs[index].timer);
                bombs[index] = null;
            }
        }
    }

    grid[y][x] = CEMENT | EXPLOSION;
    edje_object_signal_emit(objects[y][x], "cement/explode", "js");

    if (sound)
    {
        Mix_HaltChannel(BOMB_CHANNEL);
        if (Mix_PlayChannel(BOMB_CHANNEL, bomb_sound, 0) == -1)
            elx.print("failed playing bomb\n");
    }

    obj.step++;

    return 1;
}

function game_over_cb()
{
    evas_object_event_callback_del(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_cb_down, null);
    evas_object_event_callback_del(eo_bg, EVAS_CALLBACK_KEY_UP, key_cb_up, null);
    evas_object_event_callback_add(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_menu_down, null);
    edje_object_part_text_set(time_obj, "time", "Fin de partie");
    edje_object_freeze(eo_bg);
    edje_object_freeze(players[0].obj);
    edje_object_freeze(players[1].obj);

    for (var index in bombs)
    {
        if (bombs[index])
        {
            if (bombs[index].obj)
                edje_object_freeze(bombs[index].obj);
            if (bombs[index].timer)
                ecore_timer_del(bombs[index].timer);
        }
    }

    if (timer_anim)
        ecore_timer_del(timer_anim);
    timer_anim = null;
    if (timer_time)
        ecore_timer_del(timer_time);
    timer_time = null;
    if (timer_shrink)
        ecore_timer_del(timer_shrink);
    timer_shrink = null;

    timer_game_over = null;
    return 0;
}

function game_over(player)
{
    scores[player]++;
    edje_object_part_text_set(eo_bg, "score-" + player, scores[player]);
    if (!timer_game_over)
        timer_game_over = ecore_timer_add(2.0, game_over_cb, null);
}

function do_player(obj)
{
    var x = obj.tx;
    var y = obj.ty;
    var cx = obj.cx;
    var cy = obj.cy;
    var step = obj.step;

    if (grid[y][x] & EXPLOSION)
    {
        animate_player(obj, "die");
        obj.flags |= DEAD;

        if (sound)
        {
            Mix_HaltChannel(DIE_CHANNEL);
            if (Mix_PlayChannel(DIE_CHANNEL, die_sound, 0) == -1)
                elx.print("failed playing die\n");
        }

        game_over(obj == players[0] ? 1 : 0)
        return;
    }

    if (grid[y][x] & BONUS)
    {
        switch (grid[y][x] & BONUS)
        {
        case BONUS_BOMB:
            obj.bombs++;
            break;

        case BONUS_DELAY:
            obj.flags |= CAN_DELAY;
            break;

        case BONUS_GLOVE:
            obj.flags |= HAS_GLOVE;
            break;
 
        case BONUS_RADIUS:
            obj.radius++;
            break;

        case BONUS_SPEED:
            if (obj.step + DEFAULT_STEP / 2 < TILE_SQUARE / 2)
                obj.step += DEFAULT_STEP / 2;
            break;
        }

        grid[y][x] &= ~BONUS;
        edje_object_signal_emit(objects[y][x],
                                state_to_tile[grid[y][x] & MAX_STATE], "js");
    }

    if (obj.flags & DO_ACTION)
    {
        obj.flags &= ~DO_ACTION;
        /* Currently, only explode bombs */
        if (obj.flags & CAN_DELAY)
        {
            for (var index in bombs)
            {
                if (bombs[index] && bombs[index].player == obj
                     && !bombs[index].timer)
                {
                    bombs[index].timer = ecore_timer_add(0.0, bomb_explode,
                                                         bombs[index]);
                }
            }
        }
    }

    if ((obj.flags & PLACE_BOMB) && !grid[y][x]
         && obj.current_bombs < obj.bombs)
    {
        obj.flags &= ~PLACE_BOMB;
        place_bomb(obj, x, y);
    }

    if ((obj.go & UP)
         && (is_enterable(x, y - 1) || cy > 1 || move_bomb(obj, x, y - 1, UP)))
    {
        move_player(obj, -cx, -step);
        animate_player(obj, "up");
    }
    else if ((obj.go & DOWN) && (is_enterable(x, y + 1) || cy < -1
                                  || move_bomb(obj, x, y + 1, DOWN)))
    {
        move_player(obj, -cx, step);
        animate_player(obj, "down");
    }
    else if ((obj.go & LEFT) && (is_enterable(x - 1, y) || cx > 1
                                  || move_bomb(obj, x - 1, y, LEFT)))
    {
        move_player(obj, -step, -cy);
        animate_player(obj, "left");
    }
    else if ((obj.go & RIGHT) && (is_enterable(x + 1, y) || cx < -1
                                   || move_bomb(obj, x + 1, y, RIGHT)))
    {
        move_player(obj, step, -cy);
        animate_player(obj, "right");
    }
    else
    {
        deanimate_player(obj);
    }
}

function anim(data)
{
    if (!(players[0].flags & DEAD))
        do_player(players[0]);
    if (!(players[1].flags & DEAD))
        do_player(players[1]);

    return 1;
}

function time_cb()
{
    time -= 1000;
    edje_object_part_text_set(time_obj, "time", split_time(time));

    if (time == SHRINK_TIME)
        timer_shrink = ecore_timer_add(0.250, shrink_cb, {step: 0});
    if (!time)
    {
        timer_time = null;
        game_over_cb();
        return 0;
    }

    return 1; /* re-schedule */
}

function pause_game()
{
    if (!is_paused)
    {
        edje_object_part_text_set(time_obj, "time", "Pause");

        if (timer_anim)
            ecore_timer_freeze(timer_anim);
        if (timer_time)
            ecore_timer_freeze(timer_time);
        if (timer_game_over)
            ecore_timer_freeze(timer_game_over);
        if (timer_shrink)
            ecore_timer_freeze(timer_shrink)

        for (var index in bombs)
        {
            if (bombs[index])
            {
                if (bombs[index].obj)
                    edje_object_freeze(bombs[index].obj);
                if (bombs[index].timer)
                    ecore_timer_freeze(bombs[index].timer);
            }
        }

        edje_object_freeze(eo_bg);
        edje_object_freeze(players[0].obj);
        edje_object_freeze(players[1].obj);
    }
    else
    {
        edje_object_part_text_set(time_obj, "time", split_time(time));

        if (timer_anim)
            ecore_timer_thaw(timer_anim);
        if (timer_time)
            ecore_timer_thaw(timer_time);
        if (timer_game_over)
            ecore_timer_thaw(timer_game_over);
        if (timer_shrink)
            ecore_timer_thaw(timer_shrink)

        for (var index in bombs)
        {
            if (bombs[index])
            {
                if (bombs[index].obj)
                    edje_object_thaw(bombs[index].obj);
                if (bombs[index].timer)
                    ecore_timer_thaw(bombs[index].timer);
            }
        }

        edje_object_thaw(eo_bg);
        edje_object_thaw(players[0].obj);
        edje_object_thaw(players[1].obj);
    }
    is_paused = !is_paused;
}

function key_cb_down(data, e, obj, event)
{
    if (is_paused && event.keyname != "greater" && event.keyname != "space"
         && event.keyname != "Home" && event.keyname != "equal")
        return;

    switch (event.keyname)
    {
    case "KP8":
    case "Up":
    case "FP/Up":
    case "RC/Up":
    case "RCL/Up":
    case "GP/Up":
        players[0].go |= UP;
        break;
    case "KP2":
    case "Down":
    case "FP/Down":
    case "RC/Down":
    case "RCL/Down":
    case "GP/Down":
        players[0].go |= DOWN;
        break;
    case "KP4":
    case "Left":
    case "FP/Left":
    case "RC/Left":
    case "RCL/Left":
    case "GP/Left":
        players[0].go |= LEFT;
        break;
    case "KP6":
    case "Right":
    case "FP/Right":
    case "RC/Right":
    case "RCL/Right":
    case "GP/Right":
        players[0].go |= RIGHT;
        break;
    case 'l':
        players[0].flags |= PLACE_BOMB;
        break;
    case 'Escape': /* start */
    case 'Start':
        players[0].flags |= DO_ACTION;
        break;

    case "Yellow":
    case "y":
        players[1].go |= UP;
        break;
    case "Green":
    case "a":
        players[1].go |= DOWN;
        break;
    case "Blue":
    case "x":
        players[1].go |= LEFT;
        break;
    case "Red":
    case "b":
        players[1].go |= RIGHT;
        break;
    case 'r':
        players[1].flags |= PLACE_BOMB;
        break;
    case 'Return': /* select */
    case 'Select':
        players[1].flags |= DO_ACTION;
        break;

    case "greater":
    case "space":
    case "Play":
        pause_game();
        break;

    case "Home":
    case "equal":
    case "Stop":
        if (!is_paused)
            pause_game();
        edje_exit(evas, eo_bg, back);
        break;

    default:
        break;
    }
}

function key_cb_up(data, e, obj, event)
{
    switch (event.keyname)
    {
    case "KP8":
    case "Up":
    case "FP/Up":
    case "RC/Up":
    case "RCL/Up":
    case "GP/Up":
        players[0].go &= ~UP;
        break;
    case "KP2":
    case "Down":
    case "FP/Down":
    case "RC/Down":
    case "RCL/Down":
    case "GP/Down":
        players[0].go &= ~DOWN;
        break;
    case "KP4":
    case "Left":
    case "FP/Left":
    case "RC/Left":
    case "RCL/Left":
    case "GP/Left":
        players[0].go &= ~LEFT;
	break;
    case "KP6":
    case "Right":
    case "FP/Right":
    case "RC/Right":
    case "RCL/Right":
    case "GP/Right":
       players[0].go &= ~RIGHT;
        break;
    case 'l':
        players[0].flags &= ~PLACE_BOMB;
        break;
    case 'Escape': /* start */
    case 'Start':
        players[0].flags &= ~DO_ACTION;
        break;

    case "Yellow":
    case "y":
        players[1].go &= ~UP;
        break;
    case "Green":
    case "a":
        players[1].go &= ~DOWN;
        break;
    case "Blue":
    case "x":
        players[1].go &= ~LEFT;
        break;
    case "Red":
    case "b":
        players[1].go &= ~RIGHT;
        break;
    case 'r':
        players[1].flags &= ~PLACE_BOMB;
        break;
    case 'Return': /* select */
    case 'Select':
        players[1].flags &= ~DO_ACTION;
        break;

    default:
        break;
    }
}


/*
 * Game setup
 */

function back(test)
{
    if (!test)
        ecore_main_loop_quit();
}

function setup_level()
{
    if (!objects)
    {
        edje_object_file_set(eo_bg, "BomberBox.edj", "game");

        geom = edje_object_part_geometry_get(eo_bg, "grid");
        players = Array();

        o = edje_object_add(evas);
        edje_object_file_set(o, "BomberBox.edj", "player,0");
        evas_object_layer_set(o, 1);
        evas_object_resize(o, 45, 81);
        evas_object_show(o);
        players[0] = {obj: o};

        o = edje_object_add(evas);
        edje_object_file_set(o, "BomberBox.edj", "player,1");
        evas_object_layer_set(o, 1);
        evas_object_resize(o, 45, 81);
        evas_object_show(o);
        players[1] = {obj: o};

        objects = Array();
        for (var y in grid_backup)
        {
            objects[y] = Array();
            for (var x in grid_backup[y])
            {
                objects[y][x] = edje_object_part_swallow_get(eo_bg, x + "/" + y);
            }
        }

        time_obj = edje_object_part_swallow_get(eo_bg, "time");
    }
    else
    {
        edje_object_thaw(eo_bg);
        edje_object_thaw(players[0].obj);
        edje_object_thaw(players[1].obj);

        for (var index in bombs)
            if (bombs[index] && bombs[index].obj)
                evas_object_del(bombs[index].obj);
    }

    players[0] = {obj: players[0].obj,
                  obj_x: geom.x + 2, obj_y: geom.y - 46,
                  tx: 0, ty: 0, cx: 0, cy: 0,
                  x: TILE_SQUARE / 2, y: TILE_SQUARE / 2,
                  state: "down-suspend", go: 0, step: DEFAULT_STEP,
                  bombs: DEFAULT_BOMBS, current_bombs: 0,
                  radius: DEFAULT_RADIUS, flags: 0};
    evas_object_move(players[0].obj, players[0].obj_x, players[0].obj_y);
    edje_object_signal_emit(players[0].obj, "down-suspend", "js");

    players[1] = {obj: players[1].obj,
                  obj_x: geom.x + (NB_TILES_X - 1) * TILE_SQUARE + 2,
                  obj_y: geom.y + (NB_TILES_Y - 1) * TILE_SQUARE - 46,
                  tx: NB_TILES_X - 1, ty: NB_TILES_Y - 1, cx: 0, cy: 0,
                  x: (NB_TILES_X - 1) * TILE_SQUARE + TILE_SQUARE / 2,
                  y: (NB_TILES_Y - 1) * TILE_SQUARE + TILE_SQUARE / 2,
                  state: "down-suspend", go: 0, step: DEFAULT_STEP,
                  bombs: DEFAULT_BOMBS, current_bombs: 0,
                  radius: DEFAULT_RADIUS, flags: 0};
    evas_object_move(players[1].obj, players[1].obj_x, players[1].obj_y);
    edje_object_signal_emit(players[1].obj, "down-suspend", "js");

    is_paused = false;
    bombs = Array();
    grid = Array();

    for (var y in grid_backup)
        grid[y] = grid_backup[y].slice();

    for (var i = 0; i < NB_BRICKS; ++i)
    {
        var x = rand(NB_TILES_X) - 1;
        var y = rand(NB_TILES_Y) - 1;

        if (grid[y][x] != 0)
        {
            --i;
            continue;
        }

        grid[y][x] = BRICK;
    }

    for (var i = 0; i < NB_CEMENT; ++i)
    {
        var x = rand(NB_TILES_X) - 1;
        var y = rand(NB_TILES_Y) - 1;

        if (grid[y][x] != 0)
        {
            --i;
            continue;
        }

        grid[y][x] = CEMENT;
    }

    edje_freeze();
    for (var y in grid)
    {
        for (var x in grid[y])
        {
            if (grid[y][x] == -1)
                grid[y][x] = EMPTY;

            edje_object_signal_emit(objects[y][x],
                state_to_tile[grid[y][x] & MAX_STATE], "js");
        }
    }
    time = DEFAULT_TIME;
    edje_object_part_text_set(time_obj, "time", split_time(time));
    edje_thaw();

    evas_object_event_callback_del(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_menu_down, null);
    evas_object_event_callback_add(eo_bg, EVAS_CALLBACK_KEY_DOWN, key_cb_down, null);
    evas_object_event_callback_add(eo_bg, EVAS_CALLBACK_KEY_UP, key_cb_up, null);
    timer_anim = ecore_timer_add(1.0/25.0, anim, null);
    timer_time = ecore_timer_add(1.0, time_cb, null);
}

function key_menu_down(data, e, obj, event)
{
    if (event.keyname == "Home"
	|| event.keyname == "equal"
	|| event.keyname == "Stop")
      edje_exit(evas, eo_bg, back);
    else
      setup_level();
}

function sound_idler_cb(data)
{
    Mix_OpenAudio(48000, 0x9010, 2, 1024);
    die_sound = Mix_LoadWAV("die.wav");
    bomb_sound = Mix_LoadWAV("bomb.wav");
    move_bomb_sound = Mix_LoadWAV("move_bomb.wav");
    var musiq_sound = Mix_LoadWAV("BomberBox.ogg");
    if (!die_sound || !bomb_sound || !move_bomb_sound || !musiq_sound)
    {
        sound = false;
    }
    else
    {
        Mix_VolumeChunk(die_sound, 127);
        Mix_VolumeChunk(bomb_sound, 127);
        Mix_VolumeChunk(move_bomb_sound, 127);
        Mix_VolumeChunk(musiq_sound, 64);
        Mix_PlayChannel(MUSIQ_CHANNEL, musiq_sound, -1);
    }

    return 0;
}

function main()
{
    if (shutdown == undefined || shutdown == false)
    {
        ecore_init();
        ecore_evas_init();
        edje_init();

	ee = ecore_evas_new(null, 0, 0, win.w, win.h, "double_buffer=0;name=BomberBox;");

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
    edje_object_file_set(o, "BomberBox.edj", "wait");
    evas_object_layer_set(o, 0);
    evas_object_move(o, 0, 0);
    evas_object_resize(o, win.w, win.h);
    evas_object_event_callback_add(o, EVAS_CALLBACK_KEY_DOWN, key_menu_down, null);
    evas_object_focus_set(o, 1);
    evas_object_show(o);
    eo_bg = o;

    if (sound)
        ecore_idler_add(sound_idler_cb, null);

    ecore_evas_show(ee);

    edje_thaw();

    ecore_main_loop_begin();

    edje_shutdown();
    ecore_evas_shutdown();
    ecore_shutdown();
}

if (test)
    main();

true;
