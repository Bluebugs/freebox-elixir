progress_bar.edj: progress_bar.edc progress_bar.js share/
	edje_cc -v -id share/ progress_bar.edc progress_bar.edj
	eet -i progress_bar.edj "elixir/main" progress_bar.js 1
	elixir-compile progress_bar.edj "elixir/main"
	chmod a+r progress_bar.edj
