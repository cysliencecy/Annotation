## Agent skills

### Issue tracker

本项目用本地 Markdown 跟踪规格和任务，位于 `.scratch/<feature>/`。见 [任务跟踪约定](docs/agents/issue-tracker.md)。

### Triage labels

采用默认的五种任务状态；规格与已拆好的开发任务直接使用 `ready-for-agent`。见 [状态词约定](docs/agents/triage-labels.md)。

### Domain docs

采用 single-context，阅读已有 `CONTEXT.md` 及相关架构决策。见 [领域文档约定](docs/agents/domain.md)。

### Visual acceptance

- 修改结果页时遵守[原型还原与视觉验收规格](.scratch/prototype-visual-fidelity/spec.md)，视觉基准优先于自行设计的样式。
- 功能测试与视觉验收分别记录。默认、选中、关闭恢复三态需在同一 CSS 视口下对照原型与微信截图；没有微信截图证据时，不宣称视觉验收完成。
- 字号、间距、颜色和组件形状须来自基准令牌。新增标题、改变布局或复制暂未实现的操作，先说明依据并更新偏差记录。
- 优先复用已保存的预览、截图和节点信息；Figma 仅补读指定节点。额度失败后记录工具和完整错误，不连续重试或扫描整个文件。
