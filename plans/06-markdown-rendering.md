# Markdown Rendering Enhancement

## Context: what this plan is and when to use it

This plan describes how to enhance markdown rendering in agent responses, supporting bold, italic, colored text, and other formatting to make responses more readable and visually appealing.

- **When you want this**: you want agent responses to display formatted text with bold, italic, colors, and other markdown features instead of plain text.
- **What it enables**:
  - **Bold/italic text**: `**bold**` and `*italic*` formatting in responses
  - **Colored text**: Support for colored spans using markdown or custom syntax
  - **Inline code**: Better rendering of `inline code` blocks
  - **Rich formatting**: Multiple formatting styles can be combined
  - **Theme-aware colors**: Colors work with the existing theme system
  - **Testable parsing**: Markdown parsing logic is isolated and testable

This document intentionally avoids implementation-sized code blocks. The source of truth should live in `src/` and be validated by `tests/`.

## Where to start in this repo

- **Markdown parsing**: `src/utils/markdown.ts` (extend existing file)
- **Transcript rendering**: `src/components/TranscriptView.tsx` (update to use parsed markdown)
- **Types**: `src/shared/types.ts` (add formatted text types)
- **Tests**: `tests/utils/markdown.test.ts` (new file)

---

## Phase 1: Markdown Parser Foundation (PR 1)

Create a parser that converts markdown text into structured format tokens that can be rendered with Ink's Text component.

### What changes

- **Modify**: `src/utils/markdown.ts`
  - Add `FormattedTextPart` type for parsed markdown tokens
  - Add `parseMarkdown(text: string): FormattedTextPart[]` function
  - Support parsing: `**bold**`, `*italic*`, `` `code` ``, and plain text
  - Handle nested formatting (e.g., `**bold *italic* text**`)
  - Handle escaped characters (e.g., `\*` should not be italic)

- **Modify**: `src/shared/types.ts`
  - Add `FormattedTextPart` type export
  - Extend `FormattedTextPartType` enum if needed

### FormattedTextPart structure

```typescript
type FormattedTextPart = {
  type: 'text' | 'bold' | 'italic' | 'code';
  content: string;
  color?: string;
}
```

### Parsing strategy

1. Parse markdown sequentially, tracking open/close markers
2. Handle nested formatting by maintaining a stack of active formats
3. Escape sequences: `\*`, `\**`, `` \` `` should be literal
4. Code blocks: `` `code` `` should be parsed as inline code
5. Plain text segments between formatting are separate parts

### Edge cases to handle

- Unclosed formatting (e.g., `**bold` without closing)
- Overlapping formatting (e.g., `**bold *italic** text*`)
- Empty formatting (e.g., `****`)
- Code blocks containing markdown (should not parse inner markdown)

### Unit tests: markdown parser

- [ ] **Bold parsing**: `**text**` → `[{type: 'bold', content: 'text'}]`
- [ ] **Italic parsing**: `*text*` → `[{type: 'italic', content: 'text'}]`
- [ ] **Code parsing**: `` `code` `` → `[{type: 'code', content: 'code'}]`
- [ ] **Plain text**: `hello` → `[{type: 'text', content: 'hello'}]`
- [ ] **Mixed formatting**: `**bold** and *italic*` → correct parts array
- [ ] **Nested formatting**: `**bold *italic* text**` → nested structure
- [ ] **Escaped characters**: `\*text\*` → literal asterisks, not italic
- [ ] **Unclosed bold**: `**text` → handle gracefully (treat as plain text or close automatically)
- [ ] **Empty formatting**: `****` → handle gracefully
- [ ] **Code with markdown**: `` `**bold**` `` → code part contains literal `**bold**`
- [ ] **Multiple formats**: `**bold** *italic* ``code`` ` → all parsed correctly

### Suggested test cases

- [ ] **Simple bold**: parse `**hello**` → single bold part
- [ ] **Simple italic**: parse `*world*` → single italic part
- [ ] **Combined**: parse `**bold** and *italic*` → three parts (bold, text, italic)
- [ ] **Nested**: parse `**bold *nested* text**` → bold part containing italic
- [ ] **Escaped**: parse `\*not italic\*` → text part with literal asterisks
- [ ] **Code**: parse `` `const x = 1` `` → code part
- [ ] **Complex**: parse `**bold** with ``code`` and *italic*` → all parts correct

---

## Phase 2: Color Support (PR 2)

Add support for colored text spans in markdown, using theme-aware colors.

### What changes

- **Modify**: `src/utils/markdown.ts`
  - Extend `FormattedTextPart` to support `color` property
  - Add parsing for colored spans (syntax TBD: HTML-like `<color:red>text</color>` or markdown extension)
  - Map color names to theme colors or Ink color names
  - Support named colors: `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`, etc.

- **Add**: `src/utils/color-mapping.ts` (optional)
  - Map color names to Ink color strings
  - Support theme-aware color resolution (if theme context available)

### Color syntax options

**Option A: HTML-like tags** (recommended for flexibility)
- `<color:red>text</color>` or `<color:#FF0000>text</color>`
- Pros: familiar syntax, supports hex colors
- Cons: might conflict with actual HTML in responses

**Option B: Markdown extension**
- `{color:red}text{/color}` or `[color:red]text[/color]`
- Pros: less likely to conflict
- Cons: custom syntax, less familiar

**Option C: ANSI codes in markdown**
- Use ANSI escape sequences directly
- Pros: direct control
- Cons: not markdown, harder to parse

**Recommendation**: Start with Option B (`{color:red}text{/color}`) for safety, can extend later.

### Color mapping

- Named colors map to Ink color strings: `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`, `white`, `gray`, etc.
- Hex colors: convert to nearest named color or support hex directly if Ink supports it
- Theme colors: use theme system colors when available (e.g., `{color:error}` maps to `theme.error`)

### Unit tests: color parsing

- [ ] **Named color**: `{color:red}text{/color}` → part with `color: 'red'`
- [ ] **Hex color**: `{color:#FF0000}text{/color}` → part with appropriate color
- [ ] **Theme color**: `{color:error}text{/color}` → part with theme error color
- [ ] **Nested color**: `**bold {color:red}text{/color}**` → bold part with colored child
- [ ] **Unclosed color**: `{color:red}text` → handle gracefully
- [ ] **Invalid color**: `{color:invalid}text{/color}` → fallback to default or ignore

---

## Phase 3: Render Formatted Text with Ink (PR 3)

Update TranscriptView to render parsed markdown parts using Ink's Text component formatting props.

### What changes

- **Modify**: `src/components/TranscriptView.tsx`
  - Update `buildTranscriptLines()` to parse markdown for assistant messages
  - Create `renderFormattedText(parts: FormattedTextPart[], width: number): TranscriptLine[]` function
  - Use Ink's `bold` prop for bold parts
  - Use Ink's styling for italic (if supported) or fallback
  - Apply colors from parsed parts
  - Handle text wrapping across formatted parts

- **Modify**: `src/components/TranscriptLines.tsx`
  - Update to render formatted text parts (may need to use multiple Text components per line)
  - Support `bold` prop on Text components
  - Handle inline formatting within wrapped lines

### Ink formatting capabilities

From codebase inspection:
- `Text` component supports: `color`, `bold`, `dimColor`
- Need to check: italic support (may need workaround or library)
- Multiple Text components can be used inline: `<Text bold>bold</Text><Text>normal</Text>`

### Rendering strategy

1. Parse markdown into parts
2. For each part, create appropriate Text component with props
3. Handle wrapping: split long parts across lines while preserving formatting
4. Combine multiple formatted parts on same line when possible

### Wrapping considerations

- When text wraps, formatting should persist across lines
- Code blocks should wrap as a unit (don't break mid-word)
- Bold/italic should wrap naturally

### Unit tests: rendering

- [ ] **Bold text renders**: bold parts use `bold` prop
- [ ] **Italic text renders**: italic parts use appropriate styling
- [ ] **Code renders**: code parts use code styling (color, maybe monospace)
- [ ] **Colors apply**: colored parts use specified color
- [ ] **Wrapping works**: long formatted text wraps correctly
- [ ] **Nested formatting**: nested parts render correctly
- [ ] **Mixed formatting**: multiple formats on same line render correctly

### Component tests

- [ ] **TranscriptView with markdown**: assistant message with `**bold**` renders bold
- [ ] **Multiple formats**: message with bold, italic, and code all render correctly
- [ ] **Theme colors**: colored text uses theme colors when available
- [ ] **Wrapping**: long formatted messages wrap without breaking formatting

---

## Phase 4: Enhanced Markdown Features (PR 4)

Add support for additional markdown features: strikethrough, underline, and better code block handling.

### What changes

- **Modify**: `src/utils/markdown.ts`
  - Add support for `~~strikethrough~~` syntax
  - Add support for underline (syntax TBD: `__text__` or `<u>text</u>`)
  - Improve code block parsing (handle multi-line code blocks)
  - Support code block language hints (`` ```typescript` ``)

- **Modify**: `src/shared/types.ts`
  - Add `strikethrough` and `underline` to `FormattedTextPartType`

### Strikethrough and underline

- Strikethrough: `~~text~~` → part with `strikethrough: true`
- Underline: `__text__` or `<u>text</u>` → part with `underline: true`
- Check Ink support: may need to use ANSI codes or library for strikethrough/underline

### Code blocks

- Multi-line code blocks: `` ```code``` ``
- Language hints: `` ```typescript\ncode\n``` ``
- Render in bordered blocks (similar to existing code block rendering)

### Unit tests: enhanced features

- [ ] **Strikethrough**: `~~text~~` → strikethrough part
- [ ] **Underline**: `__text__` → underline part
- [ ] **Code block**: `` ```\ncode\n``` `` → code block part
- [ ] **Code block with language**: `` ```typescript\ncode\n``` `` → code block with language
- [ ] **Nested in bold**: `**bold ~~strike~~ text**` → correct nesting

---

## Phase 5: Comprehensive Tests (PR 5)

Add comprehensive test coverage for all markdown rendering functionality.

### Test coverage goals

- [ ] **Parser tests**: `tests/utils/markdown.test.ts`
  - All markdown syntax variations
  - Edge cases and error handling
  - Performance with long text

- [ ] **Rendering tests**: `tests/components/TranscriptView.test.tsx`
  - Formatted text renders correctly
  - Wrapping preserves formatting
  - Theme integration works

- [ ] **Integration tests**: `tests/integration/markdown.test.tsx` (optional)
  - Full flow: markdown → parse → render
  - Real agent responses with markdown
  - Visual regression tests (snapshots)

### Test utilities

- [ ] **Add**: `tests/utils/markdown-test-utils.ts`
  - Helper functions for creating test markdown
  - Assertion helpers for formatted parts
  - Mock theme for color tests

### Performance tests

- [ ] **Long text**: parse and render very long markdown (1000+ lines)
- [ ] **Complex nesting**: deeply nested formatting (10+ levels)
- [ ] **Many formats**: message with 100+ formatted parts

---

## Stacked PR Strategy

Use Graphite to create stacked PRs:

1. **PR 1**: Markdown parser foundation (`src/utils/markdown.ts`)
   - Base: `feature/markdown-rendering` (feature branch)
   - Branch: `graphite-base/markdown-parser`

2. **PR 2**: Color support (`src/utils/markdown.ts`, `src/utils/color-mapping.ts`)
   - Base: `graphite-base/markdown-parser`
   - Branch: `graphite-base/markdown-colors`

3. **PR 3**: Render formatted text (`src/components/TranscriptView.tsx`)
   - Base: `graphite-base/markdown-colors`
   - Branch: `graphite-base/markdown-render`

4. **PR 4**: Enhanced features (strikethrough, underline, code blocks)
   - Base: `graphite-base/markdown-render`
   - Branch: `graphite-base/markdown-enhanced`

5. **PR 5**: Comprehensive tests
   - Base: `graphite-base/markdown-enhanced`
   - Branch: `graphite-base/markdown-tests`

### Graphite commands

```bash
# Create feature branch (base for stack)
gt branch create markdown-rendering

# Create stacked branches
gt branch create markdown-parser --stack
gt branch create markdown-colors --stack
gt branch create markdown-render --stack
gt branch create markdown-enhanced --stack
gt branch create markdown-tests --stack

# After each PR is ready
gt stack submit
```

---

## Definition of done

- [ ] Markdown parser supports bold, italic, inline code, and colors
- [ ] Parser handles nested formatting and edge cases correctly
- [ ] Formatted text renders in TranscriptView with correct styling
- [ ] Colors are theme-aware and work with existing theme system
- [ ] Text wrapping preserves formatting across lines
- [ ] Comprehensive tests cover parser, renderer, and integration
- [ ] Performance is acceptable for typical agent responses
- [ ] Stacked PRs are created and ready for review

## Future enhancements (optional, post-MVP)

- [ ] **Syntax highlighting**: highlight code blocks based on language
- [ ] **Links**: render markdown links as clickable (if terminal supports)
- [ ] **Tables**: support markdown tables
- [ ] **Images**: handle image references (may not be applicable for terminal)
- [ ] **Custom themes**: allow user-defined color schemes for markdown
- [ ] **Performance optimization**: optimize parser for very long responses
- [ ] **Accessibility**: ensure formatted text is accessible (screen readers, etc.)

