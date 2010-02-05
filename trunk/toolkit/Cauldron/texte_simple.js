elx.include('Cauldron.js');

var back = new TRectangle(10, 10, 100, 50, 0xFFFFFF);
var hello = new TText('Hello World !', 10, 10, 0, 'Vera', 22);
back.setSize(hello.width, hello.height);

screen.onKeyup = function(event) {
  switch (event.key) {
    case 'o' : hello.setStyle('outline', 0xFF0000); break;
    case 'g' : hello.setStyle('glow', 0xFF00FF); break;
    case 's' : hello.setStyle('shadow', 0x0000FF, 128); break;
    case 'f' :
      hello.setStyle('shadow', 0xFF0000);
      evas_object_text_style_set(hello.handle, EVAS_TEXT_STYLE_FAR_SHADOW); 
    break;
    default  : screen.quit() 
  }
}
screen.main(); 