NAME = MPD-client
EDC = $(NAME).edc main.edc prefs.edc playlist.edc pl_bottom.edc search.edc sl_bottom.edc
JS = $(NAME).js db.js prefs.js mpc.js playlist.js search.js

all: $(NAME).edj

$(NAME).edj: $(EDC) $(JS)
	edje_cc -v -id share/ -fd share/ $(NAME).edc $(NAME).edj
	eet -i $(NAME).edj "mpc" mpc.js 1
	eet -i $(NAME).edj "db" db.js 1
	eet -i $(NAME).edj "prefs" prefs.js 1
	eet -i $(NAME).edj "playlist" playlist.js 1
	eet -i $(NAME).edj "search" search.js 1
	eet -i $(NAME).edj "elixir/main" $(NAME).js 1
	elixir-compile $(NAME).edj "elixir/main"
	chmod a+r $(NAME).edj
clean:
	$(RM) *.edj *~ *.db
