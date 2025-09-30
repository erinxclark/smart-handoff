/**
 * Alignment Detection Test Cases
 * 
 * Test cases to verify alignment detection and correction functionality
 */

import { detectAndFixAlignment, generateAlignmentHints } from './alignmentDetector';
import { validateAlignment } from './alignmentValidator';

/**
 * Test case 1: Horizontally aligned buttons
 */
export const testCase1_HorizontallyAlignedButtons = {
  name: 'Horizontally Aligned Buttons',
  description: 'Three buttons aligned horizontally with consistent spacing',
  figmaNode: {
    id: 'parent',
    name: 'Button Group',
    type: 'FRAME',
    absoluteBoundingBox: { x: 0, y: 0, width: 400, height: 60 },
    children: [
      {
        id: 'btn1',
        name: 'Button 1',
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 20, y: 10, width: 100, height: 40 }
      },
      {
        id: 'btn2', 
        name: 'Button 2',
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 140, y: 10, width: 100, height: 40 }
      },
      {
        id: 'btn3',
        name: 'Button 3', 
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 260, y: 10, width: 100, height: 40 }
      }
    ]
  },
  expectedAlignment: {
    topAligned: 3,
    consistentSpacing: 20,
    flexboxCandidate: true
  }
};

/**
 * Test case 2: Vertically aligned cards
 */
export const testCase2_VerticallyAlignedCards = {
  name: 'Vertically Aligned Cards',
  description: 'Three cards stacked vertically with consistent spacing',
  figmaNode: {
    id: 'parent',
    name: 'Card Stack',
    type: 'FRAME', 
    absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 400 },
    children: [
      {
        id: 'card1',
        name: 'Card 1',
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 20, y: 20, width: 260, height: 100 }
      },
      {
        id: 'card2',
        name: 'Card 2', 
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 20, y: 140, width: 260, height: 100 }
      },
      {
        id: 'card3',
        name: 'Card 3',
        type: 'RECTANGLE', 
        absoluteBoundingBox: { x: 20, y: 260, width: 260, height: 100 }
      }
    ]
  },
  expectedAlignment: {
    leftAligned: 3,
    consistentSpacing: 20,
    flexboxCandidate: true
  }
};

/**
 * Test case 3: Grid layout
 */
export const testCase3_GridLayout = {
  name: 'Grid Layout',
  description: '2x2 grid of elements',
  figmaNode: {
    id: 'parent',
    name: 'Grid Container',
    type: 'FRAME',
    absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 200 },
    children: [
      {
        id: 'item1',
        name: 'Item 1',
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 10, y: 10, width: 80, height: 80 }
      },
      {
        id: 'item2',
        name: 'Item 2',
        type: 'RECTANGLE', 
        absoluteBoundingBox: { x: 110, y: 10, width: 80, height: 80 }
      },
      {
        id: 'item3',
        name: 'Item 3',
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 10, y: 110, width: 80, height: 80 }
      },
      {
        id: 'item4',
        name: 'Item 4',
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 110, y: 110, width: 80, height: 80 }
      }
    ]
  },
  expectedAlignment: {
    gridPattern: { rows: 2, columns: 2 },
    topAligned: 2,
    leftAligned: 2
  }
};

/**
 * Test case 4: Centered elements
 */
export const testCase4_CenteredElements = {
  name: 'Centered Elements',
  description: 'Elements centered within their parent',
  figmaNode: {
    id: 'parent',
    name: 'Centered Container',
    type: 'FRAME',
    absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 200 },
    children: [
      {
        id: 'centered1',
        name: 'Centered Item 1',
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 125, y: 75, width: 50, height: 50 }
      },
      {
        id: 'centered2',
        name: 'Centered Item 2', 
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 125, y: 135, width: 50, height: 30 }
      }
    ]
  },
  expectedAlignment: {
    horizontallyCentered: 2,
    leftAligned: 2
  }
};

/**
 * Test case 5: Misaligned elements (should detect issues)
 */
export const testCase5_MisalignedElements = {
  name: 'Misaligned Elements',
  description: 'Elements that should be aligned but are slightly off',
  figmaNode: {
    id: 'parent',
    name: 'Misaligned Container',
    type: 'FRAME',
    absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 100 },
    children: [
      {
        id: 'misaligned1',
        name: 'Item 1',
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 20, y: 10, width: 100, height: 40 }
      },
      {
        id: 'misaligned2',
        name: 'Item 2',
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 22, y: 12, width: 100, height: 40 } // Slightly misaligned
      },
      {
        id: 'misaligned3',
        name: 'Item 3',
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 20, y: 14, width: 100, height: 40 } // Slightly misaligned
      }
    ]
  },
  expectedAlignment: {
    shouldDetectMisalignment: true,
    toleranceViolations: 2
  }
};

/**
 * Run all alignment tests
 */
export function runAlignmentTests() {
  const testCases = [
    testCase1_HorizontallyAlignedButtons,
    testCase2_VerticallyAlignedCards,
    testCase3_GridLayout,
    testCase4_CenteredElements,
    testCase5_MisalignedElements
  ];

  const results = [];

  testCases.forEach(testCase => {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    
    // Analyze alignment
    const alignmentAnalysis = detectAndFixAlignment(testCase.figmaNode);
    
    // Generate hints
    const alignmentHints = generateAlignmentHints(alignmentAnalysis);
    
    // Validate with mock generated code
    const mockGeneratedCode = generateMockCode(testCase.figmaNode);
    const validationResult = validateAlignment(mockGeneratedCode, testCase.figmaNode, alignmentAnalysis);
    
    const result = {
      testCase: testCase.name,
      alignmentAnalysis,
      alignmentHints,
      validationResult,
      passed: validateTestExpectations(alignmentAnalysis, testCase.expectedAlignment)
    };
    
    results.push(result);
    
    console.log(`✅ Alignment Groups:`, Object.keys(alignmentAnalysis.alignmentGroups).filter(key => 
      alignmentAnalysis.alignmentGroups[key].length > 0
    ));
    console.log(`📊 Summary:`, alignmentAnalysis.summary);
    console.log(`🎯 Test Passed:`, result.passed);
  });

  return results;
}

/**
 * Generate mock React code for testing
 */
function generateMockCode(figmaNode) {
  if (!figmaNode.children || figmaNode.children.length === 0) {
    return `<div style={{ width: '${figmaNode.absoluteBoundingBox.width}px', height: '${figmaNode.absoluteBoundingBox.height}px' }}></div>`;
  }

  let code = `<div style={{ position: 'relative', width: '${figmaNode.absoluteBoundingBox.width}px', height: '${figmaNode.absoluteBoundingBox.height}px' }}>`;
  
  figmaNode.children.forEach(child => {
    const { x, y, width, height } = child.absoluteBoundingBox;
    code += `\n  <div style={{ position: 'absolute', left: '${x}px', top: '${y}px', width: '${width}px', height: '${height}px' }}></div>`;
  });
  
  code += '\n</div>';
  return code;
}

/**
 * Validate test expectations
 */
function validateTestExpectations(alignmentAnalysis, expected) {
  if (expected.topAligned && alignmentAnalysis.alignmentGroups.topAligned.length !== expected.topAligned) {
    return false;
  }
  
  if (expected.leftAligned && alignmentAnalysis.alignmentGroups.leftAligned.length !== expected.leftAligned) {
    return false;
  }
  
  if (expected.consistentSpacing && !alignmentAnalysis.alignmentPatterns.consistentSpacing) {
    return false;
  }
  
  if (expected.gridPattern && !alignmentAnalysis.alignmentPatterns.gridPattern) {
    return false;
  }
  
  if (expected.flexboxCandidate && !alignmentAnalysis.alignmentPatterns.flexboxCandidate) {
    return false;
  }
  
  return true;
}

/**
 * Example usage in console
 */
export function runAlignmentTestsInConsole() {
  console.log('🚀 Starting Alignment Detection Tests...\n');
  
  const results = runAlignmentTests();
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.testCase}: ${result.passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed`);
  
  return results;
}
