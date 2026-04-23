import { Hono } from "hono"
import { lazy } from "@/util/lazy"

export async function callTui(_ctx: any) {
  return undefined
}

export const TuiRoutes = lazy(() => new Hono())
