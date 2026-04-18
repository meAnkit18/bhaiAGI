---

### Installation

```bash
# Build from source
cd /path/to/bhaiagi
bun install
bun run build

# Run from source
bun run dev
```

### Installation Directory

The install script respects the following priority order for the installation path:

1. `$BHAIAGI_INSTALL_DIR` - Custom installation directory
2. `$XDG_BIN_DIR` - XDG Base Directory Specification compliant path
3. `$HOME/bin` - Standard user binary directory (if it exists or can be created)
4. `$HOME/.bhaiagi/bin` - Default fallback

```bash
# Examples
BHAIAGI_INSTALL_DIR=/usr/local/bin ./install --binary /path/to/bhaiagi
XDG_BIN_DIR=$HOME/.local/bin ./install --binary /path/to/bhaiagi
```

### Agents

bhaiagi includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Learn more about [agents](https://bhaiagi.ai/docs/agents).

### Documentation

For more info on how to configure bhaiagi, [**head over to our docs**](https://bhaiagi.ai/docs).

### Contributing

If you're interested in contributing to bhaiagi, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

### Building on bhaiagi

If you are working on a project that's related to bhaiagi and is using "bhaiagi" as part of its name, for example "bhaiagi-dashboard" or "bhaiagi-mobile", please add a note to your README to clarify that it is not built by the bhaiagi team and is not affiliated with us in any way.

### FAQ

#### How is this different from Claude Code?

It's very similar to Claude Code in terms of capability. Here are the key differences:

- 100% open source
- Not coupled to any provider. bhaiagi can be used with Claude, OpenAI, Google, or even local models. As models evolve, the gaps between them will close and pricing will drop, so being provider-agnostic is important.
- Out-of-the-box LSP support
- A focus on TUI. bhaiagi is built for terminal users; we are going to push the limits of what's possible in the terminal.
- A client/server architecture. This, for example, can allow bhaiagi to run on your computer while you drive it remotely from a mobile app, meaning that the TUI frontend is just one of the possible clients.

---
