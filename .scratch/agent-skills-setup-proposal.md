# 开发技能配置提案

Status: done
Date: 2026-10-29

用户已于 2026-10-29 回复“同意”，确认下述提案。正式配置已写入 [AGENTS.md](../AGENTS.md)、[任务跟踪](../docs/agents/issue-tracker.md)、[状态词](../docs/agents/triage-labels.md)和[领域文档](../docs/agents/domain.md)。本文保留原提案内容，作为确认记录；后续修改以正式配置为准。

提案时仓库没有远端地址、任务跟踪约定、AGENTS.md 或 CLAUDE.md；已有单一领域术语文件 CONTEXT.md，没有发现 ADR 或多包工程。

## 推荐方案

- 用本地 Markdown 保存规格和任务，适合目前的自用、无远端项目；不新建外部服务或发布外部 Issue。
- 新建 AGENTS.md，让后续 AI 开发技能知道从哪里读规格、任务和领域规则；若更希望使用 CLAUDE.md，可在确认时替换。
- 保留默认状态词 needs-triage、needs-info、ready-for-agent、ready-for-human、wontfix。本次规格确认后直接使用 ready-for-agent，不额外走 triage。
- 沿用单上下文：已有 CONTEXT.md，架构决策按需要记录；不提前创建空 ADR。

## AGENTS.md 草案

```markdown
## Agent skills

### Issue tracker

本项目用本地 Markdown 跟踪规格和任务，位于 .scratch/<feature>/。见 docs/agents/issue-tracker.md。

### Triage labels

采用默认的五种任务状态；规格与已拆好的开发任务直接使用 ready-for-agent。见 docs/agents/triage-labels.md。

### Domain docs

采用 single-context，阅读已有 CONTEXT.md 及相关架构决策。见 docs/agents/domain.md。
```

## docs/agents/issue-tracker.md 草案

```markdown
# Issue tracker: Local Markdown

本项目使用本地 Markdown，不向外部任务系统发布。

- 每个 feature 一个目录：.scratch/<feature>/。
- 规格保存在 spec.md；开发任务一项一文件，放在 issues/<NN>-<slug>.md，不能合成一个任务大文件。
- 每份规格和任务开头使用 Status: 记录状态；已明确且可执行的内容使用 ready-for-agent。
- 草案使用 draft，完成使用 done；它们是文档或执行生命周期，不替代 triage 的五种角色。
- 开发任务用 Blocked by: 记录前置任务；依赖未完成时不要开始实现。
- 对话与补充记录追加到文末的 Comments。
- 技能要求“发布到任务系统”时，写入本地 feature 目录，不新建 GitHub 或其他外部 Issue。
```

## docs/agents/triage-labels.md 草案

```markdown
# Triage Labels

| Role | 本地状态 | 含义 |
| --- | --- | --- |
| needs-triage | needs-triage | 待评估原始请求。 |
| needs-info | needs-info | 等待补充信息。 |
| ready-for-agent | ready-for-agent | 规格明确，可交给开发代理。 |
| ready-for-human | ready-for-human | 需要人工实现或处理。 |
| wontfix | wontfix | 当前不实施。 |

to-spec 和 to-tickets 的就绪产物直接标记 ready-for-agent，不再走原始请求 triage。
```

## docs/agents/domain.md 草案

```markdown
# Domain Docs

本项目采用 single-context。

- 探索前阅读根目录 CONTEXT.md，使用其中的领域术语。
- 如有相关的 docs/adr/ 决策，阅读并遵守；不存在则继续，不提前搭建空目录。
- 当前小程序产品范围以 docs/MVP定义.md 为准，标签交互以 docs/rules/标签展示.md 为准。
- 早期 PRD、离线回绘能力和历史模型输出不能替代当前产品范围或证明模型能力。
- 遇到领域术语缺口或与既有决策冲突，明确记录，必要时通过 domain-modeling 处理。
```

## 一并确认的测试边界

建议通过结果页的用户操作验收：给页面照片和对应的受控结果，点击圆点、英文、关闭、收起、重试和换图，观察标签、卡片与提示。识别来源和微信相册作为外部边界替代或人工检查，不逐个测试私有渲染函数。

以上草案已确认并写入正式配置，[照片探索前端规格](photo-exploration-frontend/spec.md)已标为 ready-for-agent。当前阶段不编写产品代码、不创建开发任务。
