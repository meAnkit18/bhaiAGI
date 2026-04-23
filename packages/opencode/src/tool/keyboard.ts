import z from "zod"
import { Effect } from "effect"
import * as Tool from "./tool"
import { spawn } from "bun"

async function run(args: string[], env?: NodeJS.ProcessEnv): Promise<string> {
  const proc = spawn(args, { env: env ?? process.env, stdout: "pipe", stderr: "pipe" })
  const [code, out, err] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  if (code !== 0) throw new Error(err || `Command failed: ${args.join(" ")}`)
  return out.trim()
}

async function keyboardAction(action: string, text?: string, keys?: string, display?: string): Promise<string> {
  const env = display ? { ...process.env, DISPLAY: display } : process.env

  if (process.platform === "darwin") {
    switch (action) {
      case "type":
        return run(["cliclick", `t:${text}`])
      case "key":
        // keys like "cmd+c", "return", "escape"
        return run(["cliclick", `kp:${keys}`])
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } else if (process.platform === "win32") {
    switch (action) {
      case "type": {
        const ps = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${text?.replace(/'/g, "''")}')`
        return run(["powershell", "-Command", ps])
      }
      case "key": {
        const ps = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${keys}')`
        return run(["powershell", "-Command", ps])
      }
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } else {
    const isWayland = process.env.WAYLAND_DISPLAY || process.env.XDG_SESSION_TYPE === "wayland"
    if (isWayland) {
      switch (action) {
        case "type":
          return run(["ydotool", "type", "--", text ?? ""], env)
        case "key":
          return run(["ydotool", "key", ...(keys?.split("+") ?? [])], env)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } else {
      switch (action) {
        case "type":
          return run(["xdotool", "type", "--clearmodifiers", "--", text ?? ""], env)
        case "key":
          return run(["xdotool", "key", "--clearmodifiers", keys ?? ""], env)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    }
  }
}

export const KeyboardTool = Tool.define(
  "keyboard",
  Effect.succeed({
    description:
      "Control the keyboard: type text or send key combinations (e.g. ctrl+c, alt+F4, Return, Escape). Focus the target window first using the window tool.",
    parameters: z.object({
      action: z.enum(["type", "key"]).describe("'type' to input text, 'key' to send a key combination"),
      text: z.string().optional().describe("Text to type (for action='type')"),
      keys: z
        .string()
        .optional()
        .describe(
          "Key combination to press (for action='key'). Examples: 'ctrl+c', 'alt+F4', 'Return', 'Escape', 'super+d'",
        ),
      display: z.string().optional().describe("Display to use (Linux X11 only, e.g. ':0')"),
    }),
    execute: (params, _ctx) =>
      Effect.gen(function* () {
        if (params.action === "type" && !params.text) throw new Error("text is required for action='type'")
        if (params.action === "key" && !params.keys) throw new Error("keys is required for action='key'")
        yield* Effect.promise(() => keyboardAction(params.action, params.text, params.keys, params.display))
        const desc = params.action === "type" ? `typed: "${params.text}"` : `pressed: ${params.keys}`
        return {
          title: `keyboard ${params.action}`,
          metadata: { action: params.action, text: params.text, keys: params.keys },
          output: `Keyboard ${desc}`,
        }
      }).pipe(Effect.orDie),
  }),
)
