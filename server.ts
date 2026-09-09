import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 25mb limit for high-res package photos
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Lazy initializer for Gemini client with telemetry header
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Redact API key and secrets from any error messages
function sanitizeError(err: any): string {
  if (!err) return 'Unknown error occurred.';
  let msg = typeof err === 'string' ? err : err.message || String(err);
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    msg = msg.split(apiKey).join('[REDACTED_API_KEY]');
  }
  // Redact potential Gemini or Google API key patterns
  msg = msg.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');
  return msg;
}

// Strict Gemini structured output schema
const inspectionResponseSchema = {
  type: Type.OBJECT,
  description:
    'Statutory packaging declarations extracted strictly from visible packaging label evidence.',
  properties: {
    productName: {
      type: Type.STRING,
      description: 'Brand or product name printed on the packaging, or null if not detected.',
      nullable: true,
    },
    mrp: {
      type: Type.STRING,
      description:
        'Retail sale price as printed e.g. "MRP ₹ 150.00 (incl. of all taxes)", or null if not detected.',
      nullable: true,
    },
    netQuantity: {
      type: Type.STRING,
      description:
        'Net quantity with metric unit e.g. "500 g", "1 kg", "200 ml", "10 N", or null if not detected.',
      nullable: true,
    },
    manufacturer: {
      type: Type.STRING,
      description: 'Name and complete postal address of the manufacturer, or null if not detected.',
      nullable: true,
    },
    packer: {
      type: Type.STRING,
      description:
        'Name and complete address of the packer if separate from manufacturer, or null if not detected.',
      nullable: true,
    },
    importer: {
      type: Type.STRING,
      description:
        'Name and address of the importer for imported goods, or null if not detected.',
      nullable: true,
    },
    manufacturingDate: {
      type: Type.STRING,
      description:
        'Month and year of manufacture or packaging e.g. "02/2026", or null if not detected.',
      nullable: true,
    },
    consumerCare: {
      type: Type.STRING,
      description:
        'Consumer grievance telephone number, email, or physical address, or null if not detected.',
      nullable: true,
    },
    countryOfOrigin: {
      type: Type.STRING,
      description: 'Country of origin e.g. "India", or null if not detected.',
      nullable: true,
    },
    genericName: {
      type: Type.STRING,
      description:
        'Common or generic name of the commodity printed on the packaging (Rule 6(1)(b)), or null if not detected.',
      nullable: true,
    },
    unitSalePrice: {
      type: Type.STRING,
      description:
        'Unit Sale Price declaration where printed (Rule 6(11), e.g. "₹ 0.20 per g", "per kg", "per number", "per ml"), or null if not detected.',
      nullable: true,
    },
    bestBefore: {
      type: Type.STRING,
      description:
        'Best before or use by date statement if visible on package, or null if not detected.',
      nullable: true,
    },
    ingredients: {
      type: Type.ARRAY,
      description:
        'List of visible ingredients printed on the package, or null if not present or not readable.',
      items: {
        type: Type.STRING,
      },
      nullable: true,
    },
    nutritionInfo: {
      type: Type.OBJECT,
      description:
        'Nutritional facts visible on label as key-value pairs (e.g. energy, protein, fat, carbohydrates), or null if absent.',
      properties: {
        energy: { type: Type.STRING, nullable: true },
        protein: { type: Type.STRING, nullable: true },
        carbohydrates: { type: Type.STRING, nullable: true },
        fat: { type: Type.STRING, nullable: true },
        addedSugars: { type: Type.STRING, nullable: true },
        sodium: { type: Type.STRING, nullable: true },
      },
      nullable: true,
    },
    rawVisibleText: {
      type: Type.STRING,
      description: 'Verbatim transcript of visible text detected on the package label, or null.',
      nullable: true,
    },
    confidence: {
      type: Type.NUMBER,
      description:
        'Overall visual clarity and text legibility score strictly between 0.0 and 1.0.',
    },
    fieldConfidence: {
      type: Type.OBJECT,
      description:
        'Per-field detection confidence scores strictly between 0.0 and 1.0 based on visible evidence.',
      properties: {
        productName: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
        mrp: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
        netQuantity: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
        manufacturer: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
        packer: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
        importer: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
        manufacturingDate: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
        consumerCare: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
        countryOfOrigin: { type: Type.NUMBER, description: 'Score between 0.0 and 1.0' },
      },
      required: [
        'productName',
        'mrp',
        'netQuantity',
        'manufacturer',
        'manufacturingDate',
        'consumerCare',
        'countryOfOrigin',
      ],
    },
  },
  required: [
    'productName',
    'mrp',
    'netQuantity',
    'manufacturer',
    'packer',
    'importer',
    'manufacturingDate',
    'consumerCare',
    'countryOfOrigin',
    'genericName',
    'unitSalePrice',
    'bestBefore',
    'ingredients',
    'nutritionInfo',
    'rawVisibleText',
    'confidence',
    'fieldConfidence',
  ],
};

const REQUIRED_RESPONSE_FIELDS = [
  'productName',
  'mrp',
  'netQuantity',
  'manufacturer',
  'packer',
  'importer',
  'manufacturingDate',
  'consumerCare',
  'countryOfOrigin',
  'genericName',
  'unitSalePrice',
  'bestBefore',
  'ingredients',
  'nutritionInfo',
  'rawVisibleText',
  'confidence',
  'fieldConfidence',
] as const;

function clampScore(val: any, fallback = 0.5): number {
  let num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return fallback;
  if (num > 1 && num <= 100) {
    num = num / 100;
  }
  return Math.min(1, Math.max(0, Math.round(num * 100) / 100));
}

function normalizeStringOrNull(val: any): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null') return null;
    return trimmed;
  }
  return String(val).trim();
}

interface NormalizedDeclarations {
  productName: string | null;
  mrp: string | null;
  netQuantity: string | null;
  manufacturer: string | null;
  packer: string | null;
  importer: string | null;
  manufacturingDate: string | null;
  consumerCare: string | null;
  countryOfOrigin: string | null;
  genericName?: string | null;
  unitSalePrice?: string | null;
  bestBefore?: string | null;
  ingredients: string[] | null;
  nutritionInfo: Record<string, string> | null;
  rawVisibleText: string | null;
  confidence: number;
  fieldConfidence: Record<string, number>;
}

// Rigorous response validation before sending back to frontend
function validateAndNormalizeResponse(parsed: any): {
  isValid: boolean;
  error?: string;
  data?: NormalizedDeclarations;
} {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      isValid: false,
      error: 'AI response is not a valid JSON object.',
    };
  }

  // Validate required fields exist
  const missingFields: string[] = [];
  for (const field of REQUIRED_RESPONSE_FIELDS) {
    if (!(field in parsed)) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `AI response is missing required fields: ${missingFields.join(', ')}`,
    };
  }

  // Validate ingredients is an array or null
  let normalizedIngredients: string[] | null = null;
  if (parsed.ingredients !== null && parsed.ingredients !== undefined) {
    if (!Array.isArray(parsed.ingredients)) {
      return {
        isValid: false,
        error: 'Field "ingredients" must be an array of strings or null.',
      };
    }
    normalizedIngredients = parsed.ingredients
      .filter((item: any) => item !== null && item !== undefined)
      .map((item: any) => String(item).trim())
      .filter((item: string) => item.length > 0);
  }

  // Validate nutritionInfo is an object or null
  let normalizedNutrition: Record<string, string> | null = null;
  if (parsed.nutritionInfo !== null && parsed.nutritionInfo !== undefined) {
    if (typeof parsed.nutritionInfo !== 'object' || Array.isArray(parsed.nutritionInfo)) {
      return {
        isValid: false,
        error: 'Field "nutritionInfo" must be an object or null.',
      };
    }
    normalizedNutrition = {};
    for (const [k, v] of Object.entries(parsed.nutritionInfo)) {
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        normalizedNutrition[k] = String(v).trim();
      }
    }
    if (Object.keys(normalizedNutrition).length === 0) {
      normalizedNutrition = null;
    }
  }

  // Validate confidence values are between 0 and 1
  const rawConfidence = typeof parsed.confidence === 'number' ? parsed.confidence : parseFloat(parsed.confidence);
  if (isNaN(rawConfidence) || rawConfidence < 0 || rawConfidence > 100) {
    return {
      isValid: false,
      error: 'Field "confidence" must be a numeric score between 0 and 1.',
    };
  }
  const normalizedConfidence = clampScore(rawConfidence, 0.5);

  // Validate fieldConfidence is an object and values are between 0 and 1
  if (
    !parsed.fieldConfidence ||
    typeof parsed.fieldConfidence !== 'object' ||
    Array.isArray(parsed.fieldConfidence)
  ) {
    return {
      isValid: false,
      error: 'Field "fieldConfidence" must be an object containing per-field confidence scores.',
    };
  }

  const normalizedFieldConfidence: Record<string, number> = {};
  for (const [key, val] of Object.entries(parsed.fieldConfidence)) {
    normalizedFieldConfidence[key] = clampScore(val, normalizedConfidence);
  }

  // Ensure standard fields have confidence values
  const essentialKeys = [
    'productName',
    'mrp',
    'netQuantity',
    'manufacturer',
    'manufacturingDate',
    'consumerCare',
    'countryOfOrigin',
  ];
  for (const k of essentialKeys) {
    if (!(k in normalizedFieldConfidence)) {
      normalizedFieldConfidence[k] = normalizedConfidence;
    }
  }

  const data: NormalizedDeclarations = {
    productName: normalizeStringOrNull(parsed.productName),
    mrp: normalizeStringOrNull(parsed.mrp),
    netQuantity: normalizeStringOrNull(parsed.netQuantity),
    manufacturer: normalizeStringOrNull(parsed.manufacturer),
    packer: normalizeStringOrNull(parsed.packer),
    importer: normalizeStringOrNull(parsed.importer),
    manufacturingDate: normalizeStringOrNull(parsed.manufacturingDate),
    consumerCare: normalizeStringOrNull(parsed.consumerCare),
    countryOfOrigin: normalizeStringOrNull(parsed.countryOfOrigin),
    genericName: normalizeStringOrNull(parsed.genericName),
    unitSalePrice: normalizeStringOrNull(parsed.unitSalePrice),
    bestBefore: normalizeStringOrNull(parsed.bestBefore),
    ingredients: normalizedIngredients,
    nutritionInfo: normalizedNutrition,
    rawVisibleText: normalizeStringOrNull(parsed.rawVisibleText),
    confidence: normalizedConfidence,
    fieldConfidence: normalizedFieldConfidence,
  };

  return {
    isValid: true,
    data,
  };
}

// Multimodal package image inspection endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { image } = req.body;

    // Validate image input
    if (!image || typeof image !== 'string' || image.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid request: A valid image string or base64 data URI is required.',
        code: 'INVALID_IMAGE',
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server.',
        code: 'MISSING_API_KEY',
        suggestion:
          'You can test all features seamlessly using the built-in Demo Mode scenarios.',
      });
      return;
    }

    // Extract mime type and clean base64 data
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const isBase64 = image.includes(';base64,');
      const commaIdx = image.indexOf(',');
      const meta = image.substring(5, commaIdx !== -1 ? commaIdx : undefined);
      const extractedMime = meta.split(';')[0];
      if (extractedMime && extractedMime.includes('/')) {
        mimeType = extractedMime;
      }
      if (commaIdx !== -1) {
        const rawContent = image.substring(commaIdx + 1);
        if (isBase64) {
          base64Data = rawContent.trim();
        } else {
          // If URL-encoded or UTF-8 text (e.g. SVG)
          try {
            const decoded = decodeURIComponent(rawContent);
            base64Data = Buffer.from(decoded, 'utf8').toString('base64');
          } catch {
            base64Data = Buffer.from(rawContent, 'utf8').toString('base64');
          }
        }
      }
    }

    if (!base64Data || base64Data.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid image payload: Unable to extract base64 image data.',
        code: 'INVALID_IMAGE',
      });
      return;
    }

    // Guard against oversized payload (over ~15MB binary / 20MB base64)
    if (base64Data.length > 20 * 1024 * 1024) {
      res.status(413).json({
        success: false,
        error: 'Image is too large. Please upload an image under 15MB.',
        code: 'IMAGE_TOO_LARGE',
      });
      return;
    }

    const prompt = `You are an expert Legal Metrology Compliance Inspection AI analyzing packaged commodity labels and retail packages under the Indian Legal Metrology (Packaged Commodities) Rules, 2011.

STRICT EXTRACTION POLICY:
1. Strict evidence-based extraction: Only report information actually and clearly visible in the submitted image.
2. Never guess.
3. Never infer a value because it is common for a product or expected in this category.
4. If text is blurry, cropped, obscured, unavailable, or not confidently readable, return null or "Not detected".
5. Extract statutory declarations including common/generic commodity name (Rule 6(1)(b)), unit sale price (Rule 6(11)) where printed, and best before/use by where printed.
6. Do NOT make any medical, clinical, or unverified health claims. Report ingredients and nutrition strictly as factual label-derived text.
7. For each extracted field, preserve evidence traceability by calculating its confidence score between 0.0 and 1.0 based strictly on visible image clarity and print legibility.`;

    let response;
    try {
      // Call Gemini 3.8 Flash with structured schema support and transient retry
      // Note: temperature parameter is removed as Gemini 3.8 Flash uses current API guidance
      const requestPayload = {
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: inspectionResponseSchema,
        },
      };

      // Retry up to 3 times for transient spikes (503 / 429)
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          response = await ai.models.generateContent(requestPayload);
          break;
        } catch (callErr: any) {
          const errString = String(callErr?.message || callErr?.status || '');
          const isTransient =
            errString.includes('503') ||
            errString.includes('UNAVAILABLE') ||
            errString.includes('429') ||
            errString.includes('high demand');
          if (isTransient && attempt < 4) {
            const delay = attempt * 2000;
            console.warn(`Transient Gemini demand spike (attempt ${attempt}/4). Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw callErr;
        }
      }
    } catch (apiErr: any) {
      console.error('Gemini API Error:', sanitizeError(apiErr));
      const sanitized = sanitizeError(apiErr);
      const isQuotaOrRateLimit =
        sanitized.includes('429') ||
        sanitized.includes('quota') ||
        sanitized.includes('RESOURCE_EXHAUSTED');

      const statusCode = isQuotaOrRateLimit ? 429 : 502;
      const userMessage = isQuotaOrRateLimit
        ? 'Gemini API rate limit or quota exceeded. Please wait a moment and try again.'
        : 'The AI inspection service encountered an error while analyzing the image.';

      res.status(statusCode).json({
        success: false,
        error: userMessage,
        code: isQuotaOrRateLimit ? 'RATE_LIMIT_EXCEEDED' : 'GEMINI_API_ERROR',
        details: sanitized,
      });
      return;
    }

    const responseText = response?.text;

    let parsed: any = null;
    // Check if the response or text is already an object; do not attempt JSON.parse on an already-parsed response
    if (typeof (response as any)?.parsed === 'object' && (response as any)?.parsed !== null) {
      parsed = (response as any).parsed;
    } else if (typeof (response as any)?.data === 'object' && (response as any)?.data !== null) {
      parsed = (response as any).data;
    } else if (typeof responseText === 'object' && responseText !== null) {
      parsed = responseText;
    } else if (typeof responseText === 'string') {
      const trimmed = responseText.trim();
      if (!trimmed) {
        res.status(502).json({
          success: false,
          error: 'Empty response received from Gemini inspection model.',
          code: 'INVALID_AI_RESPONSE',
        });
        return;
      }

      try {
        const cleanJson = trimmed
          .replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1')
          .trim();
        // Guard against already-parsed value
        parsed = typeof cleanJson === 'object' ? cleanJson : JSON.parse(cleanJson);
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON output:', responseText);
        res.status(502).json({
          success: false,
          error: 'Failed to parse AI inspection output into structured format.',
          code: 'INVALID_AI_RESPONSE',
        });
        return;
      }
    } else {
      res.status(502).json({
        success: false,
        error: 'Invalid response format received from Gemini model.',
        code: 'INVALID_AI_RESPONSE',
      });
      return;
    }

    // Perform validation and normalization
    const validationResult = validateAndNormalizeResponse(parsed);
    if (!validationResult.isValid || !validationResult.data) {
      console.error('AI Response Validation Failed:', validationResult.error, parsed);
      res.status(502).json({
        success: false,
        error:
          validationResult.error ||
          'AI output failed strict schema validation and normalization.',
        code: 'INVALID_AI_RESPONSE',
      });
      return;
    }

    // Success response matching the frontend contract: { success: true, declarations: parsed }
    res.json({
      success: true,
      declarations: validationResult.data,
    });
  } catch (error: any) {
    console.error('Unhandled Analysis Error:', sanitizeError(error));
    res.status(500).json({
      success: false,
      error: 'An unexpected internal error occurred during package analysis.',
      code: 'GEMINI_API_ERROR',
      details: sanitizeError(error),
    });
  }
});

// JSON error handling middleware for API routes to prevent HTML error responses
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api') || req.headers.accept?.includes('application/json')) {
    const status = typeof err.status === 'number' ? err.status : 400;
    return res.status(status).json({
      success: false,
      error: err.message || 'Invalid request payload or malformed JSON.',
      code: err.type || 'REQUEST_ERROR',
    });
  }
  next(err);
});

// Explicit 404 handler for unmatched /api/* requests so they never fall through to Vite SPA HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
});

// Vite / Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Legal Metrology Compliance Inspector running on port ${PORT}`);
  });
}

startServer();
