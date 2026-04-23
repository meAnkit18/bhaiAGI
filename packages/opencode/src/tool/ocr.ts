import z from "zod"
import { Effect } from "effect"
import * as Tool from "./tool"
import { spawn } from "bun"
import os from "os"
import path from "path"

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

async function ocr(imagePath: string, lang?: string): Promise<string> {
  // tesseract is cross-platform
  const outBase = path.join(os.tmpdir(), `ocr_${Date.now()}`)
  const langArg = lang ?? "eng"
  await run(["tesseract", imagePath, outBase, "-l", langArg])
  const txt = Bun.file(`${outBase}.txt`)
  const text = await txt.text()
  return text.trim()
}

export const OcrTool = Tool.define(
  "ocr",
  Effect.succeed({
    description:
      "Extract text from an image file using OCR (Optical Character Recognition). Pass a screenshot path to read text visible on screen. Requires tesseract to be installed.",
    parameters: z.object({
      image_path: z.string().describe("Path to the image file to extract text from (e.g. from screenshot tool)"),
      lang: z
        .string()
        .optional()
        .describe("OCR language code (default: 'eng'). Examples: 'eng', 'deu', 'fra', 'chi_sim'"),
    }),
    execute: (params, _ctx) =>
      Effect.gen(function* () {
        const text = yield* Effect.promise(() => ocr(params.image_path, params.lang))
        return {
          title: `ocr ${path.basename(params.image_path)}`,
          metadata: { image_path: params.image_path, chars: text.length },
          output: text || "(no text found)",
        }
      }).pipe(Effect.orDie),
  }),
)
