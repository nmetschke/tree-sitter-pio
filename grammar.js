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

	extras: ($) => [/\s/, $.comment],
	word: ($) => $.symbol,
	externals: ($) => [$.code_block_contents, $.error_sentinel],

	rules: {
		source_file: ($) => repeat($._definition),

		_definition: ($) =>
			choice(
				seq(repeat($.label), choice($.instruction, $.directive)), // might have .wrap/.wrap_target after a label
				$.code_block,
			),

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
		code_block_target: (_) => /[a-zA-Z_-][a-zA-Z\d_-]*/,

		instruction: ($) =>
			seq(
				field(
					"op",
					choice(
						// prec(-1, $.naked_instr),
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

		// naked_instr: (_) =>
		// 	choice(
		// 		CI("jmp"),
		// 		CI("wait"),
		// 		CI("in"),
		// 		CI("out"),
		// 		CI("push"),
		// 		CI("pull"),
		// 		CI("mov"),
		// 		CI("irq"),
		// 		CI("set"),
		// 		CI("nop"),
		// 	),

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
					choice(CI("prev"), CI("next")),
					optional(","),
					field("irq_num", $.value),
				),
				seq(
					alias(CI("jmppin"), $.src),
					optional(seq("+", field("pin_offset", $.value))),
				),
			),
		block_noblock: (_) => choice(CI("block"), CI("noblock")),
		mov_destination: (_) =>
			choice(
				CI("pins"),
				CI("x"),
				CI("y"),
				CI("pindirs"),
				CI("exec"),
				CI("pc"),
				CI("isr"),
				CI("osr"),
			),
		mov_source: (_) =>
			choice(
				CI("pins"),
				CI("x"),
				CI("y"),
				CI("null"),
				CI("status"),
				CI("isr"),
				CI("osr"),
			),
		set_destination: (_) => choice(CI("pins"), CI("x"), CI("y"), CI("pindirs")),

		label_reference: ($) => $.value,

		instr_jmp: ($) =>
			seq(
				alias(CI("jmp"), $.opcode),
				optional(field("condition", $.jmp_condition)),
				optional(","),
				field("target", $.label_reference),
			),
		instr_wait: ($) =>
			seq(
				alias(CI("wait"), $.opcode),
				optional(field("polarity", choice("0", "1"))),
				field("source", $.wait_source),
			),
		instr_in: ($) =>
			seq(
				alias(CI("in"), $.opcode),
				field("source", $.in_source),
				optional(","),
				field("bit_count", $.value),
			),
		instr_out: ($) =>
			seq(
				alias(CI("out"), $.opcode),
				field("destination", $.out_destination),
				optional(","),
				field("bit_count", $.value),
			),
		instr_push: ($) =>
			seq(
				alias(CI("push"), $.opcode),
				optional(CI("iffull")),
				optional($.block_noblock),
			),
		instr_pull: ($) =>
			seq(
				alias(CI("pull"), $.opcode),
				optional(CI("ifempty")),
				optional($.block_noblock),
			),
		instr_mov: ($) =>
			seq(
				alias(CI("mov"), $.opcode),
				field(
					"destination",
					choice(
						$.mov_destination,
						seq(
							CI("rxfifo"),
							"[",
							field("index", choice(CI("y"), $.value)),
							"]",
						),
					),
				),
				optional(","),
				optional(field("mov_op", choice("!", "~", "::"))),
				field(
					"source",
					choice(
						$.mov_source,
						seq(
							CI("rxfifo"),
							"[",
							field("index", choice(CI("y"), $.value)),
							"]",
						),
					),
				),
			),
		instr_irq: ($) =>
			seq(
				alias(CI("irq"), $.opcode),
				optional(choice(CI("prev"), CI("next"))),
				optional($._irq_modifier),
				field("irq_num", $.value),
				optional(CI("rel")),
			),
		instr_set: ($) =>
			seq(
				alias(CI("set"), $.opcode),
				field("destination", $.set_destination),
				optional(","),
				field("set_value", $.value),
			),
		instr_nop: ($) => seq(alias(CI("nop"), $.opcode)),

		_irq_modifier: (_) =>
			choice(CI("clear"), CI("wait"), CI("nowait"), CI("set")),

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
				field("define_symbol", $.symbol),
				field("define_value", $._expression),
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
				field("divider", $.float),
			),
		directive_fifo: ($) =>
			seq(
				alias(token.immediate(CI("fifo")), $.define_typ),
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
		directive_mov_status: ($) =>
			seq(
				alias(token.immediate(CI("mov_status")), $.define_typ),
				choice(
					seq(choice(CI("rxfifo"), CI("txfifo")), "<"),
					seq(CI("irq"), optional(choice(CI("prev"), CI("next"))), CI("set")),
				),
				field("n", $.value),
			),
		directive_in_out: ($) =>
			seq(
				alias(token.immediate(choice(CI("in"), CI("out"))), $.define_typ),
				field("count", $.value),
				optional(choice(CI("left"), CI("right"))),
				optional(CI("auto")),
				optional(field("threshold", $.number)), // TODO: fix
			),
		directive_program: ($) =>
			seq(
				alias(token.immediate(CI("program")), $.define_typ),
				field("program_name", $.symbol),
			),
		directive_origin: ($) =>
			seq(
				alias(token.immediate(CI("origin")), $.define_typ),
				field("offset", $.value),
			),
		directive_pio_version: ($) =>
			seq(
				alias(token.immediate(CI("pio_version")), $.define_typ),
				field("version", $.number),
			),
		directive_set: ($) =>
			seq(
				alias(token.immediate(CI("set")), $.define_typ),
				field("count", $.value),
			),
		directive_side_set: ($) =>
			seq(
				alias(token.immediate(CI("side_set")), $.define_typ),
				field("count", $.value),
				optional(CI("opt")),
				optional(CI("pindirs")),
			),
		directive_wrap_target: (_) => token.immediate(CI("wrap_target")),
		directive_wrap: (_) => token.immediate(CI("wrap")),
		directive_lang_opt: ($) =>
			seq(
				alias(token.immediate(CI("lang_opt")), $.define_typ),
				field("lang", $.symbol),
				field("name", $.symbol),
				field("option", seq("=", /[a-zA-Z\d_.]+/)),
			),
		directive_word: ($) =>
			seq(
				alias(token.immediate(CI("word")), $.define_typ),
				field("value", $.value),
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
