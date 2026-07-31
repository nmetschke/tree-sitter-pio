/**
 * @file Pio grammar for tree-sitter
 * @author Niclas Metschke
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const SYMBOL = /[a-zA-Z_][a-zA-Z\d_]*/;
const CI = (/** @type {string} */ e) => new RustRegex(`(?i)${e}`);

export default grammar({
	name: "pio",

	extras: ($) => [/[ \t\r]/, $.comment],
	word: ($) => $.symbol,
	externals: ($) => [$.code_block_contents, $.error_sentinel],

	rules: {
		source_file: ($) => seq(repeat($._definition), optional($._line)), // last line may not have '\n' at end

		_definition: ($) => choice($.label, "\n", seq($._line, "\n")),

		_line: ($) => choice($.instruction, $.directive, $.code_block),

		comment: ($) => choice($.line_comment, $.block_comment),
		line_comment: (_) => token(seq(choice("//", ";"), /.*/)),
		block_comment: (_) => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

		code_block: ($) =>
			seq(
				alias("%", $.code_block_start),
				$.code_block_target,
				alias("{", $.code_block_open),
				$.code_block_contents,
				alias("%}", $.code_block_end),
			),
		code_block_target: (_) => /[a-zA-Z_-][a-zA-Z\d_-]+/,

		instruction: ($) =>
			seq(
				field(
					"op",
					choice(
						$.instr_jmp,
						$.instr_wait,
						$.instr_in,
						$.instr_out,
						$.instr_push,
						$.instr_pull,
						$.instr_mov,
						$.instr_irq,
						$.instr_set,
						$.instr_nop,
					),
				),
				optional(
					choice(
						field("side", $.side),
						field("delay", $.delay),
						seq(field("side", $.side), field("delay", $.delay)),
						seq(field("delay", $.delay), field("side", $.side)),
					),
				),
			),
		side: ($) => seq(CI("side"), $.value),
		delay: ($) => seq("[", $._expression, "]"),

		jmp_condition: (_) =>
			choice(
				CI("!x"),
				CI("!y"),
				CI("x--"),
				CI("y--"),
				CI("x!=y"),
				CI("pin"),
				CI("!osre"),
			),
		in_source: (_) =>
			choice(CI("pins"), CI("x"), CI("y"), CI("null"), CI("isr"), CI("osr")),
		out_destination: (_) =>
			choice(
				CI("pins"),
				CI("x"),
				CI("y"),
				CI("null"),
				CI("pindirs"),
				CI("pc"),
				CI("isr"),
				CI("exec"),
			),
		wait_source: ($) =>
			choice(
				seq(
					alias(CI("gpio"), $.src),
					optional(","),
					field("gpio_num", $.value),
				),
				seq(alias(CI("pin"), $.src), optional(","), field("pin_num", $.value)),
				seq(
					alias(CI("irq"), $.src),
					optional(","),
					field("irq_num", $.value),
					optional(CI("rel")),
				),
				seq(
					alias(CI("irq"), $.src),
					$.irq_target,
					optional(","),
					field("irq_num", $.value),
				),
				seq(
					alias(CI("jmppin"), $.src),
					optional(seq("+", field("pin_offset", $.value))),
				),
			),
		block_noblock: (_) => choice(CI("block"), CI("noblock")),
		mov_destination: ($) =>
			choice(
				CI("pins"),
				CI("x"),
				CI("y"),
				CI("pindirs"),
				CI("exec"),
				CI("pc"),
				CI("isr"),
				CI("osr"),
				seq(CI("rxfifo"), "[", field("index", choice(CI("y"), $.value)), "]"),
			),
		mov_source: ($) =>
			choice(
				CI("pins"),
				CI("x"),
				CI("y"),
				CI("null"),
				CI("status"),
				CI("isr"),
				CI("osr"),
				seq(CI("rxfifo"), "[", field("index", choice(CI("y"), $.value)), "]"),
			),
		set_destination: (_) => choice(CI("pins"), CI("x"), CI("y"), CI("pindirs")),

		label_reference: ($) => $.value,

		instr_jmp: ($) =>
			seq(
				alias(CI("jmp"), $.opcode),
				optional(field("cond", $.jmp_condition)),
				optional(","),
				optional(field("target", $.label_reference)),
			),
		instr_wait: ($) =>
			seq(
				alias(CI("wait"), $.opcode),
				optional(field("polarity", choice("0", "1"))),
				optional(field("source", $.wait_source)),
			),
		instr_in: ($) =>
			seq(
				alias(CI("in"), $.opcode),
				optional(field("source", $.in_source)),
				optional(","),
				optional(field("bit_count", $.value)),
			),
		instr_out: ($) =>
			seq(
				alias(CI("out"), $.opcode),
				optional(field("destination", $.out_destination)),
				optional(","),
				optional(field("bit_count", $.value)),
			),
		instr_push: ($) =>
			seq(
				alias(CI("push"), $.opcode),
				optional(alias(CI("iffull"), $.iffull)),
				optional($.block_noblock),
			),
		instr_pull: ($) =>
			seq(
				alias(CI("pull"), $.opcode),
				optional(alias(CI("ifempty"), $.ifempty)),
				optional($.block_noblock),
			),
		instr_mov: ($) =>
			seq(
				alias(CI("mov"), $.opcode),
				optional(
					seq(
						field("destination", $.mov_destination),
						optional(","),
						optional(field("op", choice("!", "~", "::"))),
						optional(field("source", $.mov_source)),
					),
				),
			),
		instr_irq: ($) =>
			seq(
				alias(CI("irq"), $.opcode),
				optional($.irq_target),
				optional($.irq_modifier),
				optional(field("irq_num", $.value)),
				optional(alias(CI("rel"), $.irq_rel)),
			),
		instr_set: ($) =>
			seq(
				alias(CI("set"), $.opcode),
				optional(field("destination", $.set_destination)),
				optional(","),
				optional(field("value", $.value)),
			),
		instr_nop: ($) => seq(alias(CI("nop"), $.opcode)),

		irq_modifier: (_) =>
			choice(CI("clear"), CI("wait"), CI("nowait"), CI("set")),
		irq_target: (_) => choice(CI("prev"), CI("next")),

		label: ($) =>
			seq(
				optional(field("public", $.public)),
				field("label", $.symbol),
				token.immediate(":"),
			),

		directive: ($) => choice($.define, seq(".", $._non_define_directive)),

		public: (_) => CI("public"),

		define: ($) =>
			seq(
				".",
				alias(token.immediate(CI("define")), $.define_keyword),
				optional(field("public", $.public)),
				optional(field("define_symbol", $.symbol)),
				optional(field("define_value", $._expression)),
			),

		_non_define_directive: ($) =>
			choice(
				$.directive_clock_div,
				$.directive_fifo,
				$.directive_mov_status,
				$.directive_in_out,
				$.directive_program,
				$.directive_origin,
				$.directive_pio_version,
				$.directive_set,
				$.directive_side_set,
				$.directive_wrap_target,
				$.directive_wrap,
				$.directive_lang_opt,
				$.directive_word,
				// field("other", token.immediate(SYMBOL)),
			),
		directive_clock_div: ($) =>
			seq(
				alias(token.immediate(CI("clock_div")), $.define_typ),
				optional(field("divider", $.float)),
			),
		directive_fifo: ($) =>
			seq(
				alias(token.immediate(CI("fifo")), $.define_typ),
				optional(
					field(
						"fifo_config",
						choice(
							CI("txrx"),
							CI("tx"),
							CI("rx"),
							CI("txput"),
							CI("txget"),
							CI("putget"),
						),
					),
				),
			),
		directive_mov_status: ($) =>
			seq(
				alias(token.immediate(CI("mov_status")), $.define_typ),
				optional(
					choice(
						seq(choice(CI("rxfifo"), CI("txfifo")), "<"),
						seq(CI("irq"), optional(choice(CI("prev"), CI("next"))), CI("set")),
					),
				),
				optional(field("n", $.value)),
			),
		directive_in_out: ($) =>
			seq(
				alias(token.immediate(choice(CI("in"), CI("out"))), $.define_typ),
				optional(field("count", $.value)),
				optional(choice(CI("left"), CI("right"))),
				optional(CI("auto")),
				optional(field("threshold", $.number)), // TODO: fix
			),
		directive_program: ($) =>
			seq(
				alias(token.immediate(CI("program")), $.define_typ),
				optional(field("program_name", $.symbol)),
			),
		directive_origin: ($) =>
			seq(
				alias(token.immediate(CI("origin")), $.define_typ),
				optional(field("offset", $.value)),
			),
		directive_pio_version: ($) =>
			seq(
				alias(token.immediate(CI("pio_version")), $.define_typ),
				optional(field("version", $.number)),
			),
		directive_set: ($) =>
			seq(
				alias(token.immediate(CI("set")), $.define_typ),
				optional(field("count", $.value)),
			),
		directive_side_set: ($) =>
			seq(
				alias(token.immediate(CI("side_set")), $.define_typ),
				optional(field("count", $.value)),
				optional(alias(CI("opt"), $.opt)),
				optional(alias(CI("pindirs"), $.pindirs)),
			),
		directive_wrap_target: (_) => token.immediate(CI("wrap_target")),
		directive_wrap: (_) => token.immediate(CI("wrap")),
		directive_lang_opt: ($) =>
			seq(
				alias(token.immediate(CI("lang_opt")), $.define_typ),
				optional(
					seq(
						field("lang", $.symbol),
						optional(field("name", $.symbol)),
						optional(
							field("option", alias(seq("=", /[a-zA-Z\d_.]+/), $.symbol)),
						),
					),
				),
			),
		directive_word: ($) =>
			seq(
				alias(token.immediate(CI("word")), $.define_typ),
				optional(field("value", $.value)),
			),

		value: ($) =>
			prec(1, choice($.number, $.symbol, $.parenthesized_expression)),

		parenthesized_expression: ($) =>
			seq("(", field("expression", $._expression), ")"),
		_expression: ($) =>
			choice($.value, $.binary_expression, $.unary_expression),
		binary_expression: ($) =>
			choice(
				prec.left(2, seq($._expression, "+", $._expression)),
				prec.left(2, seq($._expression, "-", $._expression)),
				prec.left(3, seq($._expression, "*", $._expression)),
				prec.left(3, seq($._expression, "/", $._expression)),
				prec.left(1, seq($._expression, "<<", $._expression)),
				prec.left(1, seq($._expression, ">>", $._expression)),
			),
		unary_expression: ($) =>
			prec(4, choice(seq("-", $._expression), seq("::", $._expression))),

		number: ($) => choice($.integer, $.hex, $.binary),

		integer: (_) => /\d+/,
		float: (_) => /\d*\.\d+/,
		hex: (_) => /0x[0-9a-fA-F]+/,
		binary: (_) => /0b[01]+/,
		symbol: (_) => SYMBOL,
	},
});
