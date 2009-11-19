/*
 * Runtime declarations
 */

var test = true;

test &= elx.load("edje");

/*
 * Lode-Runner/Scavenger constants
 */

var NB_TILES_X = 24;
var NB_TILES_Y = 15;
var EDJE_FILE = "Scavenger.edj";


function main()
{
    edje_init();

    elx.print("const unsigned int states[][", NB_TILES_Y, "][", NB_TILES_X, "] = {\n");
    for (var level = 0; ; ++level)
    {
        var level_str = edje_file_data_get(EDJE_FILE, level);
        if (level_str)
            state = eval(level_str);
        else
            break;

        elx.print("{");
        for (var y = 0; y < NB_TILES_Y; ++y)
        {
            elx.print("{");
            for (var x = 0; x < NB_TILES_X; ++x)
            {
                elx.print(state[y][x], ", ");
            }
            elx.print("},\n");
        } 
        elx.print("},\n");
    }
    elx.print("};\n");
    elx.print("const unsigned int last_level = ", level - 1, ";\n");
}

if (test)
    main();

0;

