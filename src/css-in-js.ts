import {
  getCurrentScope,
  getCurrentVNode,
  isReactive,
  isRecordObject,
  type Listener,
  reactive,
  type Reactive,
  Scope,
  watch
} from 'vitarx'
import { createUUIDGenerator, isCSSStyleSheetSupported, type UUIDGenerator } from './utils.js'

interface CssRule {
  name: string
  style: string
  selectorText: string
}

/**
 * css属性映射
 */
export type CssStyle = Vitarx.CssStyle

/**
 * 动态样式
 */
interface DynamicCssRule {
  /**
   * className
   */
  name: string
  /**
   * 响应式样式对象
   *
   * 可以通过此对象更新样式。
   */
  style: Reactive<CssStyle>
  /**
   * 转换为字符串
   *
   * @returns {string} 返回`name`
   */
  toString(): string
}

/**
 * # CssInJs
 *
 * 通过此类可以轻松的实现css-in-js功能，可以在js代码中使用{@linkcode define}方法定义样式，且能够随着组件销毁自动删除样式。
 *
 * @example
 * ```tsx
 * import { CssInJs,type CssStyle } from '@vitarx/css-in-js'
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
 *   const buttonCssRule = cssInJs.dynamic({color: 'red'})
 *   const switchColor = () => {
 *    // 动态更改样式
 *    buttonCssRule.style.color = buttonCssRule.style.color === 'red' ? 'blue' : 'red'
 *   }
 *   return <button className={buttonCssRule.name} onClick={switchColor}>切换颜色</button>
 * }
 * ```
 */
export class CssInJs {
  private readonly supportedReplaceRule: boolean
  private readonly styleSheet: CSSStyleSheet
  private readonly uuidGenerator: UUIDGenerator
  /**
   * 样式映射表
   *
   * 键为选择器，值为完整的规则样式字符串
   *
   * @private
   */
  private readonly styleMaps = new Map<string, string>()
  /**
   * 监听器映射表
   *
   * 键为完整选择器，值为监听器
   *
   * @private
   */
  private readonly watchMaps = new Map<string, Listener>()
  /**
   * 作用域映射表
   *
   * @private
   */
  private readonly scopeMaps = new WeakMap<Scope, Set<string>>()
  /**
   * 创建一个CssInJs实例
   *
   * @param {string} [prefix] - 前缀，建议添加前缀，避免冲突。
   */
  constructor(private readonly prefix: string = '') {
    if (!Boolean(typeof window !== 'undefined' && window.document)) {
      throw new Error('CssInJs: 暂不支持在非浏览器端运行。')
    }
    this.uuidGenerator = createUUIDGenerator()
    this.supportedReplaceRule = isCSSStyleSheetSupported()
    this.styleSheet = this.createStyleSheet()
  }

  /**
   * 初始化
   *
   * @private
   */
  private createStyleSheet(): CSSStyleSheet {
    if (isCSSStyleSheetSupported()) {
      const cssSheet = new CSSStyleSheet()
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, cssSheet]
      return cssSheet
    }
    const style = document.createElement('style')
    style.appendChild(
      document.createComment('此样式表由@vitarx/css-in-js注入与管理，请勿外部变更。')
    )
    document.head.append(style)
    return style.sheet!
  }

  /**
   * 获取唯一的`className`
   */
  public get className(): string {
    return this.prefix + this.uuidGenerator()
  }

  /**
   * ## 定义样式
   *
   * @remarks
   * 注意：仅支持`class`选择器，可以附带伪类选择器(`.className:hover`)、属性选择器(`.className[attr=value]`)。
   *
   * 在组件作用域中构建的样式，在组件销毁时，会自动删除样式。
   *
   * @param {CssStyle|Reactive<CssStyle>} style - 样式对象，支持响应式对象
   * @param {string} [selector] - 自定义css选择器，通常用于支持伪类选择器
   * @returns {string} - 如果传入了自定义的选择器，则返回的是自定义选择器的`className`，否则会生成一个随机且唯一的`className`。
   */
  public define(style: CssStyle | Reactive<CssStyle>, selector: string = ''): string {
    if (!isRecordObject(style)) throw new TypeError(`CssInJs:style must be a record object`)
    const cssRule = this.cssMapToCssRule(style, selector)
    // 判断是否存在相同样式，是则更新样式
    const oldRule = this.styleMaps.get(cssRule.selectorText)
    // 如果存在旧的规则，则更新样式
    if (oldRule) {
      // 规则不相同则更新样式
      if (oldRule !== cssRule.style) {
        this.replaceCssRule(cssRule.style, cssRule.selectorText)
      }
      return cssRule.name
    }
    // 插入样式
    this.styleSheet.insertRule(cssRule.style, this.styleSheet.cssRules.length)
    // 响应式样式处理
    if (isReactive(style)) {
      // 监听样式变化
      const listener = watch(style, () => {
        // 替换新的规则
        this.replaceCssRule(
          this.cssMapToRuleStyle(style, cssRule.selectorText),
          cssRule.selectorText
        )
      })
      // 添加到监听列表
      this.watchMaps.set(cssRule.selectorText, listener)
    }
    // 获取作用域
    const scope = getCurrentScope()
    const vnode = getCurrentVNode()
    // 如果存在于作用域上下文中，则在作用域销毁时，删除作用域下所有样式
    if (scope && vnode && vnode.instance) {
      // 添加到作用域映射表
      if (!this.scopeMaps.has(scope)) {
        const set = new Set<string>()
        this.scopeMaps.set(scope, set)
        scope.onDestroyed(() => {
          if (vnode.instance!['renderer'].state === 'uninstalling') {
            set.forEach((selector) => {
              this.deleteRule(selector)
            })
            set.clear()
            this.scopeMaps.delete(scope)
          }
        })
      }
      this.scopeMaps.get(scope)!.add(cssRule.selectorText)
    }
    // 存储样式
    this.styleMaps.set(cssRule.selectorText, cssRule.style)
    // 返回className
    return cssRule.name
  }

  /**
   * ## 定义响应式动态样式
   *
   * 此方法与define方法类似，但返回的是`DynamicCssRule`对象，可以通过 `style` 修改样式
   *
   * @param {CssStyle} style - 样式对象，支持响应式对象
   * @param {string} [selector] - 自定义css选择器，通常用于支持伪类选择器
   * @returns {DynamicCssRule} - `DynamicCssRule`对象
   */
  public dynamic(style: CssStyle, selector: string = ''): DynamicCssRule {
    if (!isRecordObject(style)) throw new TypeError(`CssInJs:style must be a record object`)
    if (!isReactive(style)) style = reactive(style)
    const name = this.define(style, selector)
    const dynamic: DynamicCssRule = {
      name,
      style: style as Reactive<CssStyle>
    }
    Object.defineProperty(dynamic, 'toString', {
      value(): string {
        return this.name
      }
    })
    return dynamic
  }

  /**
   * 样式转字符串
   *
   * @param {CssStyle} cssStyleMap - 样式对象
   * @param {string} selector - css选择器
   * @private
   */
  private cssMapToCssRule(cssStyleMap: CssStyle, selector: string): CssRule {
    const { name, selectorText } = this.parseSelector(selector)
    const style = this.cssMapToRuleStyle(cssStyleMap, selectorText)
    return {
      name,
      style,
      selectorText
    }
  }

  /**
   * 样式转字符串
   *
   * @param {CssStyle} cssStyleMap - 样式对象
   * @param {string} selectorText - 选择器文本
   * @private
   */
  private cssMapToRuleStyle(cssStyleMap: CssStyle, selectorText: string) {
    const rule = Object.entries(cssStyleMap)
      .map(([key, value]) => {
        // 将驼峰命名转换为短横线命名
        const kebabKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
        return `${kebabKey}: ${String(value)};`
      })
      .join('')
    return `${selectorText}{${rule}}`
  }

  /**
   * 替换规则
   *
   * @param {string} style - 完整的样式字符串，包含选择器
   * @param {string} selectorText - 选择器文本，在不支持`replaceSync`的浏览器中，会先删除旧的规则，再插入新的规则。
   * @private
   */
  private replaceCssRule(style: string, selectorText: string) {
    // 替换样式映射表
    this.styleMaps.set(selectorText, style)
    if (this.supportedReplaceRule) {
      this.styleSheet.replaceSync(style)
    } else {
      // 删除规则
      this.deleteRule(selectorText)
      // 插入新的规则
      this.styleSheet.insertRule(style, this.styleSheet.cssRules.length)
    }
  }

  /**
   * 获取样式表长度
   *
   * @returns {number} - 样式表长度
   */
  public get length(): number {
    return this.styleSheet.cssRules.length
  }

  /**
   * 获取样式表
   *
   * 不要直接操作 `CSSStyleSheet` 对象，可能会导致样式异常。
   *
   * @returns {CSSStyleSheet} - 样式表
   */
  public get sheet(): CSSStyleSheet {
    return this.styleSheet
  }

  /**
   * 解析选择器
   *
   * @param {string} selector - 选择器
   * @returns {{name: string, selectorText: string}} 返回一个对象，包含name和selectorText
   * @private
   */
  private parseSelector(selector: string): Omit<CssRule, 'style'> {
    // 去除前后空格
    selector = selector.trim()

    // 如果选择器为空，生成默认的类名
    if (!selector) {
      // 生成随机的类名
      const name = this.className
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

  /**
   * 删除规则
   *
   * 通常无需调用此方法删除规则，在组件创建过程中定义的样式会在组件销毁时自动删除。
   *
   * @remarks
   * 注意：`selector`参数必须是完整的选择器，包含伪类和属性选择部分！
   *
   * @param {string} selector - 完整的选择器，包含伪类和属性选择部分！
   */
  public deleteRule(selector: string): void {
    selector = selector.trim()
    if (!selector.startsWith('.')) selector = `.${selector}`
    // 没有映射规则，停止执行
    if (!this.styleMaps.has(selector)) return
    // 从样式映射表中删除
    this.styleMaps.delete(selector)
    // 判断是否存在监听器，存在则删除
    if (this.watchMaps.has(selector)) {
      this.watchMaps.get(selector)!.destroy()
      this.watchMaps.delete(selector)
    }
    for (let i = this.styleSheet.cssRules.length - 1; i >= 0; i--) {
      const rule = this.styleSheet.cssRules[i]
      // 检查是否是样式规则 (CSSStyleRule)
      if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
        this.styleSheet.deleteRule(i)
        return
      }
    }
  }

  /**
   * 单实例
   *
   * @private
   */
  private static instance: CssInJs | null = null

  /**
   * 单例模式工厂方法
   *
   * @param {string} [prefix] - 前缀，仅在第一次调用此方法时有效。
   * @returns {CssInJs} 返回CssInJs实例
   */
  static factory(prefix: string = ''): CssInJs {
    // 如果实例不存在，则创建一个新的实例并返回
    if (!this.instance) this.instance = new CssInJs(prefix)
    // 返回单例实例
    return this.instance
  }
}

/**
 * ## 定义样式
 *
 * @remarks
 * 注意：仅支持`class`选择器，可以附带伪类选择器(`.className:hover`)、属性选择器(`.className[attr=value]`)。
 *
 * 在组件作用域中构建的样式，在组件销毁时，会自动删除样式。
 *
 * @param {CssStyle|Reactive<CssStyle>} style - 样式对象，支持响应式对象
 * @param {string} [selector] - 自定义css选择器，通常用于支持伪类选择器
 * @returns {string} - 如果传入了自定义的选择器，则返回的是自定义选择器的`className`，否则会生成一个随机且唯一的`className`。
 * @see {@linkcode CssInJs.define}
 */
export function define(style: CssStyle | Reactive<CssStyle>, selector: string = ''): string {
  return CssInJs.factory().define(style, selector)
}

/**
 * ## 定义响应式动态样式
 *
 * 此方法与define方法类似，但返回的是`DynamicCssRule`对象，可以通过 `style` 修改样式
 *
 * @param {CssStyle} style - 样式对象，支持响应式对象
 * @param {string} [selector] - 自定义css选择器，通常用于支持伪类选择器
 * @returns {DynamicCssRule} - `DynamicCssRule`对象
 * @see {@linkcode CssInJs.dynamic}
 */
export function dynamic(style: CssStyle, selector: string = ''): DynamicCssRule {
  return CssInJs.factory().dynamic(style, selector)
}

/**
 * ## 删除样式
 *
 * @param {string} selector - 完整的选择器，包含伪类和属性选择部分！
 * @see {@linkcode CssInJs.deleteRule}
 */
export function deleteRule(selector: string): void {
  CssInJs.factory().deleteRule(selector)
}

/**
 * ## 创建一个唯一的 `className`
 *
 * @returns {string} 返回唯一的 `className`
 * @see {@linkcode CssInJs.className}
 */
export function makeCssClassName(): string {
  return CssInJs.factory().className
}

/**
 * 获取 `CssInJs` 单例
 *
 * @param {string} [prefix] - 前缀，仅在第一次调用时有效。
 * @returns {CssInJs} 返回 `CssInJs` 实例
 * @see {@linkcode CssInJs.factory}
 */
export function cssInJs(prefix: string = ''): CssInJs {
  return CssInJs.factory(prefix)
}
