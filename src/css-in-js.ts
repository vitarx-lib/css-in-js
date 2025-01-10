import {
  deepMergeObject,
  getCurrentVNode,
  isProxy,
  isReactive,
  isRecordObject,
  Listener,
  Observers,
  type Reactive,
  reactive,
  type ValueProxy,
  watch
} from 'vitarx'
import { createUUIDGenerator, cssMapToRuleStyle, isCSSStyleSheetSupported } from './utils.js'

export interface CssRule {
  name: string
  rule: string
  selectorText: string
}

/**
 * css属性映射
 */
export type CssStyle = Vitarx.CssStyle

/**
 * 动态样式
 */
export interface DynamicCssRule {
  /**
   * className
   */
  readonly name: string
  readonly selectorText: string
  /**
   * 响应式样式对象
   *
   * 更新对象属性值则会自动更新样式，不可以直接对`style`赋值，只能操作其属性。
   */
  readonly style: Reactive<CssStyle>

  /**
   * 转换为字符串
   *
   * @returns {string} 返回`name`
   */
  toString(): string

  /**
   * 删除样式
   */
  remove(): void
}

/**
 * 屏幕尺寸断点规则
 */
export interface MediaScreenRule {
  /**
   * 手机
   *
   * @default `@media screen and (max-width: 480px)`
   */
  xs: string
  /**
   * 小平板
   *
   * @default `@media screen and (min-width: 768px)`
   */
  sm: string
  /**
   * 普通平板
   *
   * @default `@media screen and (min-width: 992px)`
   */
  md: string
  /**
   * 大屏平板
   *
   * @default `@media screen and (min-width: 1200px)`
   */
  lg: string
  /**
   * 桌面显示器
   *
   * @default `@media screen and (min-width: 1920px)`
   */
  xl: string
}

/** 屏幕尺寸 */
export type Screen = keyof MediaScreenRule

/**
 * 可选配置项
 */
export interface CssInJsOptions {
  /**
   * 前缀，建议设置前缀，避免冲突。
   *
   * @default ''
   */
  prefix?: string
  /**
   * 屏幕尺寸断点预设规则
   *
   * @default {
   *   xs: "@media screen and (max-width: 575px)",
   *   sm: "@media screen and (min-width: 576px) and (max-width: 767px)",
   *   md: "@media screen and (min-width: 768px) and (max-width: 991px)",
   *   lg: "@media screen and (min-width: 992px) and (max-width: 1199px)",
   *   xl: "@media screen and (min-width: 1200px) and (max-width: 1399px)",
   *   xxl: "@media screen and (min-width: 1400px)"
   * }
   */
  mediaScreenRule?: Partial<MediaScreenRule>
}

export type CssStyleMap = CssStyle | Reactive<CssStyle> | ValueProxy<CssStyle>

export interface CssRuleOptions {
  /**
   * 自定义选择器
   *
   * 原理上支持任意css选择器，如果使用复合选择器时，勿直接将返回的`className`作为元素`className`|`class`使用，除非你定义的是一个简单的选择器，就像下面的示例那样。
   *
   * 示例：`.my-class:hover`，`.my-class[attr=value]`...
   */
  selector?: string
  /**
   * 适配屏幕尺寸
   *
   * 样式会写入对应的媒介查询中
   *
   * @default undefined
   */
  screen?: Screen
  /**
   * 自定义前缀
   *
   * 会和实例化时传入的全局前缀拼接
   *
   * @default ''
   */
  prefix?: string
  /**
   * 唯一的规则
   *
   * 通常需要配合`selector`使用，因为需要通过选择器去判断是否存在规则。
   *
   * 这个选项在重复样式的场景下，可以提高性能。
   *
   * > 注意：启用该选项后，CSS规则不随组件销毁而删除，但你可以通过{@linkcode CssInJs.removeStaticCssRule}删除它
   *
   * @default false
   */
  only?: boolean
}

type ScreenCssStyleSheetMap = {
  [k in Screen]?: CSSStyleSheet
}
export type SheetStore = {
  dynamic: CSSStyleSheet
  static: CSSStyleSheet
  screen: ScreenCssStyleSheetMap
}

/**
 * # CssInJs
 *
 * 通过此类可以轻松的实现css-in-js功能，可以在js代码中使用{@linkcode define}方法定义样式，且能够随着组件销毁自动删除样式。
 *
 * @example
 * ```tsx
 * import CssInJs from '@vitarx/css-in-js'
 *
 * // 实例化 cssInJs
 * const cssInJs = new CssInJs('my-')
 * // 在组件外部定义的样式是全局样式，不会随组件销毁自动删除
 * const className = cssInJs.define({color: 'red'}) // 随机生成className
 * console.log(className) // my-XjXAd
 *
 * // 自定义选择器
 * cssInJs.define({color: 'red'}, '.my-class') // my-class
 * // 伪类支持
 * cssInJs.define({color: 'red'}, '.my-class:hover') // my-class
 *
 * // 响应式样式
 * const Button:Vitarx.FN = () => {
 *   // 组件销毁时会自动移除该样式
 *   const buttonCssRule = cssInJs.reactive({color: 'red'})
 *   const switchColor = () => {
 *    // 动态更改样式
 *    buttonCssRule.style.color = buttonCssRule.style.color === 'red' ? 'blue' : 'red'
 *   }
 *   return <button className={buttonCssRule.name} onClick={switchColor}>切换颜色</button>
 * }
 * ```
 */
export class CssInJs {
  // 随机生成id
  static readonly uuidGenerator: () => string = createUUIDGenerator(3)
  /**
   * 单实例
   *
   * @private
   */
  private static instance: CssInJs | null = null
  // 样式表
  private readonly sheet: SheetStore
  // 配置项
  private readonly options: DeepRequired<CssInJsOptions> = {
    prefix: '',
    mediaScreenRule: {
      xs: `@media screen and (max-width: 480px)`,
      sm: `@media screen and (min-width: 768px)`,
      md: `@media screen and (min-width: 992px)`,
      lg: `@media screen and (min-width: 1200px)`,
      xl: `@media screen and (min-width: 1920px)`
    }
  }
  // 唯一样式选择器
  private readonly onlyCssSelector = new Set<string>()
  /**
   * 创建一个CssInJs实例
   *
   * @param {CssInJsOptions} [options] - 可选配置项
   */
  constructor(options?: CssInJsOptions) {
    if (!Boolean(typeof window !== 'undefined' && window.document)) {
      throw new Error('CssInJs: 暂不支持在非浏览器端运行。')
    }
    if (options) deepMergeObject(this.options, options)
    this.sheet = {
      dynamic: CssInJs.createStyleSheet(),
      static: CssInJs.createStyleSheet(),
      screen: {}
    }
  }

  // 前缀
  public get prefix(): string {
    return this.options.prefix
  }

  /**
   * 样式表仓库
   *
   * @readonly
   */
  get sheetStore(): Readonly<SheetStore> {
    return this.sheet
  }

  /**
   * 创建一个唯一类名，支持自定义前缀
   *
   * @param {string} [prefix] - 前缀。
   * @returns {string} - 返回一个随机且唯一的`className`。
   */
  public static makeClassName(prefix: string = ''): string {
    return prefix + CssInJs.uuidGenerator()
  }

  /**
   * 单例模式工厂方法
   *
   * @param {CssInJsOptions} [options] - 可选配置项，仅在第一次调用此方法时有效。
   * @returns {CssInJs} 返回CssInJs实例
   */
  static factory(options?: CssInJsOptions): CssInJs {
    // 如果实例不存在，则创建一个新的实例并返回
    if (!this.instance) this.instance = new CssInJs(options)
    // 返回单例实例
    return this.instance
  }

  /**
   * 创建一个样式表
   *
   * @returns {CSSStyleSheet} - CSSStyleSheet。
   * @private
   */
  private static createStyleSheet(): CSSStyleSheet {
    let cssSheet: CSSStyleSheet
    if (isCSSStyleSheetSupported()) {
      cssSheet = new CSSStyleSheet()
      document.adoptedStyleSheets.push(cssSheet)
    } else {
      const style = document.createElement('style')
      style.appendChild(
        document.createComment('此样式表由@vitarx/css-in-js注入与管理，请勿外部变更。')
      )
      document.head.append(style)
      cssSheet = style.sheet!
    }
    return cssSheet
  }

  /**
   * 删除静态的CSS规则
   *
   * @param selectorText - 完整的选择器文本
   * @returns {void}
   */
  public removeStaticCssRule(selectorText: string): void {
    this.onlyCssSelector.delete(selectorText)
    this.deleteRule(this.sheet.static, selectorText)
  }

  /**
   * 获取唯一的`className`
   *
   * 规则：`prefix`+`CssInJs.uuidGenerator()`
   *
   * @param {string} [prefix] - 前缀，不传入则使用默认前缀。
   * @returns {string} - 返回一个随机且唯一的`className`。
   */
  public className(prefix?: string): string {
    return CssInJs.makeClassName(prefix ?? this.prefix)
  }

  /**
   * 定义Css规则
   *
   * 当传入的样式是一个标准的可监听对象时，会自动监听其变化，并替换样式，前提条件它必须是在组件作用域中。
   *
   * 如果是在组件作用域中定义的样式，会随组件销毁自动删除。
   *
   * @param {CssStyleMap} style - 样式对象，支持传入响应式对象，包括但不限于 `Reactive`、`Ref`、`Computed`。
   * @param {CssRuleOptions} [options] - 可选配置项
   * @returns {string} - `className`。
   */
  public define(style: CssStyleMap, options?: CssRuleOptions): string {
    const { selector = '', screen = '', prefix = '', only = false } = options || {}
    const cssRule = this.cssMapToCssRule(style, selector, prefix)
    // 判断是否存在于唯一选择器中
    if (only && this.onlyCssSelector.has(cssRule.selectorText)) return cssRule.name
    const widget = getCurrentVNode()?.instance
    const sheet = this.getCssStyleSheet(screen, widget ? 'dynamic' : 'static')
    // 插入规则
    this.insertCssRule(sheet, cssRule)
    let listener: Listener | undefined
    // 缓存样式选择器
    if (only) this.onlyCssSelector.add(cssRule.selectorText)
    if (widget) {
      // 监听样式变化
      if (isProxy(style)) {
        // 监听样式变化，并替换样式
        listener = watch(style, () => {
          cssRule.rule = cssMapToRuleStyle(style, cssRule.selectorText)
          this.insertCssRule(sheet, cssRule, true)
        })
      }
      const onUnmounted = widget['onUnmounted']
      widget['onUnmounted'] = () => {
        if (onUnmounted && typeof onUnmounted === 'function') {
          onUnmounted.apply(widget)
        }
        listener?.destroy()
        listener = undefined
        // 销毁时删除样式
        if (!only) this.deleteRule(sheet, cssRule.selectorText)
        widget['onUnmounted'] = onUnmounted
      }
    }
    return cssRule.name
  }

  /**
   * 定义动态Css规则
   *
   * 此方法返回一个`ReactiveCssRule`对象，可以通过`ReactiveCssRule.style`更新样式。
   *
   * @remarks
   * 注意：此方法中启用的监听器不受作用域管理，不管在任何地方定义，它都不会自动销毁，不再使用该样式时需调用`ReactiveCssRule.remove()`删除。
   *
   * @param {CssStyle} style - 样式对象，只能传入普通的键值对对象或者`Reactive`对象，普通的键值对对象会自动转换为`Reactive`。
   * @param {CssRuleOptions} [options] - 可选配置项
   * @returns {DynamicCssRule} - 动态Css规则对象。
   */
  public dynamic(style: CssStyle, options: Omit<CssRuleOptions, 'only'> = {}): DynamicCssRule {
    const { selector = '', screen, prefix = '' } = options
    if (!isRecordObject(style)) throw new TypeError(`CssInJs:style must be a record object`)
    if (!isReactive(style)) style = reactive(style)
    // 创建动态样式
    const cssRule = this.cssMapToCssRule(style, selector, prefix)
    // 获取样式表
    const sheet = this.getCssStyleSheet(screen, 'dynamic')
    // 插入规则
    this.insertCssRule(sheet, cssRule)
    // 监听样式变化，并替换样式
    const listener = new Listener(() => {
      cssRule.rule = cssMapToRuleStyle(style, cssRule.selectorText)
      this.insertCssRule(sheet, cssRule, true)
    })
    Observers.register(style, listener)
    return {
      name: cssRule.name,
      selectorText: cssRule.selectorText,
      style: style as Reactive<CssStyle>,
      toString: () => {
        return cssRule.name
      },
      remove: () => {
        listener.destroy()
        this.deleteRule(sheet, cssRule.selectorText)
      }
    }
  }

  /**
   * 替换规则
   *
   * @param {CSSStyleSheet} sheet - 样式表。
   * @param {CssRule} cssRule - CssRule对象。
   * @param {boolean} [replace=false] - 是否替换规则，默认为false。
   * @private
   */
  private insertCssRule(sheet: CSSStyleSheet, cssRule: CssRule, replace: boolean = false) {
    if (!replace) {
      sheet.insertRule(cssRule.rule, sheet.cssRules.length)
    } else {
      // 删除规则
      if (replace) this.deleteRule(sheet, cssRule.selectorText)
      // 插入新的规则
      sheet.insertRule(cssRule.rule, sheet.cssRules.length)
    }
  }

  /**
   * 删除规则
   *
   * @param sheet
   * @param selectorText
   * @private
   */
  private deleteRule(sheet: CSSStyleSheet, selectorText: string): void {
    selectorText = selectorText.trim()
    if (!selectorText.startsWith('.')) selectorText = `.${selectorText}`
    for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
      const rule = sheet.cssRules[i]
      // 检查是否是样式规则 (CSSStyleRule)
      if (rule instanceof CSSStyleRule && rule.selectorText === selectorText) {
        sheet.deleteRule(i)
        return
      }
    }
  }
  /**
   * 获取屏幕样式表
   *
   * @param screen
   * @param type
   * @private
   */
  private getCssStyleSheet(screen: any, type: 'static' | 'dynamic' = 'static'): CSSStyleSheet {
    if (screen in this.options.mediaScreenRule) {
      if (!this.sheet.screen[<Screen>screen]) {
        const i = this.sheet.static.insertRule(
          `${this.options.mediaScreenRule[<Screen>screen]}{}`,
          this.sheet.static.cssRules.length
        )
        this.sheet.screen[<Screen>screen] = this.sheet.static.cssRules[
          i
        ] as unknown as CSSStyleSheet
      }
      return this.sheet.screen[<Screen>screen]!
    }
    return type === 'static' ? this.sheet.static : this.sheet.dynamic
  }
  /**
   * 样式转换为CssRule
   *
   * @param {CssStyle} cssStyleMap - 样式对象
   * @param {string} selector - css选择器
   * @param {string} prefix - 前缀
   * @private
   */
  private cssMapToCssRule(cssStyleMap: CssStyleMap, selector: string, prefix: string): CssRule {
    const { name, selectorText } = this.parseSelector(selector, prefix)
    const rule = cssMapToRuleStyle(cssStyleMap, selectorText)
    return { name, rule, selectorText }
  }
  /**
   * 解析选择器
   *
   * @param {string} selector - 选择器
   * @param {string} prefix - 前缀
   * @returns {{name: string, selectorText: string}} 返回一个对象，包含name和selectorText
   * @private
   */
  private parseSelector(selector: string, prefix: string): Omit<CssRule, 'rule'> {
    // 去除前后空格
    selector = selector.trim()

    // 如果选择器为空，生成默认的类名
    if (!selector) {
      // 生成随机的类名
      const name = this.className(this.prefix + prefix)
      return {
        name,
        selectorText: `.${name}`
      }
    }

    // 提取基础选择器部分，去掉伪类和属性选择器
    const baseSelector = selector.split(':')[0].split('[')[0].trim()

    // 如果没有 . 开头
    if (
      !baseSelector.startsWith('.') &&
      !baseSelector.startsWith('#') &&
      !baseSelector.startsWith('@')
    ) {
      return {
        name: baseSelector, // 使用原始选择器作为名字
        selectorText: `.${selector}` // 为选择器添加 .
      }
    }

    // 如果是类选择器，直接返回
    return {
      name: baseSelector.slice(1), // 去掉开头的点
      selectorText: selector
    }
  }
}
