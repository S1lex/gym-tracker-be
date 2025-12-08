/**
 * i18n Translation Routes
 * 
 * Provides translation files for non-default languages
 * 
 * Endpoint format: GET /i18n/:lng/:ns.json
 * Example: GET /i18n/es/common.json
 * 
 * This endpoint should return JSON translation files for the requested language and namespace
 * 
 * TODO: Implement actual translation file serving logic
 * You can either:
 * 1. Store translation files in the backend (e.g., backend/i18n/locales/es/common.json)
 * 2. Store translations in a database
 * 3. Use a translation management service
 */

import { Router, Response } from 'express';
import { ApiResponse } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Test route to verify i18n router is working
router.get('/test', (_req, res) => {
  res.json({ success: true, message: 'i18n router is working', path: _req.path, url: _req.url });
});

// Debug middleware to see all requests
router.use((req, _res, next) => {
  console.log('i18n router - Request:', { method: req.method, path: req.path, url: req.url, params: req.params });
  next();
});

/**
 * Translation files directory
 * Store translation JSON files here: backend/i18n/locales/{lng}/{ns}.json
 * Example: backend/i18n/locales/es/common.json
 * 
 * Note: __dirname in compiled code points to dist/routes/, so we go up two levels
 */
const translationsDir = path.join(__dirname, '../../i18n/locales');

// Log the translations directory for debugging
console.log('i18n translations directory:', translationsDir);

/**
 * Load translation file from disk
 * @param lng - Language code (e.g., 'es')
 * @param ns - Namespace (e.g., 'common')
 * @returns Translation object or null if not found
 */
const loadTranslationFile = (lng: string, ns: string): Record<string, string> | null => {
  try {
    const filePath = path.join(translationsDir, lng, `${ns}.json`);
    
    console.log('Loading translation file:', { lng, ns, filePath, exists: fs.existsSync(filePath) });
    
    if (!fs.existsSync(filePath)) {
      console.error(`Translation file not found: ${filePath}`);
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    console.log(`Successfully loaded ${Object.keys(parsed).length} translations for ${lng}/${ns}`);
    return parsed;
  } catch (error) {
    console.error(`Error loading translation file for ${lng}/${ns}:`, error);
    return null;
  }
};

/**
 * GET /i18n/:lng/:ns.json or /i18n/:lng/:ns
 * Get translation file for a specific language and namespace
 * 
 * Route matches: /api/i18n/es/common.json
 * Express will capture: lng='es', ns='common.json'
 * We need to strip .json from ns
 * 
 * Note: This route must be registered AFTER any more specific routes
 */
router.get('/:lng/:ns', async (req, res: Response<ApiResponse<Record<string, string>>>): Promise<void> => {
  try {
    const { lng, ns } = req.params;
    
    console.log('i18n route hit:', { lng, ns, url: req.url, path: req.path });
    
    // Strip .json extension if present (for compatibility with i18next-http-backend)
    const namespace = ns.endsWith('.json') ? ns.slice(0, -5) : ns;

    // Validate language
    const supportedLanguages = ['es']; // Add more languages as needed
    if (!supportedLanguages.includes(lng)) {
      res.status(404).json({
        success: false,
        error: `Language '${lng}' not supported`,
      });
      return;
    }

    // Validate namespace
    const supportedNamespaces = ['common']; // Add more namespaces as needed
    if (!supportedNamespaces.includes(namespace)) {
      res.status(404).json({
        success: false,
        error: `Namespace '${namespace}' not found`,
      });
      return;
    }

    // Load translations from file
    const translations = loadTranslationFile(lng, namespace);

    if (!translations) {
      res.status(404).json({
        success: false,
        error: `Translation file not found for ${lng}/${namespace}`,
      });
      return;
    }

    // Return translations as JSON
    // Note: i18next-http-backend expects the translations directly, not wrapped
    // But our custom load function handles both formats
    res.json({
      success: true,
      data: translations,
    });
  } catch (error: any) {
    console.error('Error serving translation file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load translations',
    });
  }
});

export default router;

