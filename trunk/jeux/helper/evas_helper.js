var NULL = null;

var test = true;

test &= elx.load("evas");
test &= elx.load("event");

function build_image_object(evas, name, level)
{
	var ob;

	ob = evas_object_image_add(evas);
	evas_object_image_file_set(ob, IM + name, NULL);
	evas_object_move(ob, 0, 0);
	geom = evas_object_image_size_get(ob);
	iw = geom.w; ih = geom.h;
	evas_object_resize(ob, geom);
	evas_object_image_fill_set(ob, 0, 0, iw, ih);
	evas_object_layer_set(ob, level);

	return ob;
}

function Color(r, g, b, a) {
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
}

function Void()
{
}

var ei = 0;
function evas_sdl_new(width, height)
{
	var newone;

	if (ei == 0)
		evas_init();
	ei++;

	newone = evas_new();
	evas_output_init(newone, "software_sdl", width, height);

	return newone;
}

function evas_clean(evas)
{
	evas_free(evas);
	ei--;
	if (ei == 0)
		evas_shutdown();
}

function center(ob, x, y) {
	var geom;

	geom = evas_object_geometry_get(ob);
	evas_object_move(ob, x - (geom.w / 2), y - (geom.h / 2));
}

function exit(evas, font)
{
   this.choice = false;
   this.looping = true;

   function key_down(data, e, obj, event)
     {
        switch (event.keyname)
          {
          case "Up":
          case "Down":
             data.choice = !data.choice;
             break;
          case "Return":
             data.looping = false;
             break;
          case "Home":
          case "equal":
          case "Escape":
          case "b":
             data.choice = true;
             data.looping = false;
             break;
          case "a":
             data.choice = false;
             data.looping = false;
             break;
          }
     }

   function gen_text(evas, texte, font, x, y)
     {
        var ob;

        ob = evas_object_text_add(evas);
        evas_object_text_font_set(ob, font, 36);
        evas_object_text_text_set(ob, texte);
        evas_object_color_set(ob, 255, 255, 255, 255);
        evas_object_layer_set(ob, 501);
        evas_object_text_shadow_color_set(ob, 0, 0, 0, 255);
        evas_object_text_style_set(ob, EVAS_TEXT_STYLE_SOFT_SHADOW);
        center(ob, x, y);
        evas_object_show(ob);

        return ob;
     }

   var bk;
   var question;
   var yes;
   var yes_color;
   var geom_yes;
   var no;
   var no_color;
   var geom_no;
   var red;
   var green;

   bk = evas_object_rectangle_add(evas);
   evas_object_resize(bk, win_w, win_h);
   evas_object_move(bk, 0, 0);
   evas_object_color_set(bk, 0, 0, 16, 175);
   evas_object_layer_set(bk, 500);
   evas_object_show(bk);

   evas_object_event_callback_add(bk, EVAS_CALLBACK_KEY_DOWN, key_down, this);

   evas_object_focus_set(bk, true);

   question = gen_text(evas, "Voulez-vous quitter ?", font, 360, 280);
   no = gen_text(evas, "Non", font, 360, 320);
   no_color = gen_text(evas, "Non", font, 360, 320);
   evas_object_color_set(no_color, 255, 255, 0, 255);

   yes = gen_text(evas, "Oui", font, 360, 360);
   yes_color = gen_text(evas, "Oui", font, 360, 360);
   evas_object_color_set(yes_color, 255, 255, 0, 255);

   red = build_image_object(evas, "btRed.png", 501);
   green = build_image_object(evas, "btGreen.png", 501);

   geom_no = evas_object_geometry_get(no);
   geom_yes = evas_object_geometry_get(yes);

   evas_object_move(green, ((geom_no.x < geom_yes.x) ? geom_no.x : geom_yes.x) - 20, 310);
   evas_object_move(red, ((geom_no.x < geom_yes.x) ? geom_no.x : geom_yes.x) - 20, 350);

   evas_object_show(red);
   evas_object_show(green);

   var d = new Date();
   var last = d.getTime();
   var glow_color = 255;
   var glow_direction = -10;

   while (looping)
     {
	var d = new Date();
	var timer = d.getTime();

        if (timer - last > 50)
          {
             glow_color += glow_direction;
             if (glow_color < 10 && glow_direction < 0)
               glow_direction = - glow_direction;
             if (glow_color > 245 && glow_direction > 0)
               glow_direction = - glow_direction;

             evas_object_color_set(yes_color, glow_color, glow_color, 0, 255);
             evas_object_color_set(no_color, glow_color, glow_color, 0, 255);

             last = timer;
          }

        if (this.choice)
          {
             evas_object_show(yes_color);
             evas_object_hide(no_color);
          }
        else
          {
             evas_object_show(no_color);
             evas_object_hide(yes_color);
          }
        var end = get_event(evas);
        if (end) {
           evas_render(evas);
        } else {
           this.looping = false;
           this.choice = true;
        }
        elx.usleep(40);
     }

   evas_object_del(no);
   evas_object_del(no_color);
   evas_object_del(yes);
   evas_object_del(yes_color);
   evas_object_del(question);
   evas_object_del(bk);
   evas_object_del(green);
   evas_object_del(red);

   return this.choice;
}



test;
