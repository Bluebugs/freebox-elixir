all: hof_level-SnakeBox.edj SnakeBox.edj

SnakeBox.edj: SnakeBox.edc scores_level.js SnakeBox.js Makefile
	edje_cc -v -id share SnakeBox.edc SnakeBox.edj
	eet -i SnakeBox.edj scores_level scores_level.js 1
	eet -i SnakeBox.edj "elixir/main" SnakeBox.js 1
	elixir-compile SnakeBox.edj scores_level
	elixir-compile SnakeBox.edj "elixir/main"
	chmod a+r SnakeBox.edj

hof_level-SnakeBox.edj: hof_level-SnakeBox.edc hof_level.js Makefile
	edje_cc -v -id share hof_level-SnakeBox.edc hof_level-SnakeBox.edj
	eet -i hof_level-SnakeBox.edj hof_level hof_level.js 1
	elixir-compile hof_level-SnakeBox.edj hof_level
	chmod a+r hof_level-SnakeBox.edj
