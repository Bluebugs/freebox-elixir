elx.load("eio");
elx.load("ecore");
elx.load("edje");

var count = 3;

ecore_init();
eio_init();

eio_filter_add("Edje file");

function refcount_die()
{
   count--;
   if (count == 0)
     ecore_main_loop_quit();
}


tst = eio_file_direct_stat("../articles/introduction/elixir.edj",
                           function (data, st) { elx.print("STAT: ", st.st_size, "\n"); refcount_die(); },
                           function (data, error) { elx.print("PFIOUT ", error,"\n"); refcount_die(); },
                           null);

tst = eio_file_direct_stat("elixir_eio_stat.js",
                           function (data, st) { elx.print("STAT: ", st, "\n"); refcount_die(); },
                           function (data, error) { elx.print("PFIOUT ", error,"\n"); refcount_die(); },
                           null);

tst = eio_file_direct_stat(null,
                           function (data, st) { elx.print("STAT: ", st, "\n"); refcount_die(); },
                           function (data, error) { elx.print("PFIOUT ", error,"\n"); refcount_die(); },
                           null);


ecore_main_loop_begin();

eio_filter_del("Edje file");

eio_shutdown();
ecore_shutdown();
