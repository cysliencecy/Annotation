# Issue tracker: Local Markdown

本项目使用本地 Markdown，不向外部任务系统发布。

- 每个 feature 一个目录：`.scratch/<feature>/`。
- 规格保存在 `spec.md`；开发任务一项一文件，放在 `issues/<NN>-<slug>.md`，不能合成一个任务大文件。
- 每份规格和任务开头使用 `Status:` 记录状态；已明确且可执行的内容使用 `ready-for-agent`。
- 草案使用 `draft`，完成使用 `done`；它们是文档或执行生命周期，不替代 triage 的五种角色。
- 开发任务用 `Blocked by:` 记录前置任务；依赖未完成时不要开始实现。
- 对话与补充记录追加到文末的 `Comments`。
- 技能要求“发布到任务系统”时，写入本地 feature 目录，不新建 GitHub 或其他外部 Issue。

状态词见 [Triage Labels](triage-labels.md)。
