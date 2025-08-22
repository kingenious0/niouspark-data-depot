# 🚀 Humaniser Pro – Enhanced AI Detector Resistant Text Humanization

## Overview

Humaniser Pro is an advanced Node.js-based text humanization system designed to transform AI-generated content into undetectable human-like writing. The system uses sophisticated techniques to bypass major AI detection tools including GPTZero, Turnitin, Originality, Copyleaks, and others.

## 🎯 Key Features

### ✅ Advanced AI Detector Resistance
- **Word Substitution Engine**: Automatically replaces AI-preferred terms with human alternatives
- **Sentence Variability**: Injects natural sentence length variations (burstiness)
- **Emotional Markers**: Adds human-like emphasis, uncertainty, and engagement cues
- **Human Imperfections**: Introduces natural hesitations, self-corrections, and fillers
- **Persona-Based Styling**: Adapts to different writing personas (student, blogger, professional, journalist)

### ✅ File Processing Support
- **Multi-format Support**: PDF, DOCX, and TXT files
- **Text Extraction**: Uses `mammoth` for DOCX and `pdf-parse` for PDF
- **Bulk Processing**: Handle files up to 2,000 words
- **Server-side Processing**: Secure file handling with authentication

### ✅ Human-Likeness Analysis
- **Real-time Scoring**: Provides human-likeness percentage scores
- **Factor Breakdown**: Analyzes sentence variation, contractions, conversational elements
- **Detection Resistance Metrics**: Evaluates AI detector bypass effectiveness

## 🛡️ AI Detector Resistance Techniques

### Word Substitution Examples
```
"Utilize" → "use" or "take advantage of"
"Furthermore" → "plus" or "also"
"However" → "but" or "though"
"Therefore" → "so" or "that means"
```

### Human Pattern Injection
- **Variable Sentence Lengths**: Mixes short and long sentences naturally
- **Natural Contractions**: "don't", "can't", "it's", "you're"
- **Conversational Connectors**: "You know,", "Honestly,", "Basically,"
- **Emotional Emphasis**: "really", "actually", "seriously"
- **Hesitation Markers**: "uh", "um", "like", "I mean"

### Persona-Specific Adaptations
- **Student**: Casual expressions, youthful tone, slight informality
- **Blogger**: Personal touches, engaging conversational style
- **Professional**: Subtle human touches while maintaining professionalism
- **Journalist**: Direct, no-nonsense with natural flow

## 🏗️ Technical Architecture

### Backend (Node.js + Next.js)
```
src/
├── lib/
│   ├── humanization.ts          # Advanced humanization engine
│   ├── paraphrasing-service.ts  # Main service with Gemini integration
│   └── constants.ts            # Configuration and personas
├── app/api/paraphrase/
│   └── route.ts                # API endpoints
└── app/paraphraser/
    └── page.tsx                # Frontend interface
```

### Dependencies
```json
{
  "@google/generative-ai": "^0.15.0",
  "express": "^4.18.2",
  "mammoth": "^1.10.0",
  "pdf-parse": "^1.1.1",
  "genkit": "^1.14.1",
  "genkit-ai/googleai": "^1.14.1"
}
```

## 🚀 Deployment

### Vercel Deployment
The system is fully compatible with Vercel serverless functions:

1. **Environment Variables**:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email
   ```

2. **Build Configuration**:
   - Uses Next.js 15.3.3
   - Serverless API routes
   - Static file serving for frontend

## 📊 Usage Examples

### Basic Text Humanization
```typescript
import { advancedHumanizeText } from '@/lib/humanization';

const result = advancedHumanizeText(
  "The implementation utilizes advanced methodologies to facilitate optimal outcomes.",
  {
    persona: 'blogger',
    intensity: 'aggressive'
  }
);
// Output: "The thing is, this setup really uses some smart approaches to help get the best results, you know?"
```

### File Processing
```typescript
// Upload PDF/DOCX files through the API
const formData = new FormData();
formData.append('file', file);
formData.append('mode', 'humanize');
formData.append('tone', 'casual');

const response = await fetch('/api/paraphrase', {
  method: 'PUT',
  body: formData
});
```

## 🎯 Success Metrics

### Target Performance
- **Human-likeness Score**: >70% for processed content
- **AI Detector Bypass**: Pass 3+ major detectors (GPTZero, Turnitin, etc.)
- **Readability**: Maintain Flesch Reading Ease >60
- **Processing Speed**: <30 seconds for 2,000 words
- **File Support**: PDF, DOCX, TXT with 99% extraction accuracy

### Current Capabilities
- ✅ **2,000 word limit** with efficient processing
- ✅ **Multi-format file support** with robust extraction
- ✅ **Real-time human-likeness analysis** with detailed metrics
- ✅ **Advanced persona system** for different writing styles
- ✅ **Vercel-compatible deployment** with serverless functions

## 🔧 Configuration Options

### Humanization Intensity Levels
- **Light**: Subtle improvements, minimal changes
- **Medium**: Balanced humanization with good detector resistance
- **Aggressive**: Maximum detector resistance with extensive modifications

### Available Personas
- **Student**: Casual, youthful, conversational
- **Blogger**: Engaging, personal, reader-focused
- **Professional**: Polished but human, business-appropriate
- **Journalist**: Direct, factual, deadline-driven

## 🔒 Security & Authentication

- **Firebase Authentication**: User session management
- **API Key Protection**: Secure Gemini API key handling
- **File Upload Validation**: Size limits and type checking
- **Rate Limiting**: Built-in request throttling

## 📈 Analytics & Monitoring

- **Usage Tracking**: Firebase Firestore logging
- **Performance Metrics**: Processing time and success rates
- **Human-likeness Scoring**: Real-time analysis feedback
- **Error Monitoring**: Comprehensive error logging

## 🚀 Getting Started

1. **Clone and Install**:
   ```bash
   git clone <repository>
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env.local
   # Add your API keys and Firebase config
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   Navigate to `/paraphraser` to use the humanization interface

## 📝 License

This project is proprietary software developed for Niouspark's Humaniser Pro service.

## 🤝 Support

For technical support or feature requests, please contact the development team.

---

**Built with ❤️ for maximum AI detector resistance and human-like text generation**
