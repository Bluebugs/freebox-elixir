edje-helper.edj: Makefile ecore-job-helper.js edje-helper.edc edje-helper.js math_helper.js score-helper.js
	edje_cc -v -fd ../../../buildroot/packages/fonts/data/ttf-bitstream-vera/ -id ../demineur/share/ edje-helper.edc edje-helper.edj
	eet -i edje-helper.edj "score-helper" score-helper.js 1
	eet -i edje-helper.edj "math_helper" math_helper.js 1
	eet -i edje-helper.edj "ecore-job-helper" ecore-job-helper.js 1
	eet -i edje-helper.edj "edje-helper" edje-helper.js 1
	chmod a+r edje-helper.edj
