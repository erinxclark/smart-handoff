// Mock axios before importing
jest.mock('axios', () => ({
  post: jest.fn()
}));

import axios from 'axios';
import { compareVisuals, clearComparisonCache } from '../compareVisuals';

describe('compareVisuals', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalApiKey = process.env.REACT_APP_OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    clearComparisonCache(); // Clear cache between tests
    // Set up environment for testing
    process.env.NODE_ENV = 'development';
    process.env.REACT_APP_OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
    process.env.REACT_APP_OPENAI_API_KEY = originalApiKey;
  });

  it('should parse structured AI response correctly', () => {
    const mockResponse = {
      data: {
        choices: [{
          message: {
            content: `## DIMENSIONS
- React: 200 x 100
- Figma: 200 x 100
- Difference: 0px
- Status: ✓ Match

## COLORS
- Background: React #ffffff vs Figma #ffffff - Match
- Text: React #333333 vs Figma #333333 - Match

## SPACING & ALIGNMENT
- Padding: React 16px vs Figma 16px
- Status: ✓ Match

## TYPOGRAPHY
- Font family: React "Inter" vs Figma "Inter"
- Font size: React 16px vs Figma 16px

## BORDER & EFFECTS
- Border radius: React 8px vs Figma 8px

## CRITICAL ISSUES
1. No critical issues found - Impact: Low

## ACCURACY SCORE
Overall: 100%
- Dimensions: 100%
- Colors: 100%
- Spacing: 100%
- Typography: 100%

## ACTIONABLE FIXES
1. No fixes needed - implementation is perfect`
          }
        }]
      }
    };

    axios.post.mockResolvedValue(mockResponse);

    return compareVisuals('data:image/png;base64,test1', 'data:image/png;base64,test2')
      .then(result => {
        expect(result.accuracyScore.overall).toBe(100);
        expect(result.accuracyScore.dimensions).toBe(100);
        expect(result.accuracyScore.colors).toBe(100);
        expect(result.accuracyScore.spacing).toBe(100);
        expect(result.accuracyScore.typography).toBe(100);
        expect(result.criticalIssues).toHaveLength(1);
        expect(result.actionableFixes).toHaveLength(1);
        expect(result.dimensions).toContain('✓ Match');
        expect(result.colors).toContain('Match');
      });
  });

  it('should handle missing API key gracefully', () => {
    delete process.env.REACT_APP_OPENAI_API_KEY;

    return compareVisuals('data:image/png;base64,test1', 'data:image/png;base64,test2')
      .then(result => {
        expect(result.accuracyScore.overall).toBe(0);
        expect(result.criticalIssues[0].description).toContain('Visual analysis unavailable');
      });
  });

  it('should return fallback analysis when API fails', () => {
    axios.post.mockRejectedValue(new Error('API Error'));

    return compareVisuals('data:image/png;base64,test1', 'data:image/png;base64,test2')
      .then(result => {
        expect(result.accuracyScore.overall).toBe(0);
        expect(result.criticalIssues).toHaveLength(1);
        expect(result.actionableFixes).toHaveLength(3);
      });
  });

  it('should use cache for repeated comparisons', () => {
    const mockResponse = {
      data: {
        choices: [{
          message: {
            content: `## ACCURACY SCORE
Overall: 85%`
          }
        }]
      }
    };

    axios.post.mockResolvedValue(mockResponse);

    const reactUrl = 'data:image/png;base64,test3';
    const figmaUrl = 'data:image/png;base64,test4';

    return compareVisuals(reactUrl, figmaUrl)
      .then(firstResult => {
        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(firstResult.accuracyScore.overall).toBe(85);
        
        return compareVisuals(reactUrl, figmaUrl);
      })
      .then(secondResult => {
        // Should not call API again due to caching
        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(secondResult.accuracyScore.overall).toBe(85);
      });
  });
});
