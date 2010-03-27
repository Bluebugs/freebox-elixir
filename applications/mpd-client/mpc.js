var handler_o = null;
var server_o = null;

function mpc_init(host, port)
{
  handler_o = {
   add: ecore_event_handler_add(ECORE_CON_EVENT_SERVER_ADD, on_srv_add, null),
   del: ecore_event_handler_add(ECORE_CON_EVENT_SERVER_DEL, on_srv_del, null),
   data: ecore_event_handler_add(ECORE_CON_EVENT_SERVER_DATA, on_srv_data, null)
  };
  server_o = ecore_con_server_connect(ECORE_CON_REMOTE_TCP, host, port, null);
  if (!server_o)
    elx.print("Unable to setup connexion.\n");
}


function mpc_shutdown()
{
  if (handler_o) {
    ecore_event_handler_del(handler_o.add);
    ecore_event_handler_del(handler_o.del);
    ecore_event_handler_del(handler_o.data);
  }
  handler_o = undefined;
}

function mpc_parse_song(lines)
{
  var title = null;
  var artist = null;
  for (var i = 0; i < lines.length; i++) {
    var result;
    if ((result = lines[i].match(/Title: (.*)/)) != null)
      title = result[1];
    if ((result = lines[i].match(/Artist: (.*)/)) != null)
      artist = result[1];
  }
  return {title: title, artist: artist};
}

function mpc_parse_playlist(lines)
{
  var file = null;
  var artist = null;
  var title = null;
  var pos = null;
  var songs = new Array;
  var j = 0;

  for (var i = 0; i < lines.length; i++) {
    var result;
    if ((result = lines[i].match(/file: (.*)$/)) != null)
      file = result[1];
    if ((result = lines[i].match(/Title: (.*)$/)) != null)
      title = result[1];
    if ((result = lines[i].match(/Artist: (.*)$/)) != null)
      artist = result[1];
    if ((result = lines[i].match(/Pos: (.*)$/)) != null)
      pos = result[1];
    if (pos) {
      if (!title || !artist)
        songs[j] = { pos: pos, title: file, artist: "" };
      else
        songs[j] = { pos: pos, title: title, artist: artist };
      file = null;
      title = null;
      artist = null;
      pos = null;
      j++;
    }
  }
  return songs;
}

function mpc_parse_search(lines)
{
  var file = null;
  var files = new Array;
  var j = 0;
  for (var i = 0; i < lines.length; i++) {
    var result;
    if ((result = lines[i].match(/file: (.*)$/)) != null) {
      file = result[1];
    }
    if (file) {
      files[j] = file;
      file = null;
      j++;
    }
  }
  return files;
}

function mpc_parse_status(lines)
{
  var state = null;
  var repeat_str = null;
  var repeat = false;
  var random_str = null;
  var random = false;
  for (var i = 0; i < lines.length; i++) {
    var result;
    if ((result = lines[i].match(/state: (.*)$/)) != null) {
      state = result[1];
    }
    if ((result = lines[i].match(/repeat: (.*)$/)) != null) {
      repeat_str = result[1];
      if (repeat_str == "1")
        repeat = true;
      else
        repeat = false;
    }
    if ((result = lines[i].match(/random: (.*)$/)) != null) {
      random_str = result[1];
      if (random_str == "1")
        random = true;
      else
        random = false;
    }
  }
  return { state: state, repeat: repeat, random: random };
}

function mpc_status(srv)
{
  if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "status\n");
  return true;
}

function mpc_currentsong(srv)
{
  if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "currentsong\n");
  return true;
}

function mpc_play(srv, pos)
{
  if (!srv) {
    return false;
  }
  if (pos >= 0)
    ecore_con_server_send(srv, "play " + pos + "\n");
  else
    ecore_con_server_send(srv, "play\n");
  return true;
}

function mpc_pause(srv)
{
  if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "pause\n");
  return true;
}

function mpc_prev(srv)
{
  if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "previous\n");
  return true;
}

function mpc_next(srv)
{
  if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "next\n");
  return true;
}

function mpc_stop(srv)
{
  if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "stop\n");
  return true;
}

function mpc_volplus(srv)
{
  if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "volume +10\n");
  return true;
}

function mpc_volminus(srv)
{
  if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "volume -10\n");
  return true;
}

function mpc_playlist(srv)
{
  if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "playlistinfo\n");
  return true;
}

function mpc_add(srv, uri)
{
  if (!srv) {
    return false;
  }
  uri = "\"" + uri + "\"";
  ecore_con_server_send(srv, "add " + uri + "\n");
  return true;
}

function mpc_del(srv, pos)
{
    if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "delete " + pos + "\n");
  return true;
}

function mpc_repeat(srv)
{
    if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "repeat 1\n");
  return true;
}

function mpc_once(srv)
{
    if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "repeat 0\n");
  return true;
}

/* random playback */
function mpc_random(srv)
{
    if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "random 1\n");
  return true;
}

function mpc_linear(srv)
{
    if (!srv) {
    return false;
  }
  ecore_con_server_send(srv, "random 0\n");
  return true;
}

/* search file in db */
function mpc_search(srv, what)
{
    if (!srv) {
    return 1;
  }
  ecore_con_server_send(srv, "search any " + what + "\n");
  return 0;
}

true;
