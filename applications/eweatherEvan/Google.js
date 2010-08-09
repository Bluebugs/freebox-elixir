//Recuperation de la meteo sur Google Weather
//Ce code correspond au plugin Google de la bibliotheque C eweather


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

function google_init(eweather)
{
    _google_tab[0] = new _google_tab_add("/ig/images/weather/chance_of_rain.gif", EWT.EWEATHER_TYPE_RAIN);
    _google_tab[1] = new _google_tab_add("/ig/images/weather/sunny.gif", EWT.EWEATHER_TYPE_SUNNY);
    _google_tab[2] = new _google_tab_add("/ig/images/weather/mostly_sunny.gif", EWT.EWEATHER_TYPE_PARTLY_CLOUDY_DAY);
    _google_tab[3] = new _google_tab_add("/ig/images/weather/partly_cloudy.gif", EWT.EWEATHER_TYPE_PARTLY_CLOUDY_DAY);
    _google_tab[4] = new _google_tab_add("/ig/images/weather/mostly_cloudy.gif", EWT.EWEATHER_TYPE_MOSTLY_CLOUDY_DAY);
    _google_tab[5] = new _google_tab_add("/ig/images/weather/chance_of_storm.gif", EWT.EWEATHER_TYPE_ISOLATED_THUNDERSTORMS);
    _google_tab[6] = new _google_tab_add("/ig/images/weather/rain.gif", EWT.EWEATHER_TYPE_RAIN);
    _google_tab[7] = new _google_tab_add("/ig/images/weather/chance_of_rain.gif", EWT.EWEATHER_TYPE_RAIN);
    _google_tab[8] = new _google_tab_add("/ig/images/weather/chance_of_snow.gif", EWT.EWEATHER_TYPE_SNOW);
    _google_tab[9] = new _google_tab_add("/ig/images/weather/cloudy.gif", EWT.EWEATHER_TYPE_CLOUDY);
    _google_tab[10] = new _google_tab_add("/ig/images/weather/mist.gif", EWT.EWEATHER_TYPE_FOGGY);
    _google_tab[11] = new _google_tab_add("/ig/images/weather/storm.gif", EWT.EWEATHER_TYPE_SCATTERED_THUNDERSTORMS);
    _google_tab[12] = new _google_tab_add("/ig/images/weather/chance_of_tstorm.gif", EWT.EWEATHER_TYPE_ISOLATED_THUNDERSTORMS);
    _google_tab[13] = new _google_tab_add("/ig/images/weather/sleet.gif", EWT.EWEATHER_TYPE_RAIN_SNOW);
    _google_tab[13] = new _google_tab_add("/ig/images/weather/rain_snow.gif", EWT.EWEATHER_TYPE_RAIN_SNOW);
    _google_tab[14] = new _google_tab_add("/ig/images/weather/snow.gif", EWT.EWEATHER_TYPE_SNOW);
    _google_tab[15] = new _google_tab_add("/ig/images/weather/icy.gif", EWT.EWEATHER_TYPE_SNOW);
    _google_tab[16] = new _google_tab_add("/ig/images/weather/dust.gif", EWT.EWEATHER_TYPE_FOGGY);
    _google_tab[17] = new _google_tab_add("/ig/images/weather/fog.gif", EWT.EWEATHER_TYPE_FOGGY);
    _google_tab[18] = new _google_tab_add("/ig/images/weather/smoke.gif", EWT.EWEATHER_TYPE_FOGGY);
    _google_tab[19] = new _google_tab_add("/ig/images/weather/haze.gif", EWT.EWEATHER_TYPE_FOGGY);
    _google_tab[20] = new _google_tab_add("/ig/images/weather/flurries.gif", EWT.EWEATHER_TYPE_SNOW);
    _google_tab[21] = new _google_tab_add("", EWT.EWEATHER_TYPE_UNKNOWN);


    eweather.google.host = "www.google.com";
    eweather.google.server = null;

    eweather.google.add_handler =
        ecore_event_handler_add(ECORE_CON_EVENT_SERVER_ADD,
                _server_add, eweather);

    eweather.google.del_handler =
        ecore_event_handler_add(ECORE_CON_EVENT_SERVER_DEL,
                _server_del, eweather);
    eweather.google.data_handler =
        ecore_event_handler_add(ECORE_CON_EVENT_SERVER_DATA,
                _server_data, eweather);

    eweather.google.check_timer = ecore_timer_add(0, _weather_cb_check, eweather);
}

function google_shutdown(eweather)
{
    if (eweather.google.check_timer) ecore_timer_del(eweather.google.check_timer);
    if (eweather.google.add_handler) ecore_event_handler_del(eweather.google.add_handler);
    if (eweather.google.data_handler) ecore_event_handler_del(eweather.google.data_handler);
    if (eweather.google.del_handler) ecore_event_handler_del(eweather.google.del_handler);
    if (eweather.google.server) ecore_con_server_del(eweather.google.server);
}

function google_poll_time_updated(eweather)
{
    if(eweather.google.check_timer)
        ecore_timer_del(eweather.google.check_timer);

    eweather.google.check_timer =
        ecore_timer_add(0, _weather_cb_check, eweather);
}

function google_code_updated(eweather)
{
    if(eweather.google.check_timer)
        ecore_timer_del(eweather.google.check_timer);

    eweather.google.check_timer =
        ecore_timer_add(0, _weather_cb_check, eweather);
}

function _weather_cb_check(data)
{
    var eweather;

    if (!(eweather = data)) return 0;

    if (eweather.google.server) ecore_con_server_del(eweather.google.server);
    eweather.google.server = null;

    if (eweather.proxy.port && eweather.proxy.port != "")
        eweather.google.server =
            ecore_con_server_connect(ECORE_CON_REMOTE_SYSTEM, eweather.proxy.host,
                    eweather.proxy.port, eweather);
    else
        eweather.google.server =
            ecore_con_server_connect(ECORE_CON_REMOTE_SYSTEM, eweather.google.host, 80, eweather);

    if (!eweather.google.server) return 0;

    ecore_timer_interval_set(eweather.google.check_timer, eweather.poll_time);
    return 1;
}

function _server_add(data, type, event)
{
    var eweather;
    var ev;
    var buf;
    var s;
    var i;

    if (!(eweather = data)) return 1;
    if(!eweather.code) return 0;

    ev = event;
    if ((!eweather.google.server) || (eweather.google.server != ev.server))
        return 1;
    s = eweather.code;
    for(i=0; i<s.length; i++)
        if(s[i] == ' ')
            s[i] = '+';

    buf = "GET http://"+eweather.google.host+"/ig/api?weather="+s+"&hl=fr HTTP/1.1\r\nHost: "
        +eweather.google.host+"\r\n\r\n";

    ecore_con_server_send(eweather.google.server, buf);

    return 0;
}

function _server_del(data, type, event)
{
    var eweather;
    var ev;
    var ret;

    eweather = data;
    ev = event;

    if ((!eweather.google.server) || (eweather.google.server != ev.server)) return 1;

    ecore_con_server_del(eweather.google.server);
    eweather.google.server = null;

    ret = _parse(eweather);

    eweather.google.bufsize = 0;
    eweather.google.cursize = 0;

    eweather.google.buffer = "";
    return 0;
}

function _server_data(data, type, event)
{
    var eweather;
    var ev;

    eweather = data;
    ev = event;

    if ( !(eweather.google.server) || (eweather.google.server != ev.server))
        return 1;

    eweather.google.buffer = eweather.google.buffer + ev.data;
    eweather.google.cursize += ev.size;

    _parse(eweather);
    return 0;
}

function _parse(eweather)
{
    var needle;
    var location;
    var day;
    var date;
    var e_data = eweather_data_current_get(eweather);
    var e_data_current;
    var code;
    var pos;
    location = "";

    if (!eweather.google.buffer) return 0;

    //elx.print(eweather.google.buffer);
    
    needle = strstr(eweather.google.buffer, "<problem_cause data=\"");
    if (needle) {
      eweather_code_set(eweather, "Paris,France");
      return 0;
    }
    
    needle = strstr(eweather.google.buffer, "<city data=\"");
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

    for(var i=1; i<4; i++)
    {
        e_data = eweather_data_get(eweather, i);

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
    }

    eweather_plugin_update(eweather);
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

    return EWT.EWEATHER_TYPE_UNKNOWN;
}

