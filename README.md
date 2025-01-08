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
    CssInJs.factory('my-css-') // 'my-css-'是className前缀
    ```
2. 使用
    ```tsx
    import { define, type CssStyle, dynamic } from '@vitarx/css-in-js'
    import { reactive,onUnmounted } from 'vitarx' 
    
    // 在非组件作用域中定义的样式属于全局样式，它不会被删除，也不会被重复定义。
    const containerStyle = define({
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
      const buttonStyle = define(style) // 还支持ref，computed定义的值代理对象。
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
      const buttonStyle = dynamic({
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
