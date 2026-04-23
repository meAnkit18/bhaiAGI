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

async function windowAction(action: string, id?: string, title?: string, display?: string): Promise<string> {
  const env = display ? { ...process.env, DISPLAY: display } : process.env

  if (process.platform === "darwin") {
    switch (action) {
      case "list":
        return run(["osascript", "-e", 'tell application "System Events" to get name of every process whose background only is false'])
      case "focus":
        if (!title) throw new Error("title required for focus on macOS")
        return run(["osascript", "-e", `tell application "${title}" to activate`])
      case "close":
        if (!title) throw new Error("title required for close on macOS")
        return run(["osascript", "-e", `tell application "${title}" to quit`])
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } else if (process.platform === "win32") {
    switch (action) {
      case "list": {
        const ps = `Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json`
        return run(["powershell", "-Command", ps])
      }
      case "focus": {
        const ps = `$wshell = New-Object -ComObject wscript.shell; $wshell.AppActivate('${title ?? id}')`
        return run(["powershell", "-Command", ps])
      }
      case "close": {
        const ps = `Stop-Process -Name '${title ?? id}' -Force`
        return run(["powershell", "-Command", ps])
      }
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } else {
    // Linux: wmctrl + xdotool
    switch (action) {
      case "list":
        return run(["wmctrl", "-l"], env)
      case "focus":
        if (id) return run(["wmctrl", "-ia", id], env)
        if (title) return run(["wmctrl", "-a", title], env)
        throw new Error("id or title required for focus")
      case "close":
        if (id) return run(["wmctrl", "-ic", id], env)
        if (title) return run(["wmctrl", "-c", title], env)
        throw new Error("id or title required for close")
      case "minimize":
        if (!id) throw new Error("id required for minimize")
        return run(["xdotool", "windowminimize", id], env)
      case "maximize":
        if (!id) throw new Error("id required for maximize")
        return run(["wmctrl", "-ir", id, "-b", "add,maximized_vert,maximized_horz"], env)
      case "resize": {
        // id format: "WIDxHEIGHT+X+Y"
        throw new Error("Use wmctrl -ir <id> -e '0,x,y,w,h' for resize")
      }
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}

export const WindowTool = Tool.define(
  "window",
  Effect.succeed({
    description:
      "Manage application windows: list open windows, focus a window, close, minimize, or maximize. Use 'list' first to get window IDs and titles.",
    parameters: z.object({
      action: z
        .enum(["list", "focus", "close", "minimize", "maximize"])
        .describe("Window action to perform"),
      id: z.string().optional().describe("Window ID (from 'list' output, Linux/Windows)"),
      title: z.string().optional().describe("Window title or app name to target"),
      display: z.string().optional().describe("Display to use (Linux X11 only, e.g. ':0')"),
    }),
    execute: (params, _ctx) =>
      Effect.gen(function* () {
        const output = yield* Effect.promise(() => windowAction(params.action, params.id, params.title, params.display))
        return {
          title: `window ${params.action}`,
          metadata: { action: params.action, id: params.id, title: params.title },
          output: output || `Window ${params.action} performed`,
        }
      }).pipe(Effect.orDie),
  }),
)
