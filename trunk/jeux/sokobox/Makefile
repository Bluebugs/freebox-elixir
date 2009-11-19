SokoBox.edj: SokoBox.edc SokoBox.js Makefile
	edje_cc -v -id share SokoBox.edc SokoBox.edj
	eet -i SokoBox.edj "elixir/main" SokoBox.js 1
	elixir-compile SokoBox.edj "elixir/main"
	chmod a+r SokoBox.edj

