; comments
([
    (line_comment)
    (block_comment)
  ] @injection.content
  (#set! injection.language "comment"))

; code blocks
((code_block
    (code_block_target) @injection.language
    (code_block_contents) @injection.content))

; c-sdk code blocks (need to rename c-sdk to c)
((code_block
    (code_block_target) @injection_language     ; using @injection.language does not work properly with eq / set
    (code_block_contents) @injection.content)
  (#eq? @injection_language "c-sdk")
  (#set! injection.language "c"))

