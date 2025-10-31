# favicon-fish 🐟

An independent favicon generator that creates ICO and PNG favicon variants from a mascot image. Designed to work with any project structure.

## Features

- 🎨 Generates favicon.ico from any mascot PNG image
- 📦 Creates multiple PNG variants (16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
- ✅ Includes built-in validation and testing
- 🔧 Works as a standalone package on any project
- 🌍 Can be used as a CLI tool or integrated into build processes

## Installation

```bash
npm install
```

## Usage

### As a CLI Tool

```bash
# Generate favicon (from current directory)
node index.js generate

# Generate favicon for a specific project
node index.js generate /path/to/project

# Test generated favicon
node index.js test

# Test favicon for a specific project
node index.js test /path/to/project

# Show help
node index.js help
```

### Using npm scripts

```bash
# Generate favicon
npm run generate -- /path/to/project

# Test favicon
npm run test -- /path/to/project
```

### Using environment variables

```bash
# Set the PROJECT_ROOT environment variable
export PROJECT_ROOT=/path/to/project
node index.js generate
node index.js test
```

## Project Structure

The tool expects the following project structure:

```
project-root/
├── src/
│   └── assets/
│       └── mascot.png      (Input mascot image)
└── public/                          (Output directory)
    ├── favicon.ico                 (Generated)
    ├── favicon-16x16.png           (Generated)
    ├── favicon-32x32.png           (Generated)
    ├── favicon-48x48.png           (Generated)
    ├── favicon-64x64.png           (Generated)
    ├── favicon-128x128.png         (Generated)
    └── favicon-256x256.png         (Generated)
```

## Options

You can specify the project path in three ways (in order of precedence):

1. **CLI argument**: `node index.js generate /path/to/project`
2. **Environment variable**: `PROJECT_ROOT=/path/to/project node index.js generate`
3. **Current directory**: `node index.js generate` (uses `process.cwd()`)

## Output

### favicon.ico
A standard ICO format file containing embedded PNG images at multiple resolutions (16x16, 32x32, 48x48). This provides the best browser compatibility.

### PNG Variants
Individual PNG files for each size, useful for modern web applications and progressive enhancement:
- `favicon-16x16.png` - Tab icons
- `favicon-32x32.png` - Tab icons (higher resolution)
- `favicon-48x48.png` - Windows taskbar
- `favicon-64x64.png` - Extended sizes
- `favicon-128x128.png` - High-DPI displays
- `favicon-256x256.png` - Extra large displays

## Testing

The test script validates:
- ✅ favicon.ico exists and has valid size
- ✅ favicon.ico has proper ICO format headers
- ✅ favicon.ico contains image data
- ✅ All PNG variants are generated
- ✅ Source mascot image exists

Run tests with:
```bash
npm run test
# or
node index.js test /path/to/project
```

## Requirements

- Node.js >= 18.0.0
- A mascot PNG image at `src/assets/mascot.png`

## Dependencies

- **sharp** - High-performance image processing library

## License

MIT