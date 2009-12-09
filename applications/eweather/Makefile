eweather.edj: EWeather.edc EWeather.js Makefile 
	edje_cc -v -id images EWeather.edc EWeather.edj
	eet -i EWeather.edj "elixir/main" EWeather.js 1
	eet -i EWeather.edj "EWeather_Smart" EWeather_Smart.js 1
	eet -i EWeather.edj "LIBEWeather" LIBEWeather.js 1
	eet -i EWeather.edj "Google" Google.js 1
	elixir-compile EWeather.edj "elixir/main"
	chmod a+r EWeather.edj
