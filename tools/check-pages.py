from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(); self.path=path; self.tags=[]; self.ids=[]; self.h1=0
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs); self.tags.append((tag,attrs))
        if tag=='h1': self.h1+=1
        if 'id' in attrs: self.ids.append(attrs['id'])

for filename in ['index.html','careers/index.html','404.html']:
    path=ROOT/filename; html=path.read_text(); p=Page(path); p.feed(html)
    assert p.h1==1, filename
    assert len(p.ids)==len(set(p.ids)), 'Duplicate IDs'
    assert 'Built by Riva' in html and 'https://rivastrategies.com/' in html
    assert any(t=='meta' and a.get('name')=='viewport' for t,a in p.tags)
    for tag,a in p.tags:
        if tag=='img': assert a.get('alt') and a.get('width') and a.get('height')
        for key in ['src','href']:
            value=a.get(key,''); u=urlsplit(value)
            if not value or u.scheme or u.netloc: continue
            if u.path:
                target=ROOT/u.path.lstrip('/') if u.path.startswith('/') else path.parent/u.path
                if u.path.endswith('/'): target=target/'index.html'
                assert target.exists(), (filename,value)
            elif u.fragment: assert u.fragment in p.ids, (filename,value)
    print('PASS:',filename,'headings, assets, local links and footer')
live = "mode: 'live'" in (ROOT/'site-config.js').read_text()
if live:
    assert 'index, follow, max-image-preview:large' in (ROOT/'careers/index.html').read_text()
    assert 'noindex' not in (ROOT/'careers/index.html').read_text()
    assert '/careers/' in (ROOT/'sitemap.xml').read_text()
    assert 'Send test application' not in (ROOT/'careers/index.html').read_text()
else:
    assert "mode: 'draft'" in (ROOT/'site-config.js').read_text()
    assert 'noindex, nofollow' in (ROOT/'careers/index.html').read_text()
    assert '/careers/' not in (ROOT/'sitemap.xml').read_text()
assert 'JobPosting' not in (ROOT/'careers/index.html').read_text()
assert 'localStorage' not in (ROOT/'careers/careers.js').read_text()
print('PASS: indexing/sitemap match release mode; no invented JobPosting schema; no browser storage for applicant data')
