
elx.include("EWeather.edj", "LIBEWeather")

var E_OBJ_NAME = "eweather_object"
var smart = null;

//
var EWM =
{
    EWEATHER_OBJECT_MODE_FULLSCREEN : 0,
    EWEATHER_OBJECT_MODE_EXPOSE : 1,
}
//


//
_tab = new Array(17);

function _tab_add(type, signal) {
    this.type = type;
    this.signal = signal;
}

function eweather_object_signal_type_get(type)
{
    for (var i = 0; i < _tab.length; ++i)
        if (_tab[i].type == type)
        {
            return _tab[i].signal;
        }

    return "";
}
//



function eweather_object_add(evas)
{
    _tab[0] = new _tab_add(EWT.EWEATHER_TYPE_UNKNOWN, "unknown");
    _tab[1] = new _tab_add(EWT.EWEATHER_TYPE_WINDY, "right,day_clear,sun,isolated_cloud,windy");
    _tab[2] = new _tab_add(EWT.EWEATHER_TYPE_RAIN, "right,day_rain,sun,rain,rain");
    _tab[3] = new _tab_add(EWT.EWEATHER_TYPE_SNOW, "right,day_rain,sun,rain,snow");
    _tab[4] = new _tab_add(EWT.EWEATHER_TYPE_RAIN_SNOW, "right,day_rain,sun,rain,rain_snow");
    _tab[5] = new _tab_add(EWT.EWEATHER_TYPE_FOGGY, "right,day_rain,sun,cloud,foggy");
    _tab[6] = new _tab_add(EWT.EWEATHER_TYPE_CLOUDY, "right,day_clear,sun,cloud,");
    _tab[7] = new _tab_add(EWT.EWEATHER_TYPE_MOSTLY_CLOUDY_NIGHT, "right,night_clear,moon,cloud,");
    _tab[8] = new _tab_add(EWT.EWEATHER_TYPE_MOSTLY_CLOUDY_DAY, "right,day_clear,sun,cloud,");
    _tab[9] = new _tab_add(EWT.EWEATHER_TYPE_PARTLY_CLOUDY_NIGHT, "right,night_clear,moon,isolated_cloud,");
    _tab[10] = new _tab_add(EWT.EWEATHER_TYPE_PARTLY_CLOUDY_DAY, "right,day_clear,sun,isolated_cloud,");
    _tab[11] = new _tab_add(EWT.EWEATHER_TYPE_CLEAR_NIGHT, "right,night_clear,moon,nothing,");
    _tab[12] = new _tab_add(EWT.EWEATHER_TYPE_SUNNY, "right,day_clear,sun,nothing,");
    _tab[13] = new _tab_add(EWT.EWEATHER_TYPE_ISOLATED_THUNDERSTORMS, "right,day_heavyrain,sun,isolated_tstorm,rain");
    _tab[14] = new _tab_add(EWT.EWEATHER_TYPE_THUNDERSTORMS, "right,day_heavyrain,sun,tstorm,rain");
    _tab[15] = new _tab_add(EWT.EWEATHER_TYPE_SCATTERED_THUNDERSTORMS, "right,day_heavyrain,sun,tstorm,rain");
    _tab[16] = new _tab_add(EWT.EWEATHER_TYPE_HEAVY_SNOW, "right,day_heavyrain,sun,storm,snow");

    _smart_init();
    return evas_object_smart_add(evas, smart);
}


function eweather_object_eweather_get(obj)
{
    return obj.data.eweather;
}


function eweather_object_mode_set(obj, mode)
{
    var sd = obj.data;
    if(!sd) return ;

    if(mode == sd.mode) return;

    sd.mode = mode;
    if(sd.mode == EWM.EWEATHER_OBJECT_MODE_FULLSCREEN)
        edje_object_signal_emit(sd.obj, "fullscreen", "");
    else
    {
        edje_object_signal_emit(sd.obj, "expose", "");

        for (var i = 0; i < sd.objs.length; ++i)
        {
            evas_object_show(sd.objs[i]);
        }
    }

    _sizing_eval(obj);
}

function eweather_object_ready_callback_add(obj, done_cb, data)
{
   var sd = obj.data;

   if (!sd) return ;

   if (sd.preload) done_cb(obj, data);
   else sd.done_cbs.push({ cb: done_cb, data: data } );
}

function _fullscreen_done_cb(data, _obj, emission, source)
{
    var obj = data;
    var sd = obj.data;
    if (!sd) return;

    for (var i = 0; i < sd.objs.length; ++i)
    {
        evas_object_hide(sd.objs[i]);
    }
}

function _loaded_cb(data, _obj, emission, source)
{
    var obj = data;
    var sd = obj.data;

    if (!sd) return;

    eweather_object_ready_callback_add(obj,
				       function (obj, sd) {
					  eweather_object_mode_set(obj, EWM.EWEATHER_OBJECT_MODE_FULLSCREEN);
					  eweather_start(sd.eweather);
				       },
				       sd);
}

function _preload_done_cb(sd, obj, emission, source)
{
   sd.preload = true;

   for (var i in sd.done_cbs)
     sd.done_cbs[i].cb(sd.smart, sd.done_cbs[i].data);
   sd.done_cbs = [];

   edje_object_signal_callback_del(sd.main, "preload,done", "", _preload_done_cb);
}

function _msg_cb(sd, obj, emission, source)
{
   elx.print(emission, ", ", source, "\n");
}

function _key_down_cb(data, evas, o_day, event)
{
   var obj = data;
   var sd = obj.data;

   if (event.timestamp == sd.timestamp) return ;

   switch (event.keyname)
     {
      case "Left":
      case "FP/Left":
      case "RC/Left":
	 if (sd.current_day > 0)
	   {
	      sd.current_day--;
	      update_main(obj);
	   }
	 break;
      case "Right":
      case "FP/Right":
      case "RC/Right":
	 if (sd.current_day < sd.objs.length - 1)
	   {
	      sd.current_day++;
	      update_main(obj);
	   }
	 break;
     }
}

function _key_up_cb(data, evas, o_day, event)
{
    var obj = data;
    var sd = obj.data;

    sd.timestamp = event.timestamp;

    switch (event.keyname)
      {
       case "b":
       case "Red":
       case "equal":
       case "Stop":
       case "Home":
       case "Escape":
       case "Start":
	  ecore_main_loop_quit();
	  break;
      }
}


function _mouse_up_cb(data, evas, o_day, _event)
{
    var obj = data;
    var ev = _event;
    var o = null;
    var sd = obj.data;
    var i;
    if (!sd) return;

    if(ev.button != 1) return ;

    sd.thumbscroll.moved = true;
    if(sd.thumbscroll.is)
    {
        sd.thumbscroll.is = false;
        return ;
    }

    for (i = 0; i < sd.objs.length; ++i)
    {
        if(sd.objs[i] == o_day)
        {
            o = sd.objs[i];
            break;
        }
    }

    if(o && sd.mode == EWM.EWEATHER_OBJECT_MODE_EXPOSE)
    {
        sd.current_day = i;
        update_main(obj);
    }

    if(o && sd.mode == EWM.EWEATHER_OBJECT_MODE_EXPOSE)
    {
        eweather_object_mode_set(obj, EWM.EWEATHER_OBJECT_MODE_FULLSCREEN);
    }
    else
    {
        eweather_object_mode_set(obj, EWM.EWEATHER_OBJECT_MODE_EXPOSE);
    }
}


function _mouse_down_cb(data, evas, o_day, _event)
{
    var obj = data;
    var ev = _event;
    var sd = obj.data;
    if (!sd) return;

    if(ev.button != 1) return ;

    sd.thumbscroll.moved = false;

    sd.thumbscroll.x = ev.canvas.x;
    sd.thumbscroll.y = ev.canvas.y;
}


function _mouse_move_cb(data, evas, o_day, _event)
{
    var obj = data;
    var ev = _event;
    var x, y;

    var sd = obj.data;
    if (!sd) return;

    if(sd.thumbscroll.moved)
        return ;

    sd.thumbscroll.is = true;

    x = ev.cur.canvas.x;
    y = ev.cur.canvas.y;

    if(x - sd.thumbscroll.x > 60)
    {
        if(sd.current_day > 0)
        {
            sd.current_day--;
            update_main(obj);
        }
        sd.thumbscroll.moved = true;
    }
    else if(x - sd.thumbscroll.x < -60)
    {
        if(sd.current_day < sd.objs.length - 1)
        {
            sd.current_day++;
            update_main(obj);
        }
        sd.thumbscroll.moved = true;
    }
}

function _eweather_update_cb(data, eweather)
{
    var obj = data;
    var sd;
    var signal;
    var buf;
    var o_day;

    sd = obj.data;
    if (!sd) return;

    if(sd.current_day >= eweather_data_count(sd.eweather))
        sd.current_day = -1;

    for(i=0; i < eweather_data_count(sd.eweather); i++)
    {
        var e_data = eweather_data_get(sd.eweather, i);

        if(sd.current_day<0)
            sd.current_day = i;

        if(i >= sd.objs.length)
        {
            o_day = edje_object_add(evas_object_evas_get(obj));
            edje_object_file_set(o_day, "EWeather.edj", "weather");
            evas_object_smart_member_add(o_day, obj);
            evas_object_show(o_day);
            sd.objs.push(o_day);

            evas_object_event_callback_add(o_day, EVAS_CALLBACK_MOUSE_UP,
                    _mouse_up_cb, obj);

            content = edje_object_part_object_get(sd.obj, "object.content");
            evas_object_clip_set(o_day, content);

            if(sd.mode == EWM.EWEATHER_OBJECT_MODE_FULLSCREEN)
                evas_object_hide(o_day);
        }

        o_day = sd.objs[i];

        signal = eweather_object_signal_type_get(eweather_data_type_get(e_data));

	ecore_idler_add(animation_idler_cb, { obj: o_day, signal: signal });
        edje_object_signal_emit(o_day, signal, "");

        if(eweather_temp_type_get(eweather) == EWTEMP.EWEATHER_TEMP_FARENHEIT)
            buf = eweather_data_temp_get(e_data) + "°F";
        else
            buf =  eweather_utils_celcius_get(eweather_data_temp_get(e_data)) + "°C";

        edje_object_part_text_set(o_day, "text.temp", buf);

        if(eweather_temp_type_get(eweather) == EWTEMP.EWEATHER_TEMP_FARENHEIT)
            buf = eweather_data_temp_min_get(e_data) + "°F";
        else
            buf = eweather_utils_celcius_get(eweather_data_temp_min_get(e_data)) + "°C";

        edje_object_part_text_set(o_day, "text.temp_min", buf);

        if(eweather_temp_type_get(eweather) == EWTEMP.EWEATHER_TEMP_FARENHEIT)
            buf = eweather_data_temp_max_get(e_data) + "°F";
        else
            buf = eweather_utils_celcius_get(eweather_data_temp_max_get(e_data)) + "°C";

        edje_object_part_text_set(o_day, "text.temp_max", buf);

        edje_object_part_text_set(o_day, "text.city", eweather_data_city_get(e_data));
        edje_object_part_text_set(o_day, "text.date", eweather_data_date_get(e_data));
    }

    //useless if we use only one provider (google here)
    /*
       while(eina_list_count(sd->objs) > eweather_data_count(sd->eweather))
       {
       Evas_Object *o = eina_list_data_get(eina_list_last(sd->objs));
       sd->objs = eina_list_remove(sd->objs, o);
       evas_object_del(o);
       }
       */

    update_main(obj);
    _sizing_eval(obj);
}

function animation_idler_cb(data)
{
   elx.print("signal : ", data.signal, "\n");
   edje_object_signal_emit(data.obj, data.signal, "");

   return 0;
}

function update_main(obj)
{
    var sd;
    var signal;
    var buf;
    var eweather;

    sd = obj.data;
    if (!sd) return;

    if(sd.current_day < 0) return ;

    eweather = sd.eweather;

    evas_object_show(sd.main);
    edje_object_part_swallow(sd.obj, "object.swallow", sd.main);

    var e_data = eweather_data_get(eweather, sd.current_day);

    signal = eweather_object_signal_type_get(eweather_data_type_get(e_data));

    ecore_idler_add(animation_idler_cb, { obj: sd.main, signal: signal });

    if(eweather_temp_type_get(eweather) == EWTEMP.EWEATHER_TEMP_FARENHEIT)
        buf = eweather_data_temp_get(e_data) + "°F";
    else
        buf =  eweather_utils_celcius_get(eweather_data_temp_get(e_data)) + "°C";

    edje_object_part_text_set(sd.main, "text.temp", buf);

    if(eweather_temp_type_get(eweather) == EWTEMP.EWEATHER_TEMP_FARENHEIT)
        buf = eweather_data_temp_min_get(e_data) + "°F";
    else
        buf = eweather_utils_celcius_get(eweather_data_temp_min_get(e_data)) + "°C";

    edje_object_part_text_set(sd.main, "text.temp_min", buf);

    if(eweather_temp_type_get(eweather) == EWTEMP.EWEATHER_TEMP_FARENHEIT)
        buf = eweather_data_temp_max_get(e_data) + "°F";
    else
        buf = eweather_utils_celcius_get(eweather_data_temp_max_get(e_data)) + "°C";

    edje_object_part_text_set(sd.main, "text.temp_max", buf);

    edje_object_part_text_set(sd.main, "text.city", eweather_data_city_get(e_data));
    edje_object_part_text_set(sd.main, "text.date", eweather_data_date_get(e_data));
}

function _sizing_eval(obj)
{
    var sd;
    var i, j, l;
    var x, y, w, h;
    var col,line;
    var w_inter, h_inter;
    var w_size, h_size;
    var content;
    var wmin, hmin;
    var ratiow, ratioh, ratio;
    var geom = {};

    sd = obj.data;
    if (!sd) return;

    if(sd.objs.length <= 0) return ;

    content = edje_object_part_object_get(sd.obj, "object.content");
    geom = evas_object_geometry_get(content);
    x = geom.x;
    y = geom.y;
    w = geom.w;
    h = geom.h;

    geom = edje_object_size_min_get(sd.objs[0]);

    wmin = geom.w;
    hmin = geom.h;

    var rac = Math.sqrt(sd.objs.length);
    col = rac;
    if(rac > col) col++;

    line = sd.objs.length / col;
    if(sd.objs.length % col) line++;

    w_size = 0;
    h_size = 0;
    if(col > 0)
        w_size = (w-(col-1)*5)/col;
    if(line > 0)
        h_size = (h-(line-1)*5)/line;

    ratiow = w_size / wmin;
    ratioh = h_size / hmin;
    ratio = ratiow;
    if(ratiow>ratioh) ratio = ratioh;

    w_size = wmin * ratio;
    h_size = hmin * ratio;


    if(col > 0)
        w_inter = (w - w_size*col) / (col+1);
    if(line > 0)
        h_inter = (h - h_size*line) / (line+1);

    x+=w_inter;
    y+=h_inter;

    l = 0;
    for(j=0; j<line; j++)
    {
        for(i=0; i<col && i*j<sd.objs.length; i++)
        {
            var o = sd.objs[l];
            l++;

            evas_object_move(o, x + i*(w_size + w_inter), y + j*(h_size + h_inter));
            evas_object_resize(o, w_size, h_size);

            edje_object_scale_set(o, ratio);
        }
    }

    //main object
    geom = evas_object_geometry_get(sd.main);
    w_size = geom.w;
    h_size = geom.h;

    ratiow = w_size / wmin;
    ratioh = h_size / hmin;

    ratio = ratiow;
    if(ratiow>ratioh) ratio = ratioh;
    edje_object_scale_set(sd.main, ratio);
}


function _smart_init()
{
    var sc =
    {
        name: "name",
      version: 4,
      add: _smart_add,
      del: _smart_del,
      move: _smart_move,
      resize: _smart_resize,
      show: _smart_show,
      hide: _smart_hide,
      color_set: _smart_color_set,
      clip_set: _smart_clip_set,
      clip_unset: _smart_clip_unset,
      calculate: _smart_calculate,
      member_add: _smart_member_add,
      member_del: _smart_member_del,
      data: null
    };
    smart = evas_smart_class_new(sc);
}

function _smart_add(obj)
{
    var sd = {};
    sd.thumbscroll = {};
    sd.objs = new Array(0);
    var o;

    obj.data = sd;
    sd.mode = EWM.EWEATHER_OBJECT_MODE_EXPOSE;
    sd.thumbscroll.moved = true;
    sd.current_day = 0;

    var evas = evas_object_evas_get(obj);
    sd.obj = edje_object_add(evas);
    edje_object_file_set(sd.obj, "EWeather.edj", "main");
    evas_object_smart_member_add(sd.obj, obj);
    sd.main = edje_object_add(evas_object_evas_get(obj));

    sd.done_cbs = [];
    sd.preloaded = false;
    sd.smart = obj;

    edje_object_signal_callback_add(sd.main, "preload,done", "", _preload_done_cb, sd);

    edje_object_file_set(sd.main, "EWeather.edj", "weather");
    edje_object_preload(sd.main, false);

    evas_object_smart_member_add(sd.main, obj);
    sd.eweather = eweather_new();
    evas_object_focus_set(sd.main, 1);

    eweather_callbacks_set(sd.eweather, _eweather_update_cb, obj);

    evas_object_event_callback_add(sd.main, EVAS_CALLBACK_MOUSE_UP,
            _mouse_up_cb, obj);
    evas_object_event_callback_add(sd.main, EVAS_CALLBACK_MOUSE_DOWN,
            _mouse_down_cb, obj);
    evas_object_event_callback_add(sd.main, EVAS_CALLBACK_MOUSE_MOVE,
            _mouse_move_cb, obj);
    evas_object_event_callback_add(sd.main, EVAS_CALLBACK_KEY_UP,
            _key_up_cb, obj);
    evas_object_event_callback_add(sd.main, EVAS_CALLBACK_KEY_DOWN,
            _key_down_cb, obj);

    edje_object_signal_callback_add(sd.obj, "fullscreen,done", "", _fullscreen_done_cb, obj);

    edje_object_signal_callback_add(sd.obj, "loaded", "", _loaded_cb, obj);

    edje_object_part_text_set(sd.main, "text.temp", "? °C");
    edje_object_part_text_set(sd.main, "text.temp_min", "? °C");
    edje_object_part_text_set(sd.main, "text.temp_max", "? °C");
    edje_object_part_text_set(sd.main, "text.city", "Unknown");
    edje_object_part_text_set(sd.main, "text.date", "Unknown");

    sd.timestamp = 0;
}


function _smart_del(obj)
{
    var sd;
    var o;

    sd = obj.data;
    if (!sd) return;
    eweather_free(sd.eweather);


    for (var i = 0; i < sd.objs; ++i)
        evas_object_del(o);
    evas_object_del(sd.obj);
    evas_object_del(sd.main);

    //free(sd);
}

function _smart_move(obj, x, y)
{
    var sd;
    sd = obj.data;
    if (!sd) return;
    evas_object_move(sd.obj, x, y);
    _sizing_eval(obj);
}

function _smart_resize(obj, w, h)
{
    var sd;

    sd = obj.data;
    if (!sd) return;
    evas_object_resize(sd.obj, w, h);
    _sizing_eval(obj);
}

function _smart_show(obj)
{
    var sd;

    sd = obj.data;
    if (!sd) return;
    evas_object_show(sd.obj);
}

function _smart_hide(obj)
{
    var sd;

    sd = obj.data;
    if (!sd) return;
    evas_object_hide(sd.obj);
}

function _smart_clip_set(obj, clip)
{
    var sd;

    sd = obj.data;
    if (!sd) return;
    evas_object_clip_set(sd.obj, clip);
}

function _smart_clip_unset(obj)
{
    var sd;

    sd = obj.data;
    if (!sd) return;
    evas_object_clip_unset(sd.obj);
}

function _smart_color_set(obj)
{
    ;
}

function _smart_calculate(obj)
{
    ;
}

function _smart_member_add(obj, obj2)
{
    ;
}

function _smart_member_del(obj, obj2)
{
    ;
}

