/**
 * Tests for tokenExtractor utility
 */

import { extractDesignTokens, exportTokensAsCSS, exportTokensAsJSON } from '../tokenExtractor';

describe('tokenExtractor', () => {
  const mockFigmaNode = {
    name: 'Test Component',
    absoluteBoundingBox: { width: 200, height: 100, x: 0, y: 0 },
    fills: [
      {
        type: 'SOLID',
        color: { r: 0.2, g: 0.4, b: 0.8 } // #3366cc
      }
    ],
    strokes: [
      {
        color: { r: 0, g: 0, b: 0 } // #000000
      }
    ],
    strokeWeight: 2,
    cornerRadius: 8,
    children: [
      {
        name: 'Text Element',
        type: 'TEXT',
        absoluteBoundingBox: { width: 150, height: 30, x: 25, y: 35 },
        style: {
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: 'bold',
          lineHeightPx: 20
        },
        fills: [
          {
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 } // #ffffff
          }
        ]
      },
      {
        name: 'Button',
        absoluteBoundingBox: { width: 80, height: 32, x: 60, y: 68 },
        fills: [
          {
            type: 'SOLID',
            color: { r: 0.2, g: 0.4, b: 0.8 } // #3366cc (same as parent)
          }
        ],
        cornerRadius: 4
      }
    ]
  };

  describe('extractDesignTokens', () => {
    it('should extract colors correctly', () => {
      const tokens = extractDesignTokens(mockFigmaNode);
      
      expect(tokens.colors).toHaveLength(3); // Background, text, border
      expect(tokens.colors[0].hex).toBe('#3366cc');
      expect(tokens.colors[0].usage).toContain('background');
      expect(tokens.colors[0].count).toBe(2); // Used twice
    });

    it('should extract spacing values correctly', () => {
      const tokens = extractDesignTokens(mockFigmaNode);
      
      expect(tokens.spacing).toContain(25); // Left padding
      expect(tokens.spacing).toContain(35); // Top padding
      expect(tokens.spacing.length).toBeGreaterThan(0);
    });

    it('should extract typography correctly', () => {
      const tokens = extractDesignTokens(mockFigmaNode);
      
      expect(tokens.typography).toHaveLength(1);
      expect(tokens.typography[0].family).toBe('Inter');
      expect(tokens.typography[0].size).toBe(16);
      expect(tokens.typography[0].weight).toBe('bold');
      expect(tokens.typography[0].lineHeight).toBe(20);
    });

    it('should extract borders correctly', () => {
      const tokens = extractDesignTokens(mockFigmaNode);
      
      expect(tokens.borders.widths).toContain(2);
      expect(tokens.borders.radii).toContain(8);
      expect(tokens.borders.radii).toContain(4);
    });

    it('should calculate summary correctly', () => {
      const tokens = extractDesignTokens(mockFigmaNode);
      
      expect(tokens.summary.totalColors).toBe(3);
      expect(tokens.summary.totalSpacingValues).toBeGreaterThan(0);
      expect(tokens.summary.totalFontStyles).toBe(1);
      expect(tokens.summary.totalBorderWidths).toBe(1);
      expect(tokens.summary.totalBorderRadii).toBe(2);
    });

    it('should handle empty nodes gracefully', () => {
      const tokens = extractDesignTokens(null);
      
      expect(tokens.colors).toEqual([]);
      expect(tokens.spacing).toEqual([]);
      expect(tokens.typography).toEqual([]);
      expect(tokens.borders).toEqual({ widths: [], radii: [] });
      expect(tokens.effects).toEqual([]);
      expect(tokens.summary.totalColors).toBe(0);
    });

    it('should detect spacing patterns', () => {
      const nodeWithPattern = {
        ...mockFigmaNode,
        children: [
          { absoluteBoundingBox: { x: 8, y: 8, width: 10, height: 10 } },
          { absoluteBoundingBox: { x: 24, y: 8, width: 10, height: 10 } },
          { absoluteBoundingBox: { x: 40, y: 8, width: 10, height: 10 } }
        ]
      };
      
      const tokens = extractDesignTokens(nodeWithPattern);
      
      expect(tokens.spacingPattern).toBeTruthy();
      expect(tokens.spacingPattern.grid).toBe(4); // 4px grid detected from 8px, 16px, 32px spacing
      expect(tokens.spacingPattern.detected).toBeDefined();
    });
  });

  describe('exportTokensAsCSS', () => {
    it('should generate valid CSS with custom properties', () => {
      const tokens = extractDesignTokens(mockFigmaNode);
      const css = exportTokensAsCSS(tokens);
      
      expect(css).toContain(':root {');
      expect(css).toContain('/* Colors */');
      expect(css).toContain('--color-1: #3366cc;');
      expect(css).toContain('/* Spacing */');
      expect(css).toContain('--spacing-');
      expect(css).toContain('/* Typography */');
      expect(css).toContain('--font-1-family: Inter;');
      expect(css).toContain('/* Border Radius */');
      expect(css).toContain('--radius-');
      expect(css).toContain('}');
    });

    it('should handle empty tokens gracefully', () => {
      const emptyTokens = {
        colors: [],
        spacing: [],
        typography: [],
        borders: { widths: [], radii: [] },
        effects: [],
        summary: { totalColors: 0, totalSpacingValues: 0, totalFontStyles: 0 }
      };
      
      const css = exportTokensAsCSS(emptyTokens);
      
      expect(css).toContain(':root {');
      expect(css).toContain('/* Design Tokens Generated by Smart Handoff */');
      expect(css).toContain('}');
    });
  });

  describe('exportTokensAsJSON', () => {
    it('should generate valid JSON structure', () => {
      const tokens = extractDesignTokens(mockFigmaNode);
      const json = exportTokensAsJSON(tokens);
      
      expect(() => JSON.parse(json)).not.toThrow();
      
      const parsed = JSON.parse(json);
      expect(parsed.colors).toBeDefined();
      expect(parsed.spacing).toBeDefined();
      expect(parsed.typography).toBeDefined();
      expect(parsed.borders).toBeDefined();
      expect(parsed.meta).toBeDefined();
      expect(parsed.meta.generatedBy).toBe('Smart Handoff');
    });

    it('should include proper token structure', () => {
      const tokens = extractDesignTokens(mockFigmaNode);
      const json = exportTokensAsJSON(tokens);
      const parsed = JSON.parse(json);
      
      expect(parsed.colors['color-1']).toBeDefined();
      expect(parsed.colors['color-1'].value).toBe('#3366cc');
      expect(parsed.colors['color-1'].type).toBe('color');
      expect(parsed.colors['color-1'].usage).toContain('background');
      
      expect(parsed.typography['font-1']).toBeDefined();
      expect(parsed.typography['font-1'].family).toBe('Inter');
      expect(parsed.typography['font-1'].type).toBe('typography');
    });
  });
});
