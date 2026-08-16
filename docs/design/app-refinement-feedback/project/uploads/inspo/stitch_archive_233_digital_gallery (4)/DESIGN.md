---
name: Editorial Archive
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#4c4640'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#7d766f'
  outline-variant: '#cec5bd'
  surface-tint: '#615e5b'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1d1b19'
  on-primary-container: '#888380'
  inverse-primary: '#cbc5c2'
  secondary: '#625e55'
  on-secondary: '#ffffff'
  secondary-container: '#e9e2d6'
  on-secondary-container: '#68645b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1d'
  on-tertiary-container: '#858386'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e8e1dd'
  primary-fixed-dim: '#cbc5c2'
  on-primary-fixed: '#1d1b19'
  on-primary-fixed-variant: '#494643'
  secondary-fixed: '#e9e2d6'
  secondary-fixed-dim: '#ccc6bb'
  on-secondary-fixed: '#1e1b14'
  on-secondary-fixed-variant: '#4a463e'
  tertiary-fixed: '#e5e1e4'
  tertiary-fixed-dim: '#c8c6c8'
  on-tertiary-fixed: '#1b1b1d'
  on-tertiary-fixed-variant: '#474649'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
  image-plate: '#FFFFFF'
  hairline: '#E4E1DA'
  signal: '#B23A20'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  body-base:
    fontFamily: Archivo Narrow
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Archivo Narrow
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  metadata-label:
    fontFamily: Archivo Narrow
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
spacing:
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 20px
  unit: 8px
---

## Brand & Style

This design system embodies a high-end editorial gallery aesthetic tailored for a curated menswear brand. The personality is restrained, precise, and intellectually masculine, drawing inspiration from niche fashion lookbooks and physical archival spaces. It prioritizes the garment as the centerpiece, using generous whitespace as a structural element rather than a void.

The design style is a blend of **Minimalism** and **Modern Editorial**. It rejects the "app-like" conventions of modern SaaS (rounded corners, shadows, vibrant gradients) in favor of a flat, architectural layout that feels permanent and intentional. Every element is governed by a strict adherence to grid systems and typographic hierarchy, evoking the feeling of a printed broadsheet or a contemporary art gallery catalogue.

## Colors

The palette is rooted in warm, organic neutrals that provide a sophisticated backdrop for photography. 
- **The primary background** uses a warm bone tone (#FAF9F6) to soften the digital experience, while **Image Plates** use pure white (#FFFFFF) to create a subtle "matting" effect around product photography, similar to a physical gallery mount.
- **Typography** is predominantly a dense near-black (#12100E), ensuring high legibility and a grounded feel. 
- **Secondary text and Hairlines** use muted, warm greys to establish hierarchy without introducing harsh contrast.
- **The Signal color** (#B23A20) is reserved strictly for high-urgency states, specifically countdowns under 60 seconds, and should never be used for general UI highlights or accents.

## Typography

The typographic system relies on a tripartite structure to distinguish between narrative, utility, and data.
- **Display:** Using *Libre Caslon Text* (as a high-quality alternative to Instrument Serif) for headings provides an authoritative, literary tone. It should be set with tight tracking in large sizes.
- **Body & UI:** *Archivo Narrow* provides a clean, neutral, yet characterful sans-serif that maintains legibility in dense product descriptions and navigation.
- **Data & Numbers:** *IBM Plex Mono* is used for all "quantifiable" information, including prices (formatted as GH₵ 380.00), sizes, and timers. This introduces a "technical ledger" feel to the commerce aspect.
- **Labels:** Metadata and small tags must always be 11px, uppercase, with 0.1em letter-spacing using the secondary text color.

## Layout & Spacing

The layout is built on a rigorous **Fixed Grid** model. On desktop, the container is centered with generous 64px outer margins. The system uses a strict 12-column grid for layouts.
- **Grid Gaps:** A minimum gutter of 32px must be maintained between all major layout blocks (e.g., product images in a list).
- **Rhythm:** Spacing follows an 8px base unit, but preference should always be given to "over-spacing" rather than "under-spacing" to maintain the gallery feel.
- **Mobile:** On mobile devices, the 32px gutter may reduce to 16px, and margins to 20px, but vertical spacing between product rows must remain expansive (48px+) to prevent a cluttered retail appearance.

## Elevation & Depth

This design system is strictly **Flat**. It rejects all traditional depth metaphors to maintain a clinical, editorial look.
- **No Shadows:** Do not use drop shadows or inner shadows for any component, including modals or menus.
- **Hairlines:** Separation is achieved through 1px solid borders using the `#E4E1DA` (Hairline) color.
- **Tonal Layering:** Depth is conveyed only through the layering of pure white image plates over the warm bone background. 
- **Interactions:** Hover states should be indicated by subtle opacity shifts (e.g., 100% to 70%) or simple underlines, never by "lifting" an element off the page.

## Shapes

The shape language is defined by **Sharp Geometry**. All UI elements, including buttons, input fields, and image containers, should have 0px border radius. A maximum of 2px is permitted only for very small utility elements (like checkboxes) if required for technical clarity, but 0px is the preferred standard across the entire system to reinforce the architectural, "archival" aesthetic.

## Components

- **Buttons:** Rectangular with 0px radius. Primary buttons are solid `#12100E` with white text. Secondary buttons are outlined with 1px `#12100E`. Text is always Archivo Narrow, uppercase, with slight tracking.
- **Cards:** Product cards must not have borders or shadows. They consist of a `#FFFFFF` image plate followed by vertically stacked metadata (Brand, Item Name, Price in Mono).
- **Input Fields:** Minimalist 1px bottom-border only (hairline color), transitioning to primary text color on focus. No background fill.
- **Lists:** Separated by 1px horizontal hairlines. High vertical padding (24px) to ensure each list item feels like a distinct entry.
- **Icons:** Limited strictly to essential navigation. Icons must be 1px weight, monochrome, and geometric. Avoid "filled" icons.
- **Navigation:** Top-level navigation is text-based. Active states are indicated by a simple 1px underline or a weight change, avoiding badges or "pills."