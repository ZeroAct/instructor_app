# Instructor App Frontend

Modern Next.js frontend for the Instructor App with improved UX and step-by-step workflow.

## Features

- 📋 **Step-by-Step Workflow**: Clear progression through Schema → Model → Prompt → Results
- 📥 **Schema Import/Export**: Import and export schema definitions as JSON
- 🎨 **Wide View Compatible**: Optimized layout for large screens
- 🔄 **Dual Result Views**: Toggle between formatted and raw JSON views
- ⚙️ **Separated Concerns**: Model configuration separate from prompt input
- 🎯 **Modern UI**: Built with Next.js, React, and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 20.x or later
- Python backend running on `http://localhost:8000`

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── InstructorApp.tsx  # Main app component
│   ├── StepIndicator.tsx  # Step progress indicator
│   ├── SchemaStep.tsx     # Step 1: Schema definition
│   ├── ModelConfigStep.tsx # Step 2: Model configuration
│   ├── PromptStep.tsx     # Step 3: Prompt input
│   └── ResultsStep.tsx    # Step 4: Results display
├── lib/                   # Utilities
│   └── api.ts            # API client functions
└── types/                # TypeScript types
    └── schema.ts         # Schema type definitions
```

## API Configuration

The frontend expects the backend API to be available at `http://localhost:8000` by default.

To use a different API URL, set the `NEXT_PUBLIC_API_URL` environment variable:

```bash
NEXT_PUBLIC_API_URL=http://your-api-url:8000 npm run dev
```

## Step-by-Step Workflow

### Step 1: Schema Definition
- Define your data structure
- Add fields with types (String, Integer, Float, Boolean, List, Nested)
- Import/export schemas as JSON
- Validate schema before proceeding

### Step 2: Model Configuration
- Select LLM provider (OpenAI)
- Configure model, temperature, and max tokens
- Optionally provide API key (or use environment variables)

### Step 3: Prompt Input
- Enter your text or prompt
- Toggle "Extract as List" for multiple instances
- Run completion to extract structured data

### Step 4: Results
- View results in formatted or raw JSON mode
- Export results as JSON or Markdown
- Start a new extraction or go back to edit

## Technologies

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React 19**: Latest React features
