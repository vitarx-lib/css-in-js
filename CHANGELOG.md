## [3.0.5](https://github.com/vitarx-lib/css-in-js/compare/v3.0.4...v3.0.5) (2025-09-25)


### Bug Fixes

* **css-in-js:** 修复样式属性类型转换问题 ([cdc6ad5](https://github.com/vitarx-lib/css-in-js/commit/cdc6ad57312dcc3d0e54cedbed09b9b457ed5b01))
* **utils:** 修复样式键格式化函数 ([327d851](https://github.com/vitarx-lib/css-in-js/commit/327d8517b7977482488eae0c657434520af1ad42))
* **widget:** 在构造函数中添加watchEffect修复css属性变化样式未更新问题 ([a4fcb6c](https://github.com/vitarx-lib/css-in-js/commit/a4fcb6cac8dec12575094d195f69f126344b7d12))



## [3.0.3](https://github.com/vitarx-lib/css-in-js/compare/v3.0.2...v3.0.3) (2025-09-18)


### Features

* **css-in-js:** 为 makeClassName 方法添加分隔符 ([65fed0a](https://github.com/vitarx-lib/css-in-js/commit/65fed0ae009b744c60425986a23c83e0f3adfe50))



## [3.0.2](https://github.com/vitarx-lib/css-in-js/compare/v3.0.1...v3.0.2) (2025-09-12)



## [3.0.1](https://github.com/vitarx-lib/css-in-js/compare/v3.0.0...v3.0.1) (2025-09-08)


### Bug Fixes

* **css-in-js:** 修复配置不生效问题 ([67a5527](https://github.com/vitarx-lib/css-in-js/commit/67a552777a0a1575341412b52a56e5f3ea0d801b))



# [3.0.0](https://github.com/vitarx-lib/css-in-js/compare/v1.1.0...v3.0.0) (2025-09-06)


### Bug Fixes

* **css-in-js:** 修复已插入样式表的保留问题 ([d31e163](https://github.com/vitarx-lib/css-in-js/commit/d31e16365a0f693a089cf8f528c18abdf94510f0))
* **css-in-js:** 修复替换样式无效BUG ([d938e33](https://github.com/vitarx-lib/css-in-js/commit/d938e33806f7f8b892f5d83cf98fdb55dcbbbccb))
* **widget:** 修复样式绑定BUG ([98ce75a](https://github.com/vitarx-lib/css-in-js/commit/98ce75af3fd1b994239affda703fd6ba237dcffe))


### Features

* **core:** 添加 sheetStore 属性 ([25ef731](https://github.com/vitarx-lib/css-in-js/commit/25ef7311644ef4b8117643e894ef95c50eb459ff))
* **css-in-js:** 优化媒体查询并添加样式配置选项 ([6daa1c4](https://github.com/vitarx-lib/css-in-js/commit/6daa1c4d6e3db6128cedac08bdd56e965f1b6cb5))
* **css-in-js:** 优化样式管理和性能 ([cb094cf](https://github.com/vitarx-lib/css-in-js/commit/cb094cfb41bc206cdf20558d4d9797128a21c58e))
* **css-in-js:** 优化静态 CSS 规则管理 ([76bf2c2](https://github.com/vitarx-lib/css-in-js/commit/76bf2c29349bd5704fdc439c3746305f5b167d72))
* **css-in-js:** 增强样式对象支持并优化 API ([645845e](https://github.com/vitarx-lib/css-in-js/commit/645845e428c7c71b7f41047f9e33b498471245a9))
* **css-in-js:** 新增 CssInJs 库实现 css-in-js 功能 ([be9a6ae](https://github.com/vitarx-lib/css-in-js/commit/be9a6aee25cfa0ad70bc0af21ef6168c686f324b))
* **css-in-js:** 更新媒体查询规则以匹配常见设备尺寸 ([2875c2e](https://github.com/vitarx-lib/css-in-js/commit/2875c2e98bef8cab0990efd1ec94965997cf72eb))
* **css-in-js:** 更新屏幕尺寸断点预设规则注释 ([093839f](https://github.com/vitarx-lib/css-in-js/commit/093839fa0d2a0c9b0e78f8fb2c9c74d4cef2deee))
* **css-in-js:** 添加自定义前缀功能 ([97ec2fe](https://github.com/vitarx-lib/css-in-js/commit/97ec2fe3def69e44c967b53fd94d90ee293b6be2))
* **css-in-js:** 添加自定义选择器规则定义功能 ([e79f87d](https://github.com/vitarx-lib/css-in-js/commit/e79f87d6c560dd59e3596a690b7464373d23c27e))
* **css-in-js:** 重构 CSS 规则定义和管理 ([8a6a035](https://github.com/vitarx-lib/css-in-js/commit/8a6a0351f2bf726188eb5886b4dc6d563ff256af))
* **css-in-js:** 重构并新增功能 ([9efe3ca](https://github.com/vitarx-lib/css-in-js/commit/9efe3caad9cbe5ee63674e25d7114f2c55535f4e))
* **export:** 导出 CssInJs 默认模块 ([17cfc69](https://github.com/vitarx-lib/css-in-js/commit/17cfc6961757a77e56a60262a391faa494558adb))
* **helper:** 新增 CSS-in-JS 辅助函数 ([87f10d9](https://github.com/vitarx-lib/css-in-js/commit/87f10d9c8a9bf0a7c1055411f2122cdea8d48db0))
* **helper:** 添加自定义选择器规则助手函数 ([b312b15](https://github.com/vitarx-lib/css-in-js/commit/b312b15383feb502557d2d689d06af6b7d774214))
* **README:** 添加 `only` 选项的说明 ([9fe415b](https://github.com/vitarx-lib/css-in-js/commit/9fe415bd9e94e4cb67806dd25446327a3dccc44a))
* **utils:** 优化样式处理功能 ([aebe215](https://github.com/vitarx-lib/css-in-js/commit/aebe2153250ee738bde3bec6b520a2925617532b))
* **utils:** 添加 isValidName 函数并更新导出 ([7ecf02c](https://github.com/vitarx-lib/css-in-js/commit/7ecf02cc33d0b317f172c48afc895e94ce1d19d5))
* **utils:** 添加样式对象转 CSS 字符串的工具函数 ([4dda39d](https://github.com/vitarx-lib/css-in-js/commit/4dda39d7870618c474507cc9ad4da526849b9ec7))
* **widget:** 优化 Styled 组件并添加文档注释 ([b2a0efa](https://github.com/vitarx-lib/css-in-js/commit/b2a0efa539d9d99267078bc419200d81d0dc37fe))
* **widget:** 添加 styled 组件前缀 ([403af73](https://github.com/vitarx-lib/css-in-js/commit/403af73a9dcc6ddf1a92e7117adbc648da0eeafc))
* **widget:** 添加样式组件和小部件 ([4733237](https://github.com/vitarx-lib/css-in-js/commit/47332370ae2a6d4317a2c721d78b6c9fe4e50dad))
* 添加 utils.js 的导出 ([c5b3647](https://github.com/vitarx-lib/css-in-js/commit/c5b3647c4f64f2f689ad0366f534811946a6f59b))


### Performance Improvements

* **css-in-js:** 优化样式规则的插入逻辑 ([7d1d7f8](https://github.com/vitarx-lib/css-in-js/commit/7d1d7f8859f222a131e1779f80b11691e3f787b2))
* **utils:** 优化 cssMapToRuleStyle 函数性能并添加样式过滤 ([6520905](https://github.com/vitarx-lib/css-in-js/commit/6520905b9b202d62b9680f92e9ab447283d59aa8))
* **utils:** 优化 CSSStyleSheet支持性检测 ([4de1285](https://github.com/vitarx-lib/css-in-js/commit/4de128526a4847b20a2ac8253fa1959626f73837))



