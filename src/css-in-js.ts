import {
  deepMergeObject,
  type DeepRequired,
  getCurrentVNode,
  isProxy,
  isRecordObject,
  isRefSignal,
  isSignal,
  type ProxySignal,
  type RefSignal,
  type Subscriber,
  type VNode,
  watch,
  type WidgetVNode
} from 'vitarx'
import {
  createUUIDGenerator,
  cssStyleMapToCssRuleText,
  formatSelector,
  formatStyleKey,
  formatStyleValue,
  isCSSStyleSheetSupported,
  removePriority
} from './utils.js'

/**
 * css样式规则对象
 *
 * 扩展了如下属性：
 * - `name`属性是从`selectorText`中提取出的，如果selectorText是一个id选择器，则提取到的是id名，类选择器则是`className`，
 * - `className`同`name`一致，
 * - `listener`属性是响应式样式的监听器，如果不是响应式或作用域已销毁则为undefined，
 * - `toString`方法返回的是`name`。
 *
 * @extends CSSStyleRule
 * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleRule CSSStyleRule}
 */
export interface CssStyleRule extends CSSStyleRule {
  /**
   * 从`selectorText`中提取出的`className`
   *
   * > 注意：如果是自定义选择器，可能提取出的`className`不准确。
   */
  name: string
  /**
   * 从`selectorText`中提取出的`className`
   *
   * > 注意：如果是自定义选择器，可能提取出的`className`不准确。
   */
  className: string
  /**
   * 响应式样式监听器
   *
   * 如果定义规则时传入的style是响应式对象，则会在第一次定义该规则时开始监听变化自动更新样式。
   *
   * 如果它是在组件作用域内时，组件销毁会自动取消监听，移除该监听器，但不在组件作用域中时，该监听器会一直存在，
   * 需手动`listener?.dispose()`
   */
  listener?: Subscriber
  /**
   * 转换为字符串
   *
   * @returns {string} - 返回的是`name`
   */
  toString(): string
}
/**
 * css属性映射
 */
export type CssStyle = Vitarx.CssStyle

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
   *   xs: "@media screen and (max-width: 480px)",
   *   sm: "@media screen and (min-width: 768px)",
   *   md: "@media screen and (min-width: 992px)",
   *   lg: "@media screen and (min-width: 1200px)",
   *   xl: "@media screen and (min-width: 1920px)",
   * }
   */
  mediaScreenRule?: Partial<MediaScreenRule>
}

export type CssStyleMap = CssStyle | ProxySignal<CssStyle> | RefSignal<CssStyle>

export interface CssRuleOptions {
  /**
   * 自定义选择器
   *
   * 选择器开头部分不支持元素选择器，但你可以在选择器片段中组合其他选择器。
   *
   * 原理上支持任意css选择器（id选择器，类选择器，伪类选择器，伪元素选择器，组合选择器，子选择器，子元素选择器，子元素选择器...），
   * 如果使用自定义选择器时，勿直接将返回的`className`作为元素`className`|`class`使用，
   * 除非你定义的是一个简单的选择器，就像下面的示例那样，否则返回的`className`可能解析的不够准确。
   *
   * 示例：`.my-class:hover`，`.my-class[attr="value"]`...
   *
   * > 注意：不要@，例如@import，@font-face，@keyframes，@media...，
   * 常用的自适应屏幕断点，已内置了媒介查询样式表，可以使用`screen`配置需要适配的屏幕。
   */
  selector?: string
  /**
   * 自定义前缀
   *
   * 会和实例化时传入的全局前缀拼接
   *
   * @default ''
   */
  prefix?: string
  /**
   * 适配屏幕尺寸
   *
   * 样式会写入对应的媒介查询中
   *
   * @default undefined
   */
  screen?: Screen
  /**
   * 是否只读
   *
   * 因为{@link https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleSheet CSSStyleSheet}删除规则使用的是index索引，
   * 删除规则需要重构索引，付出昂贵的代价，所以提供了`readonly`只读的概念，不随组件销毁而删除，不影响样式的修改。
   *
   * 默认值：
   * - 如果传入了选择器：true；
   * - 如果没有传入选择器且不在组件作用域内：true；
   * - 其他情况默认为`false`，因为动态选择器无法在组件下一个生命周期中复用，会随组件生命周期销毁而失效。
   *
   * @default `selector ? true : false`
   */
  readonly?: boolean
}

type ScreenCssStyleSheetMap = {
  [k in Screen]?: CSSStyleSheet
}

export type CSSSheetStore = {
  /**
   * 动态样式
   */
  dynamic: CSSStyleSheet
  /**
   * 静态样式
   */
  readonly: CSSStyleSheet
  /**
   * 针对屏幕的样式表
   */
  screen: {
    dynamic: ScreenCssStyleSheetMap
    readonly: ScreenCssStyleSheetMap
  }
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
 *
 * // 在组件外部定义的样式是全局样式，不会随组件销毁自动删除
 * const rule = cssInJs.define({color: 'red'})
 * console.log(rule.name) // my-AwQ  随机生成的类名，可以直接使用在html元素的class|className属性中
 *
 * // 直接返回一个类名
 * const className = cssInJs.defineNamed({color: 'red'})
 *
 * // 自定义选择器，不仅仅只支持伪类你可以传入任何选择器，只要开头是类选择器或id选择器即可
 * cssInJs.define({color: 'red'}, '.my-class:hover')
 *
 * // 修改样式
 * const Button:Vitarx.FN = () => {
 *   // 组件销毁时会自动移除该样式
 *   const buttonCssRule = cssInJs.define({color: 'red'})
 *   const switchColor = () => {
 *    // 更改样式
 *    buttonCssRule.style.color = buttonCssRule.style.color === 'red' ? 'blue' : 'red'
 *
 *    // 使用`setProperty`方法设置样式
 *    // @see https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleDeclaration/setProperty
 *    // buttonCssRule.style.setProperty('color', 'blue')
 *
 *    // 删除样式
 *    // @see https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleDeclaration/removeProperty
 *    // buttonCssRule.style.removeProperty('color')
 *   }
 *   return <button className={buttonCssRule.name} onClick={switchColor}>切换颜色</button>
 * }
 * ```
 */
export class CssInJs {
  // 随机生成id
  static readonly uuidGenerator: () => string = createUUIDGenerator(3)
  /**
   * 媒体屏幕查询标签
   */
  static readonly mediaScreenTags: Array<keyof MediaScreenRule> = ['xs', 'sm', 'md', 'lg', 'xl']
  /**
   * 单实例
   *
   * @private
   */
  static #instance: CssInJs | null = null
  // 样式表
  private readonly sheet: CSSSheetStore
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
  // 规则映射 样式表 -> Map<规则选择器文本, CssStyleRule>
  private readonly sheetCSSRuleMap = new WeakMap<CSSStyleSheet, Map<string, CssStyleRule>>()
  // vnode作用域样式表映射 vnode -> Map<样式表, Set<规则选择器文本>>
  private readonly vnodeCssRuleMap = new WeakMap<VNode, Map<CSSStyleSheet, Set<string>>>()

  /**
   * 创建一个CssInJs实例
   *
   * @param {CssInJsOptions} [options] - 可选配置项
   */
  constructor(options?: CssInJsOptions) {
    if (!Boolean(typeof window !== 'undefined' && window.document)) {
      throw new Error('CssInJs: 暂不支持在非浏览器端运行。')
    }
    if (options) {
      this.options = deepMergeObject(this.options, options)
    }
    this.sheet = {
      dynamic: CssInJs.createStyleSheet(),
      readonly: CssInJs.createStyleSheet(),
      screen: {
        dynamic: {},
        readonly: {}
      }
    }
  }

  /**
   * 获取单实例
   *
   * 如果不存在，则创建一个新的实例并返回
   *
   * @returns {CssInJs} 返回CssInJs实例
   */
  static get instance(): CssInJs {
    // 如果实例不存在，则创建一个新的实例并返回
    if (!this.#instance) this.#instance = new CssInJs()
    // 返回单例实例
    return this.#instance
  }

  /**
   * 全局配置的css前缀
   */
  public get prefix(): string {
    return this.options.prefix
  }

  /**
   * 样式表仓库
   *
   * @readonly
   */
  get sheetStore(): Readonly<CSSSheetStore> {
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
   * 替换规则样式
   *
   * @param {CssStyleRule} rule - CSSStyleRule
   * @param {CssStyleMap} style - 样式对象
   * @private
   */
  public static replaceRuleStyle(rule: CssStyleRule, style: CssStyleMap): void {
    if (isRefSignal(style)) style = style.value
    // 格式化完毕的样式
    const formatedStyles: Record<string, [string, string]> = {}
    let newCssText = `${rule.selectorText} { `
    // 将 style 中的有效属性更新到 rule.style
    for (const property in style) {
      const value = formatStyleValue(style[property])
      if (value !== null) {
        const key = formatStyleKey(property)
        newCssText += `${key}: ${value}; `
        const newValue = removePriority(value)
        formatedStyles[formatStyleKey(property)] = [newValue, newValue === value ? '' : 'important']
      }
    }
    newCssText += '}'
    // 如果规则的样式文本没有变化，则不进行任何操作
    if (rule.style.cssText === newCssText) return

    // 遍历 rule.style，处理删除和更新的逻辑
    for (let i = rule.style.length - 1; i >= 0; i--) {
      const property = rule.style[i]
      if (property in formatedStyles) {
        // 如果属性存在于 formatedStyles 中，更新它
        rule.style.setProperty(property, formatedStyles[property][0], formatedStyles[property][1])
        delete formatedStyles[property] // 更新后移除，避免后续重复设置
      } else {
        // 如果属性不在 formatedStyles 中，移除它
        rule.style.removeProperty(property)
      }
    }

    // 剩下的 formatedStyles 中的属性需要新增
    for (const property in formatedStyles) {
      rule.style.setProperty(property, formatedStyles[property][0], formatedStyles[property][1])
    }
  }

  /**
   * 创建一个样式表
   *
   * @returns {CSSStyleSheet} - CSSStyleSheet。
   */
  public static createStyleSheet(): CSSStyleSheet {
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
   * 创建单例
   *
   * @param options - 可选配置项
   * @returns {CssInJs} - 返回单例实例
   */
  static create(options?: CssInJsOptions): CssInJs {
    if (!this.#instance) {
      this.#instance = new CssInJs(options)
    }
    return this.#instance
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
   * @example
   * const rule = CssInJs.factory().define({fontSize: '20px',color: 'red'})
   * // 元素中使用该规则 rule.name || rule.className都能访问到自动生成的`className`
   * const Title = () => <h1 className={rule.name}>标题</h1>
   *
   * @param {CssStyleMap} style - 样式对象。
   * @param {CssRuleOptions} [options] - 可选配置项
   * @returns {CssStyleRule} - `CSSRule`对象。
   */
  public define(style: CssStyleMap, options: CssRuleOptions = {}): CssStyleRule {
    if (!isRecordObject(options)) {
      throw new TypeError(`CssInJs.define: options must be a object`)
    }

    const { selector = '', screen = '', prefix = '', readonly } = options

    // 获取当前虚拟节点
    const vnode = getCurrentVNode()

    // 是否为静态CSS规则
    const isStaticCssRule = Boolean(readonly === undefined ? selector.trim() || !vnode : readonly)

    // 获取样式表
    const sheet = this.getCssStyleSheet(screen, isStaticCssRule ? 'readonly' : 'dynamic')

    // 插入规则并获取 CSSStyleRule
    const rule = this.insertRule(sheet, style, selector, prefix, isStaticCssRule)
    // 处理虚拟节点的规则映射，节点销毁自动删除节点样式
    if (vnode && !isStaticCssRule) this.handleVNodeCssRules(vnode, sheet, rule)

    return rule
  }

  /**
   * `define`方法的语法糖，返回`CssStyleRule.name`
   *
   * @example
   * const className = CssInJs.factory().defineNamed({fontSize: '20px',color: 'red'})
   * const Title = () => <h1 className={className}>标题</h1>
   *
   * @param {CssStyleMap} style - 样式对象。
   * @param {CssRuleOptions} [options] - 可选配置项
   */
  public defineNamed(style: CssStyleMap, options: CssRuleOptions = {}): string {
    return this.define(style, options).name
  }

  /**
   * 定义自定义选择器规则
   *
   * @param {string} selector - 选择器
   * @param {CssStyleMap} style - 样式对象
   * @param {CssRuleOptions} options - 可选配置项
   * @returns {CssStyleRule} - 返回`CssStyleRule`对象
   */
  public defineCustomRule(
    selector: string,
    style: CssStyleMap,
    options: Omit<CssRuleOptions, 'selector'> = {}
  ): CssStyleRule {
    return this.define(style, { selector, ...options })
  }

  /**
   * 删除规则
   *
   * @param {CSSStyleSheet} sheet - 样式表
   * @param {string | string[] | Set<string>} selectors - 选择器
   * @returns {void}
   */
  private deleteRule(sheet: CSSStyleSheet, selectors: string | Set<string> | string[]): void {
    // 获取当前样式表的规则映射
    const sheetMap = this.sheetCSSRuleMap.get(sheet)
    // 如果没有规则映射，直接返回
    if (!sheetMap) return
    // 如果 selectors 不是 Set，确保其为数组并格式化
    let selectorSet: Set<string>
    if (selectors instanceof Set) {
      // 对 Set 中的每个选择器进行 formatSelector 处理
      selectorSet = new Set(Array.from(selectors).map(formatSelector))
    } else {
      // 如果是字符串或数组，格式化并转换为 Set
      const selectorsArray = Array.isArray(selectors) ? selectors : [selectors]
      selectorSet = new Set(selectorsArray.map(formatSelector))
    }

    // 删除映射中的规则
    for (const selector of selectorSet) {
      if (sheetMap.has(selector)) {
        sheetMap.delete(selector)
      } else {
        selectorSet.delete(selector)
      }
    }

    // 如果没有需要删除的规则，直接返回
    if (selectorSet.size === 0) return

    // 遍历所有的 CSS 规则，删除匹配的规则
    for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
      const rule = sheet.cssRules[i]
      // 检查是否是样式规则 (CSSStyleRule)
      if (rule instanceof CSSStyleRule && selectorSet.has(rule.selectorText)) {
        sheet.deleteRule(i)
        selectorSet.delete(rule.selectorText)
        if (selectorSet.size === 0) break
      }
    }
  }

  /**
   * 插入规则
   *
   * @param {CSSStyleSheet} sheet - 样式表
   * @param {CssStyleMap} style - 样式对象
   * @param {string} selector - 选择器
   * @param {string} prefix - 前缀
   * @param {boolean} cache - 是否缓存规则
   * @returns {CssStyleRule} - 返回`CssStyleRule`对象。
   */
  private insertRule(
    sheet: CSSStyleSheet,
    style: CssStyleMap,
    selector: string,
    prefix: string,
    cache: boolean
  ): CssStyleRule {
    const { name, selectorText } = this.parseSelector(selector, prefix)
    // 获取缓存的 CssStyleRule
    if (cache) {
      const cachedCssRule = this.sheetCSSRuleMap.get(sheet)?.get(selectorText)
      if (cachedCssRule) {
        this.updateCachedRule(cachedCssRule, style)
        return cachedCssRule
      }
    }
    // 生成规则文本
    const ruleText = cssStyleMapToCssRuleText(style, selectorText)
    // 添加规则到样式表
    const cssRule = this.addRuleToSheet(sheet, ruleText)
    // 缓存规则
    if (cache) this.cacheCssRule(sheet, selectorText, cssRule)
    // 监听代理对象变化
    if (isSignal(style)) this.watchProxyStyleChange(cssRule, style)
    // 扩展CSS规则属性
    this.extendCssRule(cssRule, name)
    return cssRule
  }
  /**
   * 缓存CSS规则
   *
   * @param {CSSStyleSheet} sheet - 样式表
   * @param {string} selectorText - 选择器文本
   * @param {CssStyleRule} cssRule - CSS规则
   */
  private cacheCssRule(sheet: CSSStyleSheet, selectorText: string, cssRule: CssStyleRule): void {
    if (!this.sheetCSSRuleMap.has(sheet)) {
      this.sheetCSSRuleMap.set(sheet, new Map())
    }
    this.sheetCSSRuleMap.get(sheet)?.set(selectorText, cssRule)
  }
  /**
   * 扩展CSS规则属性
   *
   * @param {CssStyleRule} cssRule - CSS规则
   * @param {string} name - 规则名称
   */
  private extendCssRule(cssRule: CssStyleRule, name: string): void {
    Object.defineProperties(cssRule, {
      name: { value: name },
      className: { value: name },
      toString: {
        value() {
          return name
        },
        configurable: true,
        writable: true
      }
    })
  }
  /**
   * 将规则插入到样式表
   *
   * @param {CSSStyleSheet} sheet - 样式表
   * @param {string} ruleText - 规则文本
   * @returns {CssStyleRule} - 插入的CSS规则
   */
  private addRuleToSheet(sheet: CSSStyleSheet, ruleText: string): CssStyleRule {
    let cssRule: CssStyleRule
    try {
      const index = sheet.insertRule(ruleText, sheet.cssRules.length)
      cssRule = sheet.cssRules[index] as CssStyleRule
    } catch (e) {
      throw new Error(
        `CssInJs.insertRule: 未能成功插入CSS规则，请检查样式是否存在错误，error：${e}`
      )
    }
    if (!(cssRule instanceof CSSStyleRule)) {
      throw new Error(`CssInJs.insertRule: ${ruleText} 不是有效的CSSStyleRule`)
    }
    return cssRule
  }
  /**
   * 更新缓存规则样式
   *
   * @param {CssStyleRule} cssRule - 缓存的CSS规则
   * @param {CssStyleMap} style - 样式对象
   */
  private updateCachedRule(cssRule: CssStyleRule, style: CssStyleMap): void {
    if (isProxy(style)) {
      this.watchProxyStyleChange(cssRule, style)
    } else {
      CssInJs.replaceRuleStyle(cssRule, style)
    }
  }
  /**
   * 监听代理样式变化
   *
   * @param rule - CSSStyleRule
   * @param style - 样式对象
   * @private
   */
  private watchProxyStyleChange(rule: CssStyleRule, style: CssStyleMap) {
    if (!rule.hasOwnProperty('listener')) {
      const listener = watch(style, () => CssInJs.replaceRuleStyle(rule, style))
      Object.defineProperty(rule, 'listener', {
        value: listener,
        configurable: true // 允许删除
      })
      listener.onDispose(() => delete rule.listener)
    }
  }
  /**
   * 处理虚拟节点的样式规则映射
   *
   * @param vnode - 当前虚拟节点
   * @param sheet - 当前样式表
   * @param rule - 当前CSS规则
   */
  private handleVNodeCssRules(vnode: WidgetVNode, sheet: CSSStyleSheet, rule: CssStyleRule) {
    if (!this.vnodeCssRuleMap.has(vnode)) {
      const vnodeRuleMap = new Map([[sheet, new Set([rule.selectorText])]])
      this.vnodeCssRuleMap.set(vnode, vnodeRuleMap)
    } else {
      const vnodeRuleMap = this.vnodeCssRuleMap.get(vnode)!
      if (vnodeRuleMap.has(sheet)) {
        vnodeRuleMap.get(sheet)!.add(rule.selectorText)
      } else {
        vnodeRuleMap.set(sheet, new Set([rule.selectorText]))
      }
    }
    vnode.scope.onDispose(() => {
      const vnodeRuleMap = this.vnodeCssRuleMap.get(vnode)
      if (vnodeRuleMap) {
        vnodeRuleMap.forEach((selectors, table) => {
          this.deleteRule(table, selectors)
          selectors.clear()
        })
        vnodeRuleMap.clear()
      }
      this.vnodeCssRuleMap.delete(vnode)
    })
  }
  /**
   * 获取CSS样式表
   *
   * @param {any} screen - 屏幕预设断点
   * @param {'readonly' | 'dynamic'} type - 类型
   * @private
   */
  private getCssStyleSheet(screen: any, type: 'readonly' | 'dynamic'): CSSStyleSheet {
    if (screen in this.options.mediaScreenRule) {
      const screenSheetMap = this.sheet.screen[type]
      if (!screenSheetMap[<Screen>screen]) {
        const i = this.sheet.readonly.insertRule(
          `${this.options.mediaScreenRule[<Screen>screen]}{}`,
          this.sheet.readonly.cssRules.length
        )
        screenSheetMap[<Screen>screen] = this.sheet.readonly.cssRules[i] as unknown as CSSStyleSheet
      }
      return screenSheetMap[<Screen>screen]!
    }
    return this.sheet[type]
  }
  /**
   * 解析选择器
   *
   * @param {string} selector - 选择器
   * @param {string} prefix - 前缀
   * @returns {{name: string, selectorText: string}} 返回一个对象，包含name和selectorText
   * @private
   */
  private parseSelector(selector: string, prefix: string): { name: string; selectorText: string } {
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
    if (selector.startsWith('@')) {
      throw new TypeError(`CssInJs:selector can not start with '@'`)
    }
    // 提取基础选择器部分，去掉伪类和属性选择器
    const baseSelector = selector.split(':')[0].split('[')[0].trim()
    // 如果没有 . # 开头，则默认添加.
    if (!baseSelector.startsWith('.') && !baseSelector.startsWith('#')) {
      return {
        name: baseSelector, // 使用原始选择器作为名字
        selectorText: `.${selector}` // 为选择器添加 .
      }
    }

    return {
      name: baseSelector.slice(1), // 去掉开头的点
      selectorText: selector
    }
  }
}
