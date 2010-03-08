/**
 *  Cauldron  (Elixir facile), (c)2010 Paul TOTH, tothpaul@free.fr
 *  A l'occasion des elixir's dev days du 30 janvier 2010 
 */
 
const Cauldron = '0.1.2';
 
elx.print("Rock n Roll " + elx.version() + "\n");

function dump(obj) {
  elx.print("dump of " + obj + "\n");
  for (prop in obj)
    elx.print(prop + " = " + obj[prop] + "\n");
}

/**
 *  initialisation de l'objet global Screen
 */ 
function TScreen() {
  elx.load("evas");
  elx.load("ecore");
  elx.load("ecore-evas");
  ecore_init();
  ecore_evas_init();
  this.handle = ecore_evas_new(null, 0, 0, this.width, this.height, 'Cauldron');  
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
    if (this.onKeydown) {
      evas_object_event_callback_add(
        this.background.handle, EVAS_CALLBACK_KEY_DOWN, 
        function(self, e, obj, event){
          self.onKeydown(event);
        }, 
        this
      )
    }
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
  init : function(handle, x, y, color, alpha) {
    this.handle = handle;
    this.move(x, y);
    this.setColor(color, alpha);
    this.setVisibility(true);  
  },
  setSize : function(width, height) {
    this.width = width;
    this.height = height;
    evas_object_resize(this.handle, width, height);
  },
  setColor : function(rgb, alpha) {
    var r = (rgb >> 16) & 255;
    var g = (rgb >> 8) & 255;
    var b =  rgb & 255;
    var a = alpha || 255;
    evas_object_color_set(this.handle, r, g, b, a);   
  },
  setDepth : function(index) {
    evas_object_layer_set(this.handle, index);
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
  },
  clipTo : function(target) {
    evas_object_clip_set(this.handle, target.handle);
  },
  release : function() {
    evas_object_del(this.handle);
  }
}

/**
 *  Création d'un rectangle
 *
 *  @param  x, y  : position
 *  @param  w, h  : dimensions
 *  @param  color : couleur
 *  @param  alpha : transparence
 */
function TRectangle(x, y, w, h, color, alpha) {
  this.init(evas_object_rectangle_add(screen.canvas), x, y, color, alpha);
  this.setSize(w, h);
}
TRectangle.prototype = new TEvasObject;


/**
 * Chargement d'une image depuis un eet ou directement un fichier
 *
 *@param  x, y : position
 *@param  file : eet ou fichier image
 *@param  key  : clé du fichier eet
 */
function TImage(x, y, file, key) {
  this.init(evas_object_image_add(screen.canvas), x, y, 0xFFFFFF);
  if (file) this.load(file, key);
}
TImage.prototype = new TEvasObject;
TImage.prototype.load = function(file, key) {
  evas_object_image_file_set(this.handle, file, key || null);
  var size = evas_object_image_size_get(this.handle);
  this.setSize(size.w, size.h);
  this.stretch(0, 0, size.w, size.h);
}
TImage.prototype.stretch = function(x, y, width, height) {
  evas_object_image_fill_set(this.handle, x, y, width, height);
}

/**
 *  Création d'un texte simple
 *
 *@param  text  : texte
 *@param  x, y  : position
 *@param  color : couleur du texte
 *@param  alpha : transparence
 */
function TText(text, x, y, color, font, size) {
  this.init(evas_object_text_add(screen.canvas), x, y, color);
  this.setFont(font, size);
  this.setText(text);
}
TText.prototype = new TEvasObject;
TText.prototype.setFont = function(name, size) {
  evas_object_text_font_set(this.handle, name, size);
}
TText.prototype.setText = function(text) {
  evas_object_text_text_set(this.handle, text);
  var geom = evas_object_geometry_get(this.handle);
  this.width = geom.w;
  this.height = geom.h;
}
TText.prototype.setStyle = function(style, color, alpha) {
  var r = (color >> 16) & 255;
  var g = (color >> 8) & 255;
  var b =  color & 255;
  var a = alpha || 255;
  eval('evas_object_text_' + style +  '_color_set(this.handle, r, g, b, a)');
  evas_object_text_style_set(this.handle, eval('EVAS_TEXT_STYLE_' + style.toUpperCase()));
}

/**
 * Texte riche
 *
 *@param  x, y, w, h   : position et dimensions
 *@param  color, alpha : couleur et alpha
 */
function TTextBlock(x, y, w, h, color, alpha) {
  this.init(evas_object_textblock_add(screen.canvas), x, y, color, alpha);
  this.setSize(w, h);
}
TTextBlock.prototype = new TEvasObject;

/**
 * Création d'un animateur
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
  if (!screen.mixer)
    screen.mixer = elx.load('mix');
  Mix_OpenAudio(rate, flags, channel, bufferSize);
  this.handle = Mix_LoadWAV(file);
  Mix_PlayChannel(-1, this.handle, -1)
}

/**
 * Centralisation des évènements serveur
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
  if (!screen.server_handler)
    screen.server_handler = new TServerHandler();
}
TClientSocket.prototype = {
  send : function(data) {
    ecore_con_server_send(this.handle, data);
  },
  connect : function(proto, host, port) {
    this.handle = ecore_con_server_connect(proto, host, port, screen.server_handler)
    screen.server_handler.servers.push(this);
  },
  close : function() {
    var index = screen.server_handler.servers.indexOf(this);
    screen.server_handler.servers.splice(index, 1);
  }
}

var screen = new TScreen();
screen.background = new TRectangle(0, 0, screen.width, screen.height);
evas_object_focus_set(screen.background.handle, 1);
