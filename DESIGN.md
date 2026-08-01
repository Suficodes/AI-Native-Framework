#Design System
 
## 1. Visual Theme & Philosophy
 
The design system is built on the pillars of **Trust**, **Sustainability**, and **Clarity**. It reflects a "Smart City" infrastructure that is reliable, eco-conscious, and accessible. The visual language is **Functional Minimalism**—prioritizing ease of use and high-speed information processing for essential services.
 
### Core Principles
 
- **Sustainability as a Canvas:** The heavy use of deep greens signifies life, growth, and environmental responsibility.
- **The Power of Whitespace:** Expansive layouts ensure that complex data (utility bills and consumption) feels manageable.
- **Bilingual Integrity:** Designed from the ground up to be perfectly balanced in both Arabic and English using the Dubai Font.
- **The Flow State:** Transitions and layouts mimic the fluidity of water and the speed of electricity.
 
---
 
## 2. Technical Color Palette
 
### Primary & Brand
 
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| Primary | `#007560` | `#7FC9BB` | Main branding, primary CTAs |
| Primary Variant | `#004937` | `#27A28D` | Deep headers, hover states, brand grounding |
| Active Background | `#E5F1EF` | `#2B4E48` | Highlighting selected tiles or active states |
| Unread/New | `#F2F8F7` | `#344545` | New notifications or status indicators |
 
#### Primary & Brand Tokens
 
- color-primary-light: #007560
- color-primary-dark: #7FC9BB
- color-primary-variant-light: #004937
- color-primary-variant-dark: #27A28D
- color-active-background-light: #E5F1EF
- color-active-background-dark: #2B4E48
- color-unread-light: #F2F8F7
- color-unread-dark: #344545
 
---
 
### Semantic & Feedback
 
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| Error | `#B00020` | `#CF6679` | Critical alerts, failed payments, or errors |
| Warning | `#FCF5E7` | `#916C0F` | Cautionary notes, high usage alerts |
| Yellow (Alert) | `#FFC600` | `#856700` | Strictly for Alerts. Never used for buttons |
 
#### Semantic & Feedback Tokens
 
- color-error-light: #B00020
- color-error-dark: #CF6679
- color-warning-light: #FCF5E7
- color-warning-dark: #916C0F
- color-alert-yellow-light: #FFC600
- color-alert-yellow-dark: #856700
 
---
 
### Gray Scale (UI Surfaces)
 
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| Background/Dialog | `#FFFFFF` | `#212427` | Page base and modal surface |
| Input Fields (100) | `#F2F3F3` | `#373B40` | Form fields and text areas |
| Lines (200) | `#EFEFF1` | `#5A5A5A` | Section dividers and borders |
| Card Border (300) | `#D7D7DF` | `#5A5A5A` | Defining component containers |
| Secondary Text 600 | `#6F6F6F` | `#BDBDBD` | Descriptions, captions, and labels |
| Primary Text 900 | `#222222` | `#E2E2E2` | Main body copy and headings |
| Header 900 | `#222222` | `#FFFFFF` | Highest emphasis titles |
 
#### Gray Scale Tokens
 
- color-background-light: #FFFFFF
- color-background-dark: #212427
- color-surface-100-light: #F2F3F3
- color-surface-100-dark: #373B40
- color-lines-200-light: #EFEFF1
- color-lines-200-dark: #5A5A5A
- color-card-border-300-light: #D7D7DF
- color-card-border-300-dark: #5A5A5A
- color-text-secondary-600-light: #6F6F6F
- color-text-secondary-600-dark: #BDBDBD
- color-text-primary-900-light: #222222
- color-text-primary-900-dark: #E2E2E2
- color-header-900-light: #222222
- color-header-900-dark: #FFFFFF
 
---
 
### Data Visualization (Graphs)
 
| Token | Light Mode | Dark Mode |
|---|---|---|
| Deep Blue | `#152685` | `#788DD1` |
| Blue-Violet | `#6C47CC` | `#A28EF2` |
| Sky Blue | `#60A5FA` | `#065EC9` |
 
#### Data Visualization Tokens
 
- color-graph-deep-blue-light: #152685
- color-graph-deep-blue-dark: #788DD1
- color-graph-blue-violet-light: #6C47CC
- color-graph-blue-violet-dark: #A28EF2
- color-graph-sky-blue-light: #60A5FA
- color-graph-sky-blue-dark: #065EC9
 
---
 
## 3. Typography (Dubai Font)
 
### The Bilingual Rule
 
- **Vertical Breathing:** Arabic script requires more vertical space. When the interface switches to Arabic, Line Height must increase by **10%** to prevent character clipping.
- **Visual Weighting:** Arabic characters naturally look thinner. To match the weight of English text, pair **English Bold** with **Arabic Medium**.
 
### Typographic Hierarchy
 
| Style | Size | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|
| Display | 80px | 120% | -1% | Major bill totals and Hero numbers |
| Heading 1 | 48px | 125% | -0.5% | Primary page titles |
| Heading 3 | 32px | 137% | -0.5% | Section titles |
| Body | 16px | 150% | 0% | Standard reading and content |
| Caption | 14px | 163% | +1% | Support text and metadata |
| Small | 12px | 133% | +2% | Footnotes and legal text |
 
#### Typography Tokens
 
- font-family: Dubai
- font-display-size: 80px
- font-display-line-height: 120%
- font-display-letter-spacing: -1%
- font-heading1-size: 48px
- font-heading1-line-height: 125%
- font-heading1-letter-spacing: -0.5%
- font-heading3-size: 32px
- font-heading3-line-height: 137%
- font-heading3-letter-spacing: -0.5%
- font-body-size: 16px
- font-body-line-height: 150%
- font-body-letter-spacing: 0%
- font-caption-size: 14px
- font-caption-line-height: 163%
- font-caption-letter-spacing: +1%
- font-small-size: 12px
- font-small-line-height: 133%
- font-small-letter-spacing: +2%
- font-arabic-line-height-increase: 10%
- font-english-weight: Bold
- font-arabic-weight: Medium
 
---
 
## 4. Geometric Logic (Radius & Spacing)
 
### The Radius Rule
 
| Value | Usage |
|---|---|
| `5px` | Input Fields — sharp and structured, implying data entry and precision |
| `7px` | Small Elements — tags, tooltips, and informational badges |
| `15px` | Standard Cards — dashboard modules and service containers |
| `20px` | Hero Containers — the largest, most significant sections of a page |
| `100px` (Full Pill) | Buttons — all interactive buttons; creates a clear visual distinction |
 
#### Radius Tokens
 
- radius-input-field: 5px
- radius-small-elements: 7px
- radius-standard-card: 15px
- radius-hero-container: 20px
- radius-button: 100px
 
### Linear Spacing Scale
 
`4px` `8px` `12px` `16px` `20px` `24px` `32px` `40px` `48px` `56px` `64px`
 
#### Spacing Tokens
 
- spacing-1: 4px
- spacing-2: 8px
- spacing-3: 12px
- spacing-4: 16px
- spacing-5: 20px
- spacing-6: 24px
- spacing-7: 32px
- spacing-8: 40px
- spacing-9: 48px
- spacing-10: 56px
- spacing-11: 64px
 
---
 
## 5. Depth, Elevation & Motion
 
### Lifting a Component
 
- **Border:** Apply a `1px` border of Lines-200 (`#EFEFF1`).
- **Fill:** Use the Light Primary tint (`#D9EAE7`).
- **Interaction:** On hover, the fill shifts to Active Background (`#E5F1EF`), creating an Optical Lift and clear feedback.
 
#### Elevation Tokens
 
- elevation-border-width: 1px
- elevation-border-color-light: #EFEFF1
- elevation-border-color-dark: #5A5A5A
- elevation-fill-light: #D9EAE7
- elevation-fill-dark: #2B4E48
- elevation-hover-fill-light: #E5F1EF
- elevation-hover-fill-dark: #2B4E48
 
### The Flow Motion
 
- **Data Flow:** Graphs utilize a linear-glide animation (`400ms`) to represent the movement of water and energy.
- **Success Logic:** When a transaction is completed, the Primary Green color pulses outward from the action button.
 
#### Motion Tokens
 
- motion-graph-animation: linear-glide
- motion-graph-duration: 400ms
- motion-success-pulse-color-light: #007560
- motion-success-pulse-color-dark: #7FC9BB
 
---
 
## 6. Do's and Don'ts
 
### ✅ DO
 
- Use **Primary Green** for all successful outcomes and primary navigational paths.
- **Mirror the entire layout** for Arabic (RTL), including the placement of icons and text alignment.
- Use **Full Pill** shapes for every button to ensure interactive elements are unmistakable.
- Apply the **Radius Scale** correctly—never use a 20px radius on an input field.
 
### ❌ DON'T
 
- Never use **Yellow** for buttons; it is an Alert color for caution and warnings only.
- Avoid shadows where a subtle border (`#D7D7DF`) or tint (`#D9EAE7`) can define the shape.
- Do not flip **brand logos** when mirroring the UI; only directional icons (arrows, chevrons) should flip.
- Do not use **Accent Blue** in this system; the focus is strictly on Green-based sustainability.
 
---
 
## 7. Component Masterclass
 
### Button Masterclass
 
All buttons in the system are **100px Full Pill** elements.
 
#### Component Hierarchy
 
| Type | Style | Usage |
|---|---|---|
| Primary (Solid) | `#007560` fill | "Pay Now," "Submit" |
| Secondary (Outline) | 1px border `#222222` | "Back," "Cancel" |
| Tertiary (Ghost) | No background or border | Low-priority actions |
 
#### Dynamic Iconography Logic
 
- **Leading Icon (Context):** Indicates the type of action.
- **Trailing Icon (Direction):** Indicates movement in a flow.
- **Spacing:** Exactly `8px` between icon and text.
- Both icons will **not** be displayed simultaneously.
 
#### State Definitions
 
| State | Primary (Solid) | Secondary (Outline) | Tertiary (Ghost) |
|---|---|---|---|
| Default | `#007560` | White Bg + `#222222` Border | Transparent |
| Hover | `#27A28D` | `#F2F3F3` Background | `#E5F1EF` Background |
| Disabled | `#7FC9BB` (40%) | `#EFEFF1` Border + Gray Text | Grayed Out Text |
 
#### Button Tokens
 
- button-border-radius: 100px
- button-height: 48px
- button-padding-horizontal: 24px
- button-font: Dubai Medium
- button-font-size: 16px
- button-font-case: sentence-case
- button-icon-spacing: 8px
- button-primary-background-light: #007560
- button-primary-background-dark: #7FC9BB
- button-primary-hover-background-light: #27A28D
- button-primary-hover-background-dark: #004937
- button-primary-disabled-background-light: #7FC9BB
- button-primary-disabled-opacity: 40%
- button-secondary-background-light: #FFFFFF
- button-secondary-background-dark: #212427
- button-secondary-border-light: #222222
- button-secondary-border-dark: #E2E2E2
- button-secondary-hover-background-light: #F2F3F3
- button-secondary-hover-background-dark: #373B40
- button-secondary-disabled-border-light: #EFEFF1
- button-secondary-disabled-border-dark: #5A5A5A
- button-tertiary-background: transparent
- button-tertiary-hover-background-light: #E5F1EF
- button-tertiary-hover-background-dark: #2B4E48
 
---
 
### Form & Feedback Masterclass
 
#### Core Input Fields
 
| Token | Light Mode | Dark Mode | Notes |
|---|---|---|---|
| Field Background | `#ffffff` | `#373B40` | Clean and distinct |
| Borders | `#EFEFF1` | `#5A5A5A` | Structural definition |
| Primary Text | `#222222` | `#E2E2E2` | Main body copy |
| Placeholder | `#6F6F6F` | `#BDBDBD` | Guidance text |
 
#### Core Input Field Tokens
 
- input-field-background-light: #ffffff
- input-field-background-dark: #373B40
- input-field-border-light: #EFEFF1
- input-field-border-dark: #5A5A5A
- input-field-text-light: #222222
- input-field-text-dark: #E2E2E2
- input-field-placeholder-light: #6F6F6F
- input-field-placeholder-dark: #BDBDBD
- input-field-border-radius: 5px
- input-field-border-width-default: 1px
- input-field-border-width-active: 2px
- input-field-border-color-active: #007560
- input-field-border-color-error: #B00020
- input-field-label-font: Dubai Regular
- input-field-label-font-size: 16px
- input-field-helper-text-font-size: 12px
 
---
 
### Selection Controls
 
| Control | Default State | Active (Selected) | Disabled |
|---|---|---|---|
| Checkbox | Border `#D7D7DF` | `#007560` Fill + Active Ring | Grayed out |
| Radio Button | Circle `#D7D7DF` | `#007560` Inner Dot + Ring | Grayed out |
 
#### Selection Control Tokens
 
- checkbox-border-default-light: #D7D7DF
- checkbox-border-default-dark: #5A5A5A
- checkbox-fill-active-light: #007560
- checkbox-fill-active-dark: #7FC9BB
- radio-border-default-light: #D7D7DF
- radio-border-default-dark: #5A5A5A
- radio-dot-active-light: #007560
- radio-dot-active-dark: #7FC9BB
 
---
 
### Dropdowns & Multi-Selects
 
- **Radius:** 15px (M-Scale)
- **Multi-Select:** Displays a checkbox on selection and a `Item name + X More` badge
 
#### Dropdown Tokens
 
- dropdown-border-radius: 15px
- dropdown-background-light: #FFFFFF
- dropdown-background-dark: #373B40
- dropdown-border-light: #EFEFF1
- dropdown-border-dark: #5A5A5A
- dropdown-text-light: #222222
- dropdown-text-dark: #E2E2E2
 
---
 
### Alert & Notification System
 
| Type | Background Tint | Icon | Usage |
|---|---|---|---|
| Info | `#D7E7F0` (Tonal Blue) | Info Icon | General information |
| Caution | `#FCF5E7` (Yellow-Tint) | Caution Icon | Consumption warnings |
| Error / Critical | `#F3D9DE` (Red-Tint) | Error Icon | Payment failures, outages |
| Success / Status | `#D9EAE7` (Green-Tint) | Success Icon | Successful payments |
 
#### Alert Tokens
 
- alert-info-background-light: #D7E7F0
- alert-info-background-dark: #1A3A4A
- alert-caution-background-light: #FCF5E7
- alert-caution-background-dark: #3D2E00
- alert-error-background-light: #F3D9DE
- alert-error-background-dark: #4A1A22
- alert-success-background-light: #D9EAE7
- alert-success-background-dark: #1A3D36
 
---
 
### Navigation (Breadcrumbs & Tabs)
 
| Component | Specs |
|---|---|
| Breadcrumbs | Dubai Regular 16px · Chevron (`>`) divider flips for RTL · Active is `#222222` |
| Tabs | Active tab uses 20px radius · Background `#E5F1EF` · Bottom bar 3px in `#007560` · Inactive is borderless |
 
#### Navigation Tokens
 
- breadcrumb-font: Dubai Regular
- breadcrumb-font-size: 16px
- breadcrumb-active-color-light: #222222
- breadcrumb-active-color-dark: #FFFFFF
- breadcrumb-inactive-color-light: #6F6F6F
- breadcrumb-inactive-color-dark: #BDBDBD
- breadcrumb-divider-rtl-flip: true
- tab-active-border-radius: 20px
- tab-active-background-light: #E5F1EF
- tab-active-background-dark: #2B4E48
- tab-active-indicator-height: 3px
- tab-active-indicator-color-light: #007560
- tab-active-indicator-color-dark: #7FC9BB
- tab-inactive-background: transparent
- tab-inactive-border: none