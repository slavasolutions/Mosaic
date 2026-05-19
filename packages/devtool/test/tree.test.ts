import { describe, it, expect, beforeEach } from 'vitest';
import { buildTree, readTreeData, renderTree } from '../src/tree.js';

describe('buildTree', () => {
  it('infers directories from flat entries', () => {
    const tree = buildTree({
      entries: [
        { path: 'pages/about.json' },
        { path: 'pages/about.md' },
        { path: 'pages/blog/hello.json' },
        { path: 'index.json' },
      ],
    });
    const top = tree.map((n) => n.name);
    expect(top).toEqual(['pages', 'index.json']);
    const pages = tree.find((n) => n.name === 'pages')!;
    expect(pages.kind).toBe('dir');
    expect(pages.children.map((c) => c.name)).toEqual([
      'blog',
      'about.json',
      'about.md',
    ]);
    const blog = pages.children.find((c) => c.name === 'blog')!;
    expect(blog.kind).toBe('dir');
    expect(blog.children.map((c) => c.name)).toEqual(['hello.json']);
  });

  it('accepts the already-nested shape', () => {
    const tree = buildTree({
      children: [
        {
          name: 'tokens',
          kind: 'dir',
          children: [
            { name: 'default.json', kind: 'file' },
            { name: 'dark.json', kind: 'file' },
          ],
        },
        { name: 'index.json', kind: 'file' },
      ],
    });
    expect(tree.map((n) => n.name)).toEqual(['tokens', 'index.json']);
    const tokens = tree.find((n) => n.name === 'tokens')!;
    expect(tokens.children.map((c) => c.name)).toEqual([
      'dark.json',
      'default.json',
    ]);
  });

  it('promotes a name to dir when something later treats it as a parent', () => {
    const tree = buildTree({
      entries: [{ path: 'pages' }, { path: 'pages/about.json' }],
    });
    const pages = tree.find((n) => n.name === 'pages')!;
    expect(pages.kind).toBe('dir');
  });

  it('ignores empty / invalid entries', () => {
    const tree = buildTree({
      entries: [
        { path: '' },
        { path: '/' },
        // @ts-expect-error testing runtime tolerance
        null,
        { path: 'real.json' },
      ],
    });
    expect(tree.map((n) => n.name)).toEqual(['real.json']);
  });
});

describe('readTreeData', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns null when the script is absent', () => {
    expect(readTreeData(document)).toBeNull();
  });

  it('returns null when the script is empty or unparsable', () => {
    document.body.innerHTML =
      '<script type="application/json" id="mosaic-tree">   </script>';
    expect(readTreeData(document)).toBeNull();
    document.body.innerHTML =
      '<script type="application/json" id="mosaic-tree">not json</script>';
    expect(readTreeData(document)).toBeNull();
  });

  it('parses a flat-entries payload', () => {
    document.body.innerHTML =
      '<script type="application/json" id="mosaic-tree">' +
      JSON.stringify({ entries: [{ path: 'index.json' }] }) +
      '</script>';
    const data = readTreeData(document);
    expect(data).not.toBeNull();
    expect('entries' in data!).toBe(true);
  });
});

describe('renderTree', () => {
  it('marks the active path and its ancestors', () => {
    const container = document.createElement('div');
    renderTree(
      container,
      {
        entries: [
          { path: 'pages/about.json' },
          { path: 'pages/blog/hello.json' },
          { path: 'index.json' },
        ],
        activePath: 'pages/blog/hello.json',
      },
      document,
    );
    const active = container.querySelectorAll('.tree-node.is-active');
    expect(active).toHaveLength(1);
    expect(active[0]!.querySelector('.tree-label')!.textContent).toBe(
      'hello.json',
    );
    const ancestors = Array.from(
      container.querySelectorAll('.tree-node.is-active-ancestor'),
    ).map((n) => n.querySelector('.tree-label')!.textContent);
    expect(ancestors).toContain('pages');
    expect(ancestors).toContain('blog');
  });

  it('renders an SVG icon per row', () => {
    const container = document.createElement('div');
    renderTree(
      container,
      { entries: [{ path: 'pages/about.md' }, { path: 'index.json' }] },
      document,
    );
    const svgs = container.querySelectorAll('.tree-icon svg');
    expect(svgs.length).toBeGreaterThanOrEqual(3); // pages dir + about.md + index.json
  });
});
