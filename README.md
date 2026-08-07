[![Build status](https://github.com/nmetschke/tree-sitter-pio/actions/workflows/ci.yml/badge.svg)](https://github.com/nmetschke/tree-sitter-pio/actions/workflows/ci.yml)
[![Crates.io](https://img.shields.io/crates/v/tree-sitter-pio.svg)](https://crates.io/crates/tree-sitter-pio)

# Tree-sitter grammar for PIO assembly files

## About

This repo provides [tree-sitter](https://tree-sitter.github.io/tree-sitter) grammar for Rasperry Pi [PIO assembly files](https://pip-assets.raspberrypi.com/categories/609-microcontroller-boards/documents/RP-009085-KB-2-raspberry-pi-pico-c-sdk.pdf#page=56) (3.3. Using PIOASM, the PIO Assembler) files.

In addition to the grammar, the following queries are provided:

| Query file      | Description                                                                |
| --------------- | -------------------------------------------------------------------------- |
| highlights.scm  | Syntax highlighting                                                        |
| injections.scm  | Injection queries for comments and C/Python code blocks                    |
| rainbows.scm    | Rainbow brackets for expressions                                           |
| tags.scm        | Tags for .program, .define statements and labels                           |
| textobjects.scm | Incremental selection for statements, instructions, labels and code blocks |

## Usage

### Example usage with [Helix](https://github.com/helix-editor/helix)

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

### Nix + Helix

Some more usage options with [Nix](https://nixos.org) and [Helix](https://github.com/helix-editor/helix) can be found here at my [PIO LSP Server](https://github.com/nmetschke/tree-sitter-pio).
