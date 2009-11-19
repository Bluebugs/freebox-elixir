LEVEL_EASY=part/level,easy,boolean part/level,easy,int part/level,easy,mine
LEVEL_MIDDLE=part/level,middle,boolean part/level,middle,int part/level,middle,mine part/level,middle,object
LEVEL_EXPERT=part/level,expert,boolean part/level,expert,int part/level,expert,mine part/level,expert,object

Demineur.edj: Makefile Demineur.edc $(LEVEL_EXPERT) $(LEVEL_MIDDLE) $(LEVEL_EASY) Demineur.js
	edje_cc -v -id share Demineur.edc Demineur.edj
	for i in part/*; do \
		eet -i Demineur.edj $${i/part\//} $$i 1; \
		elixir-compile Demineur.edj $${i/part\//}; \
	done
	eet -i Demineur.edj "elixir/main" Demineur.js 1
	elixir-compile Demineur.edj "elixir/main"
	chmod a+r Demineur.edj

