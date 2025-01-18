import {
  CssInJs,
  type CssInJsOptions,
  type CssRuleOptions,
  type CssStyleMap,
  type CssStyleRule
} from './css-in-js.js'

/**
 * 定义CSS样式(助手函数)
 *
 * @see {@linkcode CssInJs.define}
 */
export function defineCssRule(style: CssStyleMap, options?: CssRuleOptions): CssStyleRule {
  return CssInJs.factory().define(style, options)
}

/**
 * 定义CSS样式(助手函数)
 *
 * @see {@linkcode CssInJs.defineNamed}
 */
export function defineCssRuleNamed(style: CssStyleMap, options?: CssRuleOptions): string {
  return CssInJs.factory().defineNamed(style, options)
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
  return CssInJs.factory().defineCustomRule(selector, style, options)
}

/**
 * 工厂方法(助手函数)
 *
 * @see {@linkcode CssInJs.factory}
 */
export function factory(options?: CssInJsOptions): CssInJs {
  return CssInJs.factory(options)
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
