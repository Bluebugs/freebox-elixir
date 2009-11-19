Morpion.edj: Morpion.edc Morpion.js Makefile
	edje_cc -v -id share Morpion.edc Morpion.edj
	eet -i Morpion.edj "elixir/main" Morpion.js 1
	elixir-compile Morpion.edj "elixir/main"
	chmod a+r Morpion.edj
