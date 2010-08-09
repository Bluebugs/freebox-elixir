EWeather.edj: EWeather.edc EWeather.js EWeather_Smart.js LIBEWeather.js Google.js geoloc.js Makefile
	edje_cc -v -id images EWeather.edc EWeather.edj
	eet -i EWeather.edj "elixir/main" EWeather.js 1
	eet -i EWeather.edj "EWeather_Smart" EWeather_Smart.js 1
	eet -i EWeather.edj "LIBEWeather" LIBEWeather.js 1
	eet -i EWeather.edj "Google" Google.js 1
	eet -i EWeather.edj "Geoloc" geoloc.js 1
	elixir-compile EWeather.edj "elixir/main"
	chmod a+r EWeather.edj
