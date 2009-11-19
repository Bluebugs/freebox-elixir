BomberBox.edj: BomberBox.edc BomberBox.js Makefile
	edje_cc -v -id share BomberBox.edc BomberBox.edj
	eet -i BomberBox.edj "elixir/main" BomberBox.js 1
	elixir-compile BomberBox.edj "elixir/main"
	chmod a+r BomberBox.edj
