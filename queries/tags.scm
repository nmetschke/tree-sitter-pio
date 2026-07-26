; labels
(label
  label: (symbol) @name) @definition.function
(label_reference
  (value
    (symbol) @name)) @reference.call

; .define
(define
  define_symbol: (symbol) @name) @definition.constant

; other directives
(directive
  (directive_program program_name: _ @name) @definition.module)
 
; code blocks
(code_block
  (code_block_target) @name) @definition.interface
