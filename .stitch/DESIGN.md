# Design System: FinanzasApp - Prototipo

## 1. Visual Theme & Atmosphere

Modern, clean, and trustworthy — a personal finance fintech aesthetic. The
interface feels **airy** and **confident**: generous whitespace, a crisp light
background, and a single confident green accent that signals money growth. The
overall mood is **approachable-yet-precise**, balancing friendliness with the
credibility users expect from a financial tool. Nothing is decorative; every
element serves clarity of data.

**Density:** Medium — comfortable spacing with clearly separated cards, never
crowded, never sparse.

## 2. Color Palette & Roles

* **Growth Green (Primary) — #0E9F6E:** The signature accent. Used for primary
  action buttons, positive figures, active navigation states, and key
  call-to-action highlights.
* **Ink Black (Text Primary) — #1A202C:** Primary text color. Deep, near-black
  charcoal for headings and critical data points.
* **Slate Gray (Text Secondary) — #64748B:** Secondary text, labels, helper
  copy, and muted descriptions.
* **Mist Background (Canvas) — #F8FAFC:** The page background. A soft, cool
  off-white that keeps the interface light and reduces glare.
* **Pearl Card (Surface) — #FFFFFF:** Card and container background. Pure white
  for elevated surfaces against the mist canvas.
* **Hairline Border — #E2E8F0:** Subtle structural dividers between cards,
  table rows, and input boundaries.
* **Rose Alert (Negative) — #E11D48:** Losses, negative changes, and error
  states. Used sparingly to flag reductions or problems.
* **Amber Warning — #D97706:** Warnings, pending states, and caution flags.

## 3. Typography Rules

* **Headline Font:** Inter — geometric, modern, highly legible at all sizes.
* **Body Font:** Inter — same family for a cohesive, unified interface.
* **Heading usage:** Semibold (600) to Bold (700) weights for display and
  section titles. Financial figures use tabular-ish alignment for clean numeral
  reading.
* **Body usage:** Regular (400) weight with comfortable line height
  (1.5). Secondary text uses the Slate Gray color at slightly smaller size.
* **Letter-spacing:** Slightly tightened for large display numerals
  (spreadsheet feel on balances), normal for body text.

## 4. Component Stylings

* **Buttons:**
  * **Primary:** Growth Green background, white text, **subtly rounded
    corners**, medium weight, no outline. Hover darkens slightly.
  * **Secondary/Ghost:** Transparent background with Hairline Border, Ink Black
    text.
* **Cards/Containers:** **Subtly rounded corners**, Pearl Card white
  background, **whisper-soft diffused shadow** for gentle elevation above the
  mist canvas. Hairline Border optional at edges. No heavy drop shadows.
* **Inputs/Forms:** Pearl Card background, Hairline Border stroke, **slightly
  rounded corners**. Focus state shows a thin Growth Green border.
* **Navigation:** Clean, minimal; active item highlighted with Growth Green
  text or a subtle filled pill. Icons in Slate Gray, hover darkens.
* **Badges/Chips:** Rounded (**pill-shaped** for status tags), tinted
  backgrounds (very light green for gains, very light rose for losses) with
  the corresponding text color.

## 5. Layout Principles

* **Whitespace strategy:** Generous padding inside cards and consistent gutters
  between them. Breathing room is a feature — it makes financial data feel
  calm and trustworthy.
* **Alignment:** Left-aligned text and labels. Numerical data aligns
  consistently for easy scanning. A 4px–8px grid rhythm underlies spacing.
* **Grid:** Responsive card grid on desktop (e.g., summary cards in a row,
  transactions in a table below). On mobile, cards stack into a single column.
* **Hierarchy:** The most important number (total balance, monthly income) is
  the largest and boldest on screen; supporting figures scale down in size and
  weight.
