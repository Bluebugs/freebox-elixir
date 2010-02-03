/**
 *
 *  Exemple de création de rectangles sous Cauldron
 *  http://code.google.com/p/freebox-elixir/wiki/Cauldron
 *
 */

elx.include('Cauldron.js');

var rouge = new TRectangle(10, 10, 320, 200, 0xFF0000);
var vert  = new TRectangle(40, 20, 320, 200, 0x00FF00, 196);
var bleu  = new TRectangle(60, 30, 320, 200, 0x0000FF, 128);

Screen.onKeyup = function(event) { screen.quit() }
Screen.main();