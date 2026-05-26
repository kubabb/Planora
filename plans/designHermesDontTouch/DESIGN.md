---
name: Aetheris Void
colors:
  surface: '#0c141a'
  surface-dim: '#0c141a'
  surface-bright: '#323a41'
  surface-container-lowest: '#070f15'
  surface-container-low: '#151c23'
  surface-container: '#192027'
  surface-container-high: '#232b32'
  surface-container-highest: '#2e363d'
  on-surface: '#dbe3ec'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#dbe3ec'
  inverse-on-surface: '#293138'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#bdc2ff'
  on-secondary: '#1b247f'
  secondary-container: '#343d96'
  on-secondary-container: '#a8afff'
  tertiary: '#e9ecf5'
  on-tertiary: '#2d3137'
  tertiary-container: '#cdd0d9'
  on-tertiary-container: '#555960'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#343d96'
  tertiary-fixed: '#dfe2eb'
  tertiary-fixed-dim: '#c3c6cf'
  on-tertiary-fixed: '#181c22'
  on-tertiary-fixed-variant: '#43474e'
  background: '#0c141a'
  on-background: '#dbe3ec'
  surface-variant: '#2e363d'
  void-black: '#0c141a'
  starlight-cyan: '#00e5ff'
  deep-orbit: '#151d22'
  nebula-blur: rgba(12, 20, 26, 0.6)
  laser-error: '#ffb4ab'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.2'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  margin: 32px
  gutter: 24px
  container-max: 1440px
---

## Brand & Style
Aetheris Void is a high-performance developer tools brand that evokes the feeling of "engineering for the deep frontier." The aesthetic is a fusion of **Dark Minimalism** and **Glassmorphism**, specifically tailored for a technical audience.

The brand personality is precise, cinematic, and authoritative. It utilizes high-contrast neon accents against "obsidian" surfaces to simulate a command-center environment. Visual interest is driven by subtle motion (parallax, word cycling) and light-based depth (glows and blurs) rather than heavy textures or illustrative flourishes. The target audience is modern engineering teams who value speed, security, and sophisticated tooling.

## Colors
The palette is rooted in a deep "Void Black" (#0c141a) background that provides a high-contrast stage for "Starlight Cyan" (#00e5ff) accents. 

- **Primary:** A vibrant, high-fidelity cyan used for CTAs, active states, and glowing accents.
- **Secondary/Tertiary:** Deep indigo and charcoal tones used for structural depth and subtle container separation.
- **Neutral:** A cool-toned slate white (#dbe3ec) for primary text, ensuring legibility against dark backgrounds.
- **Functional:** An "Error" red is utilized sparingly for status indicators and destructive actions, maintained at a high enough brightness to be legible in dark mode.

## Typography
The system uses **Geist** for its clean, technical, and Swiss-inspired proportions, ensuring maximum clarity in data-dense interfaces. **JetBrains Mono** is reserved for code snippets and meta-information (like file paths or status logs) to emphasize the developer-centric nature of the product.

Headlines should use tight tracking and leading to feel compact and impactful. Labels and small CTAs use increased letter spacing (0.05em) and uppercase styling to provide a "instrument panel" aesthetic.

## Layout & Spacing
The system follows a **Fixed Grid** model with a maximum content width of 1440px. 

- **Desktop:** 12-column grid with 24px (gutter) and 32px (margins).
- **Mobile:** Single column with 16px margins.
- **Rhythm:** An 8px/4px base unit is used for all internal component spacing to maintain mathematical consistency. 

Padding within "Glass" cards is generous (32px) to allow the content to breathe against the semi-transparent background.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Tonal Layering** rather than traditional drop shadows.

1.  **The Void (Base):** Solid #0c141a background.
2.  **Orbit Layers (Cards):** Semi-transparent `rgba(12, 20, 26, 0.6)` with a 12px backdrop-blur. 
3.  **Borders:** Subtle `rgba(255, 255, 255, 0.08)` borders define edges.
4.  **Glows:** Interactive elements (like primary buttons) emit a "Cyan Aura" (`0 0 20px rgba(0, 229, 255, 0.3)`) when hovered, simulating active light emission in space.

## Shapes
The shape language is primarily **Soft Geometric**. While the base unit is slightly rounded (4px), larger cards and containers use more pronounced radii (12px to 16px) to soften the "industrial" feel of the dark theme.

- **Standard Elements:** 4px (Buttons, Input fields).
- **Cards/Bento Boxes:** 12px.
- **Hero Actions/Pills:** Full roundedness (rounded-full) for primary call-to-action buttons to create visual hierarchy through shape contrast.

## Components

- **Buttons:**
    - **Primary:** Full-pill shape, solid Cyan background, black text. Includes a light-cyan outer glow on hover.
    - **Secondary/Ghost:** Full-pill shape, subtle 1px border (`outline-variant/30`), white/neutral text, backdrop-blur background.
- **Glass Cards:** Used for bento-style layouts. Features a thin top border (`orbit-border`) with a 20% opacity cyan tint to simulate light catching the edge of a pane.
- **Status Indicators:** Small 8px circles with pulse animations. Uses the Primary Cyan for "Active/Online" and Error Red for "Alerts."
- **Code Blocks:** Darker than the surface background with monospaced text. Includes a "mac-style" window header with colored window controls for aesthetic flair.
- **Navigation:** Fixed top bar with a high `backdrop-blur` (80% opacity) and a thin bottom border to separate it from the scrollable content.