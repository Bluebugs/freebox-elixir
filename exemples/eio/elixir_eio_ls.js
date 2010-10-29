elx.load("eio");
elx.load("ecore");
elx.load("mix");

ecore_init();
eio_init();

eio_filter_add("Sample OGG");

tst = eio_file_ls(".",
                  function (data, file) { elx.print("FILTER: ", file, "\n"); return true; },
                  function (data, file) { elx.print("FILE: ", file, "\n"); },
                  function (data) { elx.print("DONE\n"); ecore_main_loop_quit(); },
                  function (data, error) { elx.print("ERR: ", error, "\n"); ecore_main_loop_quit(); },
                  null);

ecore_main_loop_begin();

eio_filter_del("Sample OGG");

eio_shutdown();
ecore_shutdown();
