import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from '../i18n/dictionary';
import { buildAppShare, initialGuideOpen } from './homeGuide';

describe('initialGuideOpen', () => {
  it('opens for a newcomer and stays out of the way once there are trips', () => {
    expect(initialGuideOpen(null, false)).toBe(true);
    expect(initialGuideOpen(null, true)).toBe(false);
  });

  it('follows what the visitor chose last time', () => {
    expect(initialGuideOpen('1', true)).toBe(true);
    expect(initialGuideOpen('0', false)).toBe(false);
  });

  it('treats an unreadable stored value as no preference', () => {
    expect(initialGuideOpen('maybe', true)).toBe(false);
    expect(initialGuideOpen('maybe', false)).toBe(true);
  });
});

describe('buildAppShare', () => {
  it('shares the site root with the app name and the pitch', () => {
    const share = buildAppShare(DICTIONARIES.vn, 'https://group-travels.onrender.com');
    expect(share.url).toBe('https://group-travels.onrender.com/');
    expect(share.title).toBe(DICTIONARIES.vn.app.name);
    expect(share.text).toContain(DICTIONARIES.vn.homeGuide.sharePitch);
  });

  it('never doubles the trailing slash', () => {
    expect(buildAppShare(DICTIONARIES.en, 'https://x.test/').url).toBe('https://x.test/');
  });
});
