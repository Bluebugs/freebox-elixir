Scavenger.edj: Makefile Scavenger.edc Scavenger.js part/*
	edje_cc -v -id share Scavenger.edc Scavenger.edj
	for i in part/*; do \
		echo "Adding : " $$i; \
		eet -i Scavenger.edj $${i/part\//} $$i 1; \
		elixir-compile Scavenger.edj $${i/part\//}; \
	done
	eet -i Scavenger.edj "elixir/main" Scavenger.js 1
	elixir-compile Scavenger.edj "elixir/main"
	chmod a+r Scavenger.edj
