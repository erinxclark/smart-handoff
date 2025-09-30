/**
 * Tests for accessibilityEnhancer utility
 */

import { enhanceWithAccessibility, checkColorContrast } from '../accessibilityEnhancer';

describe('accessibilityEnhancer', () => {
  describe('enhanceWithAccessibility', () => {
    it('should enhance button components with proper accessibility', () => {
      const buttonCode = `<div style={{ width: '120px', height: '40px', backgroundColor: '#3b82f6' }}>Submit</div>`;
      const componentDetection = {
        componentType: 'button',
        confidence: 85,
        reasoning: 'Contains button-like styling and text'
      };
      const figmaNode = {
        name: 'Submit Button',
        absoluteBoundingBox: { width: 120, height: 40, x: 100, y: 100 }
      };

      const result = enhanceWithAccessibility(buttonCode, componentDetection, figmaNode);
      
      expect(result.enhancedCode).toContain('<button');
      expect(result.enhancedCode).toContain('type="button"');
      expect(result.accessibilityReport.semanticHTML).toBe(true);
      expect(result.accessibilityReport.ariaLabels).toBe(true);
      expect(result.accessibilityReport.keyboardAccessible).toBe(true);
    });

    it('should enhance input components with proper accessibility', () => {
      const inputCode = `<div style={{ width: '250px', height: '40px' }}>Email Address</div>`;
      const componentDetection = {
        componentType: 'input',
        confidence: 90,
        reasoning: 'Contains input-like styling'
      };
      const figmaNode = {
        name: 'Email Input',
        absoluteBoundingBox: { width: 250, height: 40, x: 100, y: 100 }
      };

      const result = enhanceWithAccessibility(inputCode, componentDetection, figmaNode);
      
      expect(result.enhancedCode).toContain('<input');
      expect(result.enhancedCode).toContain('<label');
      expect(result.enhancedCode).toContain('htmlFor=');
      expect(result.enhancedCode).toContain('aria-describedby=');
      expect(result.accessibilityReport.semanticHTML).toBe(true);
    });

    it('should enhance card components with proper accessibility', () => {
      const cardCode = `<div style={{ width: '300px', height: '200px', backgroundColor: '#ffffff' }}>Card Content</div>`;
      const componentDetection = {
        componentType: 'card',
        confidence: 80,
        reasoning: 'Contains card-like styling'
      };
      const figmaNode = {
        name: 'Product Card',
        absoluteBoundingBox: { width: 300, height: 200, x: 100, y: 100 }
      };

      const result = enhanceWithAccessibility(cardCode, componentDetection, figmaNode);
      
      expect(result.enhancedCode).toContain('<article');
      expect(result.enhancedCode).toContain('role="article"');
      expect(result.accessibilityReport.semanticHTML).toBe(true);
    });

    it('should handle missing component data gracefully', () => {
      const result = enhanceWithAccessibility(null, null, null);
      
      expect(result.enhancedCode).toBeNull();
      expect(result.accessibilityReport.score).toBe(0);
      expect(result.accessibilityReport.issues).toContain('Missing component data');
    });
  });

  describe('checkColorContrast', () => {
    it('should check color contrast and return proper results', () => {
      const figmaNode = {
        fills: [
          {
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0 } // Black text
          }
        ],
        parent: {
          fills: [
            {
              type: 'SOLID',
              color: { r: 1, g: 1, b: 1 } // White background
            }
          ]
        }
      };

      const result = checkColorContrast(figmaNode);
      
      expect(result).toBeTruthy();
      expect(result.meetsAA).toBe(true);
      expect(result.meetsAAA).toBe(true);
      expect(result.ratio).toBeTruthy();
      expect(result.textColor).toBe('#000000');
      expect(result.backgroundColor).toBe('#ffffff');
    });

    it('should return null for nodes without proper color data', () => {
      const figmaNode = {
        fills: []
      };

      const result = checkColorContrast(figmaNode);
      expect(result).toBeNull();
    });

    it('should flag low contrast combinations', () => {
      const figmaNode = {
        fills: [
          {
            type: 'SOLID',
            color: { r: 0.5, g: 0.5, b: 0.5 } // Gray text
          }
        ],
        parent: {
          fills: [
            {
              type: 'SOLID',
              color: { r: 0.6, g: 0.6, b: 0.6 } // Slightly lighter gray background
            }
          ]
        }
      };

      const result = checkColorContrast(figmaNode);
      
      expect(result).toBeTruthy();
      expect(result.meetsAA).toBe(false);
      expect(result.warning).toContain('fails WCAG AA');
    });
  });
});
