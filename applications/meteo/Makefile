Meteo.edj: Meteo.edc Meteo.js Meteo_Smart.js LibMeteo.js Google.js geoloc.js Makefile
	edje_cc -v -id images Meteo.edc Meteo.edj
	eet -i Meteo.edj "elixir/main" Meteo.js 1
	eet -i Meteo.edj "Meteo_Smart" Meteo_Smart.js 1
	eet -i Meteo.edj "LIBMeteo" LibMeteo.js 1
	eet -i Meteo.edj "Google" Google.js 1
	eet -i Meteo.edj "Geoloc" geoloc.js 1
	elixir-compile Meteo.edj "elixir/main"
	chmod a+r Meteo.edj
