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
    import { CssInJs,cssInJs } from '@vitarx/css-in-js'
    // 通过静态方法初始化单例
    CssInJs.factory('my-css-') // 'my-css-'是className前缀
    // 助手函数方式
    cssInJs('my-css-')
    ```
2. 使用
    ```tsx
    import { define, type CssStyle, dynamic } from '@vitarx/css-in-js'
    import { reactive } from 'vitarx'
    
    // 在非组件作用域中定义的样式属于全局样式，它不会被删除，也不会被重复定义。
    const container = define({
      width: '500px',
      height: '500px',
      backgroundColor: 'red',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    })
   
    // 在组件中定义动态样式
    function Dynamic1() {
      // 响应式对象定义样式
      const style = reactive<CssStyle>({
        color: 'red',
      })
      // 通过difine助手函数定义样式，也可以使用CssInJs.define方法
      const buttonStyle = define(style)
      const swtichColor = () => {
        // 修改响应式对象样式
        style.color = style.color === 'red' ? 'blue' : 'red'
      }
      return <div class={container}>
        <button class={buttonStyle} onclick={swtichColor}>切换按钮颜色</button>
      </div>
    }
   
    // 使用dynamic助手函数可以更便捷的定义动态样式
    function Dynamic2() {
      // 动态样式
      const buttonStyle = dynamic({
        color: 'blue',
      })
      const swtichColor = () => {
        // 修改动态样式
        dynamicStyle.style.color = dynamicStyle.style.color === 'red' ? 'blue' : 'red'
      }
      return <div class={container}>
        {/*注意了，这里需要使用.name来获取className*/}
        <button class={buttonStyle.name} onclick={swtichColor}>切换按钮颜色</button>
      </div>
    }
    ```
