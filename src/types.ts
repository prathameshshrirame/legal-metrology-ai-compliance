export interface InspectionDeclaration {
  productName: string | null;
  mrp: string | null;
  netQuantity: string | null;
  manufacturer: string | null;
  packer: string | null;
  importer: string | null;
  manufacturingDate: string | null;
  consumerCare: string | null;
  countryOfOrigin: string | null;
  ingredients: string[] | null;
  nutritionInfo: Record<string, string> | null;
  rawVisibleText: string | null;
  confidence: number;
  fieldConfidence?: Record<string, number>;
  genericName?: string | null;
  unitSalePrice?: string | null;
  bestBefore?: string | null;
}

export interface ComplianceCheck {
  id: string;
  ruleRef: string;
  checkName: string;
  status: 'PASS' | 'REVIEW';
  detectedValue: string;
  explanation: string;
  weight: number;
  isMandatory: boolean;
}

export interface InspectionRecord {
  id: string;
  timestamp: string;
  productName: string;
  imageUri: string;
  declarations: InspectionDeclaration;
  complianceChecks: ComplianceCheck[];
  overallStatus: 'PASS' | 'REVIEW REQUIRED';
  complianceScore: number;
  issuesRequiringReview: string[];
  inspectorNotes?: string;
  isDemo?: boolean;
  screeningDisclaimer?: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  badge: 'PASS' | 'REVIEW REQUIRED';
  description: string;
  previewImage: string;
  declarations: InspectionDeclaration;
}
