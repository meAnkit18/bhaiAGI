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

async function mouseAction(action: string, x?: number, y?: number, button?: number, display?: string): Promise<string> {
  const env = display ? { ...process.env, DISPLAY: display } : process.env
  const btn = button ?? 1

  if (process.platform === "darwin") {
    // macOS: use cliclick
    switch (action) {
      case "move":
        return run(["cliclick", `m:${x},${y}`])
      case "click":
        return run(["cliclick", `c:${x},${y}`])
      case "double_click":
        return run(["cliclick", `dc:${x},${y}`])
      case "right_click":
        return run(["cliclick", `rc:${x},${y}`])
      case "scroll_up":
        return run(["cliclick", `ku:${x},${y}`])
      case "scroll_down":
        return run(["cliclick", `kd:${x},${y}`])
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } else if (process.platform === "win32") {
    const ps = (() => {
      switch (action) {
        case "move":
          return `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})`
        case "click":
          return `Add-Type -AssemblyName System.Windows.Forms; $sig = '[DllImport("user32.dll")] public static extern void mouse_event(int f, int x, int y, int d, int e);'; $t = Add-Type -MemberDefinition $sig -Name 'Win32' -Namespace 'Win32Functions' -PassThru; $t::mouse_event(0x0001, ${x}, ${y}, 0, 0); $t::mouse_event(0x0002, 0, 0, 0, 0); $t::mouse_event(0x0004, 0, 0, 0, 0)`
        default:
          throw new Error(`Action ${action} not supported on Windows yet`)
      }
    })()
    return run(["powershell", "-Command", ps])
  } else {
    // Linux: xdotool (X11) or ydotool (Wayland)
    const isWayland = process.env.WAYLAND_DISPLAY || process.env.XDG_SESSION_TYPE === "wayland"
    if (isWayland) {
      switch (action) {
        case "move":
          return run(["ydotool", "mousemove", "--absolute", "-x", String(x), "-y", String(y)], env)
        case "click":
          return run(["ydotool", "click", String(btn)], env)
        case "scroll_up":
          return run(["ydotool", "scroll", "--", "-120"], env)
        case "scroll_down":
          return run(["ydotool", "scroll", "--", "120"], env)
        default:
          throw new Error(`Action ${action} not supported on Wayland yet`)
      }
    } else {
      switch (action) {
        case "move":
          return run(["xdotool", "mousemove", String(x), String(y)], env)
        case "click":
          return run(["xdotool", "click", String(btn)], env)
        case "double_click":
          return run(["xdotool", "click", "--repeat", "2", String(btn)], env)
        case "right_click":
          return run(["xdotool", "click", "3"], env)
        case "scroll_up":
          return run(["xdotool", "click", "4"], env)
        case "scroll_down":
          return run(["xdotool", "click", "5"], env)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    }
  }
}

export const MouseTool = Tool.define(
  "mouse",
  Effect.succeed({
    description:
      "Control the mouse cursor: move, click, double-click, right-click, or scroll. Use screenshot first to see the screen and determine coordinates.",
    parameters: z.object({
      action: z
        .enum(["move", "click", "double_click", "right_click", "scroll_up", "scroll_down"])
        .describe("Mouse action to perform"),
      x: z.number().int().optional().describe("X coordinate (required for move/click actions)"),
      y: z.number().int().optional().describe("Y coordinate (required for move/click actions)"),
      button: z.number().int().min(1).max(3).optional().describe("Mouse button: 1=left, 2=middle, 3=right. Default 1."),
      display: z.string().optional().describe("Display to use (Linux X11 only, e.g. ':0')"),
    }),
    execute: (params, _ctx) =>
      Effect.gen(function* () {
        yield* Effect.promise(() => mouseAction(params.action, params.x, params.y, params.button, params.display))
        return {
          title: `mouse ${params.action}${params.x !== undefined ? ` at (${params.x}, ${params.y})` : ""}`,
          metadata: { action: params.action, x: params.x, y: params.y },
          output: `Mouse ${params.action} performed${params.x !== undefined ? ` at (${params.x}, ${params.y})` : ""}`,
        }
      }).pipe(Effect.orDie),
  }),
)
