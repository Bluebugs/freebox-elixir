function repeat_catcher(Object, Key_Down_Cb, Key_Repeat_Cb, Key_Up_Cb, Data)
{
   function key_up_handler(data, e, obj, event)
   {
      data.timestamp = event.timestamp;

      data.call(data.up_cb, data.data, e, obj, event);
   }

   function key_down_handler(data, e, obj, event)
   {
      if (data.timestamp == event.timestamp)
        data.call(data.repeat_cb, data.data, e, obj, event);
      else
        data.call(data.down_cb, data.data, e, obj, event);
   }

   function call_handler(cb, data, e, obj, event)
   {
      if (cb === undefined) return ;
      if (cb == null) return ;
      cb(data, e, obj, event);
   }

   var tmp = { Data : Data,
               up_cb: Key_Up_Cb,
               down_cb: Key_Down_Cb,
               repeat_cb: Key_Repeat_Cb,
               timestamp: 0,
               call: call_handler };

   evas_object_event_callback_add(Object,
                                  EVAS_CALLBACK_KEY_UP,
                                  key_up_handler, tmp);
   evas_object_event_callback_add(Object,
                                  EVAS_CALLBACK_KEY_DOWN,
                                  key_down_handler, tmp);
}

true;
