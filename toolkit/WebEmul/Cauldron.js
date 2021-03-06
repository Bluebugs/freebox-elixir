/**
 *  Cauldron  (Elixir facile), (c)2010 Paul TOTH, tothpaul@free.fr
 *  A l'occasion des elixir's dev days du 30 janvier 2010
 */
 
const Cauldron = '0.1.1';

elx.print("Rock n Roll " + elx.version() + "\n");

/**
 *  initialisation de l'objet global Screen
 */
function TScreen() {
  elx.load("evas");
  elx.load("ecore");
  elx.load("ecore-evas");
  ecore_init();
  ecore_evas_init();
  this.handle = ecore_evas_new(null, 0, 0, this.width, this.height, '');
  this.canvas = ecore_evas_get(this.handle);
  evas_image_cache_set(this.canvas, 10 * 1024 * 1024);
  evas_font_path_prepend(this.canvas, '/.fonts/');
  evas_font_cache_set(this.canvas, 512 * 1024);
  ecore_evas_show(this.handle);
}

TScreen.prototype = {
  width : 720,
  height: 576,
  main  : function() {
    if (this.onKeyup) {
      evas_object_event_callback_add(
        this.background.handle, EVAS_CALLBACK_KEY_UP,
        function(self, e, obj, event){
          self.onKeyup(event);
        },
        this
      )
    }
    ecore_main_loop_begin();
  },
  addEventHandler : function(event, callback) {
    evas_object_event_callback_add(this.background.handle, event, callback, null);
  },
  quit : function() {
    ecore_main_loop_quit();
  }
}

/**
 * prototype des objets evas
 */
function TEvasObject() {
}

TEvasObject.prototype = {
  init : function(handle, x, y, w, h, color, alpha) {
    this.handle = handle;
    this.move(x, y);
    this.width = w;
    this.height = h;
    evas_object_resize(this.handle, w, h);
    this.setColor(color, alpha);
    this.setVisibility(true);
  },
  setColor : function(rgb, alpha) {
    var r = (rgb >> 16) & 255;
    var g = (rgb >> 8) & 255;
    var b =  rgb & 255;
    var a = alpha || 255;
    evas_object_color_set(this.handle, r, g, b, a);
  },
  move : function(x, y) {
    this.x = x;
    this.y = y;
    evas_object_move(this.handle, x, y);
  },
  setVisibility : function(visible) {
    if (visible)  {
      evas_object_show(this.handle);
    } else {
      evas_object_hide(this.handle);
    }
  }
}

/**
 *  Cr�ation d'un rectangle
 *
 *  @param  x, y : position
 *  @param  w, h : dimensions
 *  @param  r, g, b, a : couleur
 */
function TRectangle(x, y, w, h, color, alpha) {
  this.init(evas_object_rectangle_add(Screen.canvas), x, y, w, h, color, alpha);
}
TRectangle.prototype = new TEvasObject;

function TText(text, x, y, w, h, color, alpha) {
  this.init(evas_object_text_add(Screen.canvas), x, y, w, h, color, alpha);
  evas_object_text_text_set(this.handle, text);
  evas_object_text_font_set(this.handle, 'Vera', 22);
}
TText.prototype = new TEvasObject;

function TTextBlock(x, y, w, h, color, alpha) {
  this.init(evas_object_textblock_add(Screen.canvas), x, y, w, h, color, alpha);
}
TTextBlock.prototype = new TEvasObject;

/**
 * Cr�ation d'un animateur
 *
 */
function TAnimator() {
  this.status = 0;
}
TAnimator.prototype = {
  start : function() {
    if (this.status == 0) {
      this.status = 1;
      this.handle = ecore_animator_add(this.handler, this);
    }
  },
  stop : function() {
    if (this.status == 1) {
      ecore_animator_del(this.handle);
      this.status = 0;
      this.handle = 0;
    }
  },
  handler : function(self) {
    if (self.onChange) self.onChange();
    return self.status;
  },
  setSpeed : function(rate) {
    ecore_animator_frametime_set(rate);
  }
}

/**
 *  Lancement d'un mixer
 *
 */
function TMixer(file, rate, flags, channel, bufferSize) {
  if (!Screen.mixer)
    Screen.mixer = elx.load('mix');
  Mix_OpenAudio(rate, flags, channel, bufferSize);
  this.handle = Mix_LoadWAV(file);
  Mix_PlayChannel(-1, this.handle, -1)
}

/**
 * Centralisation des �v�nements serveur
 */
function TServerHandler() {
  elx.load('ecore-con');
  ecore_con_init();
  this.servers = new Array();
  this.add  = ecore_event_handler_add(ECORE_CON_EVENT_SERVER_ADD, this.handler, this);
  this.del  = ecore_event_handler_add(ECORE_CON_EVENT_SERVER_DEL, this.handler, this);
  this.data = ecore_event_handler_add(ECORE_CON_EVENT_SERVER_DATA, this.handler, this);
}

TServerHandler.prototype = {
  findServer : function(handle) {
    for (var i = 0; i < this.servers.length; i++) {
      if (this.servers[i].handle == handle) {
        return this.servers[i];
      }
    }
    return false;
  },
  handler : function(self, type, event) {
    var server = self.findServer(event.server);
    if (!server) return 1;
    switch (type) {
      case ECORE_CON_EVENT_SERVER_ADD :
        if (server.onConnect) server.onConnect(event);
      break;
      case ECORE_CON_EVENT_SERVER_DEL :
        if (server.onDisconnect) server.onDisconnect(event);
        server.close();
      break;
      case ECORE_CON_EVENT_SERVER_DATA:
        if (server.onData) server.onData(event);
      break;
    }
    return 0;
  }
}
/**
 *  Creation d'une connexion
 */
function TClientSocket() {
  if (!Screen.server_handler)
    Screen.server_handler = new TServerHandler();
}
TClientSocket.prototype = {
  send : function(data) {
    ecore_con_server_send(this.handle, data);
  },
  connect : function(proto, host, port) {
    this.handle = ecore_con_server_connect(proto, host, port, Screen.server_handler)
    Screen.server_handler.servers.push(this);
  },
  close : function() {
    var index = Screen.server_handler.servers.indexOf(this);
    Screen.server_handler.servers.splice(index, 1);
  }
}

var Screen = new TScreen();
Screen.background = new TRectangle(0, 0, Screen.width, Screen.height);
evas_object_focus_set(Screen.background.handle, 1);
