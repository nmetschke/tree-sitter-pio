{ lib, buildGrammar }:
buildGrammar {
  language = "pio";
  version = "0.1.1";
  src = lib.sources.cleanSource ./.;
  meta = {
    license = lib.licenses.mit;
  };
}
