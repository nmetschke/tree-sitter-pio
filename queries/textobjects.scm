; code blocks
(code_block) @class.around
(code_block
  (code_block_contents) @class.inside)

; instructions
(instruction) @entry.around
(instruction
  op: (_) @entry.inside)

; directives
(directive) @entry.around

; labels
(label
  label: (symbol) @function.inside) @function.around

; comments
(line_comment) @comment.inside
(line_comment)+ @comment.around
(block_comment) @comment.inside
(block_comment)+ @comment.around
