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

// CSS stays inline so the bundle is single-file. Kept terse to fit the
// 12 KB IIFE budget — no whitespace beyond what the cascade needs.
const MONO = `ui-monospace,"SF Mono",Menlo,Consolas,monospace`;
export const STYLES = /* css */ `
:host{all:initial;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Arial,sans-serif;color-scheme:light dark;--b:#fff;--bs:#f5f5f5;--i:#1a1a1a;--is:#555;--im:#888;--l:#e0e0e0;--a:#4a9b7a;--sh:0 4px 18px rgba(0,0,0,.2)}
@media (prefers-color-scheme:dark){:host{--b:#1a1a1a;--bs:#0f0f0f;--i:#ecead8;--is:#b8b3a0;--im:#7d7868;--l:#2a2620;--a:#88c4a8;--sh:0 4px 18px rgba(0,0,0,.5)}}
.fab{position:fixed;right:16px;bottom:16px;z-index:2147483640;background:var(--i);color:var(--b);border:none;border-radius:999px;padding:10px 14px;font:500 12px ${MONO};cursor:pointer;box-shadow:var(--sh);display:inline-flex;align-items:center;gap:6px;min-height:44px}
.fab:hover{transform:translateY(-1px)}
.modal[hidden]{display:none!important}.modal{position:fixed;inset:0;z-index:2147483641;display:flex;justify-content:flex-end}
.backdrop{position:absolute;inset:0;background:rgba(0,0,0,.35);cursor:pointer}
.panel{position:relative;width:min(560px,100vw);height:100vh;background:var(--b);border-left:1px solid var(--l);box-shadow:-8px 0 24px rgba(0,0,0,.15);display:flex;flex-direction:column}
.head{flex-shrink:0;padding:14px 16px 0;border-bottom:1px solid var(--l)}
.head-row{display:flex;align-items:center;justify-content:space-between;padding-bottom:10px}
.head-row h2{margin:0;font:500 15px ui-serif,Georgia,serif;color:var(--i)}
.close{background:none;border:none;font-size:22px;line-height:1;color:var(--im);cursor:pointer;padding:6px 10px;min-height:44px;min-width:44px}
.close:hover{color:var(--i)}
.tabs{display:flex;overflow-x:auto}
.tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--is);font:500 12px ${MONO};padding:8px 12px;cursor:pointer;white-space:nowrap;min-height:36px}
.tab[aria-selected="true"]{color:var(--i);border-bottom-color:var(--a)}
.body{flex:1;overflow:auto;padding:14px 16px;background:var(--b)}
.body pre{margin:0;font:12px/1.55 ${MONO};color:var(--is);white-space:pre-wrap;word-break:break-word}
.empty{color:var(--im);font-style:italic;font-size:13px}
.note{padding:10px 16px;background:var(--bs);border-top:1px solid var(--l);font-size:12px;color:var(--im);line-height:1.5}
.note code{background:var(--b);padding:1px 4px;border-radius:3px}
.tree,.tree ul{list-style:none;margin:0;padding:0}
.tree ul{padding-left:16px;border-left:1px dashed var(--l);margin-left:6px}
.tree-row{display:flex;align-items:center;gap:6px;padding:2px 4px;border-radius:4px;font:12px/1.55 ${MONO};color:var(--is)}
.tree-icon{display:inline-flex;color:var(--im);flex-shrink:0}
.tree-icon svg,.fab svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
.tree-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tree-node.is-active>.tree-row{background:var(--bs);color:var(--i);font-weight:500}
.tree-node.is-active>.tree-row .tree-icon{color:var(--a)}
.tree-node.is-active-ancestor>.tree-row{color:var(--i)}
.sites{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.site-link{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border:1px solid var(--l);border-radius:6px;text-decoration:none;color:var(--i);background:var(--b)}
.site-link:hover{border-color:var(--a)}
.site-item.is-active .site-link{border-color:var(--a);background:var(--bs)}
.site-label{font:500 13px ui-serif,Georgia,serif}
.site-note{font:11px ${MONO};color:var(--im)}
@media (max-width:540px){.panel{width:100vw;border-left:none}.fab{right:12px;bottom:12px}}
`;
