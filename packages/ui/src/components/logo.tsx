import { ComponentProps } from "solid-js"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 40 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text x="0" y="16" font-size="14" font-weight="bold" fill="var(--icon-strong-base)" font-family="monospace">
        bAGI
      </text>
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text x="0" y="30" font-size="28" font-weight="bold" fill="var(--icon-strong-base)" font-family="monospace">
        bAGI
      </text>
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 42"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <text x="0" y="34" font-size="36" font-weight="bold" fill="var(--icon-strong-base)" font-family="monospace">
        bhaiAGI
      </text>
    </svg>
  )
}
