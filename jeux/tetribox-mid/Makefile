all: hof_level-TetriBox-Mid.edj TetriBox-Mid.edj

hof_level-TetriBox-Mid.edj: hof_level-TetriBox-Mid.edc hof_level.js Makefile
	edje_cc -v -id share hof_level-TetriBox-Mid.edc hof_level-TetriBox-Mid.edj
	eet -i hof_level-TetriBox-Mid.edj hof_level hof_level.js 1
	elixir-compile hof_level-TetriBox-Mid.edj hof_level
	chmod a+r hof_level-TetriBox-Mid.edj

TetriBox-Mid.edj: TetriBox-Mid.edc scores_level.js TetriBox-Mid.js Makefile
	edje_cc -v -id share TetriBox-Mid.edc TetriBox-Mid.edj
	eet -i TetriBox-Mid.edj scores_level scores_level.js 1
	eet -i TetriBox-Mid.edj "elixir/main" TetriBox-Mid.js 1
	elixir-compile TetriBox-Mid.edj scores_level
	elixir-compile TetriBox-Mid.edj "elixir/main"
	chmod a+r TetriBox-Mid.edj
