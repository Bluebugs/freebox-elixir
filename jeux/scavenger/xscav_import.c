/*****************************************************************************
 * xscav_import: Import levels from XScavenger
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
#include <stdlib.h>
#include <string.h>

/*
 * Lode-Runner/Scavenger constants
 */

#define NB_TILES_X 24
#define NB_TILES_Y 15

#include <stdio.h>
#include <string.h>

static const int xscav_to_fbx[] =
{0, 1, 2, 4, 8, 64, 256, 16, 128, 512, 1, 16, 0, 0, 1, 1};

int main(int argc, char **argv)
{
    if (argc != 2)
        exit(1);

    FILE *input = fopen(argv[1], "r");
    uint8_t buff[8];
    size_t got = fread(buff, 8, 1, input);
    unsigned int level, last_level;

    if (strncmp((const char *)buff, "SCAV", 4))
        exit(1);

    last_level = (((buff[4]<<24) | (buff[5]<<16) | (buff[6]<<8) | buff[7]) / 2) - 1;

    for (level = 0; level <= last_level; ++level)
    {
        uint8_t level_tmp[180];
        uint8_t level_buf[360];
	char buffer[256];
	FILE *out;
        uint32_t offset, length;
        int i, x, y;
        fseek(input, (level * 2 + 1) * 8, SEEK_SET);
        got = fread(buff, 8, 1, input);
        offset=(buff[0]<<24) | (buff[1]<<16) | (buff[2]<<8) | buff[3];
        length=(buff[4]<<24) | (buff[5]<<16) | (buff[6]<<8) | buff[7];
        fseek(input, offset, SEEK_SET);
        memset(level_tmp, 0, 180);
        fread(level_tmp, length, 1, input);

        for (i = 0; i < 180; i++)
        {
            level_buf[2 * i] = level_tmp[i] >> 4;
            level_buf[2 * i + 1] = level_tmp[i] & 0xf;
        }

	snprintf(buffer, 256, "part/level-%d", level);
	out = fopen(buffer, "w");
	fprintf(out, "[");
        for (y = 0; y < NB_TILES_Y; y++)
        {
	    fprintf(out, "[");
            for (x = 0; x < NB_TILES_X; x++)
            {
	        fprintf(out, "%u,", xscav_to_fbx[level_buf[y * NB_TILES_X + x]]);
            }
            fprintf(out, "],");
        }
        fprintf(out, "];\n");
	fclose(out);
    }

    return 0;
}
