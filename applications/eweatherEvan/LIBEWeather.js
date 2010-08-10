

var EWT =
{
    EWEATHER_TYPE_UNKNOWN : 0,
    EWEATHER_TYPE_WINDY : 1,
    EWEATHER_TYPE_RAIN : 2,
    EWEATHER_TYPE_SNOW : 3,
    EWEATHER_TYPE_RAIN_SNOW : 4,
    EWEATHER_TYPE_FOGGY : 5,
    EWEATHER_TYPE_CLOUDY : 6,
    EWEATHER_TYPE_MOSTLY_CLOUDY_NIGHT : 7,
    EWEATHER_TYPE_MOSTLY_CLOUDY_DAY : 8,
    EWEATHER_TYPE_PARTLY_CLOUDY_NIGHT : 9,
    EWEATHER_TYPE_PARTLY_CLOUDY_DAY : 10,
    EWEATHER_TYPE_CLEAR_NIGHT : 11,
    EWEATHER_TYPE_SUNNY : 12,
    EWEATHER_TYPE_ISOLATED_THUNDERSTORMS : 13,
    EWEATHER_TYPE_THUNDERSTORMS : 14,
    EWEATHER_TYPE_SCATTERED_THUNDERSTORMS : 15,
    EWEATHER_TYPE_HEAVY_SNOW : 16,
}

var EWTEMP =
{
    EWEATHER_TEMP_FARENHEIT : 0,
    EWEATHER_TEMP_CELCIUS : 1,
}

elx.include("EWeather.edj", "Google")

function eweather_new()
{
   var e = {};
   e.google = {};
   e.host = {};
   e.func = {};
   e.proxy = {};
   e.data = new Array();
   e.init = false;

   //30 minutes
   e.poll_time = 30*60;
   //celcius because Free is a french ISP
   e.temp_type = EWTEMP.EWEATHER_TEMP_CELCIUS;

   return e;
}

function eweather_start(eweather)
{
    eweather.init = true;
    google_init(eweather);
}


function eweather_free(eweather)
{
   google_shutdown(eweather);
}

function eweather_poll_time_set(eweather, poll_time)
{
   eweather.poll_time = poll_time;

   if(eweather.init)
    google_poll_time_updated(eweather)
}

function eweather_code_set(eweather, code)
{
   eweather.code = code;

   if(eweather.init)
     google_code_updated(eweather);
}

function eweather_temp_type_set(eweather, type)
{
   eweather.temp_type = type;
}

function eweather_temp_type_get(eweather)
{
   return eweather.temp_type;
}

function eweather_data_type_get(eweather_data)
{
   return eweather_data.type;
}

function eweather_data_temp_get(eweather_data)
{
   return eweather_data.temp;
}

function eweather_data_temp_min_get(eweather_data)
{
   return eweather_data.temp_min;
}


function eweather_data_temp_max_get(eweather_data)
{
   return eweather_data.temp_max;
}

function eweather_data_city_get( eweather_data)
{
   return eweather_data.city;
}


function eweather_data_region_get(eweather_data)
{
   return eweather_data.region;
}

function eweather_data_country_get(eweather_data)
{
   return eweather_data.country;
}

function eweather_data_date_get(eweather_data)
{
   return eweather_data.date;
}

function eweather_data_current_get(eweather)
{
   if(eweather.data.length == 0)
     {
	var e_data = {};
	eweather.data.push(e_data);
     }
   return eweather.data[0];
}

function eweather_data_current_set(eweather, data)
{
   if(eweather.data.length == 0)
     eweather.data.push(data);
   else
     eweather.data[0] = data;
}

function eweather_data_get(eweather, num)
{
   while(eweather.data.length <= num)
     {
	var e_data = {};
	eweather.data.push(e_data);
     }
   return eweather.data[num];
}

function eweather_data_set(eweather, data, num)
{
   while(eweather.data.length <= num)
     {
	var e_data = {};
	eweather.data.push(e_data);
     }

   eweather.data[num] = data;
}

function eweather_data_count(eweather)
{
   return eweather.data.length;
}

function eweather_callbacks_set(eweather, update_cb, data)
{
   eweather.func.data = data;
   eweather.func.update_cb = update_cb;
}

function eweather_utils_celcius_get(farenheit)
{
   return Math.round((farenheit - 32) * 5/9);
}

function eweather_plugin_update(eweather)
{
   if(eweather.func.update_cb)
     eweather.func.update_cb(eweather.func.data, eweather);
}

