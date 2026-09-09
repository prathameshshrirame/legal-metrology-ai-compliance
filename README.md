# Legal Metrology AI Compliance Inspector

> **Smart India Hackathon 2026 — Problem Statement SIH 26034**  
> *"Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images and labels."*

---

## 🎯 Overview

The **Legal Metrology AI Compliance Inspector** is an automated, AI-assisted compliance screening tool designed for enforcement officers, retail inspectors, and packaged commodity businesses. 

The application uses **Gemini 3.8 Multimodal AI** to inspect package labels and extract visible statutory declarations through strict evidence-based extraction (only reporting confidently visible information), followed by a deterministic rule engine based on the **Legal Metrology (Packaged Commodities) Rules, 2011**.

### Primary Workflow
```
SCAN / PHOTOGRAPH → EXTRACT (Gemini Multimodal) → VALIDATE (Rule Engine) → EXPLAIN → SAVE → PDF REPORT
```

---

## ✨ Key Features

1. **Mobile & Desktop Camera Integration**:
   - Live camera viewfinder with statutory label alignment guide.
   - Native device camera capture on mobile browsers (Android / iOS).
   - High-resolution image drag & drop and upload.
2. **Strict Evidence-Based Label Extraction**:
   - Only reports confidently visible information from the package image.
   - Extracts MRP, Net Quantity, Manufacturer, Packer, Importer, Manufacturing/Packing Date, Consumer Care Helpline/Email, Country of Origin, Ingredients, and Nutrition facts.
   - Explicitly returns `"Not detected"` or `null` whenever data is missing, illegible, or obscured.
3. **Deterministic Statutory Compliance Rule Engine**:
   - **Rule 6(1)(e)**: Retail Sale Price (MRP) & Tax Inclusion statement.
   - **Rule 6(1)(c)**: Net Quantity in standard metric units.
   - **Rule 6(1)(a) & (b)**: Name and complete address of Manufacturer / Packer / Importer.
   - **Rule 6(1)(d)**: Month & Year of manufacture / packaging.
   - **Rule 6(1)(n)**: Consumer grievance helpline and email.
   - **Rule 6(1)(m)**: Country of Origin declaration.
4. **Scoring & Clear Status Badging**:
   - `PASS` or `REVIEW REQUIRED` overall status.
   - Prototype compliance score (0–100%).
   - Explicit "Issues Requiring Review" alerts.
5. **Professional Official PDF Inspection Report**:
   - Instant 1-click vector PDF generation with embedded evidence photo, declarations table, compliance check results, and statutory disclaimer.
6. **Built-in Demo Scenarios (Offline-Ready)**:
   - **Scenario 1**: Compliant Package (*Golden Harvest Basmati Rice 1kg* — 100/100 PASS)
   - **Scenario 2**: Package Requiring Review (*Deluxe Hazelnut Wafers 150g* — 55/100 REVIEW REQUIRED)
   - **Scenario 3**: Package With Nutrition Information (*Oat Vitality Breakfast Flakes 400g* — 100/100 PASS)
7. **Audit Records & Inspection History**:
   - Persistent client-side inspection records with local browser storage and search/filter.

---

## ⚖️ Statutory Legal Language Notice

> **Important Legal Disclaimer:**  
> This application performs **AI-assisted preliminary compliance screening, NOT legal certification**. It never asserts "100% legal", "legally certified", or "safe". Flagged items are marked as **"Potential Non-Compliance"** and **"Review Required"**. The final legal authority remains solely with authorized Legal Metrology Officers.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Create or update `.env` in the project root:
```env
# Gemini API Key (multimodal label understanding)
GEMINI_API_KEY="your_google_gemini_api_key_here"

# Port (configured to 3000)
PORT=3000
```

### 4. Running Locally in Development Mode
```bash
npm run dev
```
Open `http://localhost:3000` in your desktop or mobile browser.

### 5. Production Build & Start
```bash
npm run build
npm run start
```

---

## 🔑 Configuring Gemini API

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and create a key in your Google Cloud project.
3. Add the key to `.env`:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   ```
4. The server automatically uses the `gemini-3.8-flash` multimodal model via `@google/genai` to analyze uploaded product packaging images.

---

## 🗄️ Database & Storage Architecture

1. **Client-Side Storage**: By default, the application implements local browser storage (`localStorage`) with audit trail persistence, allowing instant offline demonstrations and zero configuration during presentations.
2. **Cloud Firestore Integration (Optional)**:
   - To persist inspections across multi-inspector field operations, connect Firebase Firestore by initializing the Firebase client with your project credentials. The data structure maps cleanly to the `inspections` collection schema documented in `src/types.ts`.

---

## 🚢 Deployment (Cloud Run / Docker)

The application is container-ready. 

### Production Dockerfile
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

Deploy directly using Google Cloud Run:
```bash
gcloud run deploy legal-metrology-inspector \
  --source . \
  --port 3000 \
  --set-env-vars GEMINI_API_KEY=YOUR_API_KEY \
  --allow-unauthenticated
```

---

## 👥 Hackathon Team Notice
Developed for **Smart India Hackathon 2026** under Problem Statement **SIH 26034**.
