/**
 * Self-contained stylesheet for the devtool's shadow root.
 *
 * The CSS lives inline so consumers can ship the bundled IIFE without
 * worrying about a separate stylesheet. Shadow DOM gives us strict
 * isolation — none of these rules leak to the host page and host styles
 * don't reach us. Variables are intentionally non-CSS-property names
 * scoped to `:host` so they cannot be perturbed by the host's `:root`
 * cascade.
 */

export const STYLES = /* css */ `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  color-scheme: light dark;
  --dt-bg: #ffffff;
  --dt-bg-sunk: #f5f5f5;
  --dt-ink: #1a1a1a;
  --dt-ink-soft: #555555;
  --dt-ink-mute: #888888;
  --dt-line: #e0e0e0;
  --dt-accent: #4a9b7a;
  --dt-shadow: 0 4px 18px rgba(0,0,0,0.2);
}
@media (prefers-color-scheme: dark) {
  :host {
    --dt-bg: #1a1a1a;
    --dt-bg-sunk: #0f0f0f;
    --dt-ink: #ecead8;
    --dt-ink-soft: #b8b3a0;
    --dt-ink-mute: #7d7868;
    --dt-line: #2a2620;
    --dt-accent: #88c4a8;
    --dt-shadow: 0 4px 18px rgba(0,0,0,0.5);
  }
}

.fab {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483640;
  background: var(--dt-ink);
  color: var(--dt-bg);
  border: none;
  border-radius: 999px;
  padding: 10px 14px;
  font: 500 12px ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  cursor: pointer;
  box-shadow: var(--dt-shadow);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
}
.fab:hover { transform: translateY(-1px); }
.fab svg { width: 14px; height: 14px; }

.modal[hidden] { display: none !important; }
.modal {
  position: fixed;
  inset: 0;
  z-index: 2147483641;
  display: flex;
  justify-content: flex-end;
}
.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
  cursor: pointer;
}
.panel {
  position: relative;
  width: min(560px, 100vw);
  height: 100vh;
  background: var(--dt-bg);
  border-left: 1px solid var(--dt-line);
  box-shadow: -8px 0 24px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  animation: slidein 200ms ease-out;
}
@keyframes slidein {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
.head {
  flex-shrink: 0;
  padding: 14px 16px 0 16px;
  border-bottom: 1px solid var(--dt-line);
}
.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
}
.head-row h2 {
  margin: 0;
  font: 500 15px ui-serif, Georgia, serif;
  color: var(--dt-ink);
}
.close {
  background: none;
  border: none;
  font-size: 22px;
  line-height: 1;
  color: var(--dt-ink-mute);
  cursor: pointer;
  padding: 6px 10px;
  min-height: 44px;
  min-width: 44px;
}
.close:hover { color: var(--dt-ink); }

.tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
}
.tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--dt-ink-soft);
  font: 500 12px ui-monospace, "SF Mono", Menlo, monospace;
  padding: 8px 12px;
  cursor: pointer;
  white-space: nowrap;
  min-height: 36px;
}
.tab[aria-selected="true"] {
  color: var(--dt-ink);
  border-bottom-color: var(--dt-accent);
}

.body {
  flex: 1;
  overflow: auto;
  padding: 14px 16px;
  background: var(--dt-bg);
}
.body pre {
  margin: 0;
  font: 12px/1.55 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  color: var(--dt-ink-soft);
  white-space: pre-wrap;
  word-break: break-word;
}
.empty {
  color: var(--dt-ink-mute);
  font-style: italic;
  font-size: 13px;
}
.note {
  padding: 10px 16px;
  background: var(--dt-bg-sunk);
  border-top: 1px solid var(--dt-line);
  font-size: 12px;
  color: var(--dt-ink-mute);
  line-height: 1.5;
}
.note code {
  background: var(--dt-bg);
  padding: 1px 4px;
  border-radius: 3px;
}

@media (max-width: 540px) {
  .panel { width: 100vw; border-left: none; }
  .fab { right: 12px; bottom: 12px; }
}
`;
