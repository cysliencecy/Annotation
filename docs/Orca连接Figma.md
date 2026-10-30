# 在 Orca 中连接 Figma

## 先弄清连接关系

Orca 是工作区，实际使用 Figma MCP 的是 Orca 中运行的智能体（例如 Codex 或 Claude Code）。Figma 的 MCP 地址是 `https://mcp.figma.com/mcp`；填入地址只完成服务器配置，还要在浏览器中授权 Figma 账号。

本项目已有 [`.mcp.json`](../.mcp.json)，其中写有该地址。这是 Claude Code 可使用的项目配置；**Orca 中的 Codex 不会因为这个文件存在就自动使用它**。

## 在 Orca 中使用 Codex

1. 打开 Orca 中的终端，运行：

   ```powershell
   codex mcp add figma --url https://mcp.figma.com/mcp
   ```

2. 按提示在浏览器中登录 Figma 并点击“允许访问”。如果刚换过账号，授权前先确认浏览器里登录的是**新 Figma 账号**。
3. 新开一个 Codex 会话。在对话中发送：

   > 请调用 Figma MCP 的 `whoami`，告诉我当前连接的 Figma 用户名。

4. 将返回的用户名与新账号核对。Orca 中显示“**MCP 1 connection**”只能说明有一个 MCP 连接，不能单凭这个数字确认它是 Figma，也不能确认账号。可以点开连接列表，检查名称是否为 `figma`。

如果返回旧账号，仅修改 MCP 地址或 `.mcp.json` 不会切换授权账号；需要在 Codex 的 Figma MCP 连接中重新授权，再次运行 `whoami` 核对。

## 如果 Orca 中运行的是 Claude Code

本项目的 `.mcp.json` 已写入 Figma 地址。新开 Claude Code 会话，输入 `/mcp`，选择 Figma → **Authenticate**，在浏览器里用目标账号授权。授权后再输入 `/mcp` 检查连接状态。

## 容易混淆的一点

在另一个聊天客户端调用 `whoami`，检查的是**那个客户端自己的 Figma 连接**，不能代替 Orca 中的检查。此前本聊天会话返回过用户名 `chenyu`，这不能证明 Orca 已切换到新账号。

参考：[Figma 官方远程 MCP 连接指南](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)。
