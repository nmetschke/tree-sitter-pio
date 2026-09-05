{
  description = "tree-sitter grammar and queries for Raspberry Pico PIO assembly";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable-small";

  outputs =
    { self, ... }@inputs:

    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];
      forEachSupportedSystem =
        f:
        inputs.nixpkgs.lib.genAttrs supportedSystems (
          system: f (import inputs.nixpkgs { inherit system; })
        );

      mkTreeSitterPio = pkgs: pkgs.callPackage ./package.nix { inherit (pkgs.tree-sitter) buildGrammar; };
    in
    {
      packages = forEachSupportedSystem (pkgs: {
        default = mkTreeSitterPio pkgs;
      });

      devShells = forEachSupportedSystem (pkgs: {
        default = pkgs.mkShell {
          inputsFrom = [ (mkTreeSitterPio pkgs) ];
          packages = with pkgs; [
            tree-sitter
            nodejs_22
            clang
            python3
            cargo
            rustc
          ];
        };
      });
    };
}
