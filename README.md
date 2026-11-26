# Google Blogger Publisher

Publish your Obsidian notes to Google Blogger — with tables and images that render correctly, and no external image hosting.

## Features

- **Tables that don't break.** Bloggers themes ship with almost no table styling, so plain Markdown tables can collapse into run-together text. This plugin adds inline styles (borders, padding, header background, alignment) to every table before publishing, so tables look like tables on your blog.
- **Images that actually show.** Local vault images (`![[image.png]]`, `![alt](image.png)`) are embedded as base64 data URIs, so they appear on your blog without uploading them anywhere or hosting them elsewhere.
- **Math that survives.** Math is rendered to inline SVG (or sent as TeX) using MathJax, so equations show up correctly.
- **Multiple blogs.** Manage several Blogger profiles and pick which one to publish to.
- **Draft or live.** Publish as a draft or publish live, and switch an existing post between the two.
- **Auto-fit large posts.** If a note is too big for Blogger's request limit, the plugin lowers image size/quality step by step until it fits, and tells you when it can't.
- **English and Korean UI.**

## Requirements

- Obsidian 1.13.0 or newer, on **desktop**.
- A Google account with a blog on [Blogger](https://www.blogger.com).
- A Google Cloud OAuth2 client ID and secret (created once, see below).

## Installation

### From source

```bash
cd /path/to/your/vault/.obsidian/plugins
git clone https://github.com/giljae/obsidian-google-blogger-publisher.git
cd obsidian-google-blogger-publisher
npm install
npm run build
```

Then enable **Google Blogger Publisher** under **Settings → Community plugins → Installed plugins**.

## Create OAuth2 credentials

The plugin talks to the Blogger API v3 with OAuth2. You create the credentials once:

1. Open the [Google Cloud Console](https://console.cloud.google.com/apis/dashboard) and create (or pick) a project.
2. Enable the **Blogger API v3**.
3. Under **APIs & Services → Credentials**, create an **OAuth client ID** of type **Desktop app**.
4. Copy the **Client ID** and **Client secret**.

## Set up a profile

1. Open **Settings → Google Blogger Publisher**.
2. Paste the **Client ID** and **Client secret**.
3. Click **Manage** next to Profiles, then **+ Add**.
4. Enter a name and your blog's `.blogspot.com` URL (for example `https://example.blogspot.com`).
5. Click **Authorize**, sign in with Google, and return to Obsidian. The profile shows **Connected**.
6. **Save**. Repeat for each blog; mark one as the **default**.

## Usage

- **Publish with default options** — publishes the active note using the default profile and default status, without a dialog. Good for a quick publish.
- **Publish to Blogger…** — opens a dialog where you choose the profile and Draft/Live, then publishes.

The note's title, labels, and (for updates) post id come from the note itself:

```markdown
---
title: My first post
labels: [blogging, obsidian]
---

Your content goes here.
```

After the first publish the plugin writes the Blogger `postId` and the profile name back into the note's front matter, so the next publish updates the same post instead of creating a new one.

## Settings

| Setting | What it does |
| --- | --- |
| Google OAuth2 client ID / secret | Credentials from the Google Cloud Console. |
| Profiles | Manage your blogs and authorization. |
| Default post status | Draft or Live when a note doesn't say. |
| Open the post after publishing | Opens the published post in your browser. |
| Allow raw HTML | Renders HTML embedded in a note. |
| Math output | Send math as TeX source or render it to inline SVG. |
| Embed local images | Embed vault images as base64 data URIs. |
| Maximum image width | Downscale images wider than this (px). |
| Image quality | Re-encode quality for lossy formats (0.1–1.0). |
| Image format | Format used when re-encoding (Automatic, JPEG, PNG, WebP). |
| Auto-fit post size | Lower image size/quality until the post fits Blogger's limit. |
| SVG text color | Recolor embedded SVG diagrams for a light background. |

## Troubleshooting

- **A table looks plain.** Make sure the post was published by this plugin (inline table styles are added at publish time).
- **An image is missing.** Confirm the image exists in your vault and that **Embed local images** is on. Images that can't be found are left as-is and reported in a notice.
- **"Too large to publish".** Reduce the number or size of images, or turn on **Auto-fit post size**.
- **Authorization fails.** Re-open the profile and click **Re-authorize**.

## Network use

This plugin only contacts Google: the Google OAuth2 endpoints (`accounts.google.com`, `oauth2.googleapis.com`) for sign-in and token refresh, and the Blogger API v3 (`www.googleapis.com/blogger/v3`) to publish. It sends no telemetry and contacts no other servers.

## License

[MIT](LICENSE)
