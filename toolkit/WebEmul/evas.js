const EVAS_CALLBACK_KEY_UP = 1;

function evas_image_cache_set() {
  if (VERBOSE) elx.print("evas_image_cache_set()\n");
}

function evas_font_path_prepend() {
  if (VERBOSE) elx.print("evas_font_path_prepend()\n");
}

function evas_font_cache_set() {
  if (VERBOSE) elx.print("evas_font_path_prepend()\n");
}

function evas_object_rectangle_add() {
  if (VERBOSE) elx.print("evas_object_rectangle_add()\n");
  var obj = document.createElement('DIV');
  obj.style.position = 'absolute';
  obj.style.display = 'none';
  document.getElementById('freebox').appendChild(obj);
  return obj;
}

function evas_object_move(obj, x, y) {
  obj.style.left = x + 'px';
  obj.style.top = y + 'px';
  if (VERBOSE) elx.print("evas_object_move()\n");
}

function evas_object_resize(obj, width, height) {
  obj.style.width = width + 'px';
  obj.style.height = height + 'px';
  if (VERBOSE) elx.print("evas_object_resize()\n");
}

function evas_object_color_set(obj, r, g, b, a) {
  obj.style.backgroundColor = '#' + hexa(r) + hexa(g) + hexa(b);
  if (a < 255)
    obj.style.opacity = a / 255;
  else
    obj.style.opacity = 1;
  if (VERBOSE) elx.print("evas_object_color_set()\n");
}

function evas_object_show(obj) {
  obj.style.display = 'block';
  if (VERBOSE) elx.print("evas_object_show()\n");
}

function evas_object_focus_set() {
  if (VERBOSE) elx.print("evas_object_focus_set()\n");
}

function evas_object_event_callback_add() {
  if (VERBOSE) elx.print("evas_object_focus_set()\n");
}