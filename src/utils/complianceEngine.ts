import { ComplianceCheck, InspectionDeclaration, InspectionRecord } from '../types';

/**
 * Normalizes string values from AI detection to detect whether a statutory field was visible.
 */
function isFieldPresent(val: string | null | undefined): boolean {
  if (!val) return false;
  const trimmed = val.trim().toLowerCase();
  return (
    trimmed !== '' &&
    trimmed !== 'null' &&
    trimmed !== 'undefined' &&
    trimmed !== 'not detected' &&
    trimmed !== 'not found' &&
    trimmed !== 'n/a' &&
    trimmed !== 'none'
  );
}

/**
 * Tests whether standard metric or count units recognized under Legal Metrology Rules are present.
 * Standard units include:
 * - Weight: g, gm, gms, gram, grams, kg, kgs, kilogram, kilograms, mg, milligram
 * - Volume: ml, millilitre, milliliter, l, lt, ltr, litre, liter, litres, liters, cl, kl
 * - Length/Area: m, metre, meter, cm, centimetre, centimeter, mm, millimetre, sq m, sq cm
 * - Number/Count: N, U, number, numbers, pcs, pieces, piece, units, unit, count, pairs
 */
function hasRecognizedStandardUnit(netQtyStr: string): boolean {
  const standardUnitPattern =
    /(?:^|\s|\d)(?:k?g(?:rams?|ms?)?|m[gl]|millilit(?:res?|ers?)|lit(?:res?|ers?)|l|c?m(?:et(?:res?|ers?))?|mm|sq\s*c?m|sq\s*m|pcs?|pieces?|units?|[nu]|count|pairs?)(?:\.|\b|$)/i;
  return standardUnitPattern.test(netQtyStr);
}

/**
 * Checks whether tax inclusion wording is identifiable in the MRP declaration or visible raw text.
 */
function hasTaxInclusionEvidence(mrpStr: string, rawText?: string | null): boolean {
  const taxKeywordsInMrp = /(incl|inclusive|all taxes|incl\.? of all taxes|taxes)/i.test(mrpStr);
  if (taxKeywordsInMrp) return true;

  if (rawText) {
    const taxNearMrp = /(mrp|maximum retail price)[^\n\r.,;]{0,40}(incl|inclusive|all taxes)/i.test(rawText);
    if (taxNearMrp) return true;
  }

  return false;
}

/**
 * Extracts or detects Unit Sale Price declaration if present.
 */
function findUnitSalePrice(declarations: InspectionDeclaration): string | null {
  if (isFieldPresent(declarations.unitSalePrice)) {
    return declarations.unitSalePrice!.trim();
  }

  const raw = declarations.rawVisibleText || '';
  const uspMatch = raw.match(
    /(?:usp|unit sale price|unit price)[:\s]*([₹Rs.\d\s/]+(?:per|\/)\s*(?:g|kg|ml|l|litre|liter|gram|metre|meter|cm|piece|pcs|number|n|units?))/i
  );
  if (uspMatch) {
    return uspMatch[0].trim();
  }

  return null;
}

/**
 * Validates whether a candidate string contains a plausible date, month/year, or relative validity duration.
 */
function isDateLikeBestBefore(val: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (trimmed.length < 2) return false;

  // Relative durations: e.g. "24 Months from packaging", "12 months", "180 days", "2 years", "six months"
  const hasRelativeDuration =
    /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|eighteen|twenty[- ]four)\s*(?:months?|days?|years?|weeks?)\b/i.test(
      trimmed
    );
  if (hasRelativeDuration) return true;

  // Numeric date patterns:
  // e.g. DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, MM/YYYY, MM/YY, YYYY/MM/DD
  const hasNumericDate =
    /\b(?:\d{1,2}[\/\.-]\d{1,2}[\/\.-](?:20\d{2}|\d{2})|(?:0?[1-9]|1[0-2])[\/\.-](?:20\d{2}|\d{2})|(?:20\d{2})[\/\.-](?:0?[1-9]|1[0-2]))\b/.test(
      trimmed
    );
  if (hasNumericDate) return true;

  // Month name patterns:
  // e.g. "OCT 2026", "15 OCT 2025", "OCT/2026", "25-Jan-2026", "Expiry: Dec 2025"
  const monthNames =
    '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  const hasMonthNameDate = new RegExp(
    `(?:\\b\\d{1,2}[\\s\\/\\.-]+${monthNames}(?:[\\s\\/\\.-]+(?:20\\d{2}|\\d{2}))?\\b|\\b${monthNames}[\\s\\/\\.-]+(?:\\d{1,2}[\\s\\/\\.-]+)?(?:20\\d{2}|\\d{2})\\b)`,
    'i'
  ).test(trimmed);
  if (hasMonthNameDate) return true;

  // Standalone 4-digit recent/future year (2020-2035) following date keywords (e.g. "Best Before: 2026")
  const hasYearNearExpiry = /\b(?:best before|use by|exp(?:iry)?)\b[^\d\n\r]{1,15}\b(20(?:2[0-9]|3[0-5]))\b/i.test(
    trimmed
  );
  if (hasYearNearExpiry) return true;

  return false;
}

/**
 * Extracts or detects Best Before / Expiry declaration if present.
 * Requires the value to contain a plausible date/month/year or clearly date-like duration.
 * If no valid date-like value is found, returns null.
 */
function findBestBefore(declarations: InspectionDeclaration): string | null {
  if (isFieldPresent(declarations.bestBefore) && isDateLikeBestBefore(declarations.bestBefore!)) {
    return declarations.bestBefore!.trim();
  }

  const raw = declarations.rawVisibleText || '';
  // Match potential Best Before / Expiry candidates in raw visible text
  const bbMatches = raw.matchAll(
    /(?:best before|use by|expiry date|exp(?:\.|\s*date)?|expiry)[:\s]*([^\n\r.;,]{2,60})/gi
  );

  for (const match of bbMatches) {
    const fullMatch = match[0].trim();
    const captured = match[1]?.trim() || '';
    if (isDateLikeBestBefore(captured) || isDateLikeBestBefore(fullMatch)) {
      return fullMatch;
    }
  }

  // Also check if there is a relative duration or date phrase following 'within' or 'best before'
  const durationMatch = raw.match(
    /(?:best before|use by|within)\s+(\d+\s*(?:months?|days?|years?|weeks?)(?:\s+(?:from|of)\s+[^.,\n\r]{2,30})?)/i
  );
  if (durationMatch && isDateLikeBestBefore(durationMatch[0])) {
    return durationMatch[0].trim();
  }

  return null;
}

/**
 * Deterministic rule engine for Legal Metrology (Packaged Commodities) Rules, 2011.
 * Evaluates AI-extracted packaging declarations strictly against statutory screening norms.
 *
 * Core Principle:
 * "Not detected in submitted image" indicates insufficient visual evidence on the inspected surface;
 * it does NOT establish that a declaration is absent from the entire physical package.
 */
export function runComplianceScreening(
  declarations: InspectionDeclaration,
  productImage: string,
  customId?: string,
  isDemo = false
): InspectionRecord {
  const checks: ComplianceCheck[] = [];
  const issues: string[] = [];

  // --------------------------------------------------
  // Check 1: Retail Sale Price / MRP (Rule 6(1)(e))
  // Weight: 20, Mandatory
  // --------------------------------------------------
  const mrpDetected = isFieldPresent(declarations.mrp);
  const mrpVal = declarations.mrp?.trim() || '';

  if (!mrpDetected) {
    checks.push({
      id: 'chk_mrp',
      ruleRef: 'Rule 6(1)(e)',
      checkName: 'MRP Declaration Detected',
      status: 'REVIEW',
      detectedValue: 'Not detected in submitted image',
      explanation:
        'Statutory MRP declaration was not detected in the submitted image. This does not establish that the declaration is absent from the entire package; inspect other package panels.',
      weight: 20,
      isMandatory: true,
    });
    issues.push(
      'Potential non-compliance: Statutory MRP declaration was not detected in the submitted image — review required (Rule 6(1)(e)).'
    );
  } else {
    const hasTaxes = hasTaxInclusionEvidence(mrpVal, declarations.rawVisibleText);
    if (hasTaxes) {
      checks.push({
        id: 'chk_mrp',
        ruleRef: 'Rule 6(1)(e)',
        checkName: 'MRP Declaration Detected',
        status: 'PASS',
        detectedValue: mrpVal,
        explanation:
          'Maximum Retail Price detected with tax-inclusion statement in visible evidence (Rule 6(1)(e)).',
        weight: 20,
        isMandatory: true,
      });
    } else {
      checks.push({
        id: 'chk_mrp',
        ruleRef: 'Rule 6(1)(e)',
        checkName: 'MRP Declaration Detected',
        status: 'REVIEW',
        detectedValue: mrpVal,
        explanation:
          'MRP detected, but tax-inclusion wording could not be confidently verified from the submitted image.',
        weight: 20,
        isMandatory: true,
      });
      issues.push(
        'MRP detected, but tax-inclusion wording could not be confidently verified from the submitted image — review required (Rule 6(1)(e)).'
      );
    }
  }

  // --------------------------------------------------
  // Check 2: Net Quantity (Rule 6(1)(c))
  // Weight: 20, Mandatory
  // --------------------------------------------------
  const netQtyDetected = isFieldPresent(declarations.netQuantity);
  const netQtyVal = declarations.netQuantity?.trim() || '';

  if (!netQtyDetected) {
    checks.push({
      id: 'chk_net_qty',
      ruleRef: 'Rule 6(1)(c)',
      checkName: 'Net Quantity Detected',
      status: 'REVIEW',
      detectedValue: 'Not detected in submitted image',
      explanation:
        'Net quantity declaration was not detected in the submitted image. This does not establish that the declaration is absent from the entire package; inspect other package panels.',
      weight: 20,
      isMandatory: true,
    });
    issues.push(
      'Potential non-compliance: Net quantity declaration was not detected in the submitted image — review required (Rule 6(1)(c)).'
    );
  } else {
    const standardUnit = hasRecognizedStandardUnit(netQtyVal);
    if (standardUnit) {
      checks.push({
        id: 'chk_net_qty',
        ruleRef: 'Rule 6(1)(c)',
        checkName: 'Net Quantity Detected',
        status: 'PASS',
        detectedValue: netQtyVal,
        explanation:
          'Net quantity detected in recognized standard metric/count units under Rule 6(1)(c). Verify prescribed numeral height and display area standards.',
        weight: 20,
        isMandatory: true,
      });
    } else {
      checks.push({
        id: 'chk_net_qty',
        ruleRef: 'Rule 6(1)(c)',
        checkName: 'Net Quantity Detected',
        status: 'REVIEW',
        detectedValue: netQtyVal,
        explanation:
          'Net quantity detected, but unit applicability should be verified against the commodity/package category.',
        weight: 20,
        isMandatory: true,
      });
      issues.push(
        'Net quantity detected, but unit applicability should be verified against the commodity/package category (Rule 6(1)(c)).'
      );
    }
  }

  // --------------------------------------------------
  // Check 3: Manufacturer / Packer / Importer (Rule 6(1)(a))
  // Weight: 20, Mandatory
  // --------------------------------------------------
  const hasMfg = isFieldPresent(declarations.manufacturer);
  const hasPacker = isFieldPresent(declarations.packer);
  const hasImporter = isFieldPresent(declarations.importer);

  if (!hasMfg && !hasPacker && !hasImporter) {
    checks.push({
      id: 'chk_mfg_packer',
      ruleRef: 'Rule 6(1)(a)',
      checkName: 'Manufacturer / Packer / Importer Details',
      status: 'REVIEW',
      detectedValue: 'Not detected in submitted image',
      explanation:
        'Manufacturer, packer, or importer details were not detected in the submitted image. This does not establish that the declaration is absent from the entire package; inspect other package panels.',
      weight: 20,
      isMandatory: true,
    });
    issues.push(
      'Potential non-compliance: Manufacturer/packer/importer details not detected in the submitted image — review required (Rule 6(1)(a)).'
    );
  } else {
    const visibleEntities: string[] = [];
    if (hasMfg) visibleEntities.push(`Manufacturer: ${declarations.manufacturer!.trim()}`);
    if (hasPacker) visibleEntities.push(`Packer: ${declarations.packer!.trim()}`);
    if (hasImporter) visibleEntities.push(`Importer: ${declarations.importer!.trim()}`);

    checks.push({
      id: 'chk_mfg_packer',
      ruleRef: 'Rule 6(1)(a)',
      checkName: 'Manufacturer / Packer / Importer Details',
      status: 'PASS',
      detectedValue: visibleEntities.join(' | '),
      explanation:
        'Manufacturer/packer/importer information was detected in the submitted image. Verify that the applicable name and complete address requirements are satisfied for this package.',
      weight: 20,
      isMandatory: true,
    });
  }

  // --------------------------------------------------
  // Check 4: Manufacturing / Packing Date (Rule 6(1)(d))
  // Weight: 20, Mandatory
  // --------------------------------------------------
  const mfgDateDetected = isFieldPresent(declarations.manufacturingDate);
  const mfgDateVal = declarations.manufacturingDate?.trim() || '';

  if (mfgDateDetected) {
    checks.push({
      id: 'chk_mfg_date',
      ruleRef: 'Rule 6(1)(d)',
      checkName: 'Manufacturing / Packing Date Detected',
      status: 'PASS',
      detectedValue: mfgDateVal,
      explanation:
        'Date/Month of manufacture or packaging detected in accordance with Rule 6(1)(d).',
      weight: 20,
      isMandatory: true,
    });
  } else {
    checks.push({
      id: 'chk_mfg_date',
      ruleRef: 'Rule 6(1)(d)',
      checkName: 'Manufacturing / Packing Date Detected',
      status: 'REVIEW',
      detectedValue: 'Not detected in submitted image',
      explanation:
        'Manufacturing/packing date was not detected in the submitted image. This does not establish that the declaration is absent from the entire package; inspect other package panels.',
      weight: 20,
      isMandatory: true,
    });
    issues.push(
      'Potential non-compliance: Manufacturing/packing date was not detected in the submitted image — review required (Rule 6(1)(d)).'
    );
  }

  // --------------------------------------------------
  // Check 5: Consumer Care Information (Rule 6(1)(n))
  // Weight: 10, Mandatory
  // --------------------------------------------------
  const careDetected = isFieldPresent(declarations.consumerCare);
  const careVal = declarations.consumerCare?.trim() || '';

  if (careDetected) {
    checks.push({
      id: 'chk_consumer_care',
      ruleRef: 'Rule 6(1)(n)',
      checkName: 'Consumer Care Information Detected',
      status: 'PASS',
      detectedValue: careVal,
      explanation:
        'Consumer complaint contact details (helpline, email, or customer care cell) detected in submitted image under Rule 6(1)(n).',
      weight: 10,
      isMandatory: true,
    });
  } else {
    checks.push({
      id: 'chk_consumer_care',
      ruleRef: 'Rule 6(1)(n)',
      checkName: 'Consumer Care Information Detected',
      status: 'REVIEW',
      detectedValue: 'Not detected in submitted image',
      explanation:
        'Consumer grievance contact information was not detected in the submitted image. Check other package panels before concluding that it is absent.',
      weight: 10,
      isMandatory: true,
    });
    issues.push(
      'Potential non-compliance: Consumer grievance contact information was not detected in the submitted image — review required (Rule 6(1)(n)).'
    );
  }

  // --------------------------------------------------
  // Check 6: Common / Generic Name of Commodity (Rule 6(1)(b))
  // Weight: 10, Mandatory
  // --------------------------------------------------
  const genericVal = isFieldPresent(declarations.genericName)
    ? declarations.genericName!.trim()
    : isFieldPresent(declarations.productName)
      ? declarations.productName!.trim()
      : null;

  if (genericVal) {
    checks.push({
      id: 'chk_generic_name',
      ruleRef: 'Rule 6(1)(b)',
      checkName: 'Common / Generic Commodity Name',
      status: 'PASS',
      detectedValue: genericVal,
      explanation:
        'Common or generic name of commodity identified on visible packaging in accordance with Rule 6(1)(b).',
      weight: 10,
      isMandatory: true,
    });
  } else {
    checks.push({
      id: 'chk_generic_name',
      ruleRef: 'Rule 6(1)(b)',
      checkName: 'Common / Generic Commodity Name',
      status: 'REVIEW',
      detectedValue: 'Not detected in submitted image',
      explanation:
        'Common or generic name of the commodity was not detected in the submitted image. This does not establish that the declaration is absent from the entire package; inspect other package panels.',
      weight: 10,
      isMandatory: true,
    });
    issues.push(
      'Potential non-compliance: Common or generic name of commodity was not detected in the submitted image — review required (Rule 6(1)(b)).'
    );
  }

  // --------------------------------------------------
  // Check 7 (Statutory / Category Specific): Country of Origin (Rule 6(1)(m))
  // Weight: 0, Informational / Applicable
  // --------------------------------------------------
  const originDetected = isFieldPresent(declarations.countryOfOrigin);
  const originVal = declarations.countryOfOrigin?.trim() || '';
  const appearsImported =
    isFieldPresent(declarations.importer) ||
    /import(?:ed)?|product of|foreign/i.test(declarations.rawVisibleText || '');

  if (originDetected) {
    checks.push({
      id: 'chk_country_origin',
      ruleRef: 'Rule 6(1)(m)',
      checkName: 'Country of Origin Declaration',
      status: 'PASS',
      detectedValue: originVal,
      explanation: 'Country of origin is declared on visible packaging.',
      weight: 0,
      isMandatory: false,
    });
  } else {
    checks.push({
      id: 'chk_country_origin',
      ruleRef: 'Rule 6(1)(m)',
      checkName: 'Country of Origin Declaration',
      status: 'REVIEW',
      detectedValue: 'Not detected in submitted image',
      explanation: appearsImported
        ? 'Country of origin was not detected in the submitted image for an imported commodity under Rule 6(1)(m); inspect other package panels.'
        : 'Country of origin was not detected in the submitted image. Primarily mandatory for imported commodities under Rule 6(1)(m); verify applicability.',
      weight: 0,
      isMandatory: false,
    });
    if (appearsImported) {
      issues.push(
        'Country of origin declaration not detected in submitted image for imported commodity (Rule 6(1)(m)).'
      );
    }
  }

  // --------------------------------------------------
  // Check 8 (Where Applicable): Unit Sale Price (Rule 6(11))
  // Weight: 0, Applicable to packages above threshold sizes (>1kg, >1L, etc.)
  // --------------------------------------------------
  const uspVal = findUnitSalePrice(declarations);
  if (uspVal) {
    checks.push({
      id: 'chk_unit_sale_price',
      ruleRef: 'Rule 6(11)',
      checkName: 'Unit Sale Price (Where Applicable)',
      status: 'PASS',
      detectedValue: uspVal,
      explanation: 'Unit Sale Price detected in accordance with Rule 6(11) provisions.',
      weight: 0,
      isMandatory: false,
    });
  } else {
    checks.push({
      id: 'chk_unit_sale_price',
      ruleRef: 'Rule 6(11)',
      checkName: 'Unit Sale Price (Where Applicable)',
      status: 'REVIEW',
      detectedValue: 'Not detected in submitted image',
      explanation:
        'Unit Sale Price was not detected in the submitted image. Under Rule 6(11), mandatory for packages where net quantity exceeds threshold quantities (e.g., >1 kg or >1 L); verify applicability.',
      weight: 0,
      isMandatory: false,
    });
  }

  // --------------------------------------------------
  // Check 9 (Where Applicable): Best Before / Use By
  // Weight: 0, Applicable to perishable/consumable commodities
  // --------------------------------------------------
  const bbVal = findBestBefore(declarations);
  if (bbVal) {
    checks.push({
      id: 'chk_best_before',
      ruleRef: 'Rule 6 – Mandatory Declaration',
      checkName: 'Best Before / Expiry Date (Where Applicable)',
      status: 'PASS',
      detectedValue: bbVal,
      explanation: 'Best before / expiry declaration detected in visible packaging.',
      weight: 0,
      isMandatory: false,
    });
  } else {
    checks.push({
      id: 'chk_best_before',
      ruleRef: 'Rule 6 – Mandatory Declaration',
      checkName: 'Best Before / Expiry Date (Where Applicable)',
      status: 'REVIEW',
      detectedValue: 'Not detected in submitted image',
      explanation:
        'Best before / use by date was not detected in the submitted image. Applicable where a commodity may become unfit for human consumption after a period of time; verify applicability.',
      weight: 0,
      isMandatory: false,
    });
  }

  // --------------------------------------------------
  // Calculate weighted preliminary screening score
  // Represents: "Screening score based on declarations detectable in the submitted image."
  // --------------------------------------------------
  let totalScore = 0;
  let maxScore = 0;
  for (const chk of checks) {
    if (chk.weight > 0) {
      maxScore += chk.weight;
      if (chk.status === 'PASS') {
        totalScore += chk.weight;
      }
    }
  }

  const complianceScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Overall status: PASS means "No mandatory issue was identified from the submitted evidence."
  // REVIEW REQUIRED means a mandatory applicable declaration is not detected, unclear, or requires verification.
  const anyMandatoryReview = checks.some((c) => c.isMandatory && c.status === 'REVIEW');
  const overallStatus: 'PASS' | 'REVIEW REQUIRED' = anyMandatoryReview ? 'REVIEW REQUIRED' : 'PASS';

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const inspectionId = customId || `LM-${now.getFullYear()}-${randomNum}`;

  return {
    id: inspectionId,
    timestamp: now.toISOString(),
    productName: declarations.productName || 'Packaged Commodity (Unlabeled Title)',
    imageUri: productImage,
    declarations,
    complianceChecks: checks,
    overallStatus,
    complianceScore,
    issuesRequiringReview: issues,
    isDemo,
    inspectorNotes:
      'AI-assisted preliminary compliance screening based strictly on visible packaging evidence in the submitted image. It does not constitute legal certification or a final enforcement decision.',
    screeningDisclaimer:
      'This is AI-assisted preliminary compliance screening based on the submitted image. It does not constitute legal certification or a final enforcement decision.',
  };
}
