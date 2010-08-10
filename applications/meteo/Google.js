//Recuperation de la meteo sur Google Weather
//Ce code correspond au plugin Google de la bibliotheque C meteo


function strstr (haystack, needle, bool) {
    // Finds first occurrence of a string within another
    //
    // version: 909.322
    // discuss at: http://phpjs.org/functions/strstr
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // *     example 1: strstr('Kevin van Zonneveld', 'van');
    // *     returns 1: 'van Zonneveld'
    // *     example 2: strstr('Kevin van Zonneveld', 'van', true);
    // *     returns 2: 'Kevin '
    // *     example 3: strstr('name@example.com', '@');
    // *     returns 3: '@example.com'
    // *     example 4: strstr('name@example.com', '@', true);
    // *     returns 4: 'name'
    var pos = 0;

    haystack += '';
    pos = haystack.indexOf( needle );
    if (pos == -1) {
        return false;
    } else{
        if (bool){
            return haystack.substr( 0, pos );
        } else{
            return haystack.slice( pos );
        }
    }
}

var _google_tab = new Array(22);

function _google_tab_add(id, type) {
    this.id = id;
    this.type = type;
}

function google_init(meteo)
{
    _google_tab[0] = new _google_tab_add("/ig/images/weather/chance_of_rain.gif", EWT.METEO_TYPE_RAIN);
    _google_tab[1] = new _google_tab_add("/ig/images/weather/sunny.gif", EWT.METEO_TYPE_SUNNY);
    _google_tab[2] = new _google_tab_add("/ig/images/weather/mostly_sunny.gif", EWT.METEO_TYPE_PARTLY_CLOUDY_DAY);
    _google_tab[3] = new _google_tab_add("/ig/images/weather/partly_cloudy.gif", EWT.METEO_TYPE_PARTLY_CLOUDY_DAY);
    _google_tab[4] = new _google_tab_add("/ig/images/weather/mostly_cloudy.gif", EWT.METEO_TYPE_MOSTLY_CLOUDY_DAY);
    _google_tab[5] = new _google_tab_add("/ig/images/weather/chance_of_storm.gif", EWT.METEO_TYPE_ISOLATED_THUNDERSTORMS);
    _google_tab[6] = new _google_tab_add("/ig/images/weather/rain.gif", EWT.METEO_TYPE_RAIN);
    _google_tab[7] = new _google_tab_add("/ig/images/weather/chance_of_rain.gif", EWT.METEO_TYPE_RAIN);
    _google_tab[8] = new _google_tab_add("/ig/images/weather/chance_of_snow.gif", EWT.METEO_TYPE_SNOW);
    _google_tab[9] = new _google_tab_add("/ig/images/weather/cloudy.gif", EWT.METEO_TYPE_CLOUDY);
    _google_tab[10] = new _google_tab_add("/ig/images/weather/mist.gif", EWT.METEO_TYPE_FOGGY);
    _google_tab[11] = new _google_tab_add("/ig/images/weather/storm.gif", EWT.METEO_TYPE_SCATTERED_THUNDERSTORMS);
    _google_tab[12] = new _google_tab_add("/ig/images/weather/chance_of_tstorm.gif", EWT.METEO_TYPE_ISOLATED_THUNDERSTORMS);
    _google_tab[13] = new _google_tab_add("/ig/images/weather/sleet.gif", EWT.METEO_TYPE_RAIN_SNOW);
    _google_tab[13] = new _google_tab_add("/ig/images/weather/rain_snow.gif", EWT.METEO_TYPE_RAIN_SNOW);
    _google_tab[14] = new _google_tab_add("/ig/images/weather/snow.gif", EWT.METEO_TYPE_SNOW);
    _google_tab[15] = new _google_tab_add("/ig/images/weather/icy.gif", EWT.METEO_TYPE_SNOW);
    _google_tab[16] = new _google_tab_add("/ig/images/weather/dust.gif", EWT.METEO_TYPE_FOGGY);
    _google_tab[17] = new _google_tab_add("/ig/images/weather/fog.gif", EWT.METEO_TYPE_FOGGY);
    _google_tab[18] = new _google_tab_add("/ig/images/weather/smoke.gif", EWT.METEO_TYPE_FOGGY);
    _google_tab[19] = new _google_tab_add("/ig/images/weather/haze.gif", EWT.METEO_TYPE_FOGGY);
    _google_tab[20] = new _google_tab_add("/ig/images/weather/flurries.gif", EWT.METEO_TYPE_SNOW);
    _google_tab[21] = new _google_tab_add("", EWT.METEO_TYPE_UNKNOWN);


    meteo.google.host = "www.google.com";
    meteo.google.server = null;

    meteo.google.add_handler =
        ecore_event_handler_add(ECORE_CON_EVENT_SERVER_ADD,
                _server_add, meteo);

    meteo.google.del_handler =
        ecore_event_handler_add(ECORE_CON_EVENT_SERVER_DEL,
                _server_del, meteo);
    meteo.google.data_handler =
        ecore_event_handler_add(ECORE_CON_EVENT_SERVER_DATA,
                _server_data, meteo);

    meteo.google.check_timer = ecore_timer_add(0, _weather_cb_check, meteo);
}

function google_shutdown(meteo)
{
   if (meteo.google.check_timer) ecore_timer_del(meteo.google.check_timer);
   if (meteo.google.add_handler) ecore_event_handler_del(meteo.google.add_handler);
   if (meteo.google.data_handler) ecore_event_handler_del(meteo.google.data_handler);
   if (meteo.google.del_handler) ecore_event_handler_del(meteo.google.del_handler);
   if (meteo.google.server) ecore_con_server_del(meteo.google.server);
}

function google_poll_time_updated(meteo)
{
    if(meteo.google.check_timer)
        ecore_timer_del(meteo.google.check_timer);

    meteo.google.check_timer =
        ecore_timer_add(0, _weather_cb_check, meteo);
}

function google_code_updated(meteo)
{
    if (meteo.google.check_timer)
        ecore_timer_del(meteo.google.check_timer);

    meteo.google.check_timer =
      ecore_timer_add(0, _weather_cb_check, meteo);
}

function _weather_cb_check(data)
{
    var meteo;

    if (!(meteo = data)) return 0;

    if (meteo.google.server) ecore_con_server_del(meteo.google.server);
    meteo.google.server = null;

    if (meteo.proxy.port && meteo.proxy.port != "")
        meteo.google.server =
            ecore_con_server_connect(ECORE_CON_REMOTE_SYSTEM, meteo.proxy.host,
                    meteo.proxy.port, meteo);
    else
        meteo.google.server =
            ecore_con_server_connect(ECORE_CON_REMOTE_SYSTEM, meteo.google.host, 80, meteo);

    if (!meteo.google.server) return 0;

    ecore_timer_interval_set(meteo.google.check_timer, meteo.poll_time);
    return 1;
}

function _server_add(data, type, event)
{
    var meteo;
    var ev;
    var buf;
    var s;
    var i;

    if (!(meteo = data)) return 1;
    if(!meteo.code) return 0;

    meteo.google.buffer = "";
    meteo.google.cursize = 0;
    meteo.google.bufsize = 0;

    ev = event;
    if ((!meteo.google.server) || (meteo.google.server != ev.server))
        return 1;
    s = meteo.code;
    for(i=0; i<s.length; i++)
        if(s[i] == ' ')
            s[i] = '+';

    buf = "GET http://"+meteo.google.host+"/ig/api?weather="+s+"&hl=fr HTTP/1.1\r\nHost: "
        +meteo.google.host+"\r\n\r\n";

    ecore_con_server_send(meteo.google.server, buf);

    return 0;
}

function _server_del(data, type, event)
{
    var meteo;
    var ev;
    var ret;

    meteo = data;
    ev = event;

    if ((!meteo.google.server) || (meteo.google.server != ev.server)) return 1;

    ecore_con_server_del(meteo.google.server);
    meteo.google.server = null;

    ret = _parse(meteo);

    meteo.google.bufsize = 0;
    meteo.google.cursize = 0;

    meteo.google.buffer = "";

    return 0;
}

function _server_data(data, type, event)
{
    var meteo;
    var ev;

    meteo = data;
    ev = event;

    if ( !(meteo.google.server) || (meteo.google.server != ev.server))
        return 1;

    meteo.google.buffer = meteo.google.buffer + ev.data;
    meteo.google.cursize += ev.size;

    _parse(meteo);
    return 0;
}

function _parse(meteo)
{
    var needle;
    var location;
    var day;
    var date;
    var e_data = meteo_data_current_get(meteo);
    var e_data_current;
    var code;
    var pos;
    location = "";

    if (!meteo.google.buffer) return 0;

    // elx.print(meteo.google.buffer);
    needle = strstr(meteo.google.buffer, "<problem_cause data=\"");
    if (needle) {
      meteo_code_set(meteo, "Paris,France");
      return 0;
    }

    needle = strstr(meteo.google.buffer, "<city data=\"");
    if (!needle) return 0;
    needle = needle.slice(12);
    pos = needle.indexOf("\"");
    e_data.city = needle.substr( 0, pos );

    needle = strstr(needle, "<current_date_time data=\"");
    if (!needle) return 0;
    needle = needle.slice(25);
    pos = needle.indexOf("+");
    date = needle.substr( 0, pos );

    needle = strstr(needle, "<temp_c data=\"");
    if (!needle) return 0;
    needle = needle.slice(14);
    pos = needle.indexOf("\"");
    e_data.temp = parseInt(needle.substr( 0, pos ));

    needle = strstr(needle, "<icon data=\"");
    if (!needle) return 0;
    needle = needle.slice(12);
    pos = needle.indexOf("\"");
    code = needle.substr( 0, pos );

    e_data.type = _weather_type_get(code);

    needle = strstr(needle, "<day_of_week data=\"");
    if (!needle) return 0;
    needle = needle.slice(19);
    pos = needle.indexOf("\"");
    day = needle.substr( 0, pos );
    e_data.date = day + " " + date;

    needle = strstr(needle, "<low data=\"");
    if (!needle) return 0;
    needle = needle.slice(11);
    pos = needle.indexOf("\"");
    e_data.temp_min = parseInt(needle.substr( 0, pos ));

    needle = strstr(needle, "<high data=\"");
    if (!needle) return 0;
    needle = needle.slice(12);
    pos = needle.indexOf("\"");
    e_data.temp_max = parseInt(needle.substr( 0, pos ));

    e_data_current = e_data;

    meteo_data_current_set(meteo, e_data_current);

    for(var i=1; i<4; i++)
    {
        e_data = meteo_data_get(meteo, i);

        needle = strstr(needle, "<day_of_week data=\"");
        if (!needle) return 0;
        needle = needle.slice(19);
        pos = needle.indexOf("\"");
        e_data.date = needle.substr( 0, pos );

        needle = strstr(needle, "<low data=\"");
        if (!needle) return 0;
        needle = needle.slice(11);
        pos = needle.indexOf("\"");
        e_data.temp_min = parseInt(needle.substr( 0, pos ));

        needle = strstr(needle, "<high data=\"");
        if (!needle) return 0;
        needle = needle.slice(12);
        pos = needle.indexOf("\"");
        e_data.temp_max = parseInt(needle.substr( 0, pos ));

        e_data.temp = ( e_data.temp_min + e_data.temp_max ) / 2;

        needle = strstr(needle, "<icon data=\"");
        if (!needle) return 0;
        needle = needle.slice(12);
        pos = needle.indexOf("\"");
        code = needle.substr( 0, pos );
        e_data.type = _weather_type_get(code);

        e_data.country = e_data_current.country;
        e_data.region = e_data_current.region;
        e_data.city = e_data_current.city;

	meteo_data_set(meteo, e_data, i);
    }

    meteo_plugin_update(meteo);
    return 1;
}

function _weather_type_get(id)
{
    for (var i = 0; i < _google_tab.length; ++i)
    {
        if ( _google_tab[i].id == id)
        {
            return _google_tab[i].type;
        }
    }

    return EWT.METEO_TYPE_UNKNOWN;
}

