# RoleColorFinder

Static website concepts for RoleColorFinder. The deployed version is in
`concepts/primaries/` and uses plain HTML, CSS, and JavaScript.

Live site: https://rolecolorfinder-kappa.vercel.app

## Local preview

From the repository root:

```sh
python3 -m http.server 4321
```

Open http://localhost:4321/concepts/primaries/.

## Project layout

- `concepts/primaries/`: current deployed site
- `concepts/blend/` and `concepts/signal/`: alternate concepts
- `archive/v1-editorial/`: earlier design
- `assets/`: links to the current site's stylesheet and script

## Deployment

Vercel uses the root `vercel.json` to publish `concepts/primaries/` at `/`.
There are no dependencies to install and no build step.

```sh
npx vercel --prod
```

The current site links to additional HTML pages, including assessment and
pricing, that are not included in this repository.
