# AI Content Agent Documentation

Welcome to the AI Content Agent documentation. This directory contains comprehensive documentation for the AI-powered YouTube video analysis and content generation application.

## Key Features

- **Video Analysis**: Process YouTube videos to extract insights and content
- **AI Content Generation**: Create thumbnails, titles, and scripts using AI
- **Script-to-Storyboard Workspace**: Transform scripts into visual storyboards with scene-by-scene analysis, image generation, and voice-over integration
- **Chat Interface**: Interactive AI assistant for content creation
- **Real-time Database**: Convex-powered real-time data synchronization

## Documentation Structure

### SDLC Documents

- [01-Project-Overview.md](./01-Project-Overview.md) - High-level project description and objectives
- [02-Requirements-Specification.md](./02-Requirements-Specification.md) - Functional and non-functional requirements
- [03-System-Architecture.md](./03-System-Architecture.md) - Technical architecture and design patterns
- [04-Database-Design.md](./04-Database-Design.md) - Data models and schema documentation
- [05-API-Documentation.md](./05-API-Documentation.md) - API endpoints and integration details
- [06-Component-Documentation.md](./06-Component-Documentation.md) - Frontend component architecture
- [07-Security-Documentation.md](./07-Security-Documentation.md) - Security measures and authentication
- [08-Deployment-Guide.md](./08-Deployment-Guide.md) - Setup and deployment instructions
- [09-Testing-Strategy.md](./09-Testing-Strategy.md) - Testing approach and guidelines
- [10-Maintenance-Guide.md](./10-Maintenance-Guide.md) - Ongoing maintenance and updates

## Quick Start

For a quick overview, start with the [Project Overview](./01-Project-Overview.md) and [System Architecture](./03-System-Architecture.md) documents.

## Contributing

When updating this documentation, please maintain the existing structure and follow the established format patterns.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Convex

Start convex localy - npx convex dev

## Development Tools

### Convex Database

Start Convex locally:

```bash
npx convex dev
```

### Feature Flags

The application uses feature flags to control access to various features. New features include:

- `STORYBOARD_WORKSPACE` - Enables the Script-to-Storyboard Workspace
- `SCENE_IMAGE_GENERATION` - Enables image generation for storyboard scenes
- `VOICEOVER_GENERATION` - Enables voice-over generation using ElevenLabs

## ElevenLabs Voice Generation

This project includes integration with ElevenLabs for AI voice generation. To use this feature:

1. Set up your ElevenLabs API key as described in `tools/ELEVENLABS_CONFIG.md`
2. Ensure your Convex environment has the API key configured

### Troubleshooting ElevenLabs Integration

If you encounter errors when generating voiceovers:

1. Check that your ElevenLabs API key is correctly set in both `.env.local` and the Convex environment
2. Verify that the selected voice IDs exist in your ElevenLabs account
3. Ensure you haven't exceeded your ElevenLabs API quota
4. Check the browser console and server logs for detailed error messages

For more detailed configuration options and troubleshooting, see `tools/ELEVENLABS_CONFIG.md`.
