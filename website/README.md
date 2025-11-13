# DDG Web Search (Package Website)

This directory contains the complete website for the DDG Web Search package, designed for deployment on GitHub Pages.

## 🌐 Website Structure

```
website/
├── index.html         # Main landing page
├── examples.html      # Code examples and usage demonstrations
├── docs.html          # Complete API documentation
├── css/
│   └── styles.css     # Comprehensive styling
└── js/
    └── main.js        # Interactive functionality
```

## 📄 Pages Overview

### 🏠 **index.html** - Landing Page

- **Hero Section**: Compelling introduction with animated terminal demo
- **Features**: Comprehensive overview of package capabilities
- **Installation**: Multiple installation options with copy buttons
- **Quick Start**: Tabbed interface showing CLI, MCP, and API usage
- **API Overview**: High-level API reference cards
- **Call-to-Action**: Links to documentation and examples

### 💡 **examples.html** - Code Examples

- **Basic Usage**: Simple search and fetch examples
- **CLI Usage**: Terminal command demonstrations
- **MCP Server**: Integration setup and configuration
- **Advanced Configuration**: Custom rate limiting and error handling
- **Express.js Integration**: REST API implementation example
- **TypeScript Types**: Type-safe usage patterns
- **Testing**: Unit testing with Jest and mocks

### 📚 **docs.html** - Documentation

- **Sidebar Navigation**: Easy access to all documentation sections
- **API Reference**: Complete method and class documentation
- **Getting Started**: Installation and quick start guide
- **Utilities**: RateLimiter and HttpClient documentation
- **TypeScript Types**: Complete interface definitions
- **Error Handling**: Comprehensive error handling guide
- **Rate Limiting**: Configuration and usage
- **Testing**: Test setup and mocking examples
- **Migration Guide**: Version upgrade instructions

## 🎨 Design Features

### **Visual Design**

- **Modern UI**: Clean, professional design with DuckDuckGo branding
- **Responsive**: Fully responsive design for all device sizes
- **Color Scheme**: Custom CSS variables with DuckDuckGo orange (#DE5833)
- **Typography**: System font stack for optimal readability
- **Animations**: Smooth transitions and scroll-triggered animations

### **Interactive Elements**

- **Mobile Navigation**: Hamburger menu for mobile devices
- **Smooth Scrolling**: Animated navigation between sections
- **Copy Buttons**: One-click code copying functionality
- **Tabbed Interface**: Interactive tabs for different usage examples
- **Terminal Animation**: Animated terminal demo on the hero section
- **Easter Egg**: Konami code rainbow animation

### **Code Presentation**

- **Syntax Highlighting**: Dark terminal-style code blocks
- **Copy to Clipboard**: Instant code copying with visual feedback
- **Multiple Languages**: Examples in TypeScript, JavaScript, and shell
- **Organized Sections**: Clear separation of different code examples

## 🚀 Deployment

### **GitHub Pages Setup**

1. **Repository Settings**: Enable GitHub Pages in repository settings
2. **Source Branch**: Set source to `main` branch, `/website` folder
3. **Custom Domain** (optional): Configure custom domain in settings
4. **HTTPS**: Enable HTTPS enforcement

### **Local Development**

```bash
# Navigate to website directory
cd website/

# Serve locally using Python
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000

# Open browser
open http://localhost:8000
```

### **Build Process**

The website is built with vanilla HTML/CSS/JavaScript and requires no build process. All assets are self-contained and optimized for GitHub Pages deployment.

## 📱 Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **CSS Features**: CSS Grid, Flexbox, Custom Properties, Animations
- **JavaScript Features**: ES6+, Async/Await, IntersectionObserver

## 🔧 Customization

### **Colors and Branding**

Edit CSS custom properties in `css/styles.css`:

```css
:root {
  --primary-color: #de5833;
  --secondary-color: #2c3e50;
  --accent-color: #3498db;
  /* ... more variables */
}
```

### **Content Updates**

- **Package Info**: Update repository URLs and npm package names
- **Examples**: Add new code examples in `examples.html`
- **Documentation**: Extend API docs in `docs.html`

### **Interactive Features**

- **Analytics**: Add Google Analytics or other tracking
- **Search**: Implement documentation search functionality
- **Feedback**: Add feedback forms or rating systems

## 📈 SEO Optimization

- **Meta Tags**: Proper title, description, and keywords
- **Open Graph**: Social media preview optimization
- **Semantic HTML**: Proper heading hierarchy and structure
- **Mobile-Friendly**: Responsive design and viewport meta tag
- **Fast Loading**: Optimized images and minimal dependencies

## 🔍 Features Checklist

- ✅ **Responsive Design**: Works on all device sizes
- ✅ **Fast Loading**: No external dependencies, optimized assets
- ✅ **SEO Friendly**: Proper meta tags and semantic HTML
- ✅ **Accessible**: Good contrast ratios and keyboard navigation
- ✅ **Interactive**: Copy buttons, animations, mobile menu
- ✅ **Professional**: Clean design matching project quality
- ✅ **Comprehensive**: Complete documentation and examples
- ✅ **GitHub Pages Ready**: No build process required

## 🎯 Target Audience

- **Developers**: Primary users of the package
- **AI Engineers**: Users of the MCP server functionality
- **DevOps**: CLI tool users and system integrators
- **Open Source Contributors**: Project contributors and maintainers

The website serves as the central hub for all package information, providing clear pathways for different user types to find relevant information quickly and efficiently.
