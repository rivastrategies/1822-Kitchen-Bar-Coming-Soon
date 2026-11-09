"""Loopback-only draft preview; never serves repository or review files."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {'.html', '.css', '.js', '.jpg', '.png', '.webp', '.svg', '.ico', '.webmanifest'}

class Preview(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.webp': 'image/webp'}

    def allowed_path(self):
        path = unquote(urlsplit(self.path).path)
        parts = Path(path).parts
        if any(p.startswith('.') for p in parts) or path.startswith('/tools/') or path.startswith('/review/'):
            self.send_error(404)
            return False
        file = (ROOT / path.lstrip('/')).resolve()
        if not file.is_relative_to(ROOT):
            self.send_error(404)
            return False
        if file.is_dir() and not (file / 'index.html').is_file():
            self.send_error(404)
            return False
        if not file.is_dir() and file.suffix not in ALLOWED:
            self.send_error(404)
            return False
        return True

    def do_GET(self):
        if not self.allowed_path():
            return
        super().do_GET()

    def do_HEAD(self):
        if self.allowed_path():
            super().do_HEAD()

    def end_headers(self):
        self.send_header('X-Robots-Tag', 'noindex, nofollow, noarchive')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

if __name__ == '__main__':
    print('Draft preview: http://127.0.0.1:1822/ — Careers: http://127.0.0.1:1822/careers/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 1822), partial(Preview, directory=str(ROOT))).serve_forever()
