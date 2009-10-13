################################################################################
#
# HECKY Raoul
# Edje tutorial makefile
# 10/01/2007
#
################################################################################


CC=edje_cc
RUN=edje_viewer

DEFAULT=glassy.edj

DEF_SRC=theme.edc
DEF_SRCS=*.edc

INCLUDE=-id images/ -id ./ -fd ./
RUN_OPT=
DEBUG=-v

all: $(DEFAULT)

$(DEFAULT): $(DEF_SRCS)
	@echo -n "[*] Compilation du theme [$(DEFAULT)] "
	@$(CC) $(INCLUDE) $(DEBUG) $(DEF_SRC) $(DEFAULT)
	@echo "------ [OK]"

clean :
	@rm -f $(DEFAULT) *~

test : $(DEFAULT)
	@$(RUN) $(RUN_OPT) $(DEFAULT)
