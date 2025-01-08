import {
  CssInJs,
  type CssInJsOptions,
  type CssRuleOptions,
  type CssStyle,
  type CssStyleMap,
  type DynamicCssRule
} from './css-in-js.js'

/**
 * 定义样式(助手函数)
 *
 * @see {@linkcode CssInJs.define}
 */
export function define(style: CssStyleMap, options: CssRuleOptions = {}): string {
  return CssInJs.factory().define(style, options)
}
/**
 * 单例模式工厂方法(助手函数)
 *
 * @see {@linkcode CssInJs.factory}
 */
export function factory(options?: CssInJsOptions): CssInJs {
  return CssInJs.factory(options)
}

/**
 * 创建响应式样式(助手函数)
 *
 * @see {@linkcode CssInJs.dynamic}
 */
export function dynamic(style: CssStyle, options: CssRuleOptions = {}): DynamicCssRule {
  return CssInJs.factory().dynamic(style, options)
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
