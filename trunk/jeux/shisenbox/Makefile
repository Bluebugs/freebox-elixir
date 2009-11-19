all: ShisenBox.edj hof_time-ShisenBox.edj

ShisenBox.edj: ShisenBox.edc ShisenBox.js scores_time.js Makefile
	edje_cc -v -id share ShisenBox.edc ShisenBox.edj
	eet -i ShisenBox.edj "elixir/main" ShisenBox.js 1
	eet -i ShisenBox.edj scores_time scores_time.js 1
	elixir-compile ShisenBox.edj "elixir/main"
	elixir-compile ShisenBox.edj scores_time
	chmod a+r ShisenBox.edj

hof_time-ShisenBox.edj: hof_time-ShisenBox.edc hof_time.js Makefile
	edje_cc -v -id share hof_time-ShisenBox.edc hof_time-ShisenBox.edj
	eet -i hof_time-ShisenBox.edj hof_time hof_time.js 1
	elixir-compile hof_time-ShisenBox.edj hof_time
	chmod a+r hof_time-ShisenBox.edj
