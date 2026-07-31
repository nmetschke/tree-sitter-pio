; primitives
(integer) @constant.numeric.integer
(hex) @constant.numeric.integer
(binary) @constant.numeric.integer
(float) @constant.numeric.float

; comments
(line_comment) @comment.line
(block_comment) @comment.block

; expressions
(parenthesized_expression
  [ "(" ")" ] @punctuation.bracket)

(delay
  [ "[" "]" ] @punctuation.bracket)

[
  "," ; optional comma in instructions
  ":" ; colon after labels
] @punctuation.delimiter

[
  "+"
  "-"
  "*"
  "/"
  "<<"
  ">>"
  "~"
  "!"
  "::"
] @operator

; code blocks
(code_block_start) @punctuation.delimiter
(code_block_target) @tag
(code_block_open) @punctuation.delimiter
(code_block_end) @punctuation.delimiter

; labels
(public) @keyword.modifiers
(label
  label: (symbol) @variable.other.member)
(label_reference) @variable.other.member

; directives
(directive . "." @keyword.directive)             ; "." at start of directives
(directive (_ (define_typ) @keyword.directive))  ; directive name (after the "." in the above rule)

; define
(directive
  (define
  . "." @type                                    ; "." at start of define
  . (define_keyword) @type                       ; "define"
  define_symbol: _ @variable                     ; variable after ".define"
  ))

; program
(directive
  . "." @keyword.control.return                                    ; "." at start of define
  (directive_program
    (define_typ) @keyword.control.return
  ))

 
; wrap / warp_target
(directive
  . "." @keyword.control.return
  . (directive_wrap_target) @keyword.control.return)
(directive
  . "." @keyword.control.return
  .(directive_wrap) @keyword.control.return)

; instructions

(instruction op: (_ (opcode) @function.special))
; (instruction (opcode) @function.special)
(instruction (side) @keyword.modifiers)
(instruction (side (value (number (_) @constant.bultin))))
(instruction (delay (value (number (_) @constant))))
(instr_wait polarity: _ @attribute)

; src / dst / conditions / extra operands
(jmp_condition) @attribute

[
  (out_destination)
  (mov_destination)
  (set_destination)
] @type.enum

[
  (in_source)
  (mov_source)
] @type.builtin

(wait_source (src) @type.builtin)
(wait_source (value) @variable)


[
  (block_noblock)
  (iffull)
  (ifempty)
  (irq_target)
  (irq_modifier)
  (irq_rel)
  (opt)
  (pindirs)
] @attribute
