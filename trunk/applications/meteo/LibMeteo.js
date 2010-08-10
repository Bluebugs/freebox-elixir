

var EWT =
{
    METEO_TYPE_UNKNOWN : 0,
    METEO_TYPE_WINDY : 1,
    METEO_TYPE_RAIN : 2,
    METEO_TYPE_SNOW : 3,
    METEO_TYPE_RAIN_SNOW : 4,
    METEO_TYPE_FOGGY : 5,
    METEO_TYPE_CLOUDY : 6,
    METEO_TYPE_MOSTLY_CLOUDY_NIGHT : 7,
    METEO_TYPE_MOSTLY_CLOUDY_DAY : 8,
    METEO_TYPE_PARTLY_CLOUDY_NIGHT : 9,
    METEO_TYPE_PARTLY_CLOUDY_DAY : 10,
    METEO_TYPE_CLEAR_NIGHT : 11,
    METEO_TYPE_SUNNY : 12,
    METEO_TYPE_ISOLATED_THUNDERSTORMS : 13,
    METEO_TYPE_THUNDERSTORMS : 14,
    METEO_TYPE_SCATTERED_THUNDERSTORMS : 15,
    METEO_TYPE_HEAVY_SNOW : 16,
}

var EWTEMP =
{
    METEO_TEMP_FARENHEIT : 0,
    METEO_TEMP_CELCIUS : 1,
}

elx.include("Meteo.edj", "Google")

function meteo_new()
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
   e.temp_type = EWTEMP.METEO_TEMP_CELCIUS;

   return e;
}

function meteo_start(meteo)
{
    meteo.init = true;
    google_init(meteo);
}


function meteo_free(meteo)
{
   google_shutdown(meteo);
}

function meteo_poll_time_set(meteo, poll_time)
{
   meteo.poll_time = poll_time;

   if(meteo.init)
    google_poll_time_updated(meteo)
}

function meteo_code_set(meteo, code)
{
   meteo.code = code;

   if(meteo.init)
     google_code_updated(meteo);
}

function meteo_temp_type_set(meteo, type)
{
   meteo.temp_type = type;
}

function meteo_temp_type_get(meteo)
{
   return meteo.temp_type;
}

function meteo_data_type_get(meteo_data)
{
   return meteo_data.type;
}

function meteo_data_temp_get(meteo_data)
{
   return meteo_data.temp;
}

function meteo_data_temp_min_get(meteo_data)
{
   return meteo_data.temp_min;
}


function meteo_data_temp_max_get(meteo_data)
{
   return meteo_data.temp_max;
}

function meteo_data_city_get( meteo_data)
{
   return meteo_data.city;
}


function meteo_data_region_get(meteo_data)
{
   return meteo_data.region;
}

function meteo_data_country_get(meteo_data)
{
   return meteo_data.country;
}

function meteo_data_date_get(meteo_data)
{
   return meteo_data.date;
}

function meteo_data_current_get(meteo)
{
   if(meteo.data.length == 0)
     {
	var e_data = {};
	meteo.data.push(e_data);
     }
   return meteo.data[0];
}

function meteo_data_current_set(meteo, data)
{
   if(meteo.data.length == 0)
     meteo.data.push(data);
   else
     meteo.data[0] = data;
}

function meteo_data_get(meteo, num)
{
   while(meteo.data.length <= num)
     {
	var e_data = {};
	meteo.data.push(e_data);
     }
   return meteo.data[num];
}

function meteo_data_set(meteo, data, num)
{
   while(meteo.data.length <= num)
     {
	var e_data = {};
	meteo.data.push(e_data);
     }

   meteo.data[num] = data;
}

function meteo_data_count(meteo)
{
   return meteo.data.length;
}

function meteo_callbacks_set(meteo, update_cb, data)
{
   meteo.func.data = data;
   meteo.func.update_cb = update_cb;
}

function meteo_utils_celcius_get(farenheit)
{
   return Math.round((farenheit - 32) * 5/9);
}

function meteo_plugin_update(meteo)
{
   if(meteo.func.update_cb)
     meteo.func.update_cb(meteo.func.data, meteo);
}

