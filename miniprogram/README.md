# daily1 微信小程序

## 工程选择

原生 JavaScript + WXML/WXSS，无运行时 npm 依赖。当前单页不需要框架或构建器；JavaScript 用 TypeScript `checkJs` 静态检查。`result-page.js` 通过 `SampleSource` 注入结果来源，正式页面使用 `sample-source.js` 的本地异步来源。

仅实现任务 01：daily1 四个英文标签、单选词义卡、切换和关闭。额外圆点、相册、引线、严格 anchor 校验、碰撞避让、错误恢复由后续任务实现。

## 导入运行

1. 安装微信开发者工具稳定版并完成登录。导入目录 **`F:\codexDemo\Annotation`（工程根目录）**，工具会读取 `project.config.json` 的 `miniprogramRoot`。
2. 本地演示配置为 `touristappid`，可在工具允许的测试号/游客模式下使用。若工具拒绝该模式，使用有权限的小程序 AppID；把个人配置存到已忽略的 `project.private.config.json`，不要提交账号配置。
3. 点击编译，入口为 `pages/result/index`。无需构建 npm、后端、网络域名或模型密钥。
4. 真机预览需具备有效 AppID、对应开发者权限、微信登录和设备扫码条件；游客模式与模拟器通过不代表真机通过。本次未进行上传、发布或真机验证。

## 页面级行为验收

在工程根目录运行（当前环境 Node 23.0.0 / npm 10.9.0）：

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run typecheck
```

`npm test` 使用 miniprogram-simulate + jsdom 装载真实页面 JS/WXML，触发标签 tap 和关闭，验证装载、单选、内容、切换、恢复颜色、同名对象独立身份和数据不变。替换来源的测试仍使用同一 WXML 和页面工厂。它属于页面行为模拟；不验证微信渲染器、图片解码、布局尺寸或真机触摸。

真实微信自动化入口（先在工具中开启服务端口）：

```powershell
& 'E:\soft\微信web开发者工具\cli.bat' auto --project 'F:\codexDemo\Annotation' --auto-port 9420
# 待工具打开并编译完成，在另一个终端运行：
npm.cmd run test:wechat
```

其他机器请替换 CLI 和项目的绝对路径。脚本默认连接 `ws://127.0.0.1:9420`，可通过 `WECHAT_WS` 更改。Node 23 下 automator.launch 直接启动 `.bat` 会失败，所以将 CLI 启动与 WebSocket 连接分开。脚本验证真实页面标签、词卡、关闭及图片 2:3 比例，截图保存到 `.artifacts/`。该入口不包含在默认模拟测试中，需要单独运行。

人工验收：完整看到原图；四标签默认白底彩字，逐个点击后同色底白字且仅一个选中；词卡对应原始英/中/解释；关闭后四标签恢复；确认无勾选图标和“更多词汇”。视觉和设备触摸仍需人工检查。

## 数据与位置

`assets/daily1.jpg` 与原 `images/daily1.jpg` 字节一致；`fixtures/daily1-v2.json` 与原 `results/daily/daily1-v2.json` 字节一致。小程序只读取副本，不改写对象。身份为样本 ID + 记录序号，同名英文不会合并，颜色在本次结果中稳定。

标签位置暂由历史 bbox 中心换算为百分比，图片使用 `widthFix` 等比完整显示；页面明确标出“位置尚未验证”。右侧贴边仅为基本防裁切，叉子引线及一般避让尚未实现。

## 本次验证记录（2026-10-30）

- 页面模拟测试：4/4 通过；静态类型检查通过。
- 安装的开发者工具版本：Stable 2.01.2510280。GUI 可看到项目选择页，但导入动作未得到成功确认。
- `cli.bat open --project ...` 与 `cli.bat islogin` 在连接端口 14487 时失败，完整错误：`× #initialize-error: wait IDE port timeout`。较早初始化还返回 `connect ECONNREFUSED 127.0.0.1:14487`。
- `miniprogram-automator.launch` 在 Node 23 直接启动 `.bat` 失败：`Error: Failed to launch wechat web devTools, please make sure cliPath is correctly specified`。验收脚本已改为连接模式，规避此启动方式。
- 连接模式执行 `npm.cmd run test:wechat` 返回：`Error: Failed connecting to ws://127.0.0.1:9420, check if target project window is opened with automation enabled`。
- 本次没有取得真实微信页面运行或截图证据，任务 01 保留待验收状态，不将模拟测试当成微信验证。
