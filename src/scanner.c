#include "tree_sitter/parser.h"

enum TokenType {
  CODE_BLOCK_CONTENTS,
  ERROR_SENTINEL,
};

void *tree_sitter_pio_external_scanner_create() { return NULL; }
void tree_sitter_pio_external_scanner_destroy(void *payload) { (void)payload; }
unsigned tree_sitter_pio_external_scanner_serialize(void *payload,
                                                    char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}
void tree_sitter_pio_external_scanner_deserialize(void *payload,
                                                  const char *buffer,
                                                  unsigned int length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

bool tree_sitter_pio_external_scanner_scan(void *payload, TSLexer *lexer,
                                           const bool *valid_symbols) {
  (void)payload;

  if (valid_symbols[ERROR_SENTINEL] || !valid_symbols[CODE_BLOCK_CONTENTS]) {
    return false;
  }

  while (!lexer->eof(lexer)) {
    // look for "%}"
    if (lexer->lookahead != '%') {
      lexer->advance(lexer, false);
      continue;
    }

    // found "%", mark end to just before it and check if next char is "}"
    lexer->mark_end(lexer);
    lexer->advance(lexer, false);
    if (lexer->lookahead == '}') {
      // found the end
      lexer->result_symbol = CODE_BLOCK_CONTENTS;
      return true;
    }
  }

  return false;
}
