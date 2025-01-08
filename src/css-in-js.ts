import {
  deepMergeObject,
  getCurrentVNode,
  isProxy,
  isReactive,
  isRecordObject,
  type Reactive,
  reactive,
  type ValueProxy,
  watch
} from 'vitarx'
import {
  createUUIDGenerator,
  cssMapToRuleStyle,
  isCSSStyleSheetSupported,
  removeUndefinedProperties
} from './utils.js'

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
   * @default `@media screen and (max-width: 575px)`
   */
  xs: string
  /**
   * 小平板
   *
   * @default `@media screen and (min-width: 576px) and (max-width: 767px)`
   */
  sm: string
  /**
   * 普通平板
   *
   * @default `@media screen and (min-width: 768px) and (max-width: 991px)`
   */
  md: string
  /**
   * 大屏平板
   *
   * @default `@media screen and (min-width: 992px) and (max-width: 1199px)`
   */
  lg: string
  /**
   * 小型显示器
   *
   * @default `@media screen and (min-width: 1200px) and (max-width: 1399px)`
   */
  xl: string
  /**
   * 大型显示器
   *
   * @default `@media screen and (min-width: 1400px)`
   */
  xxl: string
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
}

export type SheetStore = {
  dynamic: CSSStyleSheet
  static: CSSStyleSheet
} & {
  [k in Screen]?: CSSStyleSheet
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
  static readonly isSupportedReplaceRule: boolean = isCSSStyleSheetSupported()
  // 随机生成id
  static readonly uuidGenerator: () => string = createUUIDGenerator()
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
      xs: `@media screen and (max-width: 575px)`,
      sm: `@media screen and (min-width: 576px) and (max-width: 767px)`,
      md: `@media screen and (min-width: 768px) and (max-width: 991px)`,
      lg: `@media screen and (min-width: 992px) and (max-width: 1199px)`,
      xl: `@media screen and (min-width: 1200px) and (max-width: 1399px)`,
      xxl: `@media screen and (min-width: 1400px)`
    }
  }
  /**
   * 创建一个CssInJs实例
   *
   * @param {CssInJsOptions} [options] - 可选配置项
   */
  constructor(options?: CssInJsOptions) {
    if (!Boolean(typeof window !== 'undefined' && window.document)) {
      throw new Error('CssInJs: 暂不支持在非浏览器端运行。')
    }
    if (options) deepMergeObject(this.options, removeUndefinedProperties(options))
    this.sheet = {
      dynamic: this.createStyleSheet(),
      static: this.createStyleSheet()
    }
  }
  // 前缀
  public get prefix(): string {
    return this.options.prefix
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
   * 定义样式
   *
   * 如果是在组件创建作用域中定义的样式，会随组件销毁自动删除。
   *
   * @param {CssStyleMap} style - 样式对象，支持传入响应式对象，包括但不限于 `Reactive`、`Ref`、`Computed`。
   * @param {CssRuleOptions} [options] - 可选配置项
   * @returns {string} - 返回一个`className`。
   */
  public define(style: CssStyleMap, options: CssRuleOptions = {}): string {
    const { selector = '', screen } = options
    const cssRule = this.cssMapToCssRule(style, selector)
    const widget = getCurrentVNode()?.instance
    const sheet = screen
      ? this.getScreenSheet(screen)
      : widget
        ? this.sheet.dynamic
        : this.sheet.static
    // 插入规则
    sheet.insertRule(cssRule.rule, sheet.cssRules.length)
    // 监听样式变化
    if (isProxy(style)) {
      // 监听样式变化，并替换样式
      const listener = watch(style, () => {
        this.replaceCssRule(
          sheet,
          cssMapToRuleStyle(style, cssRule.selectorText),
          cssRule.selectorText
        )
      })
      if (widget) {
        const onUnmounted = widget['onUnmounted']
        widget['onUnmounted'] = () => {
          if (onUnmounted && typeof onUnmounted === 'function') {
            onUnmounted.apply(widget)
          }
          listener.destroy()
          // 销毁时删除样式
          this.deleteRule(sheet, cssRule.selectorText)
          widget['onUnmounted'] = onUnmounted
        }
      }
    }
    return cssRule.name
  }
  /**
   * 定义响应式样式
   *
   * 此方法返回一个`ReactiveCssRule`对象，可以通过`ReactiveCssRule.style`更新样式。
   *
   * @remarks
   * 注意：不管在任何地方定义，它都不会自动销毁，不再使用该样式时需调用`ReactiveCssRule.remove()`删除，
   * 否则内存空间得不到释放！
   *
   * @param {CssStyle} style - 样式对象，只能传入普通的键值对对象或者`Reactive`对象，普通的键值对对象会自动转换为`Reactive`。
   * @param {CssRuleOptions} [options] - 可选配置项
   * @returns {DynamicCssRule} - 返回一个动态样式对象。
   */
  public dynamic(style: CssStyle, options: CssRuleOptions = {}): DynamicCssRule {
    const { selector = '', screen } = options
    if (!isRecordObject(style)) throw new TypeError(`CssInJs:style must be a record object`)
    if (!isReactive(style)) style = reactive(style)
    // 创建动态样式
    const cssRule = this.cssMapToCssRule(style, selector)
    // 获取样式表
    const sheet = screen ? this.getScreenSheet(screen) : this.sheet.dynamic
    // 插入规则
    sheet.insertRule(cssRule.rule, sheet.cssRules.length)
    // 监听样式变化，并替换样式
    const listener = watch(style, () => {
      this.replaceCssRule(
        sheet,
        cssMapToRuleStyle(style, cssRule.selectorText),
        cssRule.selectorText
      )
    })
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
   * @param {string} rule - 规则文本
   * @param {string} selectorText - 选择器文本。
   * @private
   */
  private replaceCssRule(sheet: CSSStyleSheet, rule: string, selectorText: string) {
    if (CssInJs.isSupportedReplaceRule) {
      sheet.replaceSync(rule)
    } else {
      // 删除规则
      this.deleteRule(sheet, selectorText)
      // 插入新的规则
      sheet.insertRule(rule, sheet.cssRules.length)
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
   * @private
   */
  private getScreenSheet(screen: Screen): CSSStyleSheet {
    if (this.sheet[screen]) return this.sheet[screen]
    const i = this.sheet.static.cssRules.length
    this.sheet.static.insertRule(`${this.options.mediaScreenRule[screen]}{}`, i)
    return (this.sheet[screen] = this.sheet.static.cssRules[i] as unknown as CSSStyleSheet)
  }
  /**
   * 创建一个样式表
   *
   * @returns {CSSStyleSheet} - CSSStyleSheet。
   * @private
   */
  private createStyleSheet(): CSSStyleSheet {
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
   * 样式转字符串
   *
   * @param {CssStyle} cssStyleMap - 样式对象
   * @param {string} selector - css选择器
   * @private
   */
  private cssMapToCssRule(cssStyleMap: CssStyleMap, selector: string): CssRule {
    const { name, selectorText } = this.parseSelector(selector)
    const rule = cssMapToRuleStyle(cssStyleMap, selectorText)
    return { name, rule, selectorText }
  }
  /**
   * 解析选择器
   *
   * @param {string} selector - 选择器
   * @returns {{name: string, selectorText: string}} 返回一个对象，包含name和selectorText
   * @private
   */
  private parseSelector(selector: string): Omit<CssRule, 'rule'> {
    // 去除前后空格
    selector = selector.trim()

    // 如果选择器为空，生成默认的类名
    if (!selector) {
      // 生成随机的类名
      const name = this.className()
      return {
        name,
        selectorText: `.${name}`
      }
    }

    // 提取基础选择器部分，去掉伪类和属性选择器
    const baseSelector = selector.split(':')[0].split('[')[0].trim()

    // 如果没有 . 开头
    if (!baseSelector.startsWith('.')) {
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
