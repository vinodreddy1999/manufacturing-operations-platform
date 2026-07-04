# Enterprise Typography & UI Design System

This application uses a centralized token layer in `frontend/src/styles.css` and Tailwind mappings in `frontend/tailwind.config.ts`.

## Font Stack

Primary font stack:

```css
Inter, "SF Pro Display", "Segoe UI Variable", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

Body text must remain at least `16px` on small screens. Monospace values use the `--font-mono-enterprise` token.

## Typography Tokens

| Token | Size | Weight | Use |
| --- | ---: | ---: | --- |
| `--text-display-xl` | 48px | 700 | Large marketing or executive hero copy |
| `--text-display-l` | 40px | 700 | Large page-level highlight |
| `--text-display-m` | 32px | 700 | Dashboard hero metric |
| `--text-h1` | 28px | 700 | Page title |
| `--text-h2` | 24px | 600 | Section title |
| `--text-h3` | 20px | 600 | Subsection title |
| `--text-h4` | 18px | 600 | Card title |
| `--text-h5` | 16px | 600 | Dense panel title |
| `--text-body-lg` | 16px | 400 | Body copy |
| `--text-body` | 15px | 400 | Forms and dense UI |
| `--text-body-sm` | 14px | 400 | Tables and metadata |
| `--text-caption` | 13px | 400 | Badges and helper labels |
| `--text-micro` | 12px | 400 | Eyebrows and compact status text |

Use heading line-height `--leading-heading` and body line-height `--leading-body`.

## CSS Utility Classes

Use these semantic classes for shared components:

- `enterprise-card`
- `enterprise-dialog`
- `enterprise-table-frame`
- `enterprise-sticky-header`
- `enterprise-display-xl`
- `enterprise-display-l`
- `enterprise-display-m`
- `enterprise-kpi`
- `enterprise-label`
- `enterprise-caption`
- `enterprise-micro`
- `enterprise-eyebrow`

## Tailwind Mapping

Tailwind can consume the same tokens:

```tsx
<h1 className="text-h1">Platform View</h1>
<p className="text-body-sm text-slate-400">Operational context</p>
<section className="rounded-enterprise-xl shadow-enterprise-panel" />
```

Available tokenized Tailwind font sizes include:

- `text-display-xl`
- `text-display-l`
- `text-display-m`
- `text-h1`
- `text-h2`
- `text-h3`
- `text-h4`
- `text-h5`
- `text-body-lg`
- `text-body`
- `text-body-sm`
- `text-caption`
- `text-micro`

Spacing tokens are exposed as `p-token-4`, `gap-token-6`, `mt-token-8`, etc.

## Component Rules

- Buttons, inputs, selects, and textarea controls must use at least a `44px` touch target.
- Forms use `14px` labels, `15px` inputs, and `13px` validation text.
- Tables use `14px` headers and values, with sticky headers for long data.
- Dashboard KPI numbers use the `enterprise-kpi` class.
- Dialogs, drawers, and upload panels should use `enterprise-dialog`.
- Empty, loading, and error states must remain dark-mode compatible.

## Accessibility

- Visible `focus-visible` outlines are globally enabled.
- Color contrast should meet WCAG 2.2 AA.
- Long labels should wrap without clipping.
- Use logical alignment and `dir="rtl"` support where possible.
- Avoid encoding meaning by color alone; include text or icons for status.

## Quality Checklist

Before merging UI changes:

1. Use tokenized text classes or semantic enterprise classes.
2. Avoid new one-off font sizes, line heights, and letter spacing.
3. Keep body text readable at mobile size.
4. Verify keyboard focus is visible.
5. Check table headers remain readable and sticky where data is long.
6. Keep loading, empty, error, modal, and drawer states visually consistent.
