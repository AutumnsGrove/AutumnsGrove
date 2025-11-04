/**
 * Autumn Brown's Personal Website
 * Vanilla JavaScript for smooth interactions and animations
 */

// Check if user prefers reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Smooth Scroll Navigation
 * Handles anchor links with smooth scrolling behavior
 */
document.addEventListener('DOMContentLoaded', function() {
  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      // Skip if href is just '#'
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);

      if (target) {
        // Disable smooth scroll if user prefers reduced motion
        const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
        target.scrollIntoView({ behavior: scrollBehavior, block: 'start' });

        // Close mobile menu if open (useful for responsive navigation)
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
        }
      }
    });
  });
});

/**
 * Intersection Observer for Fade-In Animations
 * Animates elements as they come into view
 */
function initializeIntersectionObserver() {
  // Skip if user prefers reduced motion
  if (prefersReducedMotion) {
    // Immediately show all animated elements
    document.querySelectorAll('.fade-in, .fade-in-up').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
    return;
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add animation class when element enters viewport
        entry.target.classList.add('in-view');
        // Optional: stop observing this element after animation
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all fade-in elements
  document.querySelectorAll('.fade-in, .fade-in-up').forEach(el => {
    observer.observe(el);
  });
}

/**
 * Interactive Elements - Hover Effects
 * Adds subtle hover states to interactive components
 */
function initializeInteractiveElements() {
  const buttons = document.querySelectorAll('button, .btn, a.button');
  const links = document.querySelectorAll('a:not([href^="#"])');

  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.3s ease';
    });
  });

  // Optional: Add subtle glow or scale effect on hover
  // This is handled primarily in CSS for better performance
}

/**
 * Floating Leaves Animation
 * Creates subtle, whimsical floating leaf elements in hero section
 */
function initializeLeafAnimation() {
  // Skip if user prefers reduced motion
  if (prefersReducedMotion) return;

  const heroSection = document.querySelector('.hero, [data-section="hero"]');
  if (!heroSection) return;

  const leafCount = 5; // Number of leaves to animate

  for (let i = 0; i < leafCount; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'floating-leaf';
    leaf.innerHTML = '🍂';
    leaf.style.cssText = `
      position: absolute;
      opacity: 0.3;
      font-size: ${16 + Math.random() * 24}px;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 50}%;
      animation: float ${8 + Math.random() * 4}s ease-in-out infinite;
      animation-delay: ${Math.random() * 2}s;
      pointer-events: none;
      z-index: 1;
    `;

    heroSection.style.position = 'relative';
    heroSection.appendChild(leaf);
  }
}

/**
 * Page Load Animation
 * Subtle fade in on page load
 */
function initializePageLoad() {
  if (prefersReducedMotion) {
    document.documentElement.style.opacity = '1';
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInPage {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    html {
      animation: fadeInPage 0.6s ease-out;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Add required keyframe animations to document
 */
function injectAnimationStyles() {
  if (prefersReducedMotion) return;

  const style = document.createElement('style');
  style.textContent = `
    /* Fade in animation */
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    /* Fade in and slide up animation */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Floating leaf animation */
    @keyframes float {
      0% {
        transform: translateY(0) rotate(0deg);
      }
      25% {
        transform: translateY(-20px) rotate(5deg);
      }
      50% {
        transform: translateY(0) rotate(0deg);
      }
      75% {
        transform: translateY(-15px) rotate(-5deg);
      }
      100% {
        transform: translateY(0) rotate(0deg);
      }
    }

    /* Classes for fade-in elements */
    .fade-in {
      opacity: 0;
      transition: opacity 0.6s ease-out;
    }

    .fade-in.in-view {
      opacity: 1;
    }

    .fade-in-up {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }

    .fade-in-up.in-view {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initialize all interactive features
 */
function initializeWebsite() {
  injectAnimationStyles();
  initializePageLoad();
  initializeIntersectionObserver();
  initializeInteractiveElements();
  initializeLeafAnimation();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWebsite);
} else {
  initializeWebsite();
}

/**
 * Optional: Add class to detect if user has JavaScript enabled
 * This is useful for progressive enhancement
 */
document.documentElement.classList.add('js-enabled');
