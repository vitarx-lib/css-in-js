# CssInJs 库文档

## 简介

`@vitarx/css-in-js` 是一个轻量级的 CSS-in-JS 库，旨在将 CSS 样式以 JavaScript 对象的方式在代码中定义，并提供自动管理和动态应用样式的功能。它支持响应式设计、媒体查询、动态样式、组件销毁时自动清理等特性。

## 安装
```shell
npm install @vitarx/css-in-js
```

## 特性

- 动态样式管理：根据组件生命周期自动删除样式。
- 响应式支持：内建媒介查询，支持不同屏幕尺寸的样式。
- 强大的选择器支持：支持自定义 CSS 选择器，兼容复杂的选择器类型。
- 全局与局部样式支持：可定义全局样式或与组件生命周期绑定的局部样式。
- 样式同步更改：支持使用`vitarx.Ref`、`vitarx.Computed`、`vitarx.Reactive` 等响应式对象定义样式，修改对象属性会自动更新样式。

## 示例

### 基本用法
```jsx
import CssInJs from '@vitarx/css-in-js'

// 实例化 CssInJs
const cssInJs = new CssInJs('my-')

// 在组件外部定义的样式是全局样式，不会随组件销毁自动删除
const rule = cssInJs.define({ color: 'red' })
// 生成的 `className` 可以直接用于 HTML 元素
const App = () => {
  return <div className={rule.name}>Hello World</div>
}
```

### 动态切换样式
```jsx
const Button = () => {
  // 组件销毁时会自动移除该样式
  const buttonCssRule = cssInJs.define({color: 'red'})
  const switchColor = () => {
    // 更改样式
    buttonCssRule.style.color = buttonCssRule.style.color === 'red' ? 'blue' : 'red'

    // 使用`setProperty`方法设置样式
    // @see https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleDeclaration/setProperty
    // buttonCssRule.style.setProperty('color', 'blue')

    // 删除样式
    // @see https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleDeclaration/removeProperty
    // buttonCssRule.style.removeProperty('color')
  }
  return <button className={buttonCssRule.name} onClick={switchColor}>切换颜色</button>
}
```

### 样式同步更改
```js
const Button = () => {
  // 用reactive创建一个响应式对象
  const style = reactive<CssStyle>({ color: 'red'})
  const className = cssInJs.defineNamed(style) // defineNamed和defin方法一样，只是返回值不同，返回的是name
  const switchColor = () => {
    // 更改响应式对象属性，会自动更新样式
    style.color = style.color === 'red' ? 'blue' : 'red'
  }
  return <button className={className} onClick={switchColor}>切换颜色</button>
}
```

### 自定义选择器
```js
// 使用自定义选择器
cssInJs.define({ color: 'red' }, '.my-class:hover')
```

### 响应式设计
```js
// 使用内建的媒体查询规则
cssInJs.define({ fontSize: '12px' }, {
  screen: 'xs'
})
```

### Styled小部件

```tsx
import { type CssStyle, Styled} from '@vitarx/css-in-js'

const Button = () => {
  const style: CssStyle = { color: 'red', fontSize: '16px', width: '180px', height: '40px' }
  const phoneStyle: CssStyle = { color: 'blue', fontSize: '12px' }
  // css定义样式，cssIn定义响应式样式，支持混合class，style，无冲突
  return (
    <Styled.button class="youer-button-css" css={style} cssIn={{xs:phoneStyle}} onClick={()=>console.log('按钮被点击了')}>
      按钮
    </Styled.button>
  )
}
```

## 性能优化
```jsx
const Card = () => {
  // 使用 selector 配置选择器，使其不重复创建样式。
  const rule = cssInJs.define({width:'100px', height:'100px'},{selector:'.my-card'})
  return <div class={rule.name}>卡片</div>
}
const App = () => {
  return (
    <div>{
      Array(100).fill(null).map(()=>(<Card />))
    }</div>
  )
}
```

## 配置
### 实例可选配置
```ts
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
```

### 规则可选配置
```ts
interface CssRuleOptions {
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
   screen?: keyof MediaScreenRule
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
```

## API
### 静态方法

- `instance(options?: CssInJsOption):CssInJs` 用于访问&初始化单例。
    1. `options`：和构造函数的参数一致，用于初始化单例。
- `makeClassName(prefix: string = ''): string` 生成唯一类名。
    1. `prefix`：类名前缀。
- `uuidGenerator(): string` 生成唯一id。
- `replaceRuleStyle(rule: CssStyleRule, style: CssStyleMap): void` 更新规则样式
    1. `rule`：define方法返回的规则。
    2. `style`: 样式对象
- `get mediaScreenTags()：keyof MediaScreenRule[]` 获取所有媒体查询断点标签。

### 动态方法/属性

- `define(style: CssStyle, options?: CssRuleOptions):CssStyleRule` 定义样式，返回样式规则。
   1. `style`：样式对象，支持响应式对象、计算属性、ref值代理对象。
   2. `options`：样式规则配置，支持选择器、前缀、适配屏幕、是否只读等配置。
- `defineNamed(style: CssStyle, options?: CssRuleOptions):string` 定义样式，返回样式规则类名，参数和`define`一致。
- `className(prefix?: string): string` 生成唯一类名，规则：`prefix`+`CssInJs.uuidGenerator()`。
- `get sheetStore()：CSSSheetStore` 获取样式表存储对象。
- `get prefix()：string` 获取前缀。


## 助手函数
- `defineCssRule`: 定义样式规则，返回`CssStyleRule`。
- `defineNamed`: 定义样式规则，返回样式规则类名。
- `defineCustomRule`: 定义自定义选择器规则，返回`CssStyleRule`。
- `makeClassName`：生成唯一类名。

## CssStyleRule对象接口声明
```ts
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
   * 需手动`listener?.destroy()`
   */
  listener?: Listener
  /**
   * 转换为字符串
   *
   * @returns {string} - 返回的是`name`
   */
  toString(): string
}
```
