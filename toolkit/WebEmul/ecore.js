var ecore_rate = 1/30;
var ecore_animators = new Array();

function ecore_init() {
  if (VERBOSE) elx.print("ecore_init()\n");
}

function ecore_main_loop_begin() {
  if (VERBOSE) elx.print("ecore_evas_show()\n");
}

function ecore_animator_frametime_set(rate) {
  if (VERBOSE) elx.print("ecore_animator_frametime_set()\n");
  ecore_rate = rate;
}

function ecore_animator_add(callback, data) {
  if (VERBOSE) elx.print("ecore_animator_add()\n");
  var timer = new Object();
  timer.callback = callback;
  timer.data = data;
  ecore_animators.push(timer);
  setTimeout('ecore_anim()', 1000 * ecore_rate);
}

function ecore_anim() {
  for (var i = 0; i < ecore_animators.length; i++)
  {
    var timer = ecore_animators[i];
    timer.callback(timer.data);
  }
  setTimeout('ecore_anim()', 1000 * ecore_rate);
}