{ lib, buildGrammar }:
buildGrammar {
  language = "pio";
  version = "0.1.0";
  src = lib.sources.cleanSource ./.;
  meta = {
    license = lib.licenses.mit;
  };
}
