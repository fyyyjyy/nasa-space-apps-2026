import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createContextNotice } from '../src/ui/contextNotice.js';
import { STRINGS } from '../src/ui/strings.js';

describe('context notice', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('shows one message on loss, keeps it past 5 s, removes it on restore', () => {
    const notice = createContextNotice();
    notice.onChange(true);
    notice.onChange(true);
    expect(document.querySelectorAll('.toast')).toHaveLength(1);
    expect(document.querySelector('.toast').textContent).toBe(STRINGS.toast.contextLost);
    vi.advanceTimersByTime(60_000);
    expect(document.querySelectorAll('.toast')).toHaveLength(1);
    notice.onChange(false);
    expect(document.querySelectorAll('.toast')).toHaveLength(0);
  });

  it('ignores a restore with no prior loss', () => {
    expect(() => createContextNotice().onChange(false)).not.toThrow();
  });
});
