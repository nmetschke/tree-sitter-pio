[![Build status](https://github.com/nmetschke/tree-sitter-pio/actions/workflows/ci.yml/badge.svg)](https://github.com/nmetschke/tree-sitter-pio/actions/workflows/ci.yml)
[![Crates.io](https://img.shields.io/crates/v/tree-sitter-pio.svg)](https://crates.io/crates/tree-sitter-pio)

# About

This repo provides [tree-sitter](https://tree-sitter.github.io/tree-sitter) grammar for Rasperry Pi [PIO assembly files](https://pip-assets.raspberrypi.com/categories/609-microcontroller-boards/documents/RP-009085-KB-2-raspberry-pi-pico-c-sdk.pdf#page=56) (3.3. Using PIOASM, the PIO Assembler) files.

In addition to the grammar, the following queries are included:

| Query file      | Description                                                                |
| --------------- | -------------------------------------------------------------------------- |
| highlights.scm  | Syntax highlighting                                                        |
| injections.scm  | Injection queries for comments and C/Python code blocks                    |
| rainbows.scm    | Rainbow brackets for expressions                                           |
| tags.scm        | Tags for .program, .define statements and labels                           |
| textobjects.scm | Incremental selection for statements, instructions, labels and code blocks |

## Example usage with [Helix](https://github.com/helix-editor/helix)

Add this to `~/.congig/helix/languages.toml`.

```toml
[[language]]
comment-tokens = ";"
file-types = ["pio"]
name = "pio"
scope = "source.pio"

[[grammar]]
name = "pio"

[grammar.source]
git = "https://github.com/nmetschke/tree-sitter-pio"
rev = "bc094f6df53f4311468ded14be1c37e8dfdc601c"
```

and run `hx --grammar fetch && hx --grammar build`.

## Helix with Nix + home-manager

`flake.nix`:

```nix
inputs = {
  tree-sitter-pio = {
    url = "github:nmetschke/tree-sitter-pio";
    inputs.nixpkgs.follows = "nixpkgs";
  };
};
```

and configure helix to use them

```nix
{ inputs, ... }:
{
  programs.helix = {
    languages = {
      language = [
        {
          name = "pio";
          scope = "source.pio";
          file-types = [ "pio" ];
          comment-tokens = ";";
        }
      ];
      grammar = [
        {
          name = "pio";
          source.path = inputs.tree-sitter-pio;
        }
      ];
    };
  };

  # link the queries
  xdg.configFile."helix/runtime/queries/pio".source = "${inputs.tree-sitter-pio}/queries";
}
```

You may also want to check out my [PIO LSP Server](https://github.com/nmetschke/tree-sitter-pio).
