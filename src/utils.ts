export type UUIDGenerator = () => string

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
 * @param {number} [initialLength=5] - 初始长度,默认5
 * @returns {UUIDGenerator}
 */
export function createUUIDGenerator(initialLength: number = 5): UUIDGenerator {
  let counter = 0
  let reset = 0
  const length = initialLength
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
