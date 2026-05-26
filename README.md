
# Neighborly Hub

Neighborly Hub is a responsive Nextdoor-style neighborhood app prototype for local updates, help requests, safety alerts, events, and marketplace posts.

## Features

- Neighborhood feed with seeded posts
- Search, category filters, and sorting
- Create-post modal with local persistence
- Safety alert broadcaster
- Events with RSVP actions
- Marketplace/help/community categories
- Dark mode
- Responsive desktop and mobile layout
- AI Copilot panel that drafts and improves neighborhood posts, estimates category and urgency, and fills the post composer

## Run Locally

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

You can also open `index.html` directly in a browser.

## Publish On GitHub Pages

After pushing this project to GitHub:

1. Open the repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. Under `Build and deployment`, choose `GitHub Actions` or `Deploy from a branch`.
4. If using branch deploy, select branch `main` and folder `/root`.
5. Save. GitHub will publish the app at a public `https://<username>.github.io/<repo>/` URL.

## Notes

This is a static frontend prototype. Posts are saved in the visitor's browser with `localStorage`; there is no shared backend database yet. The AI Copilot is implemented client-side as an assistive drafting feature, so it works immediately on public static hosting without exposing any API keys.
