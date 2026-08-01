// <DewaButton> — the only button import allowed anywhere in this app.
//
// DESIGN.md mandates every button be a 48px, fully-pill, 24px-horizontal-padding
// control. Astryx's <Button> has no 48px size (sm/md/lg are 28/32/36px, baked
// in at build time by StyleX — not a CSS var) but DOES expose an official,
// documented override hook for radius: `--_button-radius` (the same private
// var Astryx's own Carousel/Chat components set locally for pill buttons).
// So: force height/padding via inline style, force radius via --_button-radius.
//
//   <DewaButton label="Save" variant="primary" />
//   <DewaButton label="Back" variant="secondary" />
//   <DewaButton label="Dismiss" variant="ghost" />
//   <DewaButton label="Export" icon={<DownloadIcon />} />          // leading icon
//   <DewaButton label="Next" endContent={<ChevronIcon />} />       // trailing icon
import { Button } from '@astryxdesign/core/Button'

export function DewaButton({ icon, endContent, style, ...rest }) {
  if (import.meta.env.DEV && icon && endContent) {
    console.warn(
      '[DewaButton] DESIGN.md: a button shows a leading OR trailing icon, never both. ' +
        `Got both icon and endContent on a button labeled "${rest.label}".`,
    )
  }
  return (
    <Button
      {...rest}
      icon={icon}
      endContent={endContent}
      style={{
        height: 48,
        paddingInline: 24,
        '--_button-radius': '9999px',
        ...style,
      }}
    />
  )
}
