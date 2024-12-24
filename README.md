# iiPythonx / cdbar

A website for quickly looking up CD barcodes, powered by MusicBrainz.

### Deployment to Cloudflare

```sh
git clone git@github.com:iiPythonx/cdbar
cd cdbar
wrangler deploy
```

### Manual deployment

```sh
git clone git@github.com:iiPythonx/cdbar
cd cdbar
uv venv
uv pip install nova-framework minify-html beautifulsoup4
bun i -g csso-cli uglify-js
uv run nova build
```

The built site will be in `.build/`. You can skip installing csso and UglifyJS if you don't want the output to be minified.
