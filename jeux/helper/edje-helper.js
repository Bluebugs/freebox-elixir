function exit_key_down(data, e, obj, event)
{
   switch (event.keyname) {
   case "KP8":
   case "Up":
   case "FP/Up":
   case "RC/Up":
   case "RCL/Up":
   case "GP/Up":
      edje_object_signal_emit(data.msg, "helper,up", "");
      break;
   case "KP2":
   case "Down":
   case "FP/Down":
   case "RC/Down":
   case "RCL/Down":
   case "GP/Down":
      edje_object_signal_emit(data.msg, "helper,down", "");
      break;
   case "Home":
   case "equal":
   case "Escape":
   case "a":
   case "Green":
   case "Stop":
   case "Start":
      edje_object_message_send(data.msg, EDJE_MESSAGE_INT, 2, 0);
      break;
   case "Return":
   case "KP_Enter":
   case "FP/Ok":
   case "RC/Ok":
   case "Select":
      edje_object_message_send(data.msg, EDJE_MESSAGE_INT, 1, 0);
      break;
    case "Red":
    case "b":
      edje_object_message_send(data.msg, EDJE_MESSAGE_INT, 3, 0);
      break;
   }
}

function edje_timer_input(data)
{
   evas_object_event_callback_add(data.rect, EVAS_CALLBACK_KEY_DOWN, exit_key_down, data);
   evas_object_focus_set(data.rect, 1);

   return 0;
}

function edje_timer_reset(data)
{
   evas_object_focus_set(data.eo, 1);
   data.cb(data.edje_exit_end);

   return 0;
}

var active = false;
function exit_message_cb(data, obj, type, id, msg)
{
   var edje_exit_end = msg ? true : false;

   if (active)
       {
	   evas_object_event_callback_del(data.rect, EVAS_CALLBACK_KEY_DOWN, exit_key_down, data);

	   evas_object_del(data.rect);
	   evas_object_del(data.msg);

	   data.edje_exit_end = edje_exit_end;

	   ecore_timer_add(0.3, edje_timer_reset, data);
       }
   active = false;
}
function exit_job_build(data)
{
   evas_object_focus_set(data.eo, 0);

   edje_freeze();

   o = edje_object_add(evas);
   edje_object_file_set(o, "edje-helper.edj", "out");
   edje_object_message_handler_set(o, exit_message_cb, data);
   evas_object_layer_set(o, 1000);
   evas_object_move(o, 0, 0);
   evas_object_resize(o, 720, 576);
   evas_object_show(o);
   data.msg = o;

   o = evas_object_rectangle_add(evas);
   evas_object_move(o, 0, 0);
   evas_object_resize(o, 720, 576);
   evas_object_color_set(o, 0, 0, 0, 0);
   evas_object_show(o);
   data.rect = o;

   active = true;

   edje_thaw();

   ecore_timer_add(0.3, edje_timer_input, data);
}

function edje_exit(evas, obj, callback)
{
   var pobj;

   pobj = new Object();
   pobj.eo = obj;
   pobj.cb = callback;

   ecore_job_add(exit_job_build, null, pobj);
}

true;
