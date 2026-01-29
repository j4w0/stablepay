---
applyTo: '**/*.ts, **/*.js, **/package.json, **/*.tsx, **/*.jsx'
---

# General Rules for JavaScript/TypeScript Projects

- Do not add any extra dependencies, if necessary, propose and discuss.
- Use `bun` as the package manager.
- Utilize `packages/common` for shared configs, types, and utilities across different packages, note that do not put component/view specific logic there. For platform-specific logic, please put them in the respective app package.
- For imports of interfaces, types, please ensure use `import {type XXX} from '...'` syntax or `import type {XXX} from '...'` syntax
- Utilize Effect.TS for better code!!!! PLEASE USE EFFECT.TS WHEREVER POSSIBLE!!! use this: https://effect.website/llms.txt

# General Infomation for the project

- This is a project intended to build a multi-platform crypto gasless payment solution with smart wallet. It contains payer client, merchant client, and api server.
- packages under `apps` directory are applications targeting different platforms (e.g., web, native).
- Let's focus on the web client first.
- Runtimes:
  - `web` uses standard web technologies and runs in browsers.
  - `native` uses Tauri to build cross-platform desktop applications. worth noting that frontend-side still leverages web env through WebView.
- `packages/common` contains shared configurations, types, and utilities across different packages.
- `packages/ui` contains shared React components and views for the client applications.
- We use shadcn/ui as the base component library. Make sure you utilize it as many as possible. Add the new components in the respective packages under `packages/ui/`. Refer to https://ui.shadcn.com/llms.txt
- Use `@reown/appkit` for connecting to other wallets. doc: https://docs.reown.com/appkit/react/core/installation
- use `@zerodev/sdk` for smart wallet operation with passkey and external wallet support. (NOTE: we are using EntryPoint v0.7 and Kernel version v3.1 right now) doc: https://docs.zerodev.app/

# API Server Instructions

- We will use `elysia` for the server base framework. doc: https://elysiajs.com/
- API server can be used on both merchant side and payer side.
- Use `@elysiajs/eden` for api request on client side. doc: https://elysiajs.com/eden/treaty/overview.html

# Coding Patterns for React Components

- You should ignore the generated files like `routeTree.gen.ts` and so on.
- Use PascalCase for React component filenames (e.g., `MyComponent.tsx`).
- Follow the Repository Pattern or Container/Presenter Pattern for each components/views.
  - Define how the component/view should look and behave. (The interface domain)
  - Abstract the implementation details from the component logic. (The implementation domain)
  - Implement the actual behavior and logic. (The service domain)
  - Limit the side effects within the component/view.
  - For example, say we have a `WalletOverviewView` component/view:
    - `WalletOverviewView.tsx` (UI component/view in packages, consisting of the required props, interfaces, hooks and so on. But no direct implementation logic to the lower layer like the actual wallet api. It only defines the structure and behavior with the given interfaces, but with no implementation details. In order to make it functioning, it will depend on the implementation domain.)
    - `WalletOverviewInterface.ts` (The interface to be implemented, which connects the view with the service domain. It can be concatenated with the UI component/view if the interface is not complex.)
    - `WalletOverviewService.ts(x)` (The actual implementation of the interface, which connects to the service domain. It contains the actual logic like how to interact with the wallet api, fetch data, handle user actions, etc.) NOTE: the file shall be resided in the service domain folder, for example `apps/client/native/src/services/WalletOverviewImpl.tsx`
    - For `WalletOverviewImpl.ts(x)` or `WalletOverviewService.ts(x)`, it can consist of a class named `WalletOverviewService` which implements the `WalletOverviewInterface` logic and a `WalletOverviewImpl` React component/view which uses the `WalletOverviewView` and connects the react component-specific api with the `WalletOverviewService` service class. OR it can be a single React component/view named `WalletOverview` which implements the interface and uses the `WalletOverviewView` internally.
  - In case the component/view has separated files, please group them into a folder named after the component/view for better organization. (e.g., `WalletOverview/WalletOverviewView.tsx`, `WalletOverview/WalletOverviewInterface.ts`)
- Use least words for comments.

# When You Finish The Process

- Create a markdown file brifly describing what you have done, where the files are located, and how to use it. Put it in `logs/ai/` folder with the name of what you have implemented. For example, if you have implemented a merchant list feature, the file name can be `MERCHANT_LIST_IMPLEMENTATION.md`.
