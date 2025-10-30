# Frontend Migration Guide

## Overview

This guide explains the new Next.js frontend that replaces the single-page HTML application with a modern, improved UX.

## Key Improvements

### 1. Step-by-Step Workflow

The new interface guides users through a clear 4-step process:

**Step 1: Schema Definition**
- Define data structure with fields
- Import/export schemas as JSON files
- Validate schema before proceeding
- Wide-view layout for better visibility

**Step 2: Model Configuration**
- Separate model configuration from prompt
- Choose LLM provider (OpenAI/Anthropic)
- Configure temperature and max tokens
- Optional API key input (uses env vars by default)

**Step 3: Prompt Input**
- Enter text for data extraction
- Toggle "Extract as List" for multiple instances
- Clear separation of concerns
- Large text area for better input experience

**Step 4: Results**
- Toggle between formatted and raw JSON views
- Formatted view shows data in a user-friendly way
- Export results as JSON or Markdown
- Start new extraction or go back to edit

### 2. Schema Import/Export

Users can now:
- Export schema definitions as JSON files
- Import previously saved schemas
- Share schemas with team members
- Reuse schemas across sessions

### 3. Improved Result Display

- **Formatted View**: User-friendly display with proper formatting
- **Raw JSON View**: Technical view for developers
- Easy toggle between views
- No more confusing validation result display

### 4. Wide-View Compatible

- Optimized for large screens
- Better use of horizontal space
- Responsive design that works on all screen sizes
- Modern, clean UI with Tailwind CSS

## Technical Stack

- **Next.js 16**: Latest React framework with App Router
- **React 19**: Modern React features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Client-side State Management**: React hooks for local state

## Architecture

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page (renders InstructorApp)
│   └── globals.css        # Global Tailwind styles
├── components/            # React components
│   ├── InstructorApp.tsx  # Main app with state management
│   ├── StepIndicator.tsx  # Visual step progress indicator
│   ├── SchemaStep.tsx     # Step 1: Schema definition
│   ├── ModelConfigStep.tsx # Step 2: Model configuration
│   ├── PromptStep.tsx     # Step 3: Prompt input
│   └── ResultsStep.tsx    # Step 4: Results display
├── lib/                   # Utility functions
│   └── api.ts            # API client for backend calls
└── types/                # TypeScript type definitions
    └── schema.ts         # Schema and config types
```

## Running the Frontend

### Development Mode

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

### Production Build

```bash
cd frontend
npm run build
npm start
```

## API Integration

The frontend communicates with the Python backend via REST API:

- `POST /api/schema/validate` - Validate schema definition
- `POST /api/completion` - Run LLM completion
- `POST /api/export` - Export results

Backend should be running on `http://localhost:8000` (default) or set `NEXT_PUBLIC_API_URL` environment variable.

## Migration from Old UI

The legacy single-page HTML interface is still available at `http://localhost:8000` for backward compatibility.

### Differences

| Feature | Old UI | New Frontend |
|---------|--------|--------------|
| Layout | Single page, cramped | Step-by-step, wide-view |
| Schema Management | Manual only | Import/Export support |
| Model Config | Mixed with prompt | Separate dedicated step |
| Results View | Raw JSON only | Toggle formatted/raw |
| Navigation | Scroll-based | Step-based with indicator |
| Technology | Vanilla JS | Next.js + TypeScript |

## User Experience Improvements

1. **Clear Progress**: Visual step indicator shows current position
2. **Validation Feedback**: Immediate schema validation with clear messages
3. **Flexible Navigation**: Go back/forward between steps freely
4. **Better Organization**: Each concern in its own dedicated step
5. **Modern UI**: Clean, professional design with smooth interactions

## Future Enhancements

Potential future improvements:
- Real-time streaming results in Step 4
- Schema templates library
- History of past extractions
- Collaborative schema editing
- Advanced field types (dates, enums, etc.)
- Dark mode support
