# ProcureBot Design System - Quick Reference

## 🎨 Using the Theme System

### CSS Variables
Use these variables in your components:

```css
/* Colors */
var(--color-bg-primary)
var(--color-bg-secondary)
var(--color-text-primary)
var(--color-text-secondary)
var(--color-accent)
var(--color-success)
var(--color-error)

/* Spacing */
var(--spacing-xs)   /* 8px */
var(--spacing-sm)   /* 16px */
var(--spacing-md)   /* 24px */
var(--spacing-lg)   /* 32px */
var(--spacing-xl)   /* 48px */

/* Typography */
var(--font-size-sm)    /* 14px */
var(--font-size-base)  /* 16px */
var(--font-size-lg)    /* 18px */
var(--font-size-xl)    /* 24px */

/* Border Radius */
var(--radius-sm)   /* 8px */
var(--radius-md)   /* 12px */
var(--radius-lg)   /* 16px */
var(--radius-xl)   /* 24px */

/* Transitions */
var(--transition-fast)  /* 0.15s ease */
var(--transition-base)  /* 0.3s ease */

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
```

---

## 📱 Responsive Breakpoints

### Mobile First Approach

```css
/* Mobile (default) - 320px+ */
.element {
  padding: var(--spacing-sm);
}

/* Tablet - 768px+ */
@media (min-width: 768px) {
  .element {
    padding: var(--spacing-md);
  }
}

/* Desktop - 1024px+ */
@media (min-width: 1024px) {
  .element {
    padding: var(--spacing-lg);
  }
}

/* Large Desktop - 1440px+ */
@media (min-width: 1440px) {
  .element {
    padding: var(--spacing-xl);
  }
}
```

---

## 🎯 Common Patterns

### Buttons
```jsx
<button className="btn btn-primary">
  Primary Action
</button>

<button className="btn btn-secondary">
  Secondary Action
</button>
```

### Cards
```jsx
<div className="card hover-lift">
  Card Content
</div>
```

### Form Inputs
```jsx
<div className="form-group">
  <label className="form-label">Label</label>
  <input className="form-input" placeholder="Enter value" />
</div>
```

### Headings
```jsx
<h1 className="heading-1">Main Title</h1>
<h2 className="heading-2">Section Title</h2>
<h3 className="heading-3">Subsection</h3>
```

---

## 🌈 Theme Toggle

Import and use:
```jsx
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <div>
      <ThemeToggle />
    </div>
  );
}
```

---

## ✨ Interactive Background

Import and use:
```jsx
import InteractiveBackground from './components/InteractiveBackground';

function App() {
  return (
    <div>
      <InteractiveBackground />
      {/* Your content */}
    </div>
  );
}
```

---

## 🎨 Utility Classes

### Spacing
```html
<div class="mb-sm">Margin bottom small</div>
<div class="mb-md">Margin bottom medium</div>
<div class="mt-lg">Margin top large</div>
```

### Flexbox
```html
<div class="flex items-center justify-center gap-md">
  Centered flex container
</div>
```

### Animations
```html
<div class="animate-in">Fades in on load</div>
<div class="hover-lift">Lifts on hover</div>
<div class="hover-scale">Scales on hover</div>
```

---

## 📊 Grid Layouts

### Stat Cards Grid
```jsx
<div className="stats-grid">
  <div className="stat-card">...</div>
  <div className="stat-card">...</div>
  <div className="stat-card">...</div>
  <div className="stat-card">...</div>
</div>
```

### Responsive Container
```jsx
<div className="responsive-container">
  Content auto-sizes to screen
</div>
```

---

## 🎯 Best Practices

### 1. Always use CSS variables for colors
```css
/* ✅ Good */
color: var(--color-text-primary);

/* ❌ Bad */
color: #1d1d1f;
```

### 2. Mobile-first media queries
```css
/* ✅ Good */
.element { padding: 8px; }
@media (min-width: 768px) {
  .element { padding: 16px; }
}

/* ❌ Bad */
.element { padding: 16px; }
@media (max-width: 767px) {
  .element { padding: 8px; }
}
```

### 3. Use spacing variables
```css
/* ✅ Good */
margin-bottom: var(--spacing-md);

/* ❌ Bad */
margin-bottom: 24px;
```

### 4. Minimum touch targets
```css
/* Always ensure 44px minimum for touch */
button {
  min-height: 44px;
  padding: 12px 24px;
}
```

### 5. Transitions for smooth interactions
```css
.element {
  transition: all var(--transition-fast);
}
```

---

## 🚀 Quick Start Checklist

When creating a new component:

- [ ] Use CSS variables for colors
- [ ] Mobile-first responsive design
- [ ] Minimum 44px touch targets
- [ ] Add hover/focus states
- [ ] Use transition effects
- [ ] Test in both light/dark themes
- [ ] Test on mobile/tablet/desktop
- [ ] Add animations (optional)
- [ ] Ensure accessibility (ARIA labels)

---

## 🎨 Color Usage Guidelines

### Text Colors
- Primary text: `var(--color-text-primary)` - Main content
- Secondary text: `var(--color-text-secondary)` - Supporting text
- Tertiary text: `var(--color-text-tertiary)` - Subtle text

### Background Colors
- Primary: `var(--color-bg-primary)` - Main background
- Secondary: `var(--color-bg-secondary)` - Sections
- Tertiary: `var(--color-bg-tertiary)` - Inputs, cards

### Action Colors
- Accent: `var(--color-accent)` - Primary actions
- Success: `var(--color-success)` - Positive states
- Error: `var(--color-error)` - Negative states
- Warning: `var(--color-warning)` - Caution states

---

**Happy Coding! 🎉**
