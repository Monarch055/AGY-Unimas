req:
"the latex function is not rendered, can you fix it?"
Render mathematical LaTeX formulas properly across `apps/web` (in the age-adaptive module viewer, science/math concept text, and printable academic PDF lab reports) instead of displaying raw LaTeX strings inside monospace `<code>` blocks.

initial_plan:
1. Research and install a fast, browser-safe, SSR-compatible LaTeX rendering engine (KaTeX) in `apps/web`.
2. Create a reusable component `LatexRenderer.tsx`:
   - `sanitizeLatexFormula`: clean whitespace, strip `\(..\)`, `\[..\]`, `$$..$$`, `$..$` wrappers, and normalize double backslashes.
   - `renderLatexToHtml`: call `katex.renderToString` with error fallback.
   - `LatexRenderer`: React component for inline or block display.
   - `LatexText`: utility component that scans mixed text for inline/block delimiters and renders mixed text + KaTeX formulas.
3. Import KaTeX CSS in `apps/web/src/app/layout.tsx`.
4. Integrate `LatexRenderer` and `LatexText` into `AdaptiveSTEMModuleAndARLab.tsx`.
5. Enhance `apps/web/src/lib/ar-and-pdf-engine.ts` so printable academic PDF HTML incorporates KaTeX CSS and converts LaTeX formulas into HTML/MathML.
6. Add unit test for LaTeX rendering to `apps/web/tests/web-engine.test.mjs`.

revision:
1. KaTeX CSS hoisting: In this npm workspaces monorepo, KaTeX CSS is hoisted to root `node_modules/katex/dist/katex.min.css`. Next.js App Router resolves `import 'katex/dist/katex.min.css'` cleanly.
2. In printable PDF generation, since the preview/print window might run disconnected or in a separate tab, link the official KaTeX CDN stylesheet in `<head>` while rendering HTML/MathML directly into the document so it is printable offline if already loaded or rendered.
3. Handle both raw formulas (e.g. `I = \frac{V}{R}`) and formulas with literal double backslashes from JSON parsing (`I = \\frac{V}{R}`).
4. Add `*.tsbuildinfo` to `.gitignore` to keep git workspace clean.

final_plan:
1. Install `katex` (^0.19.0) and `@types/katex` (^0.16.8) in `apps/web/package.json`.
2. Implement `apps/web/src/components/LatexRenderer.tsx`.
3. Import `katex/dist/katex.min.css` in `apps/web/src/app/layout.tsx`.
4. Update `AdaptiveSTEMModuleAndARLab.tsx` and `ar-and-pdf-engine.ts`.
5. Add automated unit test in `apps/web/tests/web-engine.test.mjs`.
6. Run full test suite across monorepo (`make test` equivalent: node tests + python tests).
7. Push changes to `origin/main` and provide clear documentation to user.
