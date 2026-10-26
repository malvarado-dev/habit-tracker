import { describe, expect, it } from '@jest/globals';
import { StyleSheet } from 'react-native';

import { cardEdge, darkTheme, shadows } from './tokens';

// Bug: in dark mode a hairline card edge renders faint and uneven on Android, and the light
// shadow reads as a muddy halo. Every pill card uses cardEdge, so this guards all of them.
describe('card edge', () => {
  it('dark: a solid 1 pt border-dark edge and no shadow', () => {
    expect(cardEdge('dark', darkTheme.border)).toEqual({ borderWidth: 1, borderColor: '#73786A' });
  });

  it('light: a hairline with the soft warm shadow', () => {
    expect(cardEdge('light', '#ECE8DF')).toEqual({
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#ECE8DF',
      boxShadow: shadows.card,
    });
  });
});
