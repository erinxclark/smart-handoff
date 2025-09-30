import axios from 'axios';

const FIGMA_TOKEN = process.env.REACT_APP_FIGMA_TOKEN;
const FILE_ID = process.env.REACT_APP_FIGMA_FILE_ID;

export const fetchFigmaData = async () => {
  try {
    const response = await axios.get(`https://api.figma.com/v1/files/${FILE_ID}`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });
    console.log('✅ Figma data fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching Figma data:', error.message);
  }
};

export const fetchNodeById = async (fileId, nodeId, token) => {
  try {
    const response = await axios.get(
      `https://api.figma.com/v1/files/${fileId}/nodes?ids=${nodeId}`,
      {
        headers: { 'X-Figma-Token': token },
      }
    );
    
    console.log('Figma API raw response:', response.data);
    
    // Navigate to the actual node data
    const nodes = response.data.nodes;
    if (!nodes || !nodes[nodeId]) {
      throw new Error('Node not found in response');
    }
    
    const nodeData = nodes[nodeId].document;
    
    // Validate critical data exists
    if (!nodeData) {
      throw new Error('No document data in node');
    }
    
    // If absoluteBoundingBox is missing, try to construct it
    if (!nodeData.absoluteBoundingBox && nodeData.children) {
      console.warn('absoluteBoundingBox missing, attempting to calculate from children');
      nodeData.absoluteBoundingBox = calculateBoundingBox(nodeData.children);
    }
    
    console.log('🎯 Fetched node data:', nodeData);
    return nodeData;
    
  } catch (error) {
    console.error('Figma API error:', error.response?.data || error.message);
    throw new Error(`Failed to fetch node: ${error.response?.data?.err || error.message}`);
  }
};

function calculateBoundingBox(children) {
  if (!children || children.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  children.forEach(child => {
    if (child.absoluteBoundingBox) {
      const box = child.absoluteBoundingBox;
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    }
  });
  
  if (minX === Infinity) return null;
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
} 