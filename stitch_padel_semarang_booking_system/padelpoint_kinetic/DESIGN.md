# Design System Strategy: PadelPoint Semarang

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Glass Court."** 

Padel is a sport defined by transparency, speed, and high-energy enclosures. This design system moves away from static, boxy templates to create an experience that feels fluid and premium. We achieve this through "Kinetic Layering"—using glassmorphism and intentional asymmetry to mimic the layered depth of a professional Padel court. By utilizing high-contrast typography scales and overlapping surfaces, we create an editorial feel that positions PadelPoint Semarang not just as a utility, but as a lifestyle destination.

## 2. Colors & Surface Logic

The palette is anchored by the high-visibility "Padel Green," balanced by a sophisticated slate and off-white foundation.

### The "No-Line" Rule
To maintain a high-end feel, **1px solid borders are strictly prohibited** for sectioning or containment. Boundaries must be defined through background color shifts or tonal transitions. 
- Use `surface_container_low` for the main section background.
- Use `surface_container_lowest` for individual cards to create a "lifted" effect.
- Use `surface` for the global background.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
- **Level 0 (Foundation):** `surface` (#f6f6ff).
- **Level 1 (Sectioning):** `surface_container_low` (#eef0ff).
- **Level 2 (Interaction):** `surface_container_lowest` (#ffffff) for primary cards.
- **Level 3 (Focus):** `surface_bright` for active or highlighted states.

### The "Glass & Gradient" Rule
Standard flat colors feel "out-of-the-box." To elevate the aesthetic:
- **Floating Elements:** Use `surface_variant` at 60% opacity with a `backdrop-blur` of 20px to create glassmorphism panels.
- **Signature Textures:** For Hero sections or primary CTAs, apply a subtle linear gradient from `primary` (#4e6300) to `primary_container` (#cafd00) at a 135-degree angle. This provides a "soul" to the vibrant green that flat hex codes cannot achieve.

## 3. Typography Hierarchy

We use **Plus Jakarta Sans** for its sporty, geometric DNA. The hierarchy is designed to feel like a premium sports magazine.

*   **Display Scale (Display LG/MD/SM):** Use for hero headlines and court availability counts. These should be set with tight letter-spacing (-0.02em) to feel aggressive and modern.
*   **Headline & Title Scale:** Used for card titles and section headers. High contrast between `headline-lg` and `body-md` is essential to create editorial rhythm.
*   **Label Scale:** Use `label-md` for technical data (e.g., "Court 4", "18:00 - 19:30"). These should always be uppercase with slight letter-spacing (0.05em) for a high-tech, data-driven look.

## 4. Elevation & Depth

### Tonal Layering
Depth is achieved by "stacking" surface tiers rather than using heavy shadows. A `surface_container_lowest` card sitting on a `surface_container_low` background creates a soft, natural lift.

### Ambient Shadows
When an element must "float" (e.g., a booking modal or a sticky CTA), use Ambient Shadows:
- **Color:** Use `on_surface` (#272e42) at 4%–8% opacity.
- **Settings:** Large blur values (20px to 40px) with 0 spread. This mimics natural light rather than a synthetic "drop shadow."

### The "Ghost Border" Fallback
If accessibility requires a border, use a "Ghost Border":
- Token: `outline_variant` (#a5adc6) at 15% opacity. 
- **Rule:** Never use 100% opaque borders.

## 5. Components

### Buttons
- **Primary:** `primary_fixed` background with `on_primary_fixed` text. Shape: `rounded-full`. Add a subtle 3D shadow using a tinted version of the primary color to give it "press-ability."
- **Secondary:** Glassmorphism style. `surface_variant` (semi-transparent) with `backdrop-blur`.
- **Tertiary:** Text-only using `primary` color, reserved for low-emphasis actions like "View Rules."

### Cards & Lists
- **Rule:** Forbid divider lines. Separate list items using `8px` of vertical white space or a subtle shift to `surface_container_low` on hover.
- **Booking Cards:** Use `rounded-xl` (1.5rem). The price/time should be anchored in a glassmorphism chip in the top right corner of the card.

### Input Fields
- **State:** Default state should be `surface_container_highest` with no border. 
- **Focus State:** Transition to a "Ghost Border" of `primary` at 40% and a subtle glow.
- **Roundedness:** Use `rounded-md` (0.75rem) to balance the friendliness of the sport with the precision of the booking tech.

### Specialized Component: The "Court Heatmap"
For court selection, use a grid where each "cell" (time slot) is a `surface_container_low` block. Available slots transition to `primary_fixed` on hover. This tactile, responsive feedback mimics the energy of the sport.

## 6. Do's and Don'ts

### Do:
- **Embrace White Space:** Use the Spacing Scale aggressively. Premium design needs "room to breathe."
- **Use Asymmetry:** Overlap a player image over a `surface_container` edge to break the grid and create movement.
- **Contextual Tinting:** Ensure shadows are always tinted with the background color to keep them "clean."

### Don't:
- **Don't use pure black:** Use `on_background` (#272e42) for text to keep the contrast high but sophisticated.
- **Don't use 1px dividers:** They clutter the UI. Use background shifts instead.
- **Don't over-round everything:** Reserve `rounded-full` for buttons and chips; use `rounded-xl` for cards to maintain a structured, professional look.