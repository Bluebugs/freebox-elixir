Solitaire.edj: Solitaire.edc Solitaire.js Makefile ../elixir.private ../elixir.cert
	edje_cc -v -id share Solitaire.edc Solitaire.edj
	eet -i Solitaire.edj "elixir/main" Solitaire.js 1
	elixir-compile Solitaire.edj "elixir/main"
	eet -s Solitaire.edj ../elixir.private ../elixir.cert
	chmod a+r Solitaire.edj
