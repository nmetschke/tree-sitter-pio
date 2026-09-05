{ lib, buildGrammar }:
buildGrammar {
  language = "pio";
  version = "0.2.1";
  src = lib.sources.cleanSource ./.;
  meta = {
    license = lib.licenses.mit;
  };
}
