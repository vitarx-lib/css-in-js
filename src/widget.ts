import {
  createElement,
  type Element,
  isRecordObject,
  simple,
  type SimpleWidget,
  Widget
} from 'vitarx'
import { CssInJs, type CssStyle, type Screen } from './css-in-js.js'

// html标签
export type HTMLTags = keyof JSX.IntrinsicElements
// html标签的属性
export type HTMLProps<T extends HTMLTags> = JSX.IntrinsicElements[T]
// 媒体查询的css样式
export type MediaScreenCss = {
  [key in Screen]?: CssStyle
}

export type StyledProps<T extends HTMLTags = 'div'> = HTMLProps<T> & {
  css?: CssStyle
  cssIn?: MediaScreenCss
  /**
   * 唯一的`className`名称。
   *
   * 多个元素可以使用同一个`forCss`来使其共享同一组CSS样式规则。
   */
  forCss?: string
  /**
   * html元素标签
   *
   * @default 'div'
   */
  tag?: T
}

/**
 * html元素组件集合
 */
type HTMLWidgets = {
  [K in HTMLTags]: SimpleWidget<StyledProps<K>>
} & {
  Widget: typeof StyledWidget
}

type StyledSimpleWidgetProps<T extends HTMLTags = HTMLTags> = MakeRequired<StyledProps<T>, 'forCss'>

// 样式组件
const StyledSimpleWidget = ({
  tag,
  css,
  forCss,
  cssIn,
  children,
  ...props
}: StyledSimpleWidgetProps) => {
  const only = true
  const className = String(forCss)!
  if (isRecordObject(css)) CssInJs.factory().define(css, { selector: className, only })
  if (isRecordObject(cssIn)) {
    for (const screen of CssInJs.mediaScreenTags) {
      if (screen in cssIn) {
        const styleRule = cssIn[screen]
        if (isRecordObject(styleRule)) {
          CssInJs.factory().define(styleRule, { selector: className, only, screen })
        }
      }
    }
  }
  return createElement(tag || 'div', { 'v-bind': props, className, children })
}
// 标记为简单simple组件
simple(StyledSimpleWidget)

/**
 * 样式组件集合
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
    return simple((props: any) => {
      props = Object.assign(props || {}, { tag: prop })
      if (props?.forCss) {
        return StyledSimpleWidget(Object.assign(props || {}, { tag: prop }))
      } else {
        return createElement(StyledWidget, props)
      }
    })
  }
})

/**
 * 样式小部件
 *
 * 所有的样式都是跟随小部件生命周期的，小部件实例销毁时样式也随之销毁。
 */
export class StyledWidget<T extends StyledProps = StyledProps> extends Widget<T> {
  // 排除继承属性，其他属性都会被继承给根元素
  static readonly excludeInheritProps = ['tag', 'forCss', 'css', 'cssIn']
  // 样式类名
  public readonly className: string

  constructor(props: T) {
    super(props)
    if ('tag' in props && typeof props.tag !== 'string') {
      throw new TypeError(`StyledWidget: tag must be a string`)
    }
    this.className = String(props.forCss) || CssInJs.factory().className()
    if (isRecordObject(props.css)) {
      CssInJs.factory().define(props.css, { selector: this.className })
    }
    if (isRecordObject(props.cssIn)) {
      for (const screen of CssInJs.mediaScreenTags) {
        if (screen in props.cssIn) {
          const styleRule = props.cssIn[screen]
          if (isRecordObject(styleRule)) {
            CssInJs.factory().define(styleRule, { selector: this.className, screen })
          }
        }
      }
    }
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
