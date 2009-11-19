function rand(n)
{
	return Math.floor(Math.random() * n + 1);
}

function split_time(timing) {
	if (timing < 0 || timing === undefined) {
		return "--:--";
	} else {
		timing /= 1000;
		var minute = String(parseInt(timing / 60));
		var seconde = String(parseInt(timing % 60));

		if (minute.length < 2)
			minute = "0" + minute;
		if (seconde.length < 2)
			seconde = "0" + seconde;

		return minute + ":" + seconde;
	}
}

true;
