import axios from 'axios';

/**
 * Fetches a thumbnail image for a specific Figma node
 * @param {string} fileId - The Figma file ID
 * @param {string} nodeId - The ID of the node to fetch thumbnail for
 * @param {string} token - Figma access token
 * @returns {Promise<string>} - URL of the thumbnail image
 */
export const fetchNodeThumbnail = async (fileId, nodeId, token) => {
  try {
    const response = await axios.get(
      `https://api.figma.com/v1/images/${fileId}?ids=${nodeId}&format=png`,
      {
        headers: { 'X-Figma-Token': token },
      }
    );

    const url = response.data.images[nodeId];
    return url;
  } catch (err) {
    console.error('❌ Error fetching thumbnail:', err);
    return null;
  }
}; 