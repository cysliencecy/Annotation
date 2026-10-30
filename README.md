# 拍照学英语 · 识图验证

## 微信小程序当前进度

已实现 daily1 四标签、单选词义卡、切换和关闭，并按确认的原型修正页面。390px 与 375px 微信开发者工具验收已通过；尚未接入真实识别服务、相册选图或花束圆点探索，真机仍未验证。

- [小程序导入与运行说明](miniprogram/README.md)
- [原型与微信截图对照](.scratch/prototype-visual-fidelity/comparison.html)
- [视觉验收记录](.scratch/prototype-visual-fidelity/acceptance.md)
- [后续开发任务](.scratch/photo-exploration-frontend/ticket-plan.md)

以下内容保留离线模型验证的来源和操作方式；其中历史阶段描述不代表小程序当前交付状态。

当前项目用于离线检查视觉模型的识别名称及定位能力：此前测试使用 GLM-4.6V，food2、food4 后续使用 GLM-5.3-Flash。手动上传照片取得 JSON，再用 Python 在原图上绘制框和英文名称；模型输出是否正确仍需人工核对。

当前要构建的自用小程序范围见[最小 MVP 定义](docs/MVP定义.md)：相册选清晰日常物体照、自动调用 GLM-5.3-Flash、初始展开最多 5 个英文标签，其余已识别物体显示圆点；点圆点展开英文，再点标签查看词义，支持收起回圆点，不设“更多词汇”。识别总数上限待确认，现有日常提示词仍限制 5 个。它与本仓库的离线模型能力验证是两件事。

## 从哪里开始

| 场景 | 当前提示词 | 已确认规则 | 合并复测记录 |
| --- | --- | --- | --- |
| 食物（最多 5 类） | [提示词](docs/prompts/食物.md) | [规则](docs/rules/食物.md) | [复测记录](docs/reviews/食物.md) |
| 日常（现有离线提示词最多 5 类） | [提示词](docs/prompts/日常.md) | [规则](docs/rules/日常.md) | [复测记录](docs/reviews/日常.md) |
| 风景（最多 5 项） | [提示词](docs/prompts/风景.md) | [规则](docs/rules/风景.md) | [复测记录](docs/reviews/风景.md) |
| 鲜花（最多 10 种） | [提示词](docs/prompts/鲜花.md) | [规则](docs/rules/鲜花.md) | [复测记录](docs/reviews/鲜花.md) |

四类定位要求及当前 MVP 交互见[照片标签展示规则](docs/rules/标签展示.md)：包含 `anchor`、中心标签、小目标引线、碰撞避让、圆点展开及标签收起；MVP 的圆点探索方案已替代旧版“更多词汇”。四份当前提示词已要求返回 `anchor`；food2 至 food5 已有定向输出，其余仍待实测。回绘脚本可用 `--show-anchor` 画点并校验几何位置；小程序布局与真实识别服务尚未接通。

2026-10-28 已确认的交互可用浏览器打开[临时预览](prototypes/exploration-throwaway/index.html)体验：daily1 使用 4 项原始结果，花束样本使用 7 项演示额外圆点。花束不扩大日常 MVP 范围；临时预览不调用模型、不修改原始输出，历史 bbox 中心点也未因此得到验证。

## 目录约定

```text
images/             原始照片，保留现有文件名
results/            模型原始 JSON，按 food / daily / scenery / flowers 分类
outputs/            回绘图片，与 results 使用相同分组和文件主名
docs/prompts/       每类一份当前提示词，文件名不带版本号
docs/rules/         每类一份已确认规则与待确认项
docs/reviews/       每类一份汇总记录，包含结论、证据索引和逐图观察
visualize.py        坐标回绘脚本
CONTEXT.md          领域术语
.archive/           可恢复的本地旧资料，日常使用无需打开
```

食物、日常和鲜花当前提示词在原 v2 基础上增加 `anchor`；风景在唯一一轮旧提示词基础上增加 `anchor`。现有 JSON 与图片保留实际测试轮次后缀，避免把不同轮次的证据混在一起。

## 生成回绘

使用 Python 3.10 或更新版本，在根目录运行。下面的输出名称用于新建文件，脚本拒绝覆盖已存在的结果：

```powershell
python visualize.py images/food1.jpg results/food/food1-v2.json -o outputs/food/food1-check.png
```

本机默认 `python` 此前指向 Python 2.7，可以显式使用现有 Python 3：

```powershell
& 'C:/Users/18270/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' visualize.py images/food1.jpg results/food/food1-v2.json -o outputs/food/food1-check.png
```

字段及坐标约定见[可视化使用说明](docs/识图可视化使用说明.md)。脚本支持 `--label-position center --hide-boxes` 生成仅中心标签的静态预览，也支持 `--show-anchor` 标出模型给的指向点；默认仍在框上缘显示文字。浏览器临时预览可体验交互式标签，但不代表小程序功能已实现。

food2 至 food5 的 anchor 输出已保存并回绘，详见[食物复测记录](docs/reviews/食物.md)。[食物提示词](docs/prompts/食物.md)已修订为 anchor v2；GLM-4.6V 的 food4 米饭指向肉，确认使用同版提示词的 GLM-5.3-Flash 则指向碗沿，均未解决核心定位问题。这些食物测试不能证明模型定位可靠；自用 MVP 仍按已确认的完整标签布局构建，并如实呈现模型错误。参数、预处理等测试条件仍待补充。

## 后续如何保存

1. 每类提示词只维护当前文件；真正修改模型提示词时，在文件内记下新的版本标识，并在复测记录中对应记录。
2. 每次运行保存未修改的 JSON，再用同名 PNG 回绘。例如 `results/flowers/flower1-r3.json` 与 `outputs/flowers/flower1-r3.png`。同轮次不同重复调用使用独立编号，避免覆盖。
3. 直接在该类汇总记录追加本轮结论和证据链接，不再创建逐图 Markdown 文件。记录实际输入、模型、参数、提示词标识和时间；分别判断名称、双语一致性、定位、格式与显示。
4. 原图、原始输出与回绘需要保持对应。小样本能力验证不等于整体效果评估，也不代表用户需求已验证。

## 其他文档与历史恢复

[验证任务卡](docs/AI识图能力验证任务卡.docx)和[早期 PRD](docs/PRD.md)保留作背景资料；自用小程序第一版以[最小 MVP 定义](docs/MVP定义.md)为准。任务卡中的 GLM-4.6V-Flash 是测试前拟测型号；实际旧图测试使用 GLM-4.6V，food2、food4 后增 GLM-5.3-Flash 输出。

2026-10-21 的旧版和合并前原文保存在 `.archive/cleanup-20261021/`，迁移对应关系见[归档清单](.archive/cleanup-20261021/manifest.json)。本次没有永久删除；需要恢复时按清单的 `to` 找到文件，复制回 `from`，先检查是否与后续新文件重名。归档是本地备份，未纳入 Git。
