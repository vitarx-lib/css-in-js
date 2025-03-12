import {
  createElement,
  type Element,
  isRecordObject,
  simple,
  type SimpleWidget,
  Widget
} from 'vitarx'
import CssInJs, { type CssStyle, type Screen } from './css-in-js.js'
import { isValidName } from './utils.js'

// html标签
export type HTMLTags = keyof JSX.IntrinsicElements
// html标签的属性
export type HTMLProps<T extends HTMLTags> = JSX.IntrinsicElements[T]
// 媒体查询的css样式
export type MediaScreenCss<T = CssStyle> = {
  [key in Screen]?: T
}

export type StyledProps<T extends HTMLTags = 'div'> = HTMLProps<T> & {
  /**
   * css样式，
   *
   * 与全局的`style`属性类似，但它不会添加到元素的style样式表中，
   * 而是为其构造一条css规则，并把css的类名添加到`class`中。
   */
  css?: CssStyle
  /**
   * 媒体查询的css样式
   *
   * 支持 `xs`：手机端样式, `sm`：小平板样式, `md`：大平板样式, `lg`：笔记本样式, `xl`：桌面显示器样式，五个断点预设。
   *
   * @example
   * <Styled.div cssIn={{ xs: { fontSize: '20px' }, xl: { fontSize: '32px' } }}>
   */
  cssIn?: MediaScreenCss
  /**
   * 唯一的`className`名称。
   *
   * 多个元素可以使用同一个`forCss`来使其共享同一组CSS样式规则。
   *
   * > 注意：如果使用了`forCss`来共享样式，样式相对来说是静态的，不会因为下一次重新定义而更新样式，
   * 但它同样支持响应式样式规则的自动更新，只要你传入的css规则是响应式代理对象，则会在第一次定义该样式时开始监听变化自动更新样式。
   */
  forCss?: string
  /**
   * html元素标签
   *
   * 如果你使用的是`Styled.div`组件集合，则无需传入，div就代表tag属性。
   *
   * @default 'div'
   */
  tag?: T
}

/**
 * html元素组件集合
 */
type HTMLWidgets = {
  /**
   * HTML标准元素
   *
   * 额外的样式属性 {@linkcode StyledProps}
   */
  [K in HTMLTags]: SimpleWidget<StyledProps<K>>
} & {
  Widget: typeof StyledWidget
}

type StyledSimpleWidgetProps<T extends HTMLTags = HTMLTags> = MakeRequired<StyledProps<T>, 'forCss'>

/**
 * 定义样式
 *
 * @param css
 * @param cssIn
 * @param className
 * @param readonly
 */
function defineStyles(
  css: StyledProps['css'],
  cssIn: StyledProps['cssIn'],
  className: string,
  readonly = false
): void {
  const cssInJs = CssInJs.instance({ prefix: 'styled-' })
  if (isRecordObject(css)) {
    cssInJs.define(css, { selector: className, readonly })
  }
  if (isRecordObject(cssIn)) {
    const screens = Object.keys(cssIn) as Screen[]
    for (const screen of screens) {
      if (CssInJs.mediaScreenTags.includes(screen)) {
        const styleRule = cssIn[screen]
        if (isRecordObject(styleRule)) {
          cssInJs.define(styleRule, { selector: className, screen, readonly })
        }
      }
    }
  }
}

/**
 * 无状态样式组件，forCss必填！
 *
 * 使用简单组件定义，优化性能，减少内存占用。
 */
export const StyledSimpleWidget = simple(
  ({ tag, css, forCss, cssIn, children, ...props }: StyledSimpleWidgetProps) => {
    defineStyles(css, cssIn, forCss, true)
    tag = typeof tag === 'string' ? tag : 'div'
    return createElement(tag, { 'v-bind': props, className: forCss, children })
  }
)

/**
 * 样式小部件
 *
 * 所有的样式都是跟随小部件生命周期的，小部件实例销毁时样式也随之销毁。
 */
export class StyledWidget extends Widget<StyledProps> {
  // 排除继承属性，其他属性都会被继承给根元素
  static readonly excludeInheritProps = ['tag', 'forCss', 'css', 'cssIn']
  // 样式类名
  public readonly className: string

  constructor(props: StyledProps) {
    super(props)

    if ('tag' in props && typeof props.tag !== 'string') {
      throw new TypeError(`StyledWidget: tag must be a string`)
    }

    let readonly = false
    if (typeof props.forCss === 'string' && props.forCss.trim().length) {
      this.className = props.forCss.trim()
      readonly = true
    } else {
      this.className = CssInJs.instance({ prefix: 'styled-' }).className()
    }
    defineStyles(props.css, props.cssIn, this.className, readonly)
  }

  get tag(): HTMLTags {
    return this.props.tag || 'div'
  }

  protected build(): Element {
    return createElement(this.tag, {
      className: this.className,
      children: this.children,
      'v-bind': [this.props, StyledWidget.excludeInheritProps]
    })
  }
}

/**
 * 样式组件集合
 *
 * 支持所有 HTML 元素，另外支持 `Styled.Widget`强制使用`StyledWidget`类组件，它会让样式在组件销毁时删除样式。
 *
 * 如果给HTML元素传入`forCss="xxx"`则会直接使用{@linkcode StyledSimpleWidget}来优化性能，否则使用{@linkcode StyledWidget}类组件来管理样式，随生命周期销毁。
 *
 * @example
 * <Styled.div css={{ color: 'red' }}>Hello Vitarx CssInJs<Styled.div/>
 * // 媒介屏幕适配
 * <Styled.div cssIn={{ xs: { fontSize: '20px' }, xl: { fontSize: '32px' } }}>Hello Vitarx CssInJs<Styled.div/>
 */
export const Styled = new Proxy({} as HTMLWidgets, {
  get(_target, prop: string) {
    if (prop === 'Widget') return StyledWidget
    if (typeof prop !== 'string') prop = 'div'
    return simple((props: Omit<StyledProps, 'tag'>) => {
      props = Object.assign(props, { tag: prop })
      if (isValidName(props.forCss)) {
        return StyledSimpleWidget(props as StyledSimpleWidgetProps)
      } else {
        return createElement(StyledWidget, props)
      }
    })
  }
})
