// system file, please don't modify it

import { join } from "path"
import fs from "fs"
import prettify from "ghom-prettify"
import dayjs from "dayjs"
import chalk from "chalk"
import utc from "dayjs/plugin/utc.js"
import relative from "dayjs/plugin/relativeTime.js"
import timezone from "dayjs/plugin/timezone.js"
import toObject from "dayjs/plugin/toObject.js"
import discord from "discord.js"
import EventEmitter from "events"
import * as prettier from "prettier"

import { logger } from "@ghom/logger"

const log = logger.log.bind(logger)
const warn = logger.warn.bind(logger)
const error = logger.error.bind(logger)
const success = logger.success.bind(logger)

export { log, warn, error, success }

export const startedAt = Date.now()

export function die(message: string): never {
  throw new Error(message)
}

export function uptime(): number {
  return Date.now() - startedAt
}

export async function getBotOwnerId({
  client,
}: {
  client: discord.Client<true>
}): Promise<string> {
  const app = await client.application.fetch()
  const ownerID =
    app.owner instanceof discord.User
      ? app.owner.id
      : app.owner?.members.first()?.id

  if (!ownerID) throw new Error("Bot owner not found.")

  return ownerID
}

/**
 * Resolve `T` value from `T | (() => T)`
 * @param item - resolvable
 * @param args - parameters for resolvable function
 */
export function scrap<T, A extends any[] = []>(
  item: Scrap<T, A>,
  ...args: A
): T | Promise<T> {
  // @ts-ignore
  return typeof item === "function" ? item(...args) : item
}

export type Scrap<T, A extends any[] = []> =
  | T
  | ((...args: A) => T | Promise<T>)

export function slug(...words: string[]): string {
  return words.join("-")
}

/**
 * Make a path from root of project and return it
 * @param path
 */
export function rootPath(...path: string[]): string {
  return join(process.cwd(), ...path)
}

/**
 * Simple cache for manage temporary values
 */
export const cache = new (class Cache {
  private data: { [key: string]: any } = {}

  get<T>(key: string): T | undefined {
    return this.data[key]
  }

  set(key: string, value: any) {
    this.data[key] = value
  }

  delete(key: string) {
    delete this.data[key]
  }

  ensure<T>(key: string, defaultValue: T): T {
    let value = this.get<T>(key)
    if (value === undefined) {
      value = defaultValue
      this.set(key, value)
    }
    return value
  }
})()

export interface Code {
  lang?: string
  content: string
}

export const code = {
  pattern: /^```(\S+)?\s(.+[^\\])```$/is,
  /**
   * extract the code from code block and return code
   */
  parse(raw: string): Code | undefined {
    const match = this.pattern.exec(raw)
    if (!match) return
    return {
      lang: match[1],
      content: match[2],
    }
  },
  /**
   * inject the code in the code block and return code block
   */
  stringify({
    lang,
    content,
    format,
  }: Code & { format?: true | prettier.Options }): string {
    return (
      "```" +
      (lang ?? "") +
      "\n" +
      (format
        ? prettify.format(content, lang, format === true ? undefined : format)
        : content) +
      "\n```"
    )
  },
  /**
   * format the code using prettier and return it
   */
  format: prettify.format,
}

const locale = process.env.BOT_LOCALE

import(`dayjs/locale/${locale ?? "en"}.js`)
  .then(() => dayjs.locale(locale ?? "en"))
  .catch(() =>
    logger.warn(
      `The ${chalk.bold(
        locale
      )} locale is incorrect, please use an existing locale code.`
    )
  )

dayjs.extend(utc)
dayjs.extend(relative)
dayjs.extend(timezone)
dayjs.extend(toObject)
dayjs.utc(1)

if (process.env.BOT_TIMEZONE) dayjs.tz.setDefault(process.env.BOT_TIMEZONE)

export { dayjs }

export function forceTextSize(
  text: string | number,
  size: number,
  before = false
): string {
  text = String(text)
  if (text.length < size) {
    return before
      ? " ".repeat(size - text.length) + text
      : text + " ".repeat(size - text.length)
  } else if (text.length > size) {
    return text.slice(0, size)
  } else {
    return text
  }
}

export interface EventEmitters {
  message:
    | discord.TextBasedChannel
    | discord.User
    | discord.GuildMember
    | discord.Guild
}

export const messageEmitter = new EventEmitter()

export function onceMessage<
  Event extends keyof Pick<discord.ClientEvents, keyof EventEmitters>
>(
  emitter: EventEmitters[Event],
  cb: (...args: discord.ClientEvents[Event]) => unknown
) {
  // @ts-ignore
  messageEmitter.once(emitter.id, cb)
}

export function emitMessage<
  Event extends keyof Pick<discord.ClientEvents, keyof EventEmitters>
>(emitter: EventEmitters[Event], ...args: discord.ClientEvents[Event]) {
  messageEmitter.emit(emitter.id, ...args)
}

export function divider<T, Out>(
  items: T[],
  itemCountByDivision: number,
  mapping: (section: T[], index: number, all: T[][]) => Promise<Out> | Out
): Promise<Out[]>
export function divider<T, Out>(items: T[], itemCountByDivision: number): T[][]
export function divider<T, Out>(
  items: T[],
  itemCountByDivision: number,
  mapping?: (section: T[], index: number, all: T[][]) => Out
): T[][] | Promise<Out[]> {
  const divided: T[][] = []
  const divisionCount = Math.ceil(items.length / itemCountByDivision)
  for (let i = 0; i < divisionCount; i++) {
    divided.push(
      items.slice(itemCountByDivision * i, itemCountByDivision * (i + 1))
    )
  }

  if (mapping) return Promise.all(divided.map(mapping))

  return divided
}

export const emojiRegex =
  /\u{1F3F4}\u{E0067}\u{E0062}(?:\u{E0077}\u{E006C}\u{E0073}|\u{E0073}\u{E0063}\u{E0074}|\u{E0065}\u{E006E}\u{E0067})\u{E007F}|(?:\u{1F9D1}\u{1F3FF}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F9D1}|\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}])[\u{1F3FB}-\u{1F3FE}]|(?:\u{1F9D1}\u{1F3FE}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F9D1}|\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}])[\u{1F3FB}-\u{1F3FD}\u{1F3FF}]|(?:\u{1F9D1}\u{1F3FD}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F9D1}|\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}])[\u{1F3FB}\u{1F3FC}\u{1F3FE}\u{1F3FF}]|(?:\u{1F9D1}\u{1F3FC}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F9D1}|\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}])[\u{1F3FB}\u{1F3FD}-\u{1F3FF}]|(?:\u{1F9D1}\u{1F3FB}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F9D1}|\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}])[\u{1F3FC}-\u{1F3FF}]|\u{1F468}(?:\u{1F3FB}(?:\u200D(?:\u2764\uFE0F\u200D(?:\u{1F48B}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FF}]|\u{1F468}[\u{1F3FB}-\u{1F3FF}])|\u{1F91D}\u200D\u{1F468}[\u{1F3FC}-\u{1F3FF}]|[\u2695\u2696\u2708]\uFE0F|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]))?|[\u{1F3FC}-\u{1F3FF}]\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FF}]|\u{1F468}[\u{1F3FB}-\u{1F3FF}])|\u200D(?:\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F468}|[\u{1F468}\u{1F469}]\u200D(?:\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}])|\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FF}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FE}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FE}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FD}\u{1F3FF}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FD}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}\u{1F3FC}\u{1F3FE}\u{1F3FF}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FC}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}\u{1F3FD}-\u{1F3FF}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:[\u{1F468}\u{1F469}]\u200D[\u{1F466}\u{1F467}]|[\u{1F466}\u{1F467}])|\u{1F3FF}|\u{1F3FE}|\u{1F3FD}|\u{1F3FC})?|(?:\u{1F469}(?:\u{1F3FB}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}])|[\u{1F3FC}-\u{1F3FF}]\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}]))|\u{1F9D1}[\u{1F3FB}-\u{1F3FF}]\u200D\u{1F91D}\u200D\u{1F9D1})[\u{1F3FB}-\u{1F3FF}]|\u{1F469}\u200D\u{1F469}\u200D(?:\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}])|\u{1F469}(?:\u200D(?:\u2764\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}])|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FF}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FE}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FD}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FC}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FB}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F9D1}(?:\u200D(?:\u{1F91D}\u200D\u{1F9D1}|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FF}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FE}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FD}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FC}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FB}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F469}\u200D\u{1F466}\u200D\u{1F466}|\u{1F469}\u200D\u{1F469}\u200D[\u{1F466}\u{1F467}]|\u{1F469}\u200D\u{1F467}\u200D[\u{1F466}\u{1F467}]|(?:\u{1F441}\uFE0F\u200D\u{1F5E8}|\u{1F9D1}(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u{1F3FB}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\u{1F469}(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u{1F3FB}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\u{1F636}\u200D\u{1F32B}|\u{1F3F3}\uFE0F\u200D\u26A7|\u{1F43B}\u200D\u2744|(?:[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}][\u{1F3FB}-\u{1F3FF}]|[\u{1F46F}\u{1F93C}\u{1F9DE}\u{1F9DF}])\u200D[\u2640\u2642]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}][\uFE0F\u{1F3FB}-\u{1F3FF}]\u200D[\u2640\u2642]|\u{1F3F4}\u200D\u2620|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}]\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299\u{1F170}\u{1F171}\u{1F17E}\u{1F17F}\u{1F202}\u{1F237}\u{1F321}\u{1F324}-\u{1F32C}\u{1F336}\u{1F37D}\u{1F396}\u{1F397}\u{1F399}-\u{1F39B}\u{1F39E}\u{1F39F}\u{1F3CD}\u{1F3CE}\u{1F3D4}-\u{1F3DF}\u{1F3F5}\u{1F3F7}\u{1F43F}\u{1F4FD}\u{1F549}\u{1F54A}\u{1F56F}\u{1F570}\u{1F573}\u{1F576}-\u{1F579}\u{1F587}\u{1F58A}-\u{1F58D}\u{1F5A5}\u{1F5A8}\u{1F5B1}\u{1F5B2}\u{1F5BC}\u{1F5C2}-\u{1F5C4}\u{1F5D1}-\u{1F5D3}\u{1F5DC}-\u{1F5DE}\u{1F5E1}\u{1F5E3}\u{1F5E8}\u{1F5EF}\u{1F5F3}\u{1F5FA}\u{1F6CB}\u{1F6CD}-\u{1F6CF}\u{1F6E0}-\u{1F6E5}\u{1F6E9}\u{1F6F0}\u{1F6F3}])\uFE0F|\u{1F3F3}\uFE0F\u200D\u{1F308}|\u{1F469}\u200D\u{1F467}|\u{1F469}\u200D\u{1F466}|\u{1F635}\u200D\u{1F4AB}|\u{1F62E}\u200D\u{1F4A8}|\u{1F415}\u200D\u{1F9BA}|\u{1F9D1}[\u{1F3FF}\u{1F3FE}\u{1F3FD}\u{1F3FC}\u{1F3FB}]?|\u{1F469}[\u{1F3FF}\u{1F3FE}\u{1F3FD}\u{1F3FC}\u{1F3FB}]?|\u{1F1FD}\u{1F1F0}|\u{1F1F6}\u{1F1E6}|\u{1F1F4}\u{1F1F2}|\u{1F408}\u200D\u2B1B|\u2764\uFE0F\u200D[\u{1F525}\u{1FA79}]|\u{1F441}\uFE0F|\u{1F3F3}\uFE0F|\u{1F1FF}[\u{1F1E6}\u{1F1F2}\u{1F1FC}]|\u{1F1FE}[\u{1F1EA}\u{1F1F9}]|\u{1F1FC}[\u{1F1EB}\u{1F1F8}]|\u{1F1FB}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1EE}\u{1F1F3}\u{1F1FA}]|\u{1F1FA}[\u{1F1E6}\u{1F1EC}\u{1F1F2}\u{1F1F3}\u{1F1F8}\u{1F1FE}\u{1F1FF}]|\u{1F1F9}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1ED}\u{1F1EF}-\u{1F1F4}\u{1F1F7}\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FF}]|\u{1F1F8}[\u{1F1E6}-\u{1F1EA}\u{1F1EC}-\u{1F1F4}\u{1F1F7}-\u{1F1F9}\u{1F1FB}\u{1F1FD}-\u{1F1FF}]|\u{1F1F7}[\u{1F1EA}\u{1F1F4}\u{1F1F8}\u{1F1FA}\u{1F1FC}]|\u{1F1F5}[\u{1F1E6}\u{1F1EA}-\u{1F1ED}\u{1F1F0}-\u{1F1F3}\u{1F1F7}-\u{1F1F9}\u{1F1FC}\u{1F1FE}]|\u{1F1F3}[\u{1F1E6}\u{1F1E8}\u{1F1EA}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F4}\u{1F1F5}\u{1F1F7}\u{1F1FA}\u{1F1FF}]|\u{1F1F2}[\u{1F1E6}\u{1F1E8}-\u{1F1ED}\u{1F1F0}-\u{1F1FF}]|\u{1F1F1}[\u{1F1E6}-\u{1F1E8}\u{1F1EE}\u{1F1F0}\u{1F1F7}-\u{1F1FB}\u{1F1FE}]|\u{1F1F0}[\u{1F1EA}\u{1F1EC}-\u{1F1EE}\u{1F1F2}\u{1F1F3}\u{1F1F5}\u{1F1F7}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|\u{1F1EF}[\u{1F1EA}\u{1F1F2}\u{1F1F4}\u{1F1F5}]|\u{1F1EE}[\u{1F1E8}-\u{1F1EA}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}]|\u{1F1ED}[\u{1F1F0}\u{1F1F2}\u{1F1F3}\u{1F1F7}\u{1F1F9}\u{1F1FA}]|\u{1F1EC}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EE}\u{1F1F1}-\u{1F1F3}\u{1F1F5}-\u{1F1FA}\u{1F1FC}\u{1F1FE}]|\u{1F1EB}[\u{1F1EE}-\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1F7}]|\u{1F1EA}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1ED}\u{1F1F7}-\u{1F1FA}]|\u{1F1E9}[\u{1F1EA}\u{1F1EC}\u{1F1EF}\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1FF}]|\u{1F1E8}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1EE}\u{1F1F0}-\u{1F1F5}\u{1F1F7}\u{1F1FA}-\u{1F1FF}]|\u{1F1E7}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EF}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|\u{1F1E6}[\u{1F1E8}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F2}\u{1F1F4}\u{1F1F6}-\u{1F1FA}\u{1F1FC}\u{1F1FD}\u{1F1FF}]|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}][\u{1F3FB}-\u{1F3FF}]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}][\uFE0F\u{1F3FB}-\u{1F3FF}]|\u{1F3F4}|[\u270A\u270B\u{1F385}\u{1F3C2}\u{1F3C7}\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F466}\u{1F467}\u{1F46B}-\u{1F46D}\u{1F472}\u{1F474}-\u{1F476}\u{1F478}\u{1F47C}\u{1F483}\u{1F485}\u{1F48F}\u{1F491}\u{1F4AA}\u{1F57A}\u{1F595}\u{1F596}\u{1F64C}\u{1F64F}\u{1F6C0}\u{1F6CC}\u{1F90C}\u{1F90F}\u{1F918}-\u{1F91C}\u{1F91E}\u{1F91F}\u{1F930}-\u{1F934}\u{1F936}\u{1F977}\u{1F9B5}\u{1F9B6}\u{1F9BB}\u{1F9D2}\u{1F9D3}\u{1F9D5}][\u{1F3FB}-\u{1F3FF}]|[\u261D\u270C\u270D\u{1F574}\u{1F590}][\uFE0F\u{1F3FB}-\u{1F3FF}]|[\u270A\u270B\u{1F385}\u{1F3C2}\u{1F3C7}\u{1F408}\u{1F415}\u{1F43B}\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F466}\u{1F467}\u{1F46B}-\u{1F46D}\u{1F472}\u{1F474}-\u{1F476}\u{1F478}\u{1F47C}\u{1F483}\u{1F485}\u{1F48F}\u{1F491}\u{1F4AA}\u{1F57A}\u{1F595}\u{1F596}\u{1F62E}\u{1F635}\u{1F636}\u{1F64C}\u{1F64F}\u{1F6C0}\u{1F6CC}\u{1F90C}\u{1F90F}\u{1F918}-\u{1F91C}\u{1F91E}\u{1F91F}\u{1F930}-\u{1F934}\u{1F936}\u{1F977}\u{1F9B5}\u{1F9B6}\u{1F9BB}\u{1F9D2}\u{1F9D3}\u{1F9D5}]|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}]|[\u{1F46F}\u{1F93C}\u{1F9DE}\u{1F9DF}]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F201}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F236}\u{1F238}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F320}\u{1F32D}-\u{1F335}\u{1F337}-\u{1F37C}\u{1F37E}-\u{1F384}\u{1F386}-\u{1F393}\u{1F3A0}-\u{1F3C1}\u{1F3C5}\u{1F3C6}\u{1F3C8}\u{1F3C9}\u{1F3CF}-\u{1F3D3}\u{1F3E0}-\u{1F3F0}\u{1F3F8}-\u{1F407}\u{1F409}-\u{1F414}\u{1F416}-\u{1F43A}\u{1F43C}-\u{1F43E}\u{1F440}\u{1F444}\u{1F445}\u{1F451}-\u{1F465}\u{1F46A}\u{1F479}-\u{1F47B}\u{1F47D}-\u{1F480}\u{1F484}\u{1F488}-\u{1F48E}\u{1F490}\u{1F492}-\u{1F4A9}\u{1F4AB}-\u{1F4FC}\u{1F4FF}-\u{1F53D}\u{1F54B}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F5A4}\u{1F5FB}-\u{1F62D}\u{1F62F}-\u{1F634}\u{1F637}-\u{1F644}\u{1F648}-\u{1F64A}\u{1F680}-\u{1F6A2}\u{1F6A4}-\u{1F6B3}\u{1F6B7}-\u{1F6BF}\u{1F6C1}-\u{1F6C5}\u{1F6D0}-\u{1F6D2}\u{1F6D5}-\u{1F6D7}\u{1F6EB}\u{1F6EC}\u{1F6F4}-\u{1F6FC}\u{1F7E0}-\u{1F7EB}\u{1F90D}\u{1F90E}\u{1F910}-\u{1F917}\u{1F91D}\u{1F920}-\u{1F925}\u{1F927}-\u{1F92F}\u{1F93A}\u{1F93F}-\u{1F945}\u{1F947}-\u{1F976}\u{1F978}\u{1F97A}-\u{1F9B4}\u{1F9B7}\u{1F9BA}\u{1F9BC}-\u{1F9CB}\u{1F9D0}\u{1F9E0}-\u{1F9FF}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{1FAD0}-\u{1FAD6}]/gu

export const fetchPackageJson = () =>
  JSON.parse(fs.readFileSync(rootPath("package.json"), "utf-8"))

export const spaceChar = "\u200b"

export function getDatabaseDriverName() {
  const packageJSON = fetchPackageJson()

  if (packageJSON?.dependencies?.["pg"]) {
    return "pg"
  } else if (packageJSON?.dependencies?.["mysql2"]) {
    return "mysql2"
  } else if (packageJSON?.dependencies?.["sqlite3"]) {
    return "sqlite3"
  } else throw new Error("No database driver found in package.json")
}

export function refactor<Value>(options: {
  resolveValue: (index: number) => Value
  whileCondition: (value: Value) => boolean
  elseAction: (value: Value, index: number) => unknown
  onEnd?: (value: Value, iterationCount: number) => unknown
  maxIterations?: number
}): Value {
  const { resolveValue, whileCondition, elseAction } = options

  let value = resolveValue(0)
  let index = 0

  while (whileCondition(value)) {
    elseAction(value, index)
    value = resolveValue(index)
    index++

    if (options.maxIterations && index > options.maxIterations) break
  }

  options.onEnd?.(value, index)

  return value
}
