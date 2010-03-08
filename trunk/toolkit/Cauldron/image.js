elx.include('Cauldron.js');

var logo1 = new TImage(20, 20, 'Cauldron.jpg');
var logo2 = new TImage(20 + 160, 20, 'Cauldron.jpg');
var logo3 = new TImage(20 + 2 * 160, 20, 'Cauldron.jpg');
var logo4 = new TImage(20 + 3 * 160, 20, 'Cauldron.jpg');
var logo5 = new TImage(20 + 3 * 160, 20 + 120, 'Cauldron.jpg');

var min = logo1.height;
var max = screen.height - min;
var size = min;
var delta = +1;
var anim = new TAnimator();
anim.onChange = function() {
  size += delta;
  if (size > max || size < min) {
    delta = - delta;
    size += 2 * delta;
  }
  logo1.setSize(logo1.width, size);
  logo2.move(logo2.x, size - logo2.height + 20);
  logo3.setSize(logo3.width, size);
  logo3.stretch(0, 0, logo3.width, size);
  //logo4.setSize(logo4.width, size);
  logo4.stretch(0, size, logo4.width, logo4.height);
  logo5.stretch(size / 4, size / 4, size / 4, size / 4);
}
anim.start();

screen.onKeyup = function() {
  screen.quit();
}

screen.main();