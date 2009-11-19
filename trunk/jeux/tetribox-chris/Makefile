TetriBox.edj: TetriBox.edc TetriBox.js Makefile
	edje_cc -v -id share TetriBox.edc TetriBox.edj
	eet -i TetriBox.edj "elixir/main" TetriBox.js 1
	elixir-compile TetriBox.edj "elixir/main"
	chmod a+r TetriBox.edj
