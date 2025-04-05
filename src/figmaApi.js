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

    const node = response.data.nodes[nodeId]?.document;
    console.log('🎯 Fetched node data:', node);
    return node;
  } catch (error) {
    console.error('❌ Error fetching node:', error);
    return null;
  }
}; 