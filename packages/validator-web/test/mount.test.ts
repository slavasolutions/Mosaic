import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '../src/mount.js';

describe('mount — DOM construction', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
  });

  it('builds a drop zone, file input, and pick button', () => {
    const host = document.getElementById('host') as HTMLElement;
    mount({ host });
    expect(host.querySelector('.mosaic-validator-web-dropzone')).toBeTruthy();
    expect(host.querySelector('.mosaic-validator-web-pick')).toBeTruthy();
    expect(host.querySelector('input.mosaic-validator-web-input')).toBeTruthy();
    expect(host.querySelector('.mosaic-validator-web-results')).toBeTruthy();
  });

  it('is idempotent — second mount replaces prior content', () => {
    const host = document.getElementById('host') as HTMLElement;
    mount({ host });
    const first = host.querySelector('.mosaic-validator-web-dropzone');
    mount({ host });
    const second = host.querySelector('.mosaic-validator-web-dropzone');
    expect(host.querySelectorAll('.mosaic-validator-web-dropzone')).toHaveLength(1);
    expect(second).not.toBe(first);
  });

  it('adds is-over class on dragover and removes it on dragleave', () => {
    const host = document.getElementById('host') as HTMLElement;
    mount({ host });
    const dz = host.querySelector('.mosaic-validator-web-dropzone') as HTMLElement;
    dz.dispatchEvent(new Event('dragover', { cancelable: true, bubbles: true }));
    expect(dz.classList.contains('is-over')).toBe(true);
    dz.dispatchEvent(new Event('dragleave', { bubbles: true }));
    expect(dz.classList.contains('is-over')).toBe(false);
  });
});
