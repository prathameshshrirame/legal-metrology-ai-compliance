import { DemoScenario } from '../types';

// Helper to create clean SVG data URIs for demo package packaging mockups
function createPackageSvg(title: string, subtitle: string, color: string, details: string[]): string {
  const detailsXml = details
    .map((d, i) => `<text x="24" y="${180 + i * 26}" fill="#334155" font-family="sans-serif" font-size="13" font-weight="500">${d}</text>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="420" viewBox="0 0 480 420">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="480" height="420" rx="16" fill="url(#bgGrad)" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="0" y="0" width="480" height="74" rx="16" fill="url(#headerGrad)"/>
    <rect x="0" y="58" width="480" height="16" fill="url(#headerGrad)"/>
    
    <!-- Top badge -->
    <rect x="340" y="16" width="120" height="24" rx="12" fill="#ffffff" fill-opacity="0.2"/>
    <text x="400" y="32" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">LEGAL METROLOGY</text>

    <!-- Header title -->
    <text x="24" y="36" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">${title}</text>
    <text x="24" y="56" fill="#cbd5e1" font-family="sans-serif" font-size="12">${subtitle}</text>

    <!-- Barcode simulation -->
    <rect x="24" y="90" width="130" height="50" fill="#ffffff" stroke="#94a3b8" rx="4"/>
    <line x1="32" y1="96" x2="32" y2="132" stroke="#0f172a" stroke-width="2"/>
    <line x1="38" y1="96" x2="38" y2="132" stroke="#0f172a" stroke-width="3"/>
    <line x1="44" y1="96" x2="44" y2="132" stroke="#0f172a" stroke-width="1"/>
    <line x1="48" y1="96" x2="48" y2="132" stroke="#0f172a" stroke-width="4"/>
    <line x1="56" y1="96" x2="56" y2="132" stroke="#0f172a" stroke-width="2"/>
    <line x1="62" y1="96" x2="62" y2="132" stroke="#0f172a" stroke-width="1"/>
    <line x1="68" y1="96" x2="68" y2="132" stroke="#0f172a" stroke-width="3"/>
    <line x1="74" y1="96" x2="74" y2="132" stroke="#0f172a" stroke-width="2"/>
    <line x1="82" y1="96" x2="82" y2="132" stroke="#0f172a" stroke-width="4"/>
    <line x1="90" y1="96" x2="90" y2="132" stroke="#0f172a" stroke-width="2"/>
    <line x1="98" y1="96" x2="98" y2="132" stroke="#0f172a" stroke-width="1"/>
    <line x1="104" y1="96" x2="104" y2="132" stroke="#0f172a" stroke-width="3"/>
    <line x1="112" y1="96" x2="112" y2="132" stroke="#0f172a" stroke-width="2"/>
    <line x1="120" y1="96" x2="120" y2="132" stroke="#0f172a" stroke-width="3"/>
    <text x="89" y="138" fill="#475569" font-family="monospace" font-size="8" text-anchor="middle">8 901234 567890</text>

    <!-- Green veg symbol if applicable -->
    <rect x="420" y="90" width="30" height="30" fill="#ffffff" stroke="#16a34a" stroke-width="2" rx="3"/>
    <circle cx="435" cy="105" r="7" fill="#16a34a"/>

    <!-- Packaging declarations container -->
    <rect x="18" y="152" width="444" height="248" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="24" y="172" fill="#0f172a" font-family="sans-serif" font-size="12" font-weight="bold">STATUTORY DECLARATIONS / LABELS PANEL</text>
    <line x1="24" y1="178" x2="450" y2="178" stroke="#e2e8f0" stroke-width="1"/>
    ${detailsXml}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'demo_compliant',
    title: 'Compliant Package',
    subtitle: 'Golden Harvest Organic Basmati Rice 1kg',
    badge: 'PASS',
    description: 'Fully compliant package with all 5 mandatory statutory declarations under Legal Metrology Rules, 2011.',
    previewImage: createPackageSvg(
      'GOLDEN HARVEST BASMATI RICE',
      'Net Quantity: 1 kg | Premium Aged Grains',
      '#0284c7',
      [
        '• MRP: ₹ 175.00 (Inclusive of all taxes)',
        '• Net Quantity: 1 kg (Net Wt. 1000g)',
        '• Manufactured & Packed by: Bharat Agro Foods Ltd., Plot 42, GIDC, Anand, Gujarat - 388001',
        '• Pkd Date: 02/2026 | Batch No: GHR-2026-08',
        '• Consumer Care: 1800-222-3333 | Email: care@bharatagro.in',
        '• Country of Origin: India',
        '• Commodity: Processed Basmati Rice (Aged)',
        '• Unit Sale Price: ₹ 0.175 per g'
      ]
    ),
    declarations: {
      productName: 'Golden Harvest Organic Basmati Rice',
      mrp: '₹ 175.00 (Inclusive of all taxes)',
      netQuantity: '1 kg',
      manufacturer: 'Bharat Agro Foods Ltd., Plot 42, GIDC, Anand, Gujarat - 388001',
      packer: 'Bharat Agro Foods Ltd., Plot 42, GIDC, Anand, Gujarat - 388001',
      importer: null,
      manufacturingDate: '02/2026',
      consumerCare: 'Toll Free: 1800-222-3333, Email: care@bharatagro.in, Address: Customer Grievance Cell, Bharat Agro Foods Ltd., Anand, Gujarat - 388001',
      countryOfOrigin: 'India',
      genericName: 'Processed Basmati Rice (Aged)',
      unitSalePrice: '₹ 0.175 per g',
      bestBefore: '24 Months from packaging',
      ingredients: ['100% Whole Long Grain Basmati Rice'],
      nutritionInfo: {
        'Energy': '356 kcal',
        'Protein': '8.2 g',
        'Carbohydrate': '78.0 g',
        'Dietary Fiber': '2.4 g',
        'Fat': '0.6 g',
        'Sodium': '2 mg'
      },
      rawVisibleText: 'GOLDEN HARVEST BASMATI RICE. Net Qty: 1 kg. MRP: Rs. 175.00 (Incl. of all taxes). Mfd & Pkd by Bharat Agro Foods Ltd., Plot 42, GIDC, Anand, Gujarat - 388001. Pkd: 02/2026. Batch: GHR-2026-08. Consumer Care: 1800-222-3333, care@bharatagro.in. Country of Origin: India.',
      confidence: 0.98,
      fieldConfidence: {
        productName: 0.99,
        mrp: 0.98,
        netQuantity: 0.99,
        manufacturer: 0.96,
        manufacturingDate: 0.97,
        consumerCare: 0.95,
        countryOfOrigin: 0.99
      }
    }
  },
  {
    id: 'demo_review',
    title: 'Package Requiring Review',
    subtitle: 'Imported Hazelnut Cocoa Wafers 150g',
    badge: 'REVIEW REQUIRED',
    description: 'Sample package exhibiting multiple potential non-compliances: missing consumer grievance contact and absent manufacturing date.',
    previewImage: createPackageSvg(
      'DELUXE HAZELNUT WAFERS',
      'Crispy Cocoa Filled Luxury Wafers',
      '#dc2626',
      [
        '• MRP: ₹ 99.00 (Taxes missing from text)',
        '• Net Weight: 150g',
        '• Imported by: Apex Global Distributors, Andheri East, Mumbai 400069',
        '• Mfg / Pkg Date: [BLURRED / NOT DETECTED ON PANEL]',
        '• Consumer Care: [NO HELPLINE OR EMAIL VISIBLE]',
        '• Country of Origin: Italy',
        '• Best Before: 12 months from packing',
        '• Non-Compliant Flags: Missing Consumer Care (Rule 6(1)(n)), Missing Date'
      ]
    ),
    declarations: {
      productName: 'Deluxe Hazelnut Cocoa Wafers',
      mrp: '₹ 99.00',
      netQuantity: '150 g',
      manufacturer: 'Dolce Italia S.p.A., Milan, Italy',
      packer: null,
      importer: 'Apex Global Distributors, Andheri East, Mumbai - 400069',
      manufacturingDate: 'Not detected',
      consumerCare: 'Not detected',
      countryOfOrigin: 'Italy',
      genericName: 'Hazelnut Cocoa Wafers',
      unitSalePrice: null,
      bestBefore: '12 months from packing',
      ingredients: ['Wheat Flour', 'Sugar', 'Vegetable Oil (Palm)', 'Hazelnuts (12%)', 'Fat-reduced Cocoa Powder', 'Emulsifier (Soy Lecithin)', 'Salt'],
      nutritionInfo: null,
      rawVisibleText: 'DELUXE HAZELNUT WAFERS. Net Weight: 150g. MRP Rs 99. Imported & Marketed by Apex Global Distributors, Andheri East, Mumbai 400069. Product of Italy. Store in cool and dry place. Keep away from direct sunlight.',
      confidence: 0.88,
      fieldConfidence: {
        productName: 0.95,
        mrp: 0.89,
        netQuantity: 0.94,
        manufacturer: 0.84,
        manufacturingDate: 0.0,
        consumerCare: 0.0,
        countryOfOrigin: 0.92
      }
    }
  },
  {
    id: 'demo_nutrition',
    title: 'Package With Nutrition Information',
    subtitle: 'Oat Vitality Multi-Grain Breakfast Flakes 400g',
    badge: 'PASS',
    description: 'Complete nutritional declaration panel alongside statutory Legal Metrology declarations.',
    previewImage: createPackageSvg(
      'OAT VITALITY MULTI-GRAIN FLAKES',
      'Rich in Fiber & Iron | Whole Grains',
      '#059669',
      [
        '• MRP: ₹ 220.00 (Incl. of all taxes) | USP: ₹ 0.55/g',
        '• Net Quantity: 400 g',
        '• Mfd & Mktd by: NutriPure Cereals India Pvt Ltd, Whitefield, Bengaluru - 560066',
        '• Date of Manufacture: 01/2026 | Lot: NV-0126',
        '• Customer Care: 1800-425-9988 | Email: wecare@nutripure.co.in',
        '• Country of Origin: India',
        '• Nutrition Per 100g: Energy 380kcal, Protein 11.5g, Carbs 72g, Added Sugars 4.2g, Fiber 9.8g',
        '• Allergen Advice: Contains Oats, Wheat. May contain traces of almond.'
      ]
    ),
    declarations: {
      productName: 'Oat Vitality Multi-Grain Breakfast Flakes',
      mrp: '₹ 220.00 (Incl. of all taxes)',
      netQuantity: '400 g',
      manufacturer: 'NutriPure Cereals India Pvt Ltd, Survey No 44, Whitefield, Bengaluru, Karnataka - 560066',
      packer: 'NutriPure Cereals India Pvt Ltd, Whitefield, Bengaluru - 560066',
      importer: null,
      manufacturingDate: '01/2026',
      consumerCare: 'Consumer Grievance Manager: 1800-425-9988, wecare@nutripure.co.in, NutriPure Care Cell, Bengaluru - 560066',
      countryOfOrigin: 'India',
      genericName: 'Multi-Grain Breakfast Flakes',
      unitSalePrice: '₹ 0.55 per g',
      bestBefore: '9 Months from packaging',
      ingredients: [
        'Rolled Whole Oats (65%)',
        'Whole Wheat Flakes (20%)',
        'Barley Flakes (8%)',
        'Invert Sugar Syrup',
        'Malt Extract',
        'Iodized Salt',
        'Antioxidant (INS 307b)'
      ],
      nutritionInfo: {
        'Energy': '380 kcal',
        'Protein': '11.5 g',
        'Total Carbohydrates': '72.0 g',
        'Total Sugars': '5.1 g',
        'Added Sugars': '4.2 g',
        'Dietary Fiber': '9.8 g',
        'Total Fat': '4.5 g',
        'Saturated Fat': '0.9 g',
        'Trans Fat': '0.0 g',
        'Sodium': '185 mg',
        'Iron': '4.8 mg'
      },
      rawVisibleText: 'OAT VITALITY MULTI-GRAIN BREAKFAST FLAKES. Net Qty: 400 g. MRP: Rs 220.00 (Incl. of all taxes). USP: Rs 0.55/g. Mfd & Mktd by NutriPure Cereals India Pvt Ltd, Survey No 44, Whitefield, Bengaluru - 560066. Mfg: 01/2026. Lot: NV-0126. Customer Care: 1800-425-9988, wecare@nutripure.co.in. Country of Origin: India. FSSAI Lic No: 10019043002844.',
      confidence: 0.99,
      fieldConfidence: {
        productName: 0.99,
        mrp: 0.98,
        netQuantity: 0.99,
        manufacturer: 0.97,
        manufacturingDate: 0.98,
        consumerCare: 0.96,
        countryOfOrigin: 0.99
      }
    }
  }
];
