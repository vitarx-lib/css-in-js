import CssInJs, { type CssRuleOptions, type CssStyleMap, type CssStyleRule } from './css-in-js.js'

/**
 * 定义CSS样式(助手函数)
 *
 * @see {@linkcode CssInJs.define}
 */
export function defineCssRule(style: CssStyleMap, options?: CssRuleOptions): CssStyleRule {
  return CssInJs.instance.define(style, options)
}

/**
 * 定义CSS样式(助手函数)
 *
 * @see {@linkcode CssInJs.defineNamed}
 */
export function defineNamed(style: CssStyleMap, options?: CssRuleOptions): string {
  return CssInJs.instance.defineNamed(style, options)
}

/**
 * 定义自定义选择器规则（助手函数）
 *
 * @see {@linkcode CssInJs.defineCustomRule}
 */
export function defineCustomRule(
  selector: string,
  style: CssStyleMap,
  options: Omit<CssRuleOptions, 'selector'> = {}
): CssStyleRule {
  return CssInJs.instance.defineCustomRule(selector, style, options)
}

/**
 * 创建一个唯一类名，支持自定义前缀
 *
 * @param {string} [prefix] - 前缀。
 * @returns {string} - 返回一个随机且唯一的`className`。
 */
export function makeClassName(prefix: string = ''): string {
  return CssInJs.makeClassName(prefix)
}
