/**
 * Design Tokens Panel Component
 * 
 * Displays extracted design tokens in an organized, interactive panel
 * with export functionality and copy-to-clipboard features.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportTokensAsCSS, exportTokensAsJSON, downloadFile, copyToClipboard } from '../utils/tokenExtractor';

const DesignTokensPanel = ({ tokens, componentName }) => {
  const [copiedToken, setCopiedToken] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleCopyToken = async (value, type) => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedToken(`${type}: ${value}`);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  const handleExportCSS = () => {
    const css = exportTokensAsCSS(tokens);
    downloadFile(css, `${componentName || 'design'}-tokens.css`, 'text/css');
    setShowExportOptions(false);
  };

  const handleExportJSON = () => {
    const json = exportTokensAsJSON(tokens);
    downloadFile(json, `${componentName || 'design'}-tokens.json`, 'application/json');
    setShowExportOptions(false);
  };

  if (!tokens || tokens.summary.totalColors === 0 && tokens.summary.totalSpacingValues === 0) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Design Tokens</h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {tokens.summary.totalColors + tokens.summary.totalSpacingValues + tokens.summary.totalFontStyles} tokens
          </span>
          <button
            onClick={() => setShowExportOptions(!showExportOptions)}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title="Export options"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Export Options Dropdown */}
      <AnimatePresence>
        {showExportOptions && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex gap-2">
              <button
                onClick={handleExportCSS}
                className="flex-1 py-2 px-3 bg-indigo-500 text-white text-xs font-medium rounded hover:bg-indigo-600 transition-colors"
              >
                Export CSS
              </button>
              <button
                onClick={handleExportJSON}
                className="flex-1 py-2 px-3 bg-purple-500 text-white text-xs font-medium rounded hover:bg-purple-600 transition-colors"
              >
                Export JSON
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Colors Section */}
      {tokens.colors.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-slate-600">Colors ({tokens.colors.length})</h4>
            {tokens.spacingPattern?.detected && (
              <span className="text-xs text-green-600 font-medium">
                ✓ {tokens.spacingPattern.grid}px grid
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {tokens.colors.map((color, index) => (
              <div key={index} className="group relative">
                <button
                  onClick={() => handleCopyToken(color.hex, 'color')}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.hex} (${color.count} uses)`}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  <div className="font-medium">{color.hex}</div>
                  <div className="text-[10px] text-slate-400">
                    {color.usage.join(', ')} • {color.count} uses
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spacing Section */}
      {tokens.spacing.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-slate-600">Spacing ({tokens.spacing.length})</h4>
            {tokens.spacingPattern?.detected && (
              <span className="text-xs text-green-600 font-medium">
                {tokens.spacingPattern.confidence.toFixed(0)}% consistent
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {tokens.spacing.map((value, index) => (
              <button
                key={index}
                onClick={() => handleCopyToken(`${value}px`, 'spacing')}
                className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded hover:bg-slate-200 transition-colors"
                title={`Copy ${value}px`}
              >
                {value}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Typography Section */}
      {tokens.typography.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-slate-600 mb-2">Typography ({tokens.typography.length})</h4>
          <div className="space-y-2">
            {tokens.typography.map((font, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{font.family}</div>
                  <div className="text-slate-500">{font.size}px • {font.weight}</div>
                </div>
                <button
                  onClick={() => handleCopyToken(font.family, 'font-family')}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                  title="Copy font family"
                >
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Border Radius Section */}
      {tokens.borders.radii.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-slate-600 mb-2">Border Radius ({tokens.borders.radii.length})</h4>
          <div className="flex flex-wrap gap-1">
            {tokens.borders.radii.map((value, index) => (
              <button
                key={index}
                onClick={() => handleCopyToken(`${value}px`, 'border-radius')}
                className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded hover:bg-slate-200 transition-colors"
                title={`Copy ${value}px`}
              >
                {value}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Border Widths Section */}
      {tokens.borders.widths.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-slate-600 mb-2">Border Widths ({tokens.borders.widths.length})</h4>
          <div className="flex flex-wrap gap-1">
            {tokens.borders.widths.map((value, index) => (
              <button
                key={index}
                onClick={() => handleCopyToken(`${value}px`, 'border-width')}
                className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded hover:bg-slate-200 transition-colors"
                title={`Copy ${value}px`}
              >
                {value}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Effects Section */}
      {tokens.effects.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-slate-600 mb-2">Effects ({tokens.effects.length})</h4>
          <div className="space-y-2">
            {tokens.effects.map((effect, index) => (
              <div key={index} className="text-xs text-slate-600">
                <div className="font-medium capitalize">{effect.type}</div>
                <div className="text-slate-500">
                  {effect.radius}px radius
                  {effect.color && ` • ${effect.color}`}
                  {effect.offset && ` • offset(${effect.offset.x}, ${effect.offset.y})`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copy Feedback Toast */}
      <AnimatePresence>
        {copiedToken && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm z-50"
          >
            Copied {copiedToken} to clipboard
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={handleExportCSS}
            className="flex-1 py-2 px-3 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
          >
            Export CSS
          </button>
          <button
            onClick={handleExportJSON}
            className="flex-1 py-2 px-3 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors"
          >
            Export JSON
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DesignTokensPanel;
