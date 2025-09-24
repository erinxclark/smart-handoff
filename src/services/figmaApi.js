import axios from 'axios';
import { useCache } from '../utils/cache';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Create a cache instance for the API service
const nodeCache = new Map();
const imageCache = new Map();

export const fetchFigmaData = async (fileUrl, token) => {
  try {
    const fileId = fileUrl.split('/').pop();
    const response = await axios.get(`${FIGMA_API_BASE}/files/${fileId}`, {
      headers: { 'X-Figma-Token': token }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Figma data:', error);
    throw error;
  }
};

export const fetchNodeById = async (fileId, nodeId, token) => {
  // Check cache first
  const cacheKey = `${fileId}-${nodeId}`;
  if (nodeCache.has(cacheKey)) {
    return nodeCache.get(cacheKey);
  }

  try {
    const response = await axios.get(`${FIGMA_API_BASE}/files/${fileId}/nodes?ids=${nodeId}`, {
      headers: { 'X-Figma-Token': token }
    });
    
    // Cache the result
    const nodeData = response.data.nodes[nodeId];
    nodeCache.set(cacheKey, nodeData);
    
    return nodeData;
  } catch (error) {
    console.error('Error fetching node data:', error);
    throw error;
  }
};

export const fetchNodeThumbnail = async (fileId, nodeId, token) => {
  // Check cache first
  const cacheKey = `${fileId}-${nodeId}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    const response = await axios.get(`${FIGMA_API_BASE}/images/${fileId}?ids=${nodeId}&format=png`, {
      headers: { 'X-Figma-Token': token }
    });
    
    // Cache the result
    const imageUrl = response.data.images[nodeId];
    imageCache.set(cacheKey, imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('Error fetching node thumbnail:', error);
    throw error;
  }
}; 