import React from 'react';
import { BookOpen, X, ExternalLink, Scale, AlertCircle, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';

interface RulesReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesReferenceModal: React.FC<RulesReferenceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="rules-reference-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        id="rules-reference-modal-container"
        className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Legal Metrology (Packaged Commodities) Rules, 2011
              </h3>
              <p className="text-xs text-slate-300">
                Reference summary for AI-assisted preliminary compliance screening.
              </p>
            </div>
          </div>
          <button
            id="rules-reference-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close rules reference"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700 leading-relaxed">
          {/* Introductory Overview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Statutory Framework & Scope</span>
            </div>
            <p className="text-slate-600">
              The Legal Metrology (Packaged Commodities) Rules, 2011 specify mandatory declarations for applicable pre-packaged commodities. Under Rule 9(1)(a), all required declarations must be legible and prominent so consumers are clearly informed before purchase.
            </p>
          </div>

          {/* Applicability Note Callout */}
          <div
            id="rules-applicability-note"
            className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-200 flex items-start gap-2.5 text-amber-900"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-amber-950">Applicability Note: </span>
              Requirements can vary based on commodity type, package type, imported/domestic status and applicable exemptions/amendments. This application performs preliminary AI-assisted screening and does not constitute legal certification or a final enforcement decision.
            </div>
          </div>

          {/* Rule Cards Grid */}
          <div className="space-y-3 pt-1">
            {/* 1. Retail Sale Price / MRP */}
            <div id="rule-ref-mrp" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs flex items-center">
                  <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2 text-[11px]">
                    Rule 6(1)(e)
                  </span>
                  Retail Sale Price (MRP) & Taxes
                </h4>
              </div>
              <p className="mt-1.5 text-slate-600">
                The retail sale price/MRP declaration must comply with the applicable Rule 6 requirements and Indian currency requirements. Official Department of Consumer Affairs material describes the retail sale price as MRP inclusive of all taxes (e.g., &quot;MRP ₹...&quot; or &quot;Maximum Retail Price ₹... incl. of all taxes&quot;). The screening system verifies that a price declaration and tax inclusion context are present; it does not automatically classify a package as legally non-compliant merely because its wording differs from an example phrase.
              </p>
            </div>

            {/* 2. Net Quantity */}
            <div id="rule-ref-net-qty" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2 text-[11px]">
                  Rule 6(1)(c)
                </span>
                Net Quantity in Applicable Standard Units
              </h4>
              <p className="mt-1.5 text-slate-600">
                Mandatory declaration of net quantity in terms of the applicable standard unit of weight, measure, or number (such as g, kg, ml, l, or number/N). The system checks whether the declared net quantity uses an applicable standard unit under the Rules.
              </p>
            </div>

            {/* 3. Common / Generic Name */}
            <div id="rule-ref-generic-name" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2 text-[11px]">
                  Rule 6(1)(b)
                </span>
                Common / Generic Name of Commodity
              </h4>
              <p className="mt-1.5 text-slate-600">
                The common or generic name of the commodity is among the mandatory package information identified by the Department of Consumer Affairs. Packages must indicate the common or generic name of the commodity contained within so that consumers are clearly informed of product identity.
              </p>
            </div>

            {/* 4. Manufacturer / Packer / Importer */}
            <div id="rule-ref-manufacturer" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2 text-[11px]">
                  Rule 6(1)(a)
                </span>
                Name and Address of Manufacturer, Packer, or Importer
              </h4>
              <p className="mt-1.5 text-slate-600">
                Applicable packages must declare the relevant name and address information for the manufacturer, packer, or importer as required by the Rules. Where the manufacturer is not the packer, the relevant names and addresses are declared as applicable. For imported packages, the name and complete address of the importer must be declared. Every package does not necessarily require all three.
              </p>
            </div>

            {/* 5. Manufacturing / Packing / Import Date */}
            <div id="rule-ref-dates" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2 text-[11px]">
                  Rule 6(1)(d)
                </span>
                Month and Year of Manufacture / Pre-packing / Import
              </h4>
              <p className="mt-1.5 text-slate-600">
                Applicable packages must declare the month and year in which the commodity is manufactured, pre-packed, or imported, according to the applicable provisions of Rule 6 and subsequent amendments.
              </p>
            </div>

            {/* 6. Unit Sale Price */}
            <div id="rule-ref-unit-sale-price" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2 text-[11px]">
                  Rule 6(11)
                </span>
                Unit Sale Price
              </h4>
              <p className="mt-1.5 text-slate-600">
                Rule 6(11) requires unit sale price declarations for applicable pre-packaged commodities to facilitate consumer price transparency. When required under the Rules, unit sale price must be declared in applicable units:
              </p>
              <ul className="mt-1.5 ml-4 list-disc space-y-0.5 text-slate-600 text-[11px]">
                <li><strong>Per gram</strong> or <strong>per kilogram</strong> (for weight-based commodities)</li>
                <li><strong>Per millilitre</strong> or <strong>per litre</strong> (for liquid commodities)</li>
                <li><strong>Per centimetre</strong> or <strong>per metre</strong> (for length-based commodities)</li>
                <li><strong>Per number</strong> (for count-based commodities)</li>
              </ul>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Applicability depends on the package type and declared net quantity under the Rules rather than a simplistic universal check.
              </p>
            </div>

            {/* 7. Consumer Care Details */}
            <div id="rule-ref-consumer-care" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2 text-[11px]">
                  Rule 6(1)(n)
                </span>
                Consumer Care Details
              </h4>
              <p className="mt-1.5 text-slate-600">
                Every applicable package must declare consumer care information to ensure consumers have a designated point of contact for complaints or queries (such as telephone number, email, or designated office address), subject to the specific category requirements and guidelines issued by the Department.
              </p>
            </div>

            {/* 8. Country of Origin */}
            <div id="rule-ref-origin" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2 text-[11px]">
                  Rule 6(1)(m)
                </span>
                Country of Origin
              </h4>
              <p className="mt-1.5 text-slate-600">
                The country of origin or manufacture or assembly must be clearly declared on applicable packages, which is particularly relevant to imported products under the Rules.
              </p>
            </div>

            {/* 9. Best Before / Use By */}
            <div id="rule-ref-best-before" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                Best Before / Use By (Where Applicable)
              </h4>
              <p className="mt-1.5 text-slate-600">
                Applicable commodities which may become unfit for human consumption require the relevant date declaration (such as &quot;Best Before&quot; or &quot;Use By&quot; with month/year or days). This requirement applies to susceptible product categories rather than universally to every packaged commodity.
              </p>
            </div>

            {/* 10. Dimensions */}
            <div id="rule-ref-dimensions" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                Dimensions (Where Applicable)
              </h4>
              <p className="mt-1.5 text-slate-600">
                Where the dimensions of the commodity are relevant (such as bedsheets, fabrics, mats, paper sheets, or specific hardware items), the applicable dimensions must be declared according to the Rules in standard metric units.
              </p>
            </div>

            {/* 11. Legibility and Prominence */}
            <div id="rule-ref-legibility" className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs flex items-center">
                <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2 text-[11px]">
                  Rule 9(1)(a)
                </span>
                Legibility and Prominence
              </h4>
              <p className="mt-1.5 text-slate-600">
                Under Rule 9(1)(a), every declaration required to be made on a package shall be legible and prominent. Declarations should be conspicuous, with sufficient visual clarity and contrast against the background so that they are easily read under normal viewing conditions.
              </p>
            </div>
          </div>

          {/* Official References Area */}
          <div id="official-references-section" className="mt-6 pt-4 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>Official Department of Consumer Affairs References</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Consult official publications from the Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution, Government of India:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <a
                id="ref-link-all-amendments"
                href="https://consumeraffairs.nic.in/sites/default/files/file-uploads/latestnews/LM_PCR_All_Amendements.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-300 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-900 font-medium text-[11px] group-hover:text-blue-700">
                    <span>PCR All Amendments</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                    Legal Metrology (Packaged Commodities) Rules & amendments compendium.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-blue-600 mt-2">consumeraffairs.nic.in</span>
              </a>

              <a
                id="ref-link-gsr-226"
                href="https://consumeraffairs.nic.in/sites/default/files/uploads/legal-metrology-acts-rules/GSR226.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-300 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-900 font-medium text-[11px] group-hover:text-blue-700">
                    <span>G.S.R. 226(E) Notification</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                    Legal Metrology (Packaged Commodities) Amendment Rules, 2022.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-blue-600 mt-2">consumeraffairs.nic.in</span>
              </a>

              <a
                id="ref-link-faqs"
                href="https://consumeraffairs.nic.in/sites/default/files/file-uploads/latestnews/LM_FAQs.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-300 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-900 font-medium text-[11px] group-hover:text-blue-700">
                    <span>Official FAQs</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                    Department of Consumer Affairs Legal Metrology FAQs and guidance.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-blue-600 mt-2">consumeraffairs.nic.in</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Department of Consumer Affairs, Government of India</span>
          </span>
          <button
            id="rules-reference-footer-close-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

