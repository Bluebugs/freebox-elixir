var win = { w: 720, h: 576 };

var levels = {
 easy: { x: 209, y: 259, w: 15, h: 6 },
 middle: { x: 139, y: 178, w: 21, h: 14 },
 expert: { x: 76, y: 132, w: 27, h: 18 }
};

elx.print("#define CELL(Name, X, Y) \\\n");
elx.print("\tpart {\\\n");
elx.print("\t\tname, Name;\\\n");
elx.print("\t\ttype, GROUP;\\\n");
elx.print("\t\tsource, \"cell\";\\\n");
elx.print("\t\tmouse_events, 0;\\\n");
elx.print("\t\trepeat_events, 0;\\\n");
elx.print("\t\tdescription {\\\n");
elx.print("\t\tstate, \"default\" 0.0;\\\n");
elx.print("\t\trel1.relative, X Y;\\\n");
elx.print("\t\trel1.offset, -10 -10;\\\n");
elx.print("\t\trel2.relative, X Y;\\\n");
elx.print("\t\trel2.offset, 10 10;\\\n");
elx.print("\t\t}\\\n");
elx.print("\t}\n");
elx.print("\n");
elx.print("#define CURSOR(Name) \\\n");
elx.print("\tdescription {\\\n");
elx.print("\t\tstate, Name 0.0;\\\n");
elx.print("\t\trel1.to, Name;\\\n");
elx.print("\t\trel1.offset, -4 -4;\\\n");
elx.print("\t\trel2.to, Name;\\\n");
elx.print("\t\trel2.offset, 3 3;\\\n");
elx.print("\t\timage.normal, \"case_selected.png\";\\\n");
elx.print("\t}\\\n");
elx.print("\tdescription {\\\n");
elx.print("\t\tstate, Name\"-cube\" 0.0;\\\n");
elx.print("\t\tinherit, Name 0.0;\\\n");
elx.print("\t\timage.normal, \"case_cube_selected.png\";\\\n");
elx.print("\t}\\\n");
elx.print("\tdescription {\\\n");
elx.print("\t\tstate, Name\"-flag\" 0.0;\\\n");
elx.print("\t\tinherit, Name 0.0;\\\n");
elx.print("\t\timage.normal, \"case_cube_selected_flag.png\";\\\n");
elx.print("\t}\n");
elx.print("\n");
elx.print("#define DETECT(Name, X, Y) \\\n");
elx.print("\tpart {\\\n");
elx.print("\t\tname, \"detect-\"Name;\\\n");
elx.print("\t\ttype, RECT;\\\n");
elx.print("\t\tmouse_events, 1;\\\n");
elx.print("\t\tdescription {\\\n");
elx.print("\t\t\tstate, \"default\" 0.0;\\\n");
elx.print("\t\t\trel1.relative, X Y;\\\n");
elx.print("\t\t\trel1.offset, -10 -10;\\\n");
elx.print("\t\t\trel2.relative, X Y;\\\n");
elx.print("\t\t\trel2.offset, 10 10;\\\n");
elx.print("\t\t\tcolor, 0 0 0 0;\\\n");
elx.print("\t\t}\\\n");
elx.print("\t}\n");
elx.print("\n");

for (var i in levels)
  {
     for (var y = 0; y < levels[i].h; ++y)
       {
          var r1y = levels[i].y + 2 + 20 * y;
          var r2y = r1y + 20;

          elx.print("#define Y", i, y, " ", (r1y + 10) / win.h, "\n");
       }
     for (var x = 0; x < levels[i].w; ++x)
       {
          var r1x = levels[i].x + 2 + 20 * x;
          var r2x = r1x + 20;

          elx.print("#define X", i, x, " ", (r1x + 10) / win.w, "\n");
       }

     elx.print("#define CELL_LINE", i, "(Name, X1) \\\n");
     for (var y = 0; y < levels[i].h; ++y)
       elx.print("\tCELL(Name\"/" + y +"\", X1, Y", i, y, ")\\\n");
     elx.print("\n");

     elx.print("#define CURSOR_LINE", i, "(Name) \\\n");
     for (var y = 0; y < levels[i].h; ++y)
       elx.print("\tCURSOR(Name\"/" + y + "\")\\\n");
     elx.print("\n");

     elx.print("#define DETECT_LINE", i, "(Name, X1) \\\n");
     for (var y = 0; y < levels[i].h; ++y)
       elx.print("\tDETECT(Name\"/" + y + "\", X1, Y", i, y, ")\\\n");
     elx.print("\n");

     elx.print("\n");
     elx.print("\tgroup {\n");
     elx.print("\t\tname, \"level,", i, "\";\n");
     elx.print("\t\tmin, ", win.w, " ", win.h, ";\n");
     elx.print("\t\tmax, ", win.w, " ", win.h, ";\n");

     elx.print("\t\tscript {\n");
     elx.print("\t\t\tnew target[12];\n");
     elx.print("\t\t\tpublic set_target(index, x, y) {\n");
     elx.print("\t\t\t\tif (index == 0) {\n");
     elx.print("\t\t\t\t\tsnprintf(target, 12, \"%i/%i\", x, y);\n");
     elx.print("\t\t\t\t} else {\n");
     elx.print("\t\t\t\t\tif (index == 1) {\n");
     elx.print("\t\t\t\t\t\tsnprintf(target, 12, \"%i/%i-flag\", x, y);\n");
     elx.print("\t\t\t\t\t} else {\n");
     elx.print("\t\t\t\t\tsnprintf(target, 12, \"%i/%i-cube\", x, y);\n");
     elx.print("\t\t\t\t\t}\n");
     elx.print("\t\t\t\t}\n");
     elx.print("\t\t\t}\n");
     elx.print("\n");
     elx.print("\t\t\tpublic message(Msg_Type:type, id, ...) {\n");
     elx.print("\t\t\t\tif (type == MSG_INT_SET) {\n");
     elx.print("\t\t\t\t\tif (id == 4) {\n");
     elx.print("\t\t\t\t\t\tnew state;\n");
     elx.print("\t\t\t\t\t\tnew x;\n");
     elx.print("\t\t\t\t\t\tnew y;\n");
     elx.print("\n");
     elx.print("\t\t\t\t\t\tstate = getarg(2);\n");
     elx.print("\t\t\t\t\t\tx = getarg(3);\n");
     elx.print("\t\t\t\t\t\ty = getarg(4);\n");
     elx.print("\n");
     elx.print("\t\t\t\t\t\tset_target(state, x, y);\n");
     elx.print("\t\t\t\t\t\tset_state(PART:\"cursor\", target, 0.0);\n");
     elx.print("\t\t\t\t\t}\n");
     elx.print("\t\t\t\t}\n");
     elx.print("\t\t\t}\n");
     elx.print("\n");
     elx.print("\t\t}\n");

     elx.print("\t\tparts {\n");
     elx.print("\t\t\tBACKGROUND;\n");
     elx.print("\t\t\tpart {\n");
     elx.print("\t\t\t\tname, \"border\";\n");
     elx.print("\t\t\t\ttype, IMAGE;\n");
     elx.print("\t\t\t\tmouse_events, 0;\n");
     elx.print("\t\t\t\tdescription {\n");
     elx.print("\t\t\t\t\tstate, \"default\" 0.0;\n");
     elx.print("\n");
     elx.print("\t\t\t\t\trel1.relative, ", levels[i].x / win.w, " ", levels[i].y / win.h, ";\n");
     elx.print("\t\t\t\t\trel2.relative, ", (levels[i].x + 4 + 20 * levels[i].w) / win.w, " ", (levels[i].y + 4 + 20 * levels[i].h) / win.h, ";\n");
     elx.print("\t\t\t\t\timage {\n");
     elx.print("\t\t\t\t\t\tnormal, \"bloc_4x4.png\";\n");
     elx.print("\t\t\t\t\t\tborder, 4 4 4 4;\n");
     elx.print("\t\t\t\t\t\tmiddle, 0;\n");
     elx.print("\t\t\t\t\t}\n");
     elx.print("\t\t\t\t}\n");
     elx.print("\t\t\t}\n");

     for (var x = 0; x < levels[i].w; ++x)
       elx.print("\t\t\tCELL_LINE", i, "(\"", x, "\", X", i, x, ");\n");

     elx.print("\t\t\tpart {\n");
     elx.print("\t\t\t\tname, \"cursor\";\n");
     elx.print("\t\t\t\ttype, IMAGE;\n");
     elx.print("\t\t\t\tmouse_events, 1;\n");
     elx.print("\t\t\t\tdescription {\n");
     elx.print("\t\t\t\t\tstate, \"default\" 0.0;\n");
     elx.print("\t\t\t\t\tvisible, 0;\n");
     elx.print("\t\t\t\t}\n");

     for (var x = 0; x < levels[i].w; ++x)
       elx.print("\t\t\t\tCURSOR_LINE", i, "(\"", x, "\");\n");

     elx.print("\t\t\t}\n");

     for (var x = 0; x < levels[i].w; ++x)
       elx.print("\t\t\tDETECT_LINE", i, "(\"", x, "\", X", i, x, ");\n");

     elx.print("\t\t\tEND;\n");
     elx.print("\t\t\tCLOCK;\n");
     elx.print("\t\t\tFLAG;\n");
     elx.print("\t\t}\n");
     elx.print("\t\tprograms {\n");
     elx.print("\t\t\tWINNER\n");
     elx.print("\t\t\tprogram {\n");
     elx.print("\t\t\t\tname, \"cursor,hide\";\n");
     elx.print("\t\t\t\tsignal, \"cursor,hide\";\n");
     elx.print("\t\t\t\tsource, \"\";\n");
     elx.print("\t\t\t\taction, STATE_SET \"default\" 0.0;\n");
     elx.print("\t\t\t\ttarget, \"cursor\";\n");
     elx.print("\t\t\t}\n");
     elx.print("\n");

     elx.print("\t\t}\n");
     elx.print("\t}\n");
     elx.print("\n");
  }

