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
