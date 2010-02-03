/*
 *  Utilisation d'un Animator Cauldron
 *  http://code.google.com/p/freebox-elixir/wiki/Cauldron
 */

elx.include('Cauldron.js');

var obj = new TRectangle(50, 50, 250, 200, 0x804000);

var anim = new TAnimator();
anim.onChange = function() {
  var x = obj.x + anim.dx;
  var y = obj.y + anim.dy;

  if (x + obj.width > Screen.width || x < 0)
  {
	  anim.dx = - anim.dx;
 	  x += 2 * anim.dx;
  }

  if (y + obj.height > Screen.height || y < 0)
  {
	  anim.dy = - anim.dy;
	  y += 2 * anim.dy;
  }

  obj.move(x, y);
}

Screen.onKeyup = function(event) {
  switch (event.keyname)
  {
    case "a":
    case "Stop":
      anim.stop();
    break;
    case "s":
    case "Start":
      anim.start();
    break;
    case "b":
    case "Red":
    case "equal":
    case "Home":
    case "Escape":
	    Screen.quit();
	   break;
  }
}

anim.setSpeed(1/20);
anim.dx = 20;
anim.dy = 10;
anim.start();
Screen.main();
