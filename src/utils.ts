import { isNumber, isRecordObject, isRefSignal, isString } from 'vitarx'
import { type CssStyleMap } from './css-in-js.js'

/**
 * 创建唯一id生成器
 *
 * 基于计数器实现的唯一id生成器，仅适合简单的应用场景。
 *
 * @example
 * ```ts
 * const uuidGenerator = createUniqueIdGenerator()
 * const id = uuidGenerator()
 * ```
 *
 * @param {number} [initialLength=2] - 初始长度，不能小于2
 * @returns {() => string}
 */
export function createUUIDGenerator(initialLength: number = 2): () => string {
  let counter = 0
  let reset = 0
  const length = Math.max(initialLength - 1, 1)
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' // 大小写字母

  // 获取后缀
  const getSuffix = () => (reset > 0 ? `_${reset}` : '')

  // 将数字转换为字母
  const convertToBase = (num: number): string => {
    const base = chars.length // 字母表的长度
    if (num === 0) return chars[0]

    let result = ''
    while (num > 0) {
      result = chars[num % base] + result
      num = Math.floor(num / base)
    }

    return result
  }

  // 生成唯一ID的主逻辑
  return (): string => {
    // 生成固定长度的随机字母部分
    let randomPart = ''
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length)
      randomPart += chars[randomIndex]
    }

    // 将计数器值转换为字母
    let counterPart = convertToBase(counter)

    // 增加计数器
    counter++

    // 当计数器达到最大安全整数时，自动重置计数器
    if (counter >= Number.MAX_SAFE_INTEGER) {
      counter = 0
      reset++
    }

    return randomPart + counterPart + getSuffix()
  }
}

/**
 * 判断浏览器是否支持 CSSStyleSheet
 *
 * @returns {boolean}
 */
export function isCSSStyleSheetSupported(): boolean {
  try {
    // 检查浏览器是否支持 CSSStyleSheet 构造函数
    return 'CSSStyleSheet' in window && 'adoptedStyleSheets' in document
  } catch (e) {
    return false
  }
}

/**
 * 格式化样式值
 *
 * @param value
 * @returns {null|string} - 返回null代表值无效
 */
export function formatStyleValue(value: any): null | string {
  if (isString(value) && removePriority(value).length > 0) {
    value = value.trim()
    return value.length > 0 ? value : null
  }
  if (isNumber(value)) return String(value)
  return null
}

/**
 * 删除样式的优先级
 *
 * @param value
 */
export function removePriority(value: string): string {
  return value.includes('!important') ? value.replace('!important', '').trim() : value.trim()
}

/**
 * 格式化样式key
 *
 * @param key
 * @returns {string}
 */
export function formatStyleKey(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}
/**
 * 样式转字符串
 *
 * @param {CssStyle} cssStyleMap - 样式对象
 * @param {string} selectorText - 选择器文本
 * @private
 */
export function cssStyleMapToCssRuleText(cssStyleMap: CssStyleMap, selectorText: string): string {
  if (isRefSignal(cssStyleMap)) cssStyleMap = cssStyleMap.value
  if (!isRecordObject(cssStyleMap)) throw new TypeError(`CssInJs:style must be a record object`)

  const rule = Object.entries(cssStyleMap)
    .reduce((acc, [key, value]) => {
      value = formatStyleValue(value)
      if (value !== null) {
        acc.push(`${formatStyleKey(key)}: ${value};`)
      }
      return acc
    }, [] as string[])
    .join('')

  return `${selectorText}{${rule}}`
}

/**
 * 格式化CSS选择器
 *
 * 如果没有 . 开头，且 不是 @ 开头或 # 开头，则添加 .
 *
 * @param {string} selector
 * @returns {string}
 */
export function formatSelector(selector: string): string {
  // 去除前后空格
  selector = selector.trim()
  // 如果没有 . 开头
  if (!selector.startsWith('.') && !selector.startsWith('#') && !selector.startsWith('@')) {
    return `.${selector}` // 为选择器添加 .
  }
  return selector
}

/**
 * 判断是否是有效的类名
 *
 * @param {any} value - 要判断的值
 * @returns {boolean} - 返回一个布尔值，表示是否是有效的类名。
 */
export function isValidName(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
