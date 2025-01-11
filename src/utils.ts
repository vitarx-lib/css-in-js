import { isRecordObject, isValueProxy } from 'vitarx'
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
    return (
      'CSSStyleSheet' in window &&
      'adoptedStyleSheets' in document &&
      typeof CSSStyleSheet.prototype.replaceSync === 'function'
    )
  } catch (e) {
    return false
  }
}

/**
 * 样式转字符串
 *
 * @param {CssStyle} cssStyleMap - 样式对象
 * @param {string} selectorText - 选择器文本
 * @private
 */
export function cssMapToRuleStyle(cssStyleMap: CssStyleMap, selectorText: string) {
  if (isValueProxy(cssStyleMap)) cssStyleMap = cssStyleMap.value
  if (!isRecordObject(cssStyleMap)) throw new TypeError(`CssInJs:style must be a record object`)

  const rule = Object.entries(cssStyleMap)
    .reduce((acc, [key, value]) => {
      // 过滤掉值为 null 或 undefined 的样式
      if (value || value === '0' || value === 0) {
        // 将驼峰命名转换为短横线命名
        const kebabKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
        acc.push(`${kebabKey}: ${String(value)};`)
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
