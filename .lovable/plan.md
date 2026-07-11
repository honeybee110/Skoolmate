## Scope

Rebuild `src/routes/index.tsx` to match the Figma video's structure, adapted to the current brand system. No changes to `/pricing`, auth, sidebar, or any app routes.

- **Kept from current tokens:** moss primary, brick accent, sage/sand backgrounds, Fraunces (brand/display), Public Sans (body), existing `BrandMark` logo.
- **Not applied:** the video's indigo/purple/cyan gradient palette and its Poppins-style sans. Gradient accents (in the headline and dark bands) become moss → brick.
- **Not built:** the pricing section. The "Pricing" nav item and any "Explore Pricing" CTAs are hidden until pricing is ready to surface. The `/pricing` route stays live but unlinked from the landing page.

## Sections (top → bottom)

1. **Sticky top nav**
   - Left: `BrandMark` wordmark.
   - Center (desktop): Features · Curriculum · Behaviour Analytics · Schools.
   - Right: `Sign in` (→ `/auth`) + solid `Get Started Free` pill CTA (→ `/teacher/login`).

2. **Hero**
   - Eyebrow pill: "Purpose-built for Australian schools · Victorian Curriculum 2.0" (sage bg, moss text).
   - Headline (Fraunces): "The smarter way to run" / "Australian classrooms." Second line rendered in a moss → brick text gradient.
   - Sub: existing 2-sentence pitch, tightened.
   - Two CTAs: solid `Start Free Trial` (→ `/teacher/login`) + outline `Watch Demo` (→ `#demo`).
   - Trust row: three checks — "No credit card required", "Free 30-day trial", "Victorian Curriculum 2.0 ready".

3. **Product mockup band**
   - Reuses the existing `teacherShot` image inside a soft-shadowed rounded card on a sand gradient background. Keeps the visual weight of the Figma dashboard frame without recreating a fake UI.

4. **Schools trust strip**
   - Sage-tinted band, "Trusted by leading Victorian schools", 6 school names in muted Fraunces. Uses the existing `schools` array.

5. **Feature grid — "One platform. Every classroom need."**
   - 3-column grid, 6 cards: AI-Powered Lesson Planner (Core), IEP Writer & Tracker (Inclusion), Victorian Curriculum 2.0 Crosscheck (VC 2.0), Behaviour Analytics Heatmap (Neurodivergent), Student Profiles & Cohort View (Students), Privacy & Compliance (Security).
   - Each card: colored icon tile (moss/brick/sage variants), title, 2-line body, small category chip top-right.

6. **Behaviour heatmap spotlight**
   - Dark moss-ink band with the "World-first feature" eyebrow.
   - Split layout: copy + 4 bullet points + `See it in action` CTA on the left; a static heatmap grid (Wk 1–4 × Mon–Fri, "Calm/Moderate/Elevated/Distressed" chips) + a moss "AI Pattern Insight" callout on the right. Rendered in CSS, no image asset.

7. **Stats band**
   - Full-width moss → moss-dark gradient. 4 KPIs: 120+ Victorian schools · 28K+ Students supported · 2,400+ IEPs generated · 4.9★ Teacher satisfaction. Cream/sand text.

8. **Testimonials**
   - 3 cards with initial-avatars (moss/brick/sage), name, role, colored role chip. Uses the existing 2 testimonials plus one new (Rachel Stafford, Year 6 Teacher) so the row balances.

9. **Final CTA**
   - Dark ink-navy band. Fraunces headline "Ready to give every student the support they deserve?" with the second line in the moss → brick text gradient. Sub, then solid `Book a Demo` + outline `See the product` (→ `/dashboard`). Small `BrandMark` above the heading.

10. **Footer**
    - 4 columns: Product (Lesson Planner, IEP Writer, Behaviour Heatmap, VC 2.0 Crosscheck) · Schools (Primary, Secondary, Special, Catholic, Independent) · Resources (existing links: DSE 2005, NCCD, NDIS, Australian Curriculum – Student Diversity) · Company (About, Careers, Contact, Privacy). Left rail: brand mark, one-line tagline, "All systems operational" status dot. Bottom bar: copyright + Terms/Privacy/Cookies.
    - "Pricing" is intentionally omitted from the Product column.

## Design tokens & motion

- All colors reference existing CSS variables (`--primary`, `--primary-soft`, `--accent`, `--accent-soft`, `--background`, `--foreground`, `--muted`, `--border`, `--navy`). No hex literals in JSX.
- Gradient headline uses `bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`.
- Keeps the existing `drift-a/b/c/d` floating shapes on the hero for continuity.
- Every heading uses `font-brand` (Fraunces); body stays on the default sans (Public Sans).

## Files

- **Edit:** `src/routes/index.tsx` — replace the current Landing component with the new section stack; keep the `Route = createFileRoute(...)` head unchanged. Remove references to `#pricing` and the "Explore Pricing" outline button. Keep imports of `teacherShot` (used in section 3); drop the unused `adminShot` import if it becomes orphan.
- **No other files touched.** `src/styles.css`, `BrandMark`, and `/pricing` remain as-is.

## Out of scope

- No pricing section, no pricing CTAs, no changes to `/pricing`.
- No new image assets — the dashboard mockup reuses `teacherShot`; the heatmap is CSS only.
- No changes to sidebar, auth, or app routes.
- No copy changes to school names or resource links beyond what's listed above.

## Verification

- Build passes, no TS errors.
- Visual check on `/` at desktop (≥1024px) and mobile (≤640px): nav collapses, hero CTAs stack, feature grid becomes single column, footer columns wrap.
- No hex color literals introduced; all styling via Tailwind semantic tokens.
- No link to `/pricing` from the landing page; the route itself still resolves if visited directly.
