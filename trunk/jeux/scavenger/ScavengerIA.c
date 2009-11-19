/*****************************************************************************
 * ScavengerIA : calculate the IA of a level
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

#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <limits.h>

#include "levels.h"

/*
 * Lode-Runner/Scavenger constants
 */

#define NB_TILES_X 24
#define NB_TILES_Y 15

/* states */
#define EMPTY 0
#define BRICK 1
#define CEMENT 2
#define LADDER 4
#define RAIL 8
#define GOLD 16
#define DUG 32
#define FAKE 64
#define MAX_STATE 127

#define ROBOT 128
#define ESCAPE_LADDER 256
#define PLAYER 512
#define BRICK_DIGGING 1024

#define NOT_ENTERABLE (BRICK | CEMENT)
#define STABLE (BRICK | CEMENT | ladder)

#define UP 1
#define DOWN 2
#define LEFT 4
#define RIGHT 8

#define UP_DIR 0
#define DOWN_DIR 1
#define LEFT_DIR 2
#define RIGHT_DIR 3

#define MAX_COST UINT_MAX

#define is_enterable(x, y, also_stable)                             \
    (x >= 0 && y >= 0 && x < NB_TILES_X && y < NB_TILES_Y && !(state[y][x] & (NOT_ENTERABLE | also_stable)))
#define is_stable(x, y, also_stable)                                \
    (x < 0 || y < 0 || x >= NB_TILES_X || y >= NB_TILES_Y || (state[y][x] & (STABLE | also_stable)))


/*
 * Variable declarations
 */
unsigned int level;
unsigned int state[NB_TILES_Y][NB_TILES_X];
unsigned int ladder;
int zones[NB_TILES_Y][NB_TILES_X];
unsigned int nodes_to_zones[NB_TILES_Y * NB_TILES_X];
unsigned int zones_to_nodes[NB_TILES_Y * NB_TILES_X];
unsigned int max_zone;

typedef struct node_t
{
    int node;
    unsigned int cost;
} node_t;

node_t graph[NB_TILES_Y * NB_TILES_X][4];
unsigned int possible_movements[NB_TILES_Y * NB_TILES_X];
unsigned int directions[NB_TILES_Y * NB_TILES_X][NB_TILES_Y * NB_TILES_X];


/*
 * Implementation
 */

void print_zones(const char *string)
{
    unsigned int x, y;
    FILE *out;
    char buffer[256];

    snprintf(buffer, 256, "part/%u-%szones", level, string);
    out = fopen(buffer, "w");

    fprintf(out, "[");
    for (y = 0; y < NB_TILES_Y; ++y)
    {
        fprintf(out, "[");
        for (x = 0; x < NB_TILES_X; ++x)
        {
            fprintf(out, "%u,", zones[y][x]);
        }
        fprintf(out, "],");
    }
    fprintf(out, "];\n");
    fclose(out);
}

void print_directions(const char *string)
{
    unsigned int i, j;
    FILE *out;
    char buffer[256];

    snprintf(buffer, 256, "part/%u-%sdir", level, string);
    out = fopen(buffer, "w");

    fprintf(out, "[[");
    for (i = 0; i <= max_zone; ++i)
      fprintf(out, "0,");
    fprintf(out, "]");
    for (i = 1; i <= max_zone; ++i)
    {
        fprintf(out, ",[0");
        for (j = 1; j <= max_zone; ++j)
        {
            fprintf(out, ",%u", directions[zones_to_nodes[i]][zones_to_nodes[j]]);
        }
        fprintf(out, "]");
    }
    fprintf(out, "];\n");
    fclose(out);
}

void fixup_zones(void)
{
    int x, y;

    for (x = 0; x < NB_TILES_X; ++x)
    {
        unsigned int last_zone = zones[NB_TILES_Y - 1][x];
        for (y = NB_TILES_Y - 2; y >= 0; --y)
        {
            if (zones[y][x])
                last_zone = zones[y][x];
            else if (!zones[y][x] && is_enterable(x, y, FAKE))
                zones[y][x] = last_zone;
            else
                last_zone = 0;
        }
    }
}

void renumber_zones(void)
{
    unsigned int x, y;

    max_zone = 0;
    memset(nodes_to_zones, 0, sizeof(nodes_to_zones));
    for (y = 0; y < NB_TILES_Y; ++y)
    {
        for (x = 0; x < NB_TILES_X; ++x)
        {
            if (zones[y][x] != -1)
            {
                if (!nodes_to_zones[zones[y][x]])
                {
                    nodes_to_zones[zones[y][x]] = ++max_zone;
                    zones_to_nodes[max_zone] = zones[y][x];
                }
                zones[y][x] = nodes_to_zones[zones[y][x]];
            }
            else
                zones[y][x] = 0;
        }
    }
}

void merge_zones(unsigned int node1, unsigned int node2)
{
    unsigned int i;
    for (i = 0; i < NB_TILES_X * NB_TILES_Y; ++i)
    {
        if (i == node1 || i == node2) continue;
        directions[node1][i] &= directions[node2][i];
        directions[i][node1] &= directions[i][node2];
    }
}

unsigned int are_mergeable(unsigned int node1, unsigned int node2)
{
    unsigned int i;
    for (i = 0; i < NB_TILES_X * NB_TILES_Y; ++i)
    {
        if (i == node1 || i == node2) continue;
        if (!(directions[node1][i] & directions[node2][i]) &&
              directions[node1][i] != directions[node2][i])
            return 0;
        if (!((directions[i][node1] & directions[i][node2])
                || directions[i][node1] == directions[i][node2]))
            return 0;
    }
    return 1;
}

unsigned int is_unreachable(unsigned int node)
{
    int i;

    if (possible_movements[node])
        return 0;

    for (i = 0; i < NB_TILES_X * NB_TILES_Y; ++i)
    {
        if (i != node && directions[i][node])
            return 0;
    }

    return 1;
}

void merge_directions(void)
{
    unsigned int x, y;
    for (y = 0; y < NB_TILES_Y; ++y)
    {
        for (x = 0; x < NB_TILES_X; ++x)
        {
            unsigned int i = y * NB_TILES_X + x;
            if (i == zones[y][x] && is_unreachable(i))
            {
                zones[y][x] = -1;
                continue;
            }

            if (y < NB_TILES_Y - 1
                 && are_mergeable(zones[y][x], i + NB_TILES_X))
            {
                merge_zones(zones[y][x], i + NB_TILES_X);
                zones[y + 1][x] = zones[y][x];
            }

            if (x < NB_TILES_X - 1 && are_mergeable(zones[y][x], i + 1))
            {
                merge_zones(zones[y][x], i + 1);
                zones[y][x + 1] = zones[y][x];
            }
        }
    }
}

void find_nodes(unsigned int i, int *result)
{
    unsigned int j;

    for (j = 0; j < 4; ++j)
    {
        unsigned int cost;

        if (graph[i][j].node == -1)
            continue;

        cost = result[i] + graph[i][j].cost;
        if (result[graph[i][j].node] != -1 && cost >= result[graph[i][j].node])
            continue;

        result[graph[i][j].node] = cost;

        find_nodes(graph[i][j].node, result);
    }
}

void scan_directions(void)
{
    unsigned int i, j, k;
    memset(directions, 0, sizeof(directions));

    for (i = 0; i < NB_TILES_X * NB_TILES_Y; ++i)
    {
        int possible_directions[4][NB_TILES_X * NB_TILES_Y];

        if (!possible_movements[i])
            continue;

        for (j = 0; j < 4; ++j)
            for (k = 0; k < NB_TILES_X * NB_TILES_Y; ++k)
                possible_directions[j][k] = -1;

        for (j = 0; j < 4; ++j)
        {
            if (graph[i][j].node == -1)
                continue;

            possible_directions[j][graph[i][j].node] = graph[i][j].cost;
            find_nodes(graph[i][j].node, possible_directions[j]);
        }

        for (k = 0; k < NB_TILES_X * NB_TILES_Y; ++k)
        {
            unsigned int best_cost = MAX_COST;
            unsigned int best_dir = 0;

            for (j = 0; j < 4; ++j)
            {
                if (graph[i][j].node == -1)
                    continue;

                if (possible_directions[j][k] != -1)
                {
                    if (possible_directions[j][k] < best_cost)
                    {
                        best_cost = possible_directions[j][k];
                        best_dir = (1 << j);
                    }
                    else if (possible_directions[j][k] == best_cost)
                        best_dir |= (1 << j);
                }
            }
            directions[i][k] = best_dir;
        }
    }
}

void find_end_node(unsigned int x, unsigned int y, node_t *node)
{
    unsigned int yprime = y;

    while (!is_stable(x, yprime + 1, FAKE)
            && !(state[yprime][x] & ladder)
            && !(state[yprime][x] & RAIL))
        yprime++;

    node->node = yprime * NB_TILES_X + x;
    node->cost = 1 + yprime - y;
}

void build_graph(void)
{
    unsigned int x, y;
    memset(possible_movements, 0, sizeof(possible_movements));

    for (y = 0; y < NB_TILES_Y; ++y)
    {
        for (x = 0; x < NB_TILES_X; ++x)
        {
            zones[y][x] = y * NB_TILES_X + x;

            /* Find possible movements */
            if (!is_stable(x, y + 1, FAKE)
                 && !(state[y][x] & ladder)
                 && !(state[y][x] & RAIL))
                continue; /* not stable => no connections */

            if ((state[y][x] & ladder) && is_enterable(x, y - 1, FAKE))
            {
                find_end_node(x, y - 1, &graph[y * NB_TILES_X + x][UP_DIR]);
                possible_movements[y * NB_TILES_X + x] |= UP;
            }
            else
                graph[y * NB_TILES_X + x][UP_DIR].node = -1;

            if (is_enterable(x, y + 1, FAKE))
            {
                find_end_node(x, y + 1, &graph[y * NB_TILES_X + x][DOWN_DIR]);
                possible_movements[y * NB_TILES_X + x] |= DOWN;
            }
            else
                graph[y * NB_TILES_X + x][DOWN_DIR].node = -1;

            if (is_enterable(x - 1, y, FAKE))
            {
                find_end_node(x - 1, y, &graph[y * NB_TILES_X + x][LEFT_DIR]);
                possible_movements[y * NB_TILES_X + x] |= LEFT;
            }
            else
                graph[y * NB_TILES_X + x][LEFT_DIR].node = -1;

            if (is_enterable(x + 1, y, FAKE))
            {
                find_end_node(x + 1, y, &graph[y * NB_TILES_X + x][RIGHT_DIR]);
                possible_movements[y * NB_TILES_X + x] |= RIGHT;
            }
            else
                graph[y * NB_TILES_X + x][RIGHT_DIR].node = -1;
        }
    }
}

int main(int argc, char **argv)
{
    for (level = 0; level <= last_level; ++level)
    {
        memcpy(state, states[level],
               sizeof(unsigned int) * NB_TILES_X * NB_TILES_Y);

        ladder = LADDER;
        build_graph();
        scan_directions();
        merge_directions();
        renumber_zones();
        fixup_zones();
        print_zones("");
        print_directions("");

        ladder = LADDER | ESCAPE_LADDER;
        build_graph();
        scan_directions();
        merge_directions();
        renumber_zones();
        fixup_zones();
        print_zones("escape-");
        print_directions("escape-");
    }

    return 0;
}
