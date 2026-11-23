import type { OrcaWorkerApi } from 'orca/worker'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

const STORAGE_KEY = 'mode'

// Pure: which theme the current minute-of-day maps to, given light/dark
// boundaries in minutes-of-day. The most recent boundary wins; at/after the
// dark boundary dark wins. Exported for testing.
export function autoTargetMode(
  nowMinutes: number,
  lightMinutes: number,
  darkMinutes: number
): 'dark' | 'light' {
  if (lightMinutes < darkMinutes) {
    // Daytime light window [light, dark); dark otherwise (wraps midnight).
    return nowMinutes >= darkMinutes || nowMinutes < lightMinutes ? 'dark' : 'light'
  }
  if (lightMinutes > darkMinutes) {
    // Overnight light window [light, dark) wraps midnight.
    return nowMinutes >= lightMinutes || nowMinutes < darkMinutes ? 'light' : 'dark'
  }
  return 'dark'
}

// Local "HH:MM" (24-hour). Both groups are captured so minutes parse correctly.
export const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/
export function parseTimeMinutes(hhmm: string): number | null {
  const m = TIME_RE.exec(hhmm)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

// ---- Orca built-in palette (generated; run scripts/sync-orca-palette.mjs) ----
const ORCA_BUILTIN_DARK_APP = "{\n  \"schemaVersion\": 1,\n  \"base\": \"dark\",\n  \"tokens\": {\n    \"--background\": \"#0a0a0a\",\n    \"--editor-surface\": \"#1e1e1e\",\n    \"--foreground\": \"#f0f0f0\",\n    \"--card\": \"#171717\",\n    \"--card-foreground\": \"#f0f0f0\",\n    \"--popover\": \"#171717\",\n    \"--popover-foreground\": \"#f0f0f0\",\n    \"--primary\": \"#e5e5e5\",\n    \"--primary-foreground\": \"#171717\",\n    \"--secondary\": \"#262626\",\n    \"--secondary-foreground\": \"#f0f0f0\",\n    \"--muted\": \"#262626\",\n    \"--muted-foreground\": \"#acacac\",\n    \"--accent\": \"#404040\",\n    \"--accent-foreground\": \"#f0f0f0\",\n    \"--border\": \"#ffffff12\",\n    \"--input\": \"#ffffff26\",\n    \"--ring\": \"#737373\",\n    \"--sidebar\": \"#171717\",\n    \"--sidebar-foreground\": \"#f0f0f0\",\n    \"--sidebar-primary\": \"#1447e6\",\n    \"--sidebar-primary-foreground\": \"#f0f0f0\",\n    \"--sidebar-accent\": \"#262626\",\n    \"--sidebar-accent-foreground\": \"#f0f0f0\",\n    \"--sidebar-border\": \"#ffffff12\",\n    \"--sidebar-ring\": \"#525252\",\n    \"--worktree-sidebar\": \"#2a2a2a\",\n    \"--worktree-sidebar-foreground\": \"#f0f0f0\",\n    \"--worktree-sidebar-accent\": \"#353535\",\n    \"--worktree-sidebar-accent-foreground\": \"#f0f0f0\",\n    \"--worktree-sidebar-border\": \"#ffffff12\",\n    \"--worktree-sidebar-ring\": \"#737373\"\n  },\n  \"tokenColors\": [\n    {\n      \"scope\": [\n        \"meta.embedded\",\n        \"source.groovy.embedded\",\n        \"string meta.image.inline.markdown\",\n        \"variable.legacy.builtin.python\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#D4D4D4\"\n      }\n    },\n    {\n      \"scope\": \"emphasis\",\n      \"settings\": {\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": \"strong\",\n      \"settings\": {\n        \"fontStyle\": \"bold\"\n      }\n    },\n    {\n      \"scope\": \"header\",\n      \"settings\": {\n        \"foreground\": \"#000080\"\n      }\n    },\n    {\n      \"scope\": \"comment\",\n      \"settings\": {\n        \"foreground\": \"#6A9955\"\n      }\n    },\n    {\n      \"scope\": \"constant.language\",\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": [\n        \"constant.numeric\",\n        \"variable.other.enummember\",\n        \"keyword.operator.plus.exponent\",\n        \"keyword.operator.minus.exponent\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#b5cea8\"\n      }\n    },\n    {\n      \"scope\": \"constant.regexp\",\n      \"settings\": {\n        \"foreground\": \"#646695\"\n      }\n    },\n    {\n      \"scope\": \"entity.name.tag\",\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.name.tag.css\",\n        \"entity.name.tag.less\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#d7ba7d\"\n      }\n    },\n    {\n      \"scope\": \"entity.other.attribute-name\",\n      \"settings\": {\n        \"foreground\": \"#9cdcfe\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.other.attribute-name.class.css\",\n        \"source.css entity.other.attribute-name.class\",\n        \"entity.other.attribute-name.id.css\",\n        \"entity.other.attribute-name.parent-selector.css\",\n        \"entity.other.attribute-name.parent.less\",\n        \"source.css entity.other.attribute-name.pseudo-class\",\n        \"entity.other.attribute-name.pseudo-element.css\",\n        \"source.css.less entity.other.attribute-name.id\",\n        \"entity.other.attribute-name.scss\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#d7ba7d\"\n      }\n    },\n    {\n      \"scope\": \"invalid\",\n      \"settings\": {\n        \"foreground\": \"#f44747\"\n      }\n    },\n    {\n      \"scope\": \"markup.underline\",\n      \"settings\": {\n        \"fontStyle\": \"underline\"\n      }\n    },\n    {\n      \"scope\": \"markup.bold\",\n      \"settings\": {\n        \"fontStyle\": \"bold\",\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"markup.heading\",\n      \"settings\": {\n        \"fontStyle\": \"bold\",\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"markup.italic\",\n      \"settings\": {\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": \"markup.strikethrough\",\n      \"settings\": {\n        \"fontStyle\": \"strikethrough\"\n      }\n    },\n    {\n      \"scope\": \"markup.inserted\",\n      \"settings\": {\n        \"foreground\": \"#b5cea8\"\n      }\n    },\n    {\n      \"scope\": \"markup.deleted\",\n      \"settings\": {\n        \"foreground\": \"#ce9178\"\n      }\n    },\n    {\n      \"scope\": \"markup.changed\",\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"punctuation.definition.quote.begin.markdown\",\n      \"settings\": {\n        \"foreground\": \"#6A9955\"\n      }\n    },\n    {\n      \"scope\": \"punctuation.definition.list.begin.markdown\",\n      \"settings\": {\n        \"foreground\": \"#6796e6\"\n      }\n    },\n    {\n      \"scope\": \"markup.inline.raw\",\n      \"settings\": {\n        \"foreground\": \"#ce9178\"\n      }\n    },\n    {\n      \"scope\": \"punctuation.definition.tag\",\n      \"settings\": {\n        \"foreground\": \"#808080\"\n      }\n    },\n    {\n      \"scope\": [\n        \"meta.preprocessor\",\n        \"entity.name.function.preprocessor\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"meta.preprocessor.string\",\n      \"settings\": {\n        \"foreground\": \"#ce9178\"\n      }\n    },\n    {\n      \"scope\": \"meta.preprocessor.numeric\",\n      \"settings\": {\n        \"foreground\": \"#b5cea8\"\n      }\n    },\n    {\n      \"scope\": \"meta.structure.dictionary.key.python\",\n      \"settings\": {\n        \"foreground\": \"#9cdcfe\"\n      }\n    },\n    {\n      \"scope\": \"meta.diff.header\",\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"storage\",\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"storage.type\",\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": [\n        \"storage.modifier\",\n        \"keyword.operator.noexcept\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": [\n        \"string\",\n        \"meta.embedded.assembly\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#ce9178\"\n      }\n    },\n    {\n      \"scope\": \"string.tag\",\n      \"settings\": {\n        \"foreground\": \"#ce9178\"\n      }\n    },\n    {\n      \"scope\": \"string.value\",\n      \"settings\": {\n        \"foreground\": \"#ce9178\"\n      }\n    },\n    {\n      \"scope\": \"string.regexp\",\n      \"settings\": {\n        \"foreground\": \"#d16969\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.definition.template-expression.begin\",\n        \"punctuation.definition.template-expression.end\",\n        \"punctuation.section.embedded\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": [\n        \"meta.template.expression\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#d4d4d4\"\n      }\n    },\n    {\n      \"scope\": [\n        \"support.type.vendored.property-name\",\n        \"support.type.property-name\",\n        \"source.css variable\",\n        \"source.coffee.embedded\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#9cdcfe\"\n      }\n    },\n    {\n      \"scope\": \"keyword\",\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"keyword.control\",\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"keyword.operator\",\n      \"settings\": {\n        \"foreground\": \"#d4d4d4\"\n      }\n    },\n    {\n      \"scope\": [\n        \"keyword.operator.new\",\n        \"keyword.operator.expression\",\n        \"keyword.operator.cast\",\n        \"keyword.operator.sizeof\",\n        \"keyword.operator.alignof\",\n        \"keyword.operator.typeid\",\n        \"keyword.operator.alignas\",\n        \"keyword.operator.instanceof\",\n        \"keyword.operator.logical.python\",\n        \"keyword.operator.wordlike\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"keyword.other.unit\",\n      \"settings\": {\n        \"foreground\": \"#b5cea8\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.section.embedded.begin.php\",\n        \"punctuation.section.embedded.end.php\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"support.function.git-rebase\",\n      \"settings\": {\n        \"foreground\": \"#9cdcfe\"\n      }\n    },\n    {\n      \"scope\": \"constant.sha.git-rebase\",\n      \"settings\": {\n        \"foreground\": \"#b5cea8\"\n      }\n    },\n    {\n      \"scope\": [\n        \"storage.modifier.import.java\",\n        \"variable.language.wildcard.java\",\n        \"storage.modifier.package.java\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#d4d4d4\"\n      }\n    },\n    {\n      \"scope\": \"variable.language\",\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.name.function\",\n        \"support.function\",\n        \"support.constant.handlebars\",\n        \"source.powershell variable.other.member\",\n        \"entity.name.operator.custom-literal\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#DCDCAA\"\n      }\n    },\n    {\n      \"scope\": [\n        \"support.class\",\n        \"support.type\",\n        \"entity.name.type\",\n        \"entity.name.namespace\",\n        \"entity.other.attribute\",\n        \"entity.name.scope-resolution\",\n        \"entity.name.class\",\n        \"storage.type.numeric.go\",\n        \"storage.type.byte.go\",\n        \"storage.type.boolean.go\",\n        \"storage.type.string.go\",\n        \"storage.type.uintptr.go\",\n        \"storage.type.error.go\",\n        \"storage.type.rune.go\",\n        \"storage.type.cs\",\n        \"storage.type.generic.cs\",\n        \"storage.type.modifier.cs\",\n        \"storage.type.variable.cs\",\n        \"storage.type.annotation.java\",\n        \"storage.type.generic.java\",\n        \"storage.type.java\",\n        \"storage.type.object.array.java\",\n        \"storage.type.primitive.array.java\",\n        \"storage.type.primitive.java\",\n        \"storage.type.token.java\",\n        \"storage.type.groovy\",\n        \"storage.type.annotation.groovy\",\n        \"storage.type.parameters.groovy\",\n        \"storage.type.generic.groovy\",\n        \"storage.type.object.array.groovy\",\n        \"storage.type.primitive.array.groovy\",\n        \"storage.type.primitive.groovy\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#4EC9B0\"\n      }\n    },\n    {\n      \"scope\": [\n        \"meta.type.cast.expr\",\n        \"meta.type.new.expr\",\n        \"support.constant.math\",\n        \"support.constant.dom\",\n        \"support.constant.json\",\n        \"entity.other.inherited-class\",\n        \"punctuation.separator.namespace.ruby\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#4EC9B0\"\n      }\n    },\n    {\n      \"scope\": [\n        \"keyword.control\",\n        \"source.cpp keyword.operator.new\",\n        \"keyword.operator.delete\",\n        \"keyword.other.using\",\n        \"keyword.other.directive.using\",\n        \"keyword.other.operator\",\n        \"entity.name.operator\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#C586C0\"\n      }\n    },\n    {\n      \"scope\": [\n        \"variable\",\n        \"meta.definition.variable.name\",\n        \"support.variable\",\n        \"entity.name.variable\",\n        \"constant.other.placeholder\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#9CDCFE\"\n      }\n    },\n    {\n      \"scope\": [\n        \"variable.other.constant\",\n        \"variable.other.enummember\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#4FC1FF\"\n      }\n    },\n    {\n      \"scope\": [\n        \"meta.object-literal.key\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#9CDCFE\"\n      }\n    },\n    {\n      \"scope\": [\n        \"support.constant.property-value\",\n        \"support.constant.font-name\",\n        \"support.constant.media-type\",\n        \"support.constant.media\",\n        \"constant.other.color.rgb-value\",\n        \"constant.other.rgb-value\",\n        \"support.constant.color\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#CE9178\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.definition.group.regexp\",\n        \"punctuation.definition.group.assertion.regexp\",\n        \"punctuation.definition.character-class.regexp\",\n        \"punctuation.character.set.begin.regexp\",\n        \"punctuation.character.set.end.regexp\",\n        \"keyword.operator.negation.regexp\",\n        \"support.other.parenthesis.regexp\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#CE9178\"\n      }\n    },\n    {\n      \"scope\": [\n        \"constant.character.character-class.regexp\",\n        \"constant.other.character-class.set.regexp\",\n        \"constant.other.character-class.regexp\",\n        \"constant.character.set.regexp\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#d16969\"\n      }\n    },\n    {\n      \"scope\": [\n        \"keyword.operator.or.regexp\",\n        \"keyword.control.anchor.regexp\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#DCDCAA\"\n      }\n    },\n    {\n      \"scope\": \"keyword.operator.quantifier.regexp\",\n      \"settings\": {\n        \"foreground\": \"#d7ba7d\"\n      }\n    },\n    {\n      \"scope\": [\n        \"constant.character\",\n        \"constant.other.option\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#569cd6\"\n      }\n    },\n    {\n      \"scope\": \"constant.character.escape\",\n      \"settings\": {\n        \"foreground\": \"#d7ba7d\"\n      }\n    },\n    {\n      \"scope\": \"entity.name.label\",\n      \"settings\": {\n        \"foreground\": \"#C8C8C8\"\n      }\n    }\n  ]\n}"
const ORCA_BUILTIN_LIGHT_APP = "{\n  \"schemaVersion\": 1,\n  \"base\": \"light\",\n  \"tokens\": {\n    \"--background\": \"#fff\",\n    \"--editor-surface\": \"#fff\",\n    \"--foreground\": \"#0a0a0a\",\n    \"--card\": \"#fff\",\n    \"--card-foreground\": \"#0a0a0a\",\n    \"--popover\": \"#fff\",\n    \"--popover-foreground\": \"#0a0a0a\",\n    \"--primary\": \"#171717\",\n    \"--primary-foreground\": \"#fafafa\",\n    \"--secondary\": \"#f5f5f5\",\n    \"--secondary-foreground\": \"#171717\",\n    \"--muted\": \"#f5f5f5\",\n    \"--muted-foreground\": \"#696969\",\n    \"--accent\": \"#f5f5f5\",\n    \"--accent-foreground\": \"#171717\",\n    \"--border\": \"#e5e5e5\",\n    \"--input\": \"#e5e5e5\",\n    \"--ring\": \"#a1a1a1\",\n    \"--sidebar\": \"#fafafa\",\n    \"--sidebar-foreground\": \"#0a0a0a\",\n    \"--sidebar-primary\": \"#171717\",\n    \"--sidebar-primary-foreground\": \"#fafafa\",\n    \"--sidebar-accent\": \"#f5f5f5\",\n    \"--sidebar-accent-foreground\": \"#171717\",\n    \"--sidebar-border\": \"#e5e5e5\",\n    \"--sidebar-ring\": \"#a1a1a1\",\n    \"--worktree-sidebar\": \"#f5f5f5\",\n    \"--worktree-sidebar-foreground\": \"#0a0a0a\",\n    \"--worktree-sidebar-accent\": \"#eaeaea\",\n    \"--worktree-sidebar-accent-foreground\": \"#171717\",\n    \"--worktree-sidebar-border\": \"#e5e5e5\",\n    \"--worktree-sidebar-ring\": \"#a1a1a1\"\n  },\n  \"tokenColors\": [\n    {\n      \"scope\": [\n        \"meta.embedded\",\n        \"source.groovy.embedded\",\n        \"string meta.image.inline.markdown\",\n        \"variable.legacy.builtin.python\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#000000ff\"\n      }\n    },\n    {\n      \"scope\": \"emphasis\",\n      \"settings\": {\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": \"strong\",\n      \"settings\": {\n        \"fontStyle\": \"bold\"\n      }\n    },\n    {\n      \"scope\": \"meta.diff.header\",\n      \"settings\": {\n        \"foreground\": \"#000080\"\n      }\n    },\n    {\n      \"scope\": \"comment\",\n      \"settings\": {\n        \"foreground\": \"#008000\"\n      }\n    },\n    {\n      \"scope\": \"constant.language\",\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": [\n        \"constant.numeric\",\n        \"variable.other.enummember\",\n        \"keyword.operator.plus.exponent\",\n        \"keyword.operator.minus.exponent\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#098658\"\n      }\n    },\n    {\n      \"scope\": \"constant.regexp\",\n      \"settings\": {\n        \"foreground\": \"#811f3f\"\n      }\n    },\n    {\n      \"scope\": \"entity.name.tag\",\n      \"settings\": {\n        \"foreground\": \"#800000\"\n      }\n    },\n    {\n      \"scope\": \"entity.name.selector\",\n      \"settings\": {\n        \"foreground\": \"#800000\"\n      }\n    },\n    {\n      \"scope\": \"entity.other.attribute-name\",\n      \"settings\": {\n        \"foreground\": \"#e50000\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.other.attribute-name.class.css\",\n        \"source.css entity.other.attribute-name.class\",\n        \"entity.other.attribute-name.id.css\",\n        \"entity.other.attribute-name.parent-selector.css\",\n        \"entity.other.attribute-name.parent.less\",\n        \"source.css entity.other.attribute-name.pseudo-class\",\n        \"entity.other.attribute-name.pseudo-element.css\",\n        \"source.css.less entity.other.attribute-name.id\",\n        \"entity.other.attribute-name.scss\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#800000\"\n      }\n    },\n    {\n      \"scope\": \"invalid\",\n      \"settings\": {\n        \"foreground\": \"#cd3131\"\n      }\n    },\n    {\n      \"scope\": \"markup.underline\",\n      \"settings\": {\n        \"fontStyle\": \"underline\"\n      }\n    },\n    {\n      \"scope\": \"markup.bold\",\n      \"settings\": {\n        \"fontStyle\": \"bold\",\n        \"foreground\": \"#000080\"\n      }\n    },\n    {\n      \"scope\": \"markup.heading\",\n      \"settings\": {\n        \"fontStyle\": \"bold\",\n        \"foreground\": \"#800000\"\n      }\n    },\n    {\n      \"scope\": \"markup.italic\",\n      \"settings\": {\n        \"fontStyle\": \"italic\"\n      }\n    },\n    {\n      \"scope\": \"markup.strikethrough\",\n      \"settings\": {\n        \"fontStyle\": \"strikethrough\"\n      }\n    },\n    {\n      \"scope\": \"markup.inserted\",\n      \"settings\": {\n        \"foreground\": \"#098658\"\n      }\n    },\n    {\n      \"scope\": \"markup.deleted\",\n      \"settings\": {\n        \"foreground\": \"#a31515\"\n      }\n    },\n    {\n      \"scope\": \"markup.changed\",\n      \"settings\": {\n        \"foreground\": \"#0451a5\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.definition.quote.begin.markdown\",\n        \"punctuation.definition.list.begin.markdown\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0451a5\"\n      }\n    },\n    {\n      \"scope\": \"markup.inline.raw\",\n      \"settings\": {\n        \"foreground\": \"#800000\"\n      }\n    },\n    {\n      \"scope\": \"punctuation.definition.tag\",\n      \"settings\": {\n        \"foreground\": \"#800000\"\n      }\n    },\n    {\n      \"scope\": [\n        \"meta.preprocessor\",\n        \"entity.name.function.preprocessor\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": \"meta.preprocessor.string\",\n      \"settings\": {\n        \"foreground\": \"#a31515\"\n      }\n    },\n    {\n      \"scope\": \"meta.preprocessor.numeric\",\n      \"settings\": {\n        \"foreground\": \"#098658\"\n      }\n    },\n    {\n      \"scope\": \"meta.structure.dictionary.key.python\",\n      \"settings\": {\n        \"foreground\": \"#0451a5\"\n      }\n    },\n    {\n      \"scope\": \"storage\",\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": \"storage.type\",\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": [\n        \"storage.modifier\",\n        \"keyword.operator.noexcept\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": [\n        \"string\",\n        \"meta.embedded.assembly\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#a31515\"\n      }\n    },\n    {\n      \"scope\": [\n        \"string.comment.buffered.block.pug\",\n        \"string.quoted.pug\",\n        \"string.interpolated.pug\",\n        \"string.unquoted.plain.in.yaml\",\n        \"string.unquoted.plain.out.yaml\",\n        \"string.unquoted.block.yaml\",\n        \"string.quoted.single.yaml\",\n        \"string.quoted.double.xml\",\n        \"string.quoted.single.xml\",\n        \"string.unquoted.cdata.xml\",\n        \"string.quoted.double.html\",\n        \"string.quoted.single.html\",\n        \"string.unquoted.html\",\n        \"string.quoted.single.handlebars\",\n        \"string.quoted.double.handlebars\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": \"string.regexp\",\n      \"settings\": {\n        \"foreground\": \"#811f3f\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.definition.template-expression.begin\",\n        \"punctuation.definition.template-expression.end\",\n        \"punctuation.section.embedded\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": [\n        \"meta.template.expression\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#000000\"\n      }\n    },\n    {\n      \"scope\": [\n        \"support.constant.property-value\",\n        \"support.constant.font-name\",\n        \"support.constant.media-type\",\n        \"support.constant.media\",\n        \"constant.other.color.rgb-value\",\n        \"constant.other.rgb-value\",\n        \"support.constant.color\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0451a5\"\n      }\n    },\n    {\n      \"scope\": [\n        \"support.type.vendored.property-name\",\n        \"support.type.property-name\",\n        \"source.css variable\",\n        \"source.coffee.embedded\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#e50000\"\n      }\n    },\n    {\n      \"scope\": [\n        \"support.type.property-name.json\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0451a5\"\n      }\n    },\n    {\n      \"scope\": \"keyword\",\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": \"keyword.control\",\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": \"keyword.operator\",\n      \"settings\": {\n        \"foreground\": \"#000000\"\n      }\n    },\n    {\n      \"scope\": [\n        \"keyword.operator.new\",\n        \"keyword.operator.expression\",\n        \"keyword.operator.cast\",\n        \"keyword.operator.sizeof\",\n        \"keyword.operator.alignof\",\n        \"keyword.operator.typeid\",\n        \"keyword.operator.alignas\",\n        \"keyword.operator.instanceof\",\n        \"keyword.operator.logical.python\",\n        \"keyword.operator.wordlike\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": \"keyword.other.unit\",\n      \"settings\": {\n        \"foreground\": \"#098658\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.section.embedded.begin.php\",\n        \"punctuation.section.embedded.end.php\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#800000\"\n      }\n    },\n    {\n      \"scope\": \"support.function.git-rebase\",\n      \"settings\": {\n        \"foreground\": \"#0451a5\"\n      }\n    },\n    {\n      \"scope\": \"constant.sha.git-rebase\",\n      \"settings\": {\n        \"foreground\": \"#098658\"\n      }\n    },\n    {\n      \"scope\": [\n        \"storage.modifier.import.java\",\n        \"variable.language.wildcard.java\",\n        \"storage.modifier.package.java\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#000000\"\n      }\n    },\n    {\n      \"scope\": \"variable.language\",\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": [\n        \"entity.name.function\",\n        \"support.function\",\n        \"support.constant.handlebars\",\n        \"source.powershell variable.other.member\",\n        \"entity.name.operator.custom-literal\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#795E26\"\n      }\n    },\n    {\n      \"scope\": [\n        \"support.class\",\n        \"support.type\",\n        \"entity.name.type\",\n        \"entity.name.namespace\",\n        \"entity.other.attribute\",\n        \"entity.name.scope-resolution\",\n        \"entity.name.class\",\n        \"storage.type.numeric.go\",\n        \"storage.type.byte.go\",\n        \"storage.type.boolean.go\",\n        \"storage.type.string.go\",\n        \"storage.type.uintptr.go\",\n        \"storage.type.error.go\",\n        \"storage.type.rune.go\",\n        \"storage.type.cs\",\n        \"storage.type.generic.cs\",\n        \"storage.type.modifier.cs\",\n        \"storage.type.variable.cs\",\n        \"storage.type.annotation.java\",\n        \"storage.type.generic.java\",\n        \"storage.type.java\",\n        \"storage.type.object.array.java\",\n        \"storage.type.primitive.array.java\",\n        \"storage.type.primitive.java\",\n        \"storage.type.token.java\",\n        \"storage.type.groovy\",\n        \"storage.type.annotation.groovy\",\n        \"storage.type.parameters.groovy\",\n        \"storage.type.generic.groovy\",\n        \"storage.type.object.array.groovy\",\n        \"storage.type.primitive.array.groovy\",\n        \"storage.type.primitive.groovy\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#267f99\"\n      }\n    },\n    {\n      \"scope\": [\n        \"meta.type.cast.expr\",\n        \"meta.type.new.expr\",\n        \"support.constant.math\",\n        \"support.constant.dom\",\n        \"support.constant.json\",\n        \"entity.other.inherited-class\",\n        \"punctuation.separator.namespace.ruby\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#267f99\"\n      }\n    },\n    {\n      \"scope\": [\n        \"keyword.control\",\n        \"source.cpp keyword.operator.new\",\n        \"source.cpp keyword.operator.delete\",\n        \"keyword.other.using\",\n        \"keyword.other.directive.using\",\n        \"keyword.other.operator\",\n        \"entity.name.operator\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#AF00DB\"\n      }\n    },\n    {\n      \"scope\": [\n        \"variable\",\n        \"meta.definition.variable.name\",\n        \"support.variable\",\n        \"entity.name.variable\",\n        \"constant.other.placeholder\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#001080\"\n      }\n    },\n    {\n      \"scope\": [\n        \"variable.other.constant\",\n        \"variable.other.enummember\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0070C1\"\n      }\n    },\n    {\n      \"scope\": [\n        \"meta.object-literal.key\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#001080\"\n      }\n    },\n    {\n      \"scope\": [\n        \"support.constant.property-value\",\n        \"support.constant.font-name\",\n        \"support.constant.media-type\",\n        \"support.constant.media\",\n        \"constant.other.color.rgb-value\",\n        \"constant.other.rgb-value\",\n        \"support.constant.color\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0451a5\"\n      }\n    },\n    {\n      \"scope\": [\n        \"punctuation.definition.group.regexp\",\n        \"punctuation.definition.group.assertion.regexp\",\n        \"punctuation.definition.character-class.regexp\",\n        \"punctuation.character.set.begin.regexp\",\n        \"punctuation.character.set.end.regexp\",\n        \"keyword.operator.negation.regexp\",\n        \"support.other.parenthesis.regexp\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#d16969\"\n      }\n    },\n    {\n      \"scope\": [\n        \"constant.character.character-class.regexp\",\n        \"constant.other.character-class.set.regexp\",\n        \"constant.other.character-class.regexp\",\n        \"constant.character.set.regexp\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#811f3f\"\n      }\n    },\n    {\n      \"scope\": \"keyword.operator.quantifier.regexp\",\n      \"settings\": {\n        \"foreground\": \"#000000\"\n      }\n    },\n    {\n      \"scope\": [\n        \"keyword.operator.or.regexp\",\n        \"keyword.control.anchor.regexp\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#EE0000\"\n      }\n    },\n    {\n      \"scope\": [\n        \"constant.character\",\n        \"constant.other.option\"\n      ],\n      \"settings\": {\n        \"foreground\": \"#0000ff\"\n      }\n    },\n    {\n      \"scope\": \"constant.character.escape\",\n      \"settings\": {\n        \"foreground\": \"#EE0000\"\n      }\n    },\n    {\n      \"scope\": \"entity.name.label\",\n      \"settings\": {\n        \"foreground\": \"#000000\"\n      }\n    }\n  ]\n}"
const ORCA_BUILTIN_DARK_TERMINAL = "{\n  \"schemaVersion\": 1,\n  \"mode\": \"dark\",\n  \"terminal\": {\n    \"foreground\": \"#ffffff\",\n    \"background\": \"#282c34\",\n    \"cursor\": \"#ffffff\",\n    \"selectionBackground\": \"#5a7898\",\n    \"black\": \"#1d1f21\",\n    \"red\": \"#cc6666\",\n    \"green\": \"#b5bd68\",\n    \"yellow\": \"#f0c674\",\n    \"blue\": \"#81a2be\",\n    \"magenta\": \"#b294bb\",\n    \"cyan\": \"#8abeb7\",\n    \"white\": \"#c5c8c6\",\n    \"brightBlack\": \"#666666\",\n    \"brightRed\": \"#d54e53\",\n    \"brightGreen\": \"#b9ca4a\",\n    \"brightYellow\": \"#e7c547\",\n    \"brightBlue\": \"#7aa6da\",\n    \"brightMagenta\": \"#c397d8\",\n    \"brightCyan\": \"#70c0b1\",\n    \"brightWhite\": \"#eaeaea\"\n  }\n}"
const ORCA_BUILTIN_LIGHT_TERMINAL = "{\n  \"schemaVersion\": 1,\n  \"mode\": \"light\",\n  \"terminal\": {\n    \"foreground\": \"#2e3434\",\n    \"background\": \"#ffffff\",\n    \"cursor\": \"#2e3434\",\n    \"selectionBackground\": \"#accef7\",\n    \"black\": \"#2e3436\",\n    \"red\": \"#cc0000\",\n    \"green\": \"#4e9a06\",\n    \"yellow\": \"#8e7700\",\n    \"blue\": \"#3465a4\",\n    \"magenta\": \"#75507b\",\n    \"cyan\": \"#05727e\",\n    \"white\": \"#6a6a6a\",\n    \"brightBlack\": \"#555753\",\n    \"brightRed\": \"#ef2929\",\n    \"brightGreen\": \"#1b7a1b\",\n    \"brightYellow\": \"#6d5a00\",\n    \"brightBlue\": \"#204a87\",\n    \"brightMagenta\": \"#ad7fa8\",\n    \"brightCyan\": \"#034b50\",\n    \"brightWhite\": \"#3d3d3d\"\n  }\n}"
// ---- end Orca built-in palette ----

function orcaUserDataDir(): string {
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'orca')
  if (process.platform === 'win32') return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'orca')
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'orca')
}

function parseContentId(id: string): { pluginKey: string; themeId: string } | null {
  const m = String(id || '').match(/^plugin:(.+?)\/(.+)$/)
  if (!m) return null
  return { pluginKey: m[1], themeId: m[2] }
}

function findPluginDir(pluginKey: string): string | null {
  const base = path.join(orcaUserDataDir(), 'plugins', pluginKey)
  if (!fs.existsSync(base)) return null
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const p = path.join(base, entry.name, 'orca-plugin.json')
      if (fs.existsSync(p)) return path.join(base, entry.name)
    }
  }
  return null
}

interface ResolvedTheme { app: string; terminal: string }

function resolveTheme(contentId: string): ResolvedTheme | null {
  const parsed = parseContentId(contentId)
  if (!parsed) return null
  const dir = findPluginDir(parsed.pluginKey)
  if (!dir) return null
  let manifest: any
  try { manifest = JSON.parse(fs.readFileSync(path.join(dir, 'orca-plugin.json'), 'utf8')) } catch { return null }
  const themeEntry = (manifest?.contributes?.themes || []).find((t: any) => t.id === parsed.themeId)
  const termEntry = (manifest?.contributes?.terminalThemes || []).find((t: any) => t.id === parsed.themeId)
  if (!themeEntry) return null
  try {
    const app = fs.readFileSync(path.join(dir, themeEntry.path), 'utf8')
    let terminal = ''
    if (termEntry) {
      terminal = fs.readFileSync(path.join(dir, termEntry.path), 'utf8')
    } else {
      // Minimal terminal fallback derived from app base
      const base = JSON.parse(app).base === 'light' ? 'light' : 'dark'
      terminal = JSON.stringify({ schemaVersion: 1, mode: base, terminal: { background: '#000000', foreground: '#ffffff', black: '#000000' } })
    }
    return { app, terminal }
  } catch {
    return null
  }
}

function listInstalledThemes(): string[] {
  const out: string[] = []
  const base = path.join(orcaUserDataDir(), 'plugins')
  if (!fs.existsSync(base)) return out
  for (const pluginEntry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!pluginEntry.isDirectory()) continue
    const pluginKey = pluginEntry.name
    const pluginDir = findPluginDir(pluginKey)
    if (!pluginDir) continue
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(pluginDir, 'orca-plugin.json'), 'utf8'))
      for (const t of (manifest?.contributes?.themes || [])) {
        out.push(`plugin:${pluginKey}/${t.id}`)
      }
    } catch { /* ignore */ }
  }
  return out
}

export default function activate(orca: OrcaWorkerApi): void {
  async function currentMode(): Promise<'dark' | 'light'> {
    const value = await orca.storage.get(STORAGE_KEY)
    return value === 'dark' ? 'dark' : 'light'
  }

  async function applyMode(mode: 'dark' | 'light'): Promise<void> {
    const revisionResult = (await orca.host.call('appearance.read')) as { revision: string }
    const { app, terminal } = await configuredTheme(mode)
    await orca.host.call('appearance.apply', {
      expectedRevision: revisionResult.revision,
      app,
      terminal
    })
    await orca.storage.set(STORAGE_KEY, mode)
    await orca.host.call('statusBar.update', {
      id: 'toggle',
      text: mode === 'dark' ? '☾' : '☀'
    })
  }

  async function toggle(): Promise<'dark' | 'light'> {
    const mode = await currentMode()
    const next = mode === 'dark' ? 'light' : 'dark'
    await applyMode(next)
    // A manual toggle opts out of auto until the user re-enables it.
    await setThemeMode('manual')
    return next
  }

  const LIGHT_KEY = 'lightTheme'
  const DARK_KEY = 'darkTheme'
  const BUILTIN_THEME = 'builtin'
  const DEFAULT_LIGHT = BUILTIN_THEME
  const DEFAULT_DARK = BUILTIN_THEME

  async function getConfig() {
    const light = (await orca.storage.get(LIGHT_KEY)) as string | null
    const dark = (await orca.storage.get(DARK_KEY)) as string | null
    return { light: light || DEFAULT_LIGHT, dark: dark || DEFAULT_DARK }
  }

  async function setConfig(input: { light?: string; dark?: string }) {
    if (input.light !== undefined) await orca.storage.set(LIGHT_KEY, input.light)
    if (input.dark !== undefined) await orca.storage.set(DARK_KEY, input.dark)
    const cfg = await getConfig()
    orca.panels.post('config.changed', { light: cfg.light, dark: cfg.dark })
    return cfg
  }

  orca.commands.register('toggle', async () => toggle())
  orca.commands.register('list-themes', async () => {
    const themes = listInstalledThemes()
    console.log('[toggle-theme] Installed themes:')
    for (const t of themes) console.log('  ' + t)
    return themes
  })

  orca.panels.handle('themes.list', async () => ({ themes: listInstalledThemes() }))
  orca.panels.handle('config.get', async () => getConfig())
  orca.panels.handle('config.set', async (input: any) => setConfig(input || {}))
  orca.panels.handle('apply', async (input: any) => { await applyMode(input?.mode === 'dark' ? 'dark' : 'light'); return { mode: input?.mode === 'dark' ? 'dark' : 'light' } })
  orca.panels.handle('toggle', async () => ({ mode: await toggle() }))
  orca.panels.handle('themeMode.get', async () => ({ mode: await getThemeMode() }))
  orca.panels.handle('themeMode.set', async (input: any) => {
    await setThemeMode(input?.mode === 'auto' ? 'auto' : 'manual')
    const m = await getThemeMode()
    if (m === 'auto') startAutoTimer(); else stopAutoTimer()
    const { light, dark } = await getAutoTimes()
    orca.panels.post('themeMode.changed', { mode: m, light, dark })
    return { mode: m }
  })
  orca.panels.handle('autoTimes.get', async () => getAutoTimes())
  orca.panels.handle('autoTimes.set', async (input: any) => {
    const times = await setAutoTimes(input || {})
    const m = await getThemeMode()
    if (m === 'auto') void runAutoTick()
    orca.panels.post('themeMode.changed', { mode: m, light: times.light, dark: times.dark })
    return times
  })

  // Resolves the configured theme for a mode from storage. An empty value
  // (or the "builtin" sentinel) means "Use Orca defaults": apply Orca's real
  // built-in light/dark palette bundled in this plugin (no Ayu fallback).
  function orcaBuiltin(mode: 'dark' | 'light'): ResolvedTheme {
    return mode === 'dark'
      ? { app: ORCA_BUILTIN_DARK_APP, terminal: ORCA_BUILTIN_DARK_TERMINAL }
      : { app: ORCA_BUILTIN_LIGHT_APP, terminal: ORCA_BUILTIN_LIGHT_TERMINAL }
  }
  async function configuredTheme(mode: 'dark' | 'light'): Promise<ResolvedTheme> {
    const cfg = await getConfig()
    const id = mode === 'dark' ? cfg.dark : cfg.light
    if (!id || id === BUILTIN_THEME) return orcaBuiltin(mode)
    const resolved = resolveTheme(id)
    return resolved ?? orcaBuiltin(mode)
  }

  // ---- Scheduled auto mode (times are "HH:MM" on the local clock) ----
  const THEME_MODE_KEY = 'themeMode'
  const AUTO_LIGHT_TIME_KEY = 'autoLightTime'
  const AUTO_DARK_TIME_KEY = 'autoDarkTime'
  const DEFAULT_LIGHT_TIME = '07:00'
  const DEFAULT_DARK_TIME = '19:00'
  const AUTO_POLL_MS = 60_000

  async function getThemeMode(): Promise<'manual' | 'auto'> {
    const v = (await orca.storage.get(THEME_MODE_KEY)) as string | null
    return v === 'auto' ? 'auto' : 'manual'
  }
  async function setThemeMode(v: 'manual' | 'auto') {
    await orca.storage.set(THEME_MODE_KEY, v)
  }
  async function getAutoTimes(): Promise<{ light: string; dark: string }> {
    const light = (await orca.storage.get(AUTO_LIGHT_TIME_KEY)) as string | null
    const dark = (await orca.storage.get(AUTO_DARK_TIME_KEY)) as string | null
    return {
      light: light && TIME_RE.test(light) ? light : DEFAULT_LIGHT_TIME,
      dark: dark && TIME_RE.test(dark) ? dark : DEFAULT_DARK_TIME
    }
  }
  async function setAutoTimes(input: { light?: string; dark?: string }): Promise<{ light: string; dark: string }> {
    if (input.light !== undefined && TIME_RE.test(input.light)) await orca.storage.set(AUTO_LIGHT_TIME_KEY, input.light)
    if (input.dark !== undefined && TIME_RE.test(input.dark)) await orca.storage.set(AUTO_DARK_TIME_KEY, input.dark)
    return getAutoTimes()
  }

  let lastAutoMode: 'dark' | 'light' | null = null

  async function runAutoTick(): Promise<void> {
    try {
      const mode = await getThemeMode()
      if (mode !== 'auto') return
      const { light: lightTime, dark: darkTime } = await getAutoTimes()
      const lightMinutes = parseTimeMinutes(lightTime)
      const darkMinutes = parseTimeMinutes(darkTime)
      if (lightMinutes === null || darkMinutes === null) return
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const target = autoTargetMode(nowMinutes, lightMinutes, darkMinutes)
      if (target === lastAutoMode) return
      const { app, terminal } = await configuredTheme(target)
      const revisionResult = (await orca.host.call('appearance.read')) as { revision: string }
      await orca.host.call('appearance.apply', { expectedRevision: revisionResult.revision, app, terminal })
      await orca.storage.set(STORAGE_KEY, target)
      await orca.host.call('statusBar.update', {
        id: 'toggle',
        text: target === 'dark' ? '☾' : '☀'
      })
      lastAutoMode = target
      console.log('[toggle-theme] applied', target)
      orca.panels.post('themeMode.changed', { mode: 'auto', light: lightTime, dark: darkTime })
    } catch (err) {
      console.log('[toggle-theme] auto tick failed', String(err))
    }
  }

  let autoTimer: ReturnType<typeof setInterval> | null = null
  function startAutoTimer() {
    if (autoTimer) clearInterval(autoTimer)
    void runAutoTick()
    autoTimer = setInterval(() => void runAutoTick(), AUTO_POLL_MS)
  }
  function stopAutoTimer() {
    if (autoTimer) clearInterval(autoTimer)
    autoTimer = null
  }

  void getThemeMode().then((m) => { if (m === 'auto') startAutoTimer() })


  void currentMode().then((mode) => {
    void orca.host.call('statusBar.update', {
      id: 'toggle',
      text: mode === 'dark' ? '☾' : '☀'
    })
  })
}