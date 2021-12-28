# miniprogram-tailwind-windi-kit

> 一套完整的 **原生小程序** 接入/重构 到 **tailwind/windicss** 的方案, 支持**分包**及**高度自定义配置**

## 开始体验
```bash
npm i
# 通过demo体验
cd example
# watch project
npm run watch
```

## 描述
因为基于原生小程序，所以同样适用任何小程序框架最终生成的原生代码（后处理）
- [ ] 可以选择切换tailwind模式或windicss模式
- [ ] 小程序分包处理 + 公共样式提取（可配置场景：用户可以选择是否使用在分包场景；可配置样式表生成方案，例如主包一份/分包各自一份/独立分包一份/指定分包输出）
- [ ] 提供 value auto infer 的解决方案，即可以在 tailwind 模式下使用 h-[918px] 这样的动态值语法，而不必特别为此切换到 windicss
- [ ] 更细化的小程序专用预设，给你尽可能多的选择（例如：针对To B 和To C 有各自定制场景，To B侧重复用模板，To C侧重动态值）
- [ ] 提供demo + 配套的自动化重构工具
- [ ] 基于官方playground，写入自己的config

## 优点
- 基于原生，与小程序框架解耦，适用于所有全场景
- 基于 tailwind cli 和 windicss cli 上层封装，与 tailwind 和 windicss 源码解耦，所以能够同步升级最新版本
- 高度自定义（例如：将特性都做成用户可配置，例如样式库选择，分包输出策略，去重策略）
- 提供重构工具，快速改造项目

## 目录
```
├── lib
│ ├── processSubpackage.ts // 核心流程:按分包输出样式 + postcss插件提重
│ ├── accessWatch.ts       // watch & rebuild
├── presets           // 针对小程序场景的内置预设
│ ├── tailwindPreset  // tailwind 预设集
│ └── windiPrset      // windicss 预设集
├── customStyle       // 用户自定义原子类
│ ├──subpackageName   // 根据app.json的扫描得到的分包自动生成目录
├── postcssPlugin     // postcss 定制插件集
│   ├── autoInfer     // 动态值替换插件
│   └── extractCommon // 重复类提取插件
├── utils             // 工具集
│ ├── extractPlugin   // 用于提重的postcss插件
│ ├── refactHelper    // 自动重构工具
├── config.ts         // 用户配置文件(例如选择tail或windi/是否分包处理)
├── index.ts          // config.js 处理 & cli配置
└── example           // demo(自带分包+测试类)
```
## TODO
- [ ] 增强调试性

## 用户配置
