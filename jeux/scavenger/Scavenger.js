/*****************************************************************************
 * Scavenger.js : Lode-Runner clone for elixir
 *****************************************************************************
 * Copyright (C) 2008 Freebox S.A.
 *
 * Author: Christophe Massiot <massiot@via.ecp.fr>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston MA 02110-1301, USA.
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

test &= elx.include("edje-helper.edj", "edje-helper");
test &= elx.include("edje-helper.edj", "ecore-job-helper");
test &= elx.include("edje-helper.edj", "math_helper");
test &= elx.include("edje-helper.edj", "score-helper");

var FN = "/.fonts/";

/*
 * Lode-Runner/Scavenger constants
 */

var WIN = { w: 720, h: 576 };
var NB_TILES_X = 24;
var NB_TILES_Y = 15;
var TILE_SQUARE = 24;
var MAX_HOLD_TILES = 24;
var MAX_HELD_STABLE = 8;
var DIG_OPEN_TIMER = 0.5;
var DUG_TIMER = 9.34;
var TRAPPED_TIMER = 4.0;
var EDJE_FILE = "Scavenger.edj";

/* states */
var EMPTY = 0;
var BRICK = 1;
var CEMENT = 2;
var LADDER = 4;
var RAIL = 8;
var GOLD = 16;
var DUG = 32;
var FAKE = 64;
var MAX_STATE = 127;

var ROBOT = 128;
var ESCAPE_LADDER = 256;
var PLAYER = 512;
var BRICK_DIGGING = 1024;

var state_to_tile = Array();
state_to_tile[EMPTY] = "empty";
state_to_tile[BRICK] = "brick";
state_to_tile[CEMENT] = "cement";
state_to_tile[LADDER] = "ladder";
state_to_tile[RAIL] = "rail";
state_to_tile[GOLD] = "gold";
state_to_tile[DUG] = "dug";
state_to_tile[FAKE] = "fake";

var NOT_ENTERABLE = BRICK | CEMENT;
var STABLE = BRICK | CEMENT | LADDER;
var NOT_DIGGABLE = BRICK | CEMENT | LADDER | RAIL | GOLD | ROBOT;
var DUG_WITH_ROBOT = DUG | ROBOT;

/* player flags */
var PLAYER_FLAG = 1;
var DIGGING = 2;
/* enemy flags */
var DEAD = 4;
var HAS_GOLD = 8;
var TRAPPED = 16;
var ESCAPING_1 = 32;
var ESCAPING_2 = 64;
var RUNNING_AWAY = 128;

var UP = 1;
var DOWN = 2;
var LEFT = 4;
var RIGHT = 8;

var HAS_DIED = 1;
var HAS_KILLED = 2;
var HAS_TRAPPED = 4;


/*
 * Variable declarations
 */

var NULL = null;

/* ecore evas */
var ee;
var evas;
var background;
var animator = null;
var idler = null;
var timer = null;

/* game globals */
var game = null;
var state = null;
var level = 0;
var build_grid = true;
var grid = null;
var zones;
var directions;
var zones_escape;
var directions_escape;
var is_paused = true;
var dig_tiles = Array();
var nb_gold;
var cumulative_score = 0;
var score;
var high_score = 0;
var time;
var time_timer = null;
var bonuses = 0;
var initing = true;
var time_obj;
var saphirs_obj;

/* players */
var player = null;
var robots = Array();

/* sounds */
var dig_sound;
var fall_sound;
var pop_sound;
var victory_sound;
var death_sound;
var musiq_sound;
var fall_channel = -1;
var dig_channel = -1;


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

function is_enterable(x, y, also_stable)
{
    if (x < 0 || x >= NB_TILES_X || y >= NB_TILES_Y)
        return false;
    if (y < 0)
        return !nb_gold;

    return !(state[y][x] & (NOT_ENTERABLE | also_stable));
}

function is_stable(x, y, also_stable)
{
    if (x < 0 || x >= NB_TILES_X || y < 0 || y >= NB_TILES_Y)
        return true;

    return (state[y][x] & (STABLE | also_stable))
             || (state[y][x] & DUG_WITH_ROBOT) == DUG_WITH_ROBOT;
}

function is_player_over_robot(robot)
{
    return (robot.y - player.y >= 2 * TILE_SQUARE / 3
             && robot.y - player.y <= TILE_SQUARE + 4
             && (player.x - robot.x) <= 3 * TILE_SQUARE / 4
             && (robot.x - player.x) <= 3 * TILE_SQUARE / 4
             && !(state[player.ty + 1][player.tx] & LADDER));
}

function move_object(obj, x, y)
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

function animate_object(obj, anim)
{
    if (obj.state != anim)
        edje_object_signal_emit(obj.obj, anim, "code");

    obj.state = anim;
}

function deanimate_object(obj)
{
    var transitions =
    {
        left: "left-suspend",
        right: "right-suspend",
        climb: "climb-suspend",
        "rail-left": "rail-left-suspend",
        "rail-right": "rail-right-suspend"
    };

    if (transitions[obj.movement] != undefined)
        animate_object(obj, transitions[obj.movement]);
}

function pause_player(obj)
{
    var transitions =
    {
        left: "left-pause",
        right: "right-pause",
        climb: "climb-pause",
        stand: "stand-pause",
        fall: "fall-pause",
        "rail-left": "rail-left-pause",
        "rail-right": "rail-right-pause"
    };

    if (transitions[obj.movement] != undefined)
        animate_object(obj, transitions[obj.movement]);
}

function pause_game()
{
    var i;

    pause_player(player);
    for (i = 0; i < robots.length; ++i)
        deanimate_object(robots[i]);

    if (time_timer)
        ecore_timer_freeze(time_timer);

    for (i = 0; i < robots.length; ++i)
        if (robots[i].timer)
            ecore_timer_freeze(robots[i].timer);

    for (i = 0; i < dig_tiles.length; ++i)
        if (dig_tiles[i])
            ecore_timer_freeze(dig_tiles[i].timer);

    is_paused = true;
}

function resume_game()
{
    var i;

    if (time_timer)
        ecore_timer_thaw(time_timer);

    for (i = 0; i < robots.length; ++i)
        if (robots[i].timer)
            ecore_timer_thaw(robots[i].timer);

    for (i = 0; i < dig_tiles.length; ++i)
        if (dig_tiles[i])
            ecore_timer_thaw(dig_tiles[i].timer);

    is_paused = false;
}

function change_tile(x, y, nand, or)
{
    state[y][x] &= ~nand;
    state[y][x] |= or;
    edje_object_signal_emit(grid[y][x], state_to_tile[state[y][x] & MAX_STATE],
                            "code");
}


/*
 * Game implementation
 */

function fixup_dug(x, y, zone)
{
    if (x < 0 || x >= NB_TILES_X || y < 0 || y >= NB_TILES_Y)
        return;

    if ((state[y][x] & DUG) && !zones[y][x])
    {
        zones[y][x] = zone;
        fixup_dug(x - 1, y, zone);
        fixup_dug(x + 1, y, zone);
    }
}

function dig_brick(tile_pos)
{
    var x = tile_pos.x;
    var y = tile_pos.y;
    tile_pos.incoming_zones = Array();
    tile_pos.outgoing_zones = Array();

    state[y][x] &= ~(BRICK | BRICK_DIGGING);
    state[y][x] |= DUG;

    if (is_enterable(x, y + 1, FAKE) && zones[y + 1][x])
    {
        tile_pos.outgoing_zones.push({zone: zones[y + 1][x], dir: DOWN});
        if (state[y + 1][x] & LADDER)
            tile_pos.incoming_zones.push({zone: zones[y + 1][x], dir: UP});
    }
    if (is_enterable(x - 1, y, FAKE) && zones[y][x - 1])
    {
        tile_pos.outgoing_zones.push({zone: zones[y][x - 1], dir: LEFT});
        tile_pos.incoming_zones.push({zone: zones[y][x - 1], dir: RIGHT});
    }
    if (is_enterable(x + 1, y, FAKE) && zones[y][x + 1])
    {
        tile_pos.outgoing_zones.push({zone: zones[y][x + 1], dir: RIGHT});
        tile_pos.incoming_zones.push({zone: zones[y][x + 1], dir: LEFT});
    }

    if (!is_stable(x, y + 1, FAKE | DUG) && zones[y + 1][x])
    {
        tile_pos.outgoing_zones = Array();
        tile_pos.outgoing_zones.push({zone: zones[y + 1][x], dir: DOWN});
    }

    if (!tile_pos.outgoing_zones.length)
        return;

    var zone = zones[y][x] = tile_pos.outgoing_zones[0].zone;
    fixup_dug(x - 1, y, zone);
    fixup_dug(x + 1, y, zone);
}

function close_brick(tile_pos)
{
    var x = tile_pos.x;
    var y = tile_pos.y;

    state[y][x] &= ~DUG;
    state[y][x] |= BRICK;

    zones[y][x] = 0;
}

function out_brick(tile_pos, dest_zone)
{
    if (tile_pos.outgoing_zones == undefined)
        return 0;

    for (var i = 0; i < tile_pos.outgoing_zones.length; ++i)
    {
        if (directions[tile_pos.outgoing_zones[i].zone][dest_zone])
            return tile_pos.outgoing_zones[i].dir;
    }

    return 0;
}

function in_brick(tile_pos, src_zone)
{
    if (tile_pos.incoming_zones == undefined)
        return 0;

    for (var i = 0; i < tile_pos.incoming_zones.length; ++i)
    {
        if (src_zone == tile_pos.incoming_zones[i].zone)
            return tile_pos.incoming_zones[i].dir;
        if (directions[src_zone][tile_pos.incoming_zones[i].zone])
            return directions[src_zone][tile_pos.incoming_zones[i].zone];
    }

    return 0;
}

function digging1_cb(tile_pos)
{
    if (player.flags & DIGGING)
    {
        /* Otherwise digging was cancelled */
        dig_brick(tile_pos);
        player.flags &= ~DIGGING;

        tile_pos.timer = ecore_timer_add(DUG_TIMER, digging2_cb, tile_pos);

        if (dig_channel != -1)
        {
            Mix_HaltChannel(dig_channel);
            dig_channel = -1;
        }
    }
    else
    {
        dig_tiles[tile_pos.index] = null;
        tile_pos.index = 0;
    }

    return 0;
}

function digging2_cb(tile_pos)
{
    edje_object_signal_emit(grid[tile_pos.y][tile_pos.x], "closing", "code");

    tile_pos.timer = ecore_timer_add(DIG_OPEN_TIMER, digging3_cb, tile_pos);

    return 0;
}

function digging3_cb(tile_pos)
{
    dig_tiles[tile_pos.index] = null;
    tile_pos.index = 0;

    close_brick(tile_pos);

    return 0;
}

function trapped_cb(obj)
{
    obj.timer = null;
    obj.flags &= ~TRAPPED;
    obj.flags |= ESCAPING_1 | ESCAPING_2;

    return 0;
}

function move_entity(obj, steps)
{
    if (obj.flags & DIGGING)
    {
        /* Suspend player while digging */
        return;
    }

    var also_stable = (obj.flags & PLAYER_FLAG) ? 0 : FAKE;
    var x = obj.tx;
    var y = obj.ty;
    var cx = obj.cx;
    var cy = obj.cy;

    if (obj.flags & PLAYER_FLAG)
    {
        if (obj.held_stable)
            obj.held_stable--;
        for (var i = 0; i < robots.length; ++i)
        {
            if (is_player_over_robot(robots[i]))
            {
                obj.held_stable = MAX_HELD_STABLE;
                robots[i].flags |= RUNNING_AWAY;
                break;
            }
        }
    }

    /* Find possible movements */
    if ((!is_stable(x, y + 1, also_stable) || (cy < 0))
         && !(state[y][x] & LADDER) && (!(state[y][x] & RAIL) || cy)
         && !(obj.flags & ESCAPING_2) && !obj.held_stable)
    {
        /* falling */
        move_object(obj, -cx, steps);
        obj.movement = "fall";
        animate_object(obj, "fall");
    }
    else if ((obj.go & UP) && (((state[y][x] & LADDER)
               && is_enterable(x, y - 1, FAKE))
              || cy > 1))
    {
        move_object(obj, -cx, -steps);
        obj.movement = "climb";
        animate_object(obj, "climb");
    }
    else if ((obj.go & DOWN) && !(obj.held_stable)
              && (is_enterable(x, y + 1, also_stable) || cy < -1))
    {
        move_object(obj, -cx, steps);
        obj.movement = "climb";
        animate_object(obj, "climb");
    }
    else if ((obj.go & LEFT)
              && (is_enterable(x - 1, y, FAKE) || cx > 1))
    {
        move_object(obj, -steps, -cy);
        if (state[y][x] & RAIL)
        {
            obj.movement = "rail-left";
            animate_object(obj, "rail-left");
        }
        else
        {
            obj.movement = "left";
            animate_object(obj, "left");
        }
    }
    else if ((obj.go & RIGHT)
              && (is_enterable(x + 1, y, FAKE) || cx < -1))
    {
        move_object(obj, steps, -cy);
        if (state[y][x] & RAIL)
        {
            obj.movement = "rail-right";
            animate_object(obj, "rail-right");
        }
        else
        {
            obj.movement = "right";
            animate_object(obj, "right");
        }
    }
    else if (obj.dig_left && y < NB_TILES_Y - 1
              && (state[y + 1][x - 1] & BRICK)
              && !(state[y][x - 1] & NOT_DIGGABLE))
    {
        move_object(obj, -cx, -cy);
        animate_object(obj, "dig-left");
        obj.flags |= DIGGING;
        edje_object_signal_emit(grid[y + 1][x - 1], "digging", "code");

        state[y + 1][x - 1] |= BRICK_DIGGING;
        var param = {x: x - 1, y: y + 1};
        param.timer = ecore_timer_add(DIG_OPEN_TIMER, digging1_cb, param);
        param.index = insert_into_list(dig_tiles, param);

        if (sound)
            dig_channel = Mix_PlayChannel(-1, dig_sound, 0);
    }
    else if (obj.dig_right && y < NB_TILES_Y - 1
              && (state[y + 1][x + 1] & BRICK)
              && !(state[y][x + 1] & NOT_DIGGABLE))
    {
        move_object(obj, -cx, -cy);
        animate_object(obj, "dig-right");
        obj.flags |= DIGGING;
        edje_object_signal_emit(grid[y + 1][x + 1], "digging", "code");

        state[y + 1][x + 1] |= BRICK_DIGGING;
        var param = {x: x + 1, y: y + 1};
        param.timer = ecore_timer_add(DIG_OPEN_TIMER, digging1_cb, param);
        param.index = insert_into_list(dig_tiles, param);

        if (sound)
            dig_channel = Mix_PlayChannel(-1, dig_sound, 0);
    }
    else if (obj.movement == "fall" && !(state[y][x] & RAIL))
    {
        obj.movement = "stand";
        animate_object(obj, "stand");
    }
    else
    {
        deanimate_object(obj);
    }
}

function robot_think(obj)
{
    var player_zone = zones[player.ty][player.tx];
    var robot_zone = zones[obj.ty][obj.tx];

    obj.go = 0;
    if (!player.held_stable)
    {
        obj.runaway_go = 0;
        obj.flags &= ~RUNNING_AWAY;
    }

    if (player_zone && robot_zone && !(obj.flags & RUNNING_AWAY))
    {
        /* Find if we are in the player's zone */
        if (player_zone == robot_zone)
        {
            if (player.ty < obj.ty && state[obj.ty][obj.tx] == LADDER)
                obj.go |= UP;
            else if (player.ty > obj.ty)
                obj.go |= DOWN;

            if (player.tx < obj.tx)
                obj.go |= LEFT;
            else if (player.tx > obj.tx)
                obj.go |= RIGHT;

            if (obj.go)
                return;
        }
        else
        {
            /* General case */
            obj.go |= directions[robot_zone][player_zone];
            if (obj.go)
                return;

            /* Find if a dug brick can provide us a way */
            for (var i = 0; i < dig_tiles.length; ++i)
            {
                if (!dig_tiles[i]) continue;
                var dug_zone = zones[dig_tiles[i].y][dig_tiles[i].x];

                if (dug_zone == robot_zone)
                {
                    obj.go = out_brick(dig_tiles[i], player_zone);
                    if (obj.go)
                        return;
                }
                if (dug_zone == player_zone
                     || out_brick(dig_tiles[i], player_zone))
                {
                    obj.go = in_brick(dig_tiles[i], robot_zone);
                    if (obj.go)
                        return;
                }
            }
        }
    }

    if (obj.flags & RUNNING_AWAY)
    {
        var possible = 0;

        if (is_enterable(obj.tx - 1, obj.ty, 0) || obj.cx > 1)
            possible |= LEFT;
        if (is_enterable(obj.tx + 1, obj.ty, 0) || obj.cx < -1)
            possible |= RIGHT;

        if (obj.runaway_go & possible)
            obj.runaway_go = obj.go = obj.runaway_go & possible;
        else
        {
            if (obj.tx - player.tx < 0)
            {
                if (is_enterable(obj.tx - 1, obj.ty, 0) || obj.cx > 1)
                    obj.runaway_go = obj.go = LEFT;
                else if (is_enterable(obj.tx + 1, obj.ty, 0) || obj.cy < -1)
                    obj.runaway_go = obj.go = RIGHT;
            }
            else
            {
                if (is_enterable(obj.tx + 1, obj.ty, 0) || obj.cy < -1)
                    obj.runaway_go = obj.go = RIGHT;
                else if (is_enterable(obj.tx - 1, obj.ty, 0) || obj.cx > 1)
                    obj.runaway_go = obj.go = LEFT;
            }
        }
    }
}

function dec_gold()
{
    nb_gold--;
    edje_object_part_text_set(saphirs_obj, "content", "Saphirs " + nb_gold);

    if (!nb_gold)
        reveal_escape();
}

function robot_dead(obj)
{
    bonuses |= HAS_KILLED;
    if (obj.flags & HAS_GOLD)
        dec_gold();

    state[obj.ty][obj.tx] &= ~ROBOT;

    if (obj.timer)
        ecore_timer_del(obj.timer);
    obj.timer = null;
    obj.flags = 0;

    var new_x = rand(NB_TILES_X) - 1;
    while (state[0][new_x])
    {
        new_x++;
        if (new_x >= NB_TILES_X)
            new_x = 0;
    }

    move_object(obj, TILE_SQUARE / 2 + new_x * TILE_SQUARE - obj.x,
                TILE_SQUARE / 2 - obj.y);
    animate_object(obj, "fall");
}

function restart_cb()
{
    animator = ecore_timer_add(0.04, animator_cb, null);
    return 0;
}

/* This should actually be an animator, but it is a timer because animators
 * are buggy */
function animator_cb()
{
    if (is_paused)
        return 1;

    if (!time_timer)
        time_timer = ecore_timer_add(1.0, time_cb, null);

    if (state[player.ty][player.tx] & (BRICK | ROBOT))
    {
        if (sound)
        {
            Mix_PlayChannel(-1, death_sound, 0);
            if (fall_channel != -1)
            {
                Mix_HaltChannel(fall_channel);
                fall_channel = -1;
            }
        }
        bonuses = HAS_DIED;
        clear_state();
        build_state(level);
        show_state();
        ecore_idler_add(restart_cb, null);
        animator = null;
        return 0;
    }

    move_entity(player, 3);

    if (player.ty < 0)
    {
        if (sound)
            Mix_PlayChannel(-1, victory_sound, 0);
        show_score();
        animator = null;
        return 0;
    }

    if (sound)
    {
        if (player.movement == "fall"
             && !(state[player.ty][player.tx] & RAIL))
        {
            if (fall_channel == -1)
                fall_channel = Mix_PlayChannel(-1, fall_sound, -1);
        }
        else if (fall_channel != -1)
        {
            Mix_HaltChannel(fall_channel);
            fall_channel = -1;
        }
    }

    if ((state[player.ty][player.tx] & GOLD) && !player.cx && !player.cy)
    {
        change_tile(player.tx, player.ty, GOLD, 0);
        dec_gold();
        score += 10;
        if (sound)
            Mix_PlayChannel(-1, pop_sound, 0);
    }

    for (var i = 0; i < robots.length; ++i)
    {
        var x = robots[i].tx;
        var y = robots[i].ty;
        var cx = robots[i].cx;
        var cy = robots[i].cy;

        if (state[y][x] & BRICK)
        {
            robot_dead(robots[i]);
        }
        else if (!(robots[i].flags & TRAPPED))
        {
            var old_tx = x, old_ty = y;
            state[y][x] &= ~ROBOT;

            if ((state[y][x] & DUG) && (robots[i].flags & ESCAPING_1))
            {
                /* No longer trapped - get out */
                move_object(robots[i], -cx, -2);
                robots[i].movement = "climb";
                animate_object(robots[i], "climb");
            }
            else
            {
                robot_think(robots[i]);
                move_entity(robots[i], 2);
            }

            x = robots[i].tx;
            y = robots[i].ty;
            cx = robots[i].cx;
            cy = robots[i].cy;
            state[y][x] |= ROBOT;

            if (old_tx != x)
                robots[i].flags &= ~(ESCAPING_1 | ESCAPING_2);
            if (old_ty != y)
                robots[i].flags &= ~ESCAPING_1;

            if ((state[y][x] & GOLD) && !cx && !cy
                  && !(robots[i].flags & HAS_GOLD))
            {
                change_tile(x, y, GOLD, 0);
                robots[i].flags |= HAS_GOLD;
                robots[i].hold_time = rand(MAX_HOLD_TILES);
            }

            if (!(state[y][x] & MAX_STATE) && !cx && !cy
                  && (robots[i].flags & HAS_GOLD)
                  && (robots[i].state == "left"
                       || robots[i].state =="right"))
            {
                if (robots[i].hold_time)
                    robots[i].hold_time--;
                if (!robots[i].hold_time)
                {
                    change_tile(x, y, 0, GOLD);
                    robots[i].flags &= ~HAS_GOLD;
                }
            }

            if (y < NB_TILES_Y - 1 && (state[y + 1][x] & BRICK_DIGGING))
            {
                /* Cancel digging */
                player.flags &= ~DIGGING;
                player.movement = "stand";
                animate_object(player, "stand");

                state[y + 1][x] &= ~BRICK_DIGGING;
                edje_object_signal_emit(grid[y + 1][x], "brick", "code");

                if (dig_channel != -1)
                {
                    Mix_HaltChannel(dig_channel);
                    dig_channel = -1;
                }
            }

            if ((state[y][x] & DUG) && !cx && !cy
                  && robots[i].movement == "fall")
            {
                if ((robots[i].flags & HAS_GOLD)
                     && !(state[y - 1][x] & MAX_STATE))
                {
                    change_tile(x, y - 1, 0, GOLD);
                    robots[i].flags &= ~HAS_GOLD;
                }

                robots[i].flags |= TRAPPED;
                bonuses |= HAS_TRAPPED;
                robots[i].timer = ecore_timer_add(TRAPPED_TIMER, trapped_cb,
                                                  robots[i]);
            }
        }
    }

    return 1; /* re-schedule */
}

function time_cb()
{
    time += 1000;
    edje_object_part_text_set(time_obj, "content", split_time(time));

    return 1; /* re-schedule */
}

function leave_game(test)
{
    if (cumulative_score > high_score)
        save_highscore({score: cumulative_score}, "Scavenger");

    if (!test)
        ecore_main_loop_quit();
}

function key_cb_down(data, e, obj, event)
{
    switch (event.keyname)
    {
        case "KP4":
        case "FP/Left":
        case "RC/Left":
        case "RCL/Left":
        case "GP/Left":
        case "Left": player.go |= LEFT; break;
        case "KP6":
        case "FP/Right":
        case "RC/Right":
        case "RCL/Right":
        case "GP/Right":
        case "Right": player.go |= RIGHT; break;
        case "KP8":
        case "FP/Up":
        case "RC/Up":
        case "RCL/Up":
        case "GP/Up":
        case "Up": player.go |= UP; break;
        case "KP2":
        case "FP/Down":
        case "RC/Down":
        case "RCL/Down":
        case "GP/Down":
        case "Down": player.go |= DOWN; break;
        case "l":
        case "x":
        case "Blue":
        case "Green":
        case "a": player.dig_left = 1; break;
        case "r":
        case "y":
        case "Yellow":
        case "Red":
        case "b": player.dig_right = 1; break;

        case "Return": /* select */
        case "Select":
        case "greater": /* play/pause */
        case "Play":
            if (is_paused)
                break;
            if (!(player.flags & DIGGING))
                pause_game();
            return;

        case "Escape": /* start */
        case "Start":
            if (is_paused)
                break;
            if (sound)
            {
                Mix_PlayChannel(-1, death_sound, 0);
                if (fall_channel != -1)
                {
                    Mix_HaltChannel(fall_channel);
                    fall_channel = -1;
                }
            }
            bonuses = HAS_DIED;
            clear_state();
            build_state(level);
            show_state();
            return;

        case "Home":
        case "equal": /* stop */
        case "Stop":
            if (!is_paused)
                pause_game();
            edje_exit(evas, background, leave_game);
            return;

        default:
            return;
    }

    if (is_paused)
        resume_game();
}

function key_cb_up(data, e, obj, event)
{
    switch (event.keyname)
    {
        case "KP4":
        case "FP/Left":
        case "RC/Left":
        case "RCL/Left":
        case "GP/Left":
        case "Left": player.go &= ~LEFT; break;
        case "KP6":
        case "FP/Right":
        case "RC/Right":
        case "RCL/Right":
        case "GP/Right":
        case "Right": player.go &= ~RIGHT; break;
        case "KP8":
        case "FP/Up":
        case "RC/Up":
        case "RCL/Up":
        case "GP/Up":
        case "Up": player.go &= ~UP; break;
        case "KP2":
        case "FP/Down":
        case "RC/Down":
        case "RCL/Down":
        case "GP/Down":
        case "Down": player.go &= ~DOWN; break;
        case "l":
        case "x":
        case "Blue":
        case "Green":
        case "a": player.dig_left = 0; break;
        case "r":
        case "y":
        case "Yellow":
        case "Red":
        case "b": player.dig_right = 0; break;
    }
}


/*
 * Levels functions
 */

function reveal_escape()
{
    if (sound)
        Mix_PlayChannel(-1, victory_sound, 0);

    for (var y = 0; y < NB_TILES_Y; ++y)
    {
        for (var x = 0; x < NB_TILES_X; ++x)
        {
            if (state[y][x] & ESCAPE_LADDER)
            {
                state[y][x] |= LADDER;
                edje_object_signal_emit(grid[y][x],
                                        state_to_tile[state[y][x] & MAX_STATE],
                                        "code");
            }
        }
    }
    zones = zones_escape;
    directions = directions_escape;

    for (var i = 0; i < dig_tiles.length; ++i)
        if (dig_tiles[i])
            dig_brick(dig_tiles[i]);
}

function clear_state()
{
    if (player)
        evas_object_del(player.obj);

    if (time_timer)
    {
        ecore_timer_del(time_timer);
        time_timer = null;
    }

    for (var i = 0; i < robots.length; ++i)
    {
        if (robots[i].timer)
            ecore_timer_del(robots[i].timer);
        evas_object_del(robots[i].obj);
    }

    for (var i = 0; i < dig_tiles.length; ++i)
    {
        if (dig_tiles[i])
            ecore_timer_del(dig_tiles[i].timer);
    }
}

function build_state(level_number)
{
    var tmp = elx.include(EDJE_FILE, "level-" + level_number);
    if (tmp != false)
        state = tmp;
    else
        return build_state(0);

    edje_freeze();

    var geom = edje_object_part_geometry_get(background, "grid");

    var rx = geom.x;
    var ry = geom.y;

    if (build_grid)
        grid = new Array();

    robots = Array();
    dig_tiles = Array();

    nb_gold = 0;

    for (var y = 0; y < NB_TILES_Y; ++y)
    {
        var line;
        if (build_grid);
            line = new Array();

        for (var x = 0; x < NB_TILES_X; ++x)
        {
            if (build_grid)
            {
                var o = edje_object_part_swallow_get(background, x + "/" + y);

                edje_object_signal_emit(o,
                                        state_to_tile[state[y][x] & MAX_STATE],
                                        "code");
                line.push(o);
            }
            else
            {
                edje_object_signal_emit(grid[y][x],
                                        state_to_tile[state[y][x] & MAX_STATE],
                                        "code");
            }

            if (state[y][x] & GOLD)
            {
                nb_gold++;
            }
            else if (state[y][x] & (PLAYER | ROBOT))
            {
                var o = edje_object_add(evas);

                evas_object_propagate_events_set(o, false);
                evas_object_repeat_events_set(o, false);
                evas_object_pass_events_set(o, false);

                if (state[y][x] & PLAYER)
                    edje_object_file_set(o, EDJE_FILE, "player");
                else
                    edje_object_file_set(o, EDJE_FILE, "robot");

                evas_object_layer_set(o, 2);
                evas_object_resize(o, TILE_SQUARE, TILE_SQUARE);
                evas_object_move(o, rx, ry);

                var obj = {obj: o, obj_x: rx, obj_y: ry, tx: x, ty: y,
                           x: x * TILE_SQUARE + TILE_SQUARE / 2, cx: 0,
                           y: y * TILE_SQUARE + TILE_SQUARE / 2, cy: 0,
                           state: "stand", movement: "stand", flags: 0, go: 0,
                           runaway_go: 0, held_stable: 0};

                if (state[y][x] & PLAYER)
                {
                    state[y][x] &= ~PLAYER;
                    obj.flags |= PLAYER_FLAG;
                    player = obj;
                }
                else
                    robots.push(obj);
            }

            rx += TILE_SQUARE;
        }

        rx = geom.x;
        ry += TILE_SQUARE;

        if (build_grid)
            grid.push(line);
    }

    zones = elx.include(EDJE_FILE, level_number + "-zones");
    directions = elx.include(EDJE_FILE, level_number + "-dir");
    zones_escape = elx.include(EDJE_FILE, level_number + "-escape-zones");
    directions_escape = elx.include(EDJE_FILE, level_number + "-escape-dir");

    build_grid = false;
    pause_game();
    time = 0;
    score = 0;

    edje_thaw();
}

function show_state()
{
    edje_object_signal_emit(background, "hide", "code");
    edje_object_part_text_set(background, "scores-text", "");
    edje_object_part_text_set(background, "scores-figures", "");
    evas_object_show(player.obj);
    for (var i = 0; i < robots.length; ++i)
        evas_object_show(robots[i].obj);
    edje_object_part_text_set(background, "level", "Niveau " + (level + 1));
    edje_object_part_text_set(time_obj, "content", "00:00");
    edje_object_part_text_set(saphirs_obj, "content", "Saphirs " + nb_gold);
}


/*
 * Panel functions
 */

function key_cb_panel(data, e, obj, event)
{
    switch (event.keyname)
    {
        case "Home":
        case "equal": /* stop */
        case "Stop":
            edje_exit(evas, background, leave_game);
            return;

        case "KP8":
        case "Up":
        case "FP/Up":
        case "RC/Up":
        case "RCL/Up":
        case "GP/Up":
            if (initing)
            {
                level++;
                edje_object_part_text_set(background, "level", "Niveau "
                                             + (level + 1));
                return;
            }
            break;
        case "KP2":
        case "FP/Down":
        case "RC/Down":
        case "RCL/Down":
        case "GP/Down":
        case "Down":
            if (initing && level > 0)
            {
                level--;
                edje_object_part_text_set(background, "level", "Niveau "
                                             + (level + 1));
                return;
            }
            break;

        case "KP4":
        case "FP/Left":
        case "RC/Left":
        case "RCL/Left":
        case "GP/Left":
        case "Left":
        case "KP6":
        case "FP/Right":
        case "RC/Right":
        case "RCL/Right":
        case "GP/Right":
        case "Right":
        case "y":
        case "Yellow":
        case "a":
        case "Green":
        case "x":
        case "Blue":
        case "b":
        case "Red":
        case "Escape": /* start */
        case "Start":
        case "l":
        case "r":
            break;

        default:
	   elx.print(event.keyname, "\n");
            return;
    }

    if (initing)
    {
        clear_state();
        build_state(level);
        initing = false;
    }
    bonuses = 0;
    show_state();

    animator = ecore_timer_add(0.04, animator_cb, null);
    evas_object_event_callback_del(background, EVAS_CALLBACK_KEY_UP,
                                   key_cb_panel, null);
    evas_object_event_callback_add(background, EVAS_CALLBACK_KEY_DOWN,
                                   key_cb_down, null);
    evas_object_event_callback_add(background, EVAS_CALLBACK_KEY_UP,
                                   key_cb_up, null);
}

function panel_cb()
{
    build_state(++level);

    return 0;
}

function panel_timer()
{
    evas_object_event_callback_add(background, EVAS_CALLBACK_KEY_UP,
                                   key_cb_panel, null);

    return 0;
}

function show_score()
{
    var text = "", figures = "";
    var lines = 4;

    text += "Score reporté<br><br>";
    figures += cumulative_score + "<br><br>";

    if (score)
    {
        text += (score / 10) + " saphirs<br>";
        figures += score + "<br>";
        cumulative_score += score;
        lines++;
    }

    time /= 1000;
    if (time < 300)
    {
        text += time + " secondes<br>";
        figures += (300 - time) + "<br>";
        cumulative_score += 300 - time;
        lines++;
    }

    if (!(bonuses & HAS_DIED))
    {
        text += "0 échec<br>";
        figures += 300 + "<br>";
        cumulative_score += 300;
        lines++;
    }

    if (!(bonuses & HAS_KILLED))
    {
        text += "0 meurtre<br>";
        figures += 100 + "<br>";
        cumulative_score += 100;
        lines++;
    }

    if (!(bonuses & HAS_TRAPPED))
    {
        text += "0 capture<br>";
        figures += 300 + "<br>";
        cumulative_score += 300;
        lines++;
    }

    text += "<br>Score final<br>";
    figures += "<br>" + cumulative_score + "<br>";

    while (lines < 8)
    {
        text = "<br>" + text;
        figures = "<br>" + figures;
        lines += 2;
    }

    edje_object_part_text_set(background, "scores-text", text);
    edje_object_part_text_set(background, "scores-figures", figures);
    edje_object_signal_emit(background, "show", "code");

    clear_state();
    idler = ecore_idler_add(panel_cb, null);
    evas_object_event_callback_del(background, EVAS_CALLBACK_KEY_DOWN,
                                   key_cb_down, null);
    evas_object_event_callback_del(background, EVAS_CALLBACK_KEY_UP,
                                   key_cb_up, null);
    timer = ecore_timer_add(1.0, panel_timer, null);
}


/*
 * Core functions
 */

function build_sound()
{
    Mix_OpenAudio(44100, 0x9010, 1, 512);
    dig_sound = Mix_LoadWAV("dig.wav");
    fall_sound = Mix_LoadWAV("fall.wav");
    pop_sound = Mix_LoadWAV("pop.wav");
    death_sound = Mix_LoadWAV("death.wav");
    victory_sound = Mix_LoadWAV("victory.wav");
    musiq_sound = Mix_LoadWAV("Scavenger.ogg");
    if (!dig_sound || !fall_sound || !death_sound || !victory_sound || !musiq_sound)
        sound = false;

    if (sound)
        Mix_PlayChannel(-1, musiq_sound, -1);
}

function interface_builder_cb(data)
{
    build_state(0);
    if (sound)
        build_sound();

    evas_object_event_callback_add(background, EVAS_CALLBACK_KEY_UP,
                                   key_cb_panel, null);

    idler = null;
    return 0;
}

function main()
{
    if (shutdown == undefined || shutdown == false)
    {
        ecore_init();
        ecore_evas_init();
        edje_init();

        ee = ecore_evas_new(null, 0, 0, WIN.w, WIN.h, "name=Scavenger;double_buffer=0;");

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
    edje_object_file_set(o, EDJE_FILE, "game");
    evas_object_layer_set(o, 1);
    evas_object_move(o, 0, 0);
    evas_object_resize(o, WIN.w, WIN.h);
    evas_object_focus_set(o, 1);
    evas_object_show(o);
    background = o;

    o = edje_object_add(evas);
    edje_object_file_set(o, EDJE_FILE, "text-centered");
    edje_object_part_swallow(background, "time", o);
    time_obj = o;

    o = edje_object_add(evas);
    edje_object_file_set(o, EDJE_FILE, "text-right");
    edje_object_part_swallow(background, "saphirs", o);
    saphirs_obj = o;

    var score_obj = load_highscore();
    if (score_obj)
    {
        high_score = score_obj.score;
        edje_object_part_text_set(saphirs_obj, "content",
                                  "Record : " + high_score);
    }

    idler = ecore_idler_add(interface_builder_cb, null);

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
