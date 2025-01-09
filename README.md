# CssInJs

这是一个为[Vitarx框架](https://vitarx.cn)量身打造的CssInJs库，用于在 JS 中创建 CSS 。
______________________________________________________________________________

## 安装
```bash
npm install @vitarx/css-in-js
```

## 使用教程
1. 初始化单例
    ```ts
    // main.ts
    import { CssInJs } from '@vitarx/css-in-js'
    // 通过静态方法初始化单例
    CssInJs.factory({prefix:'my-css-'}) // 'my-css-'是className前缀
    ```
2. 使用
    ```tsx
    import { defineCssStyle, type CssStyle, defineDynamicCssStyle } from '@vitarx/css-in-js'
    import { reactive,onUnmounted } from 'vitarx' 
    
    // 在非组件作用域中定义的样式属于全局样式，它不会被删除，也不会被重复定义。
    const containerStyle = defineCssStyle({
      width: '500px',
      height: '500px',
      backgroundColor: 'red',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    })
   
    // 响应式的样式定义
    function ReactiveStyle() {
      const style = reactive<CssStyle>({
        color: 'red',
      })
      // 传入一个reactive定义的响应式对象，
      // define内部会自动监听响应式对象变化实时更新样式，
      // 且在组件销毁时它会自动移除
      const buttonStyle = defineCssStyle(style) // 还支持ref，computed定义的值代理对象。
      const swtichColor = () => {
        // 修改响应式对象样式
        style.color = style.color === 'red' ? 'blue' : 'red'
      }
      return <div class={containerStyle}>
        <button class={buttonStyle} onclick={swtichColor}>切换按钮颜色</button>
      </div>
    }
   
    // 动态样式定义，与响应式样式不同之处是它不会自动删除
    function DynamicStyle() {
      // 动态样式
      const buttonStyle = defineDynamicCssStyle({
        color: 'blue',
      })
      const swtichColor = () => {
        // 修改动态样式
        dynamicStyle.style.color = dynamicStyle.style.color === 'red' ? 'blue' : 'red'
      }
      onUnmounted(() => {
        // 在组件卸载时，移除动态样式
        buttonStyle.remove()
      })
      return <div class={containerStyle}>
        {/*注意了，这里需要使用.name来获取className*/}
        <button class={buttonStyle.name} onclick={swtichColor}>切换按钮颜色</button>
      </div>
    }
    ```
   
## 构造参数
```ts
interface CssInJsOptions {
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
/**
 * 屏幕尺寸断点规则
 */
interface MediaScreenRule {
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

## 规则可选配置
```ts
interface CssRuleOptions {
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
   screen?: keyof MediaScreenRule
   /**
    * 自定义前缀
    *
    * 会和实例化时传入的全局前缀拼接
    *
    * @default ''
    */
   prefix?: string
}
```
