## FileRelay

> [!NOTE]
> This project is in beta! If you need help self-hosting it or want to learn more, join the Discord server here: https://go.bestcodes.dev/discord

FileRelay is a peer-to-peer file sharing application that uses WebRTC technology to enable secure and direct file transfers between two devices. Files are never stored on a central server, ensuring privacy and security.
Since no data is stored on a central server, FileRelay is also 100% free, open-source, ad-free, and does not require any registration or login. There are (theoretically) no limits to the file size and amount of data you can share.

### Live Demo

You can test the app live at https://share.bestcodes.dev. **Try sharing between two browsers, two tabs, or two devices connected to the same WiFi network** for easy testing.

### Self-hosting

Fork this repo to deploy your own copy.

#### Coolify

If you're deploying using Coolify, I recommend using Nixpacks.

- Selecting "Port 1869" as the port number.
- Use `bun install --frozen-lockfile` as the install step, `bun run build` as the build step, and `bun run start` as the start step.
- Set the `VITE_BASE_URL=https://example.com` environment variable in your deployment configuration.
- Also set `LIGHTNING_ACCESS_CODE=******` in the environment variables.
