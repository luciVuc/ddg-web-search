// Main JavaScript for the website
document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu toggle
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", function () {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", function () {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        const offsetTop = target.offsetTop - 70; // Account for fixed navbar
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    });
  });

  // Navbar background on scroll
  window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 100) {
      navbar.style.background = "rgba(255, 255, 255, 0.98)";
      navbar.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)";
    } else {
      navbar.style.background = "rgba(255, 255, 255, 0.95)";
      navbar.style.boxShadow = "none";
    }
  });

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe elements for animation
  document
    .querySelectorAll(".feature-card, .install-option, .api-card")
    .forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });
});

// Tab functionality
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Remove active class from all tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab content
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add("active");
  }

  // Add active class to clicked button
  event.target.classList.add("active");
}

// Copy to clipboard functionality
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function copyToClipboard(button) {
  const codeBlock = button.parentElement;
  const code = codeBlock.querySelector("code");
  const text = code.textContent;

  // Create temporary textarea to copy text
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);

  // Show feedback
  const originalText = button.textContent;
  button.textContent = "Copied!";
  button.style.background = "#27AE60";

  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = "";
  }, 2000);
}

// Terminal animation
function animateTerminal() {
  const terminalLines = document.querySelectorAll(".terminal-line");
  const terminalOutput = document.querySelector(".terminal-output");

  // Hide all elements initially
  terminalLines.forEach((line) => (line.style.opacity = "0"));
  if (terminalOutput) terminalOutput.style.opacity = "0";

  // Animate each line with delay
  terminalLines.forEach((line, index) => {
    setTimeout(() => {
      line.style.opacity = "1";
      line.style.transition = "opacity 0.5s ease";
    }, index * 800);
  });

  // Show output after commands
  if (terminalOutput) {
    setTimeout(
      () => {
        terminalOutput.style.opacity = "1";
        terminalOutput.style.transition = "opacity 0.5s ease";
      },
      terminalLines.length * 800 + 500,
    );
  }
}

// Start terminal animation when the hero section is visible
document.addEventListener("DOMContentLoaded", function () {
  const heroSection = document.querySelector(".hero");
  if (heroSection) {
    const heroObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              animateTerminal();
            }, 1000);
            heroObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    heroObserver.observe(heroSection);
  }
});

// Add dynamic content to badges
document.addEventListener("DOMContentLoaded", function () {
  // Update npm badges with actual package info (if available)
  const badges = document.querySelectorAll(".hero-badges img");
  badges.forEach((badge) => {
    badge.addEventListener("error", function () {
      // Hide badge if image fails to load (package might not be published yet)
      this.style.display = "none";
    });
  });
});

// Add search functionality to navigation
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function addSearchFunctionality() {
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search documentation...";
  searchInput.className = "nav-search";
  searchInput.style.cssText = `
    padding: 8px 15px;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    outline: none;
    font-size: 0.9rem;
    width: 200px;
    transition: var(--transition);
  `;

  searchInput.addEventListener("focus", function () {
    this.style.borderColor = "var(--primary-color)";
    this.style.boxShadow = "0 0 0 2px rgba(222, 88, 51, 0.1)";
  });

  searchInput.addEventListener("blur", function () {
    this.style.borderColor = "var(--border-color)";
    this.style.boxShadow = "none";
  });

  // Add search functionality
  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase();
    if (query.length > 2) {
      highlightSearchResults(query);
    } else {
      clearHighlights();
    }
  });

  // Add to navbar (optional - commented out for now)
  // const navMenu = document.querySelector('.nav-menu');
  // if (navMenu && window.innerWidth > 768) {
  //     const searchItem = document.createElement('li');
  //     searchItem.appendChild(searchInput);
  //     navMenu.appendChild(searchItem);
  // }
}

function highlightSearchResults(query) {
  clearHighlights();
  const textNodes = getTextNodes(document.body);

  textNodes.forEach((node) => {
    const text = node.textContent.toLowerCase();
    if (text.includes(query)) {
      const parent = node.parentElement;
      parent.style.backgroundColor = "rgba(222, 88, 51, 0.1)";
      parent.classList.add("search-highlight");
    }
  });
}

function clearHighlights() {
  document.querySelectorAll(".search-highlight").forEach((el) => {
    el.style.backgroundColor = "";
    el.classList.remove("search-highlight");
  });
}

function getTextNodes(node) {
  const textNodes = [];
  if (node.nodeType === Node.TEXT_NODE) {
    textNodes.push(node);
  } else {
    for (let i = 0; i < node.childNodes.length; i++) {
      textNodes.push(...getTextNodes(node.childNodes[i]));
    }
  }
  return textNodes;
}

// Initialize search functionality
// addSearchFunctionality();

// Easter egg - Konami code
let konamiCode = [];
const konami = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

document.addEventListener("keydown", function (e) {
  konamiCode.push(e.code);
  konamiCode = konamiCode.slice(-konami.length);

  if (konamiCode.join(",") === konami.join(",")) {
    // Easter egg triggered!
    document.body.style.animation = "rainbow 2s infinite";
    setTimeout(() => {
      document.body.style.animation = "";
    }, 5000);

    // Add rainbow animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes rainbow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    console.log("🦆 DDG Web Search - You found the easter egg!");
  }
});
