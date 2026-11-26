// Tạo các trang sản phẩm tĩnh cho Google/Facebook từ gia-snapshot.js (chỉ giá lẻ, không có giá đại lý).
// Chạy:  node tools/build-seo.js        (ở thư mục web-khach)
// Đổi tên miền: sửa site-config.json (site) rồi chạy lại.
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(R, 'site-config.json'), 'utf8'));
const SITE = cfg.site.replace(/\/$/, '');
function nap(f, bien) { const c = { window: {}, self: {} }; vm.runInNewContext(fs.readFileSync(path.join(R, f), 'utf8') + ';this.__v=typeof ' + bien + "!=='undefined'?" + bien + ':null;', c); return c.__v || c.window[bien]; }
const snap = (function () { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(R, 'gia-snapshot.js'), 'utf8'), c); return c.window; })();
const G = snap.GIA_SNAPSHOT, NGAY = snap.GIA_SNAPSHOT_NGAY;
const FACE = nap('face-data.js', 'FACE_GACH') || {};
const TT = G.thuocTinh.data, IMG = G.spImages || {}, EXTRA = G.extra || {};
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tien = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const nhan = v => { v = String(v || '').replace(/_/g, ' ').toLowerCase(); return v ? v.charAt(0).toUpperCase() + v.slice(1) : ''; };
const khoa = ma => String(ma).toUpperCase().replace(/^\d{6}_/, '').replace(/[-_ ]?(H\+|FP|NUNG2L)/g, '').replace(/[^A-Z0-9]/g, '');
function tenMau(ma) { const m = String(ma).replace(/^(?:DTD|DTS|CT|D)?\d+/, '').replace(/-.*$/, ''); const k = m.match(/^([A-Z]+)(\d+)$/i); return k ? k[1] + ' ' + k[2] : m; }
const MEN = { 'BÓNG': 'men bóng', 'MỜ': 'men mờ', 'DOUBLE_CHARGE': 'double charge', 'ĐỒNG_CHẤT': 'đồng chất' };
const cuaGoc = u => { u = String(u || ''); const m = u.match(/\/d\/([\w-]+)/) || u.match(/id=([\w-]+)/); return m ? 'https://lh3.googleusercontent.com/d/' + m[1] + '=w900' : ''; };

// ---- chuẩn bị danh sách sản phẩm
const sp = [], dung = {};
G.gach.data.filter(r => r.le > 0).forEach(r => {
  const k = khoa(r.ma), m = String(r.kc || '').match(/(\d+)x(\d+)/i); if (!m || !/^[A-Z]+ \d+$/i.test(tenMau(r.ma))) return;
  let slug = 'gach-' + tenMau(r.ma).toLowerCase().replace(/\s+/g, '-') + '-' + m[1] / 10 + 'x' + m[2] / 10;
  slug = slug.replace(/[^a-z0-9-.]/g, '').replace(/\./g, '-');
  if (dung[slug]) slug += '-' + r.sap; dung[slug] = 1;
  const t = TT[r.ma] || {};
  const imgLocal = FACE[k] ? 'anh/face/' + k + '-1.jpg' : '';
  const img = imgLocal || cuaGoc(IMG[r.sap]);
  sp.push({ r, k, slug, w: +m[1] / 10, h: +m[2] / 10, ten: tenMau(r.ma), t, img, imgLocal });
});

const CSS = `/* trang sản phẩm tĩnh: phong cách sang trọng đồng bộ web chính */
:root{--ruou:#4A130F;--do:#E81A21;--vang:#D9B36A;--vangd:#A67C2E;--kem:#F8F3ED;--chu:#1A0F0E;--phu:#5A5252;--vien:#E7DEDC}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Be Vietnam Pro",Arial,sans-serif;color:var(--chu);background:var(--kem);line-height:1.55}
a{color:inherit}.wrap{max-width:1040px;margin:0 auto;padding:0 18px}
.top{background:#fff;border-bottom:1px solid var(--vien)}.top .wrap{display:flex;align-items:center;gap:18px;min-height:58px;flex-wrap:wrap}
.top b{color:var(--do);font-size:18px;font-weight:900}.top nav{display:flex;gap:14px;font-size:13.5px;font-weight:600;flex-wrap:wrap}.top nav a{text-decoration:none}
.hero{background:radial-gradient(800px 500px at 70% 0,#4A130F 0,#1F0A08 55%,#090404 100%);color:#fff;padding:22px 0 26px;border-bottom:2px solid var(--vang)}
.hero small{color:#EBCF95;letter-spacing:1.4px;text-transform:uppercase;font-size:12px}
.hero h1{font-family:'Times New Roman',Cambria,serif;font-size:clamp(26px,5.5vw,38px);line-height:1.15;margin-top:6px}
.hero p{color:#F1E4D2;margin-top:8px;max-width:640px}
.sp{display:grid;grid-template-columns:1fr;gap:22px;padding:24px 0}
@media(min-width:800px){.sp{grid-template-columns:1fr 1fr;align-items:start}}
.sp img.anh{width:100%;height:auto;border-radius:14px;box-shadow:0 0 0 2px var(--vang),0 18px 40px rgba(40,10,8,.25);background:#EFE9E2;display:block}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--vien);border-radius:12px;overflow:hidden;margin-top:12px}
td{padding:9px 12px;border-bottom:1px solid var(--vien);font-size:14.5px}td:first-child{color:var(--phu);width:42%}
.gia{font-size:30px;font-weight:900;color:var(--do);margin-top:10px}.gia small{display:block;font-size:13px;color:var(--phu);font-weight:500;margin-top:2px}
.nut{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 24px;border-radius:12px;background:var(--do);color:#fff;font-weight:800;text-decoration:none;margin:12px 10px 0 0}
.nut.v{background:transparent;border:1.5px solid var(--vangd);color:var(--ruou)}
h2{font-family:'Times New Roman',Cambria,serif;color:var(--ruou);font-size:22px;margin:26px 0 8px}
h2:after{content:"";display:block;width:46px;height:2px;background:var(--vang);margin-top:6px}
.luoi{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}@media(min-width:700px){.luoi{grid-template-columns:repeat(4,1fr)}}
.the{background:#fff;border:1px solid rgba(217,179,106,.7);border-radius:12px;text-decoration:none;overflow:hidden;display:block}
.the img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#EFE9E2}.the span{display:block;padding:9px 11px;font-size:13.5px;font-weight:700}.the small{display:block;font-weight:500;color:var(--phu);font-size:12.5px}
.ghi{font-size:13px;color:var(--phu);margin-top:14px}footer{background:#1A0F0E;color:#D8C9B4;font-size:13px;padding:22px 0;margin-top:30px}footer a{color:#EBCF95}
ul.ds{margin:8px 0 0 18px}.ds li{margin:3px 0}`;

const KHONG_CHINH_THUC = 'Trang tham khảo về gạch, ngói, keo Đồng Tâm do nhân viên kinh doanh khu vực thực hiện, không phải trang chính thức của hãng. Tư vấn, báo giá và giao hàng do đại lý Đồng Tâm thực hiện.';
const GOP_Y = 'Góp ý về trang: <a href="https://zalo.me/0819548908">Zalo 0819 548 908</a> · <a href="mailto:lechilinh.work@gmail.com">lechilinh.work@gmail.com</a>';

function khung(o) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${SITE}${o.url}">
<meta property="og:type" content="${o.og || 'website'}"><meta property="og:locale" content="vi_VN"><meta property="og:site_name" content="Gạch, ngói, keo Đồng Tâm tham khảo">
<meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${SITE}${o.url}">
${o.img ? '<meta property="og:image" content="' + esc(o.img) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + esc(o.img) + '">' : ''}
<style>${CSS}</style>${o.ld ? '<script type="application/ld+json">' + JSON.stringify(o.ld) + '</script>' : ''}</head><body>
<div class="top"><div class="wrap"><b>Dongtam</b><nav><a href="${SITE}/">Chọn gạch theo ngân sách</a><a href="${SITE}/gach/">Danh mục gạch</a><a href="${SITE}/#dai-ly">Đại lý gần bạn</a></nav></div></div>
${o.body}
<footer><div class="wrap"><p>${KHONG_CHINH_THUC}</p><p style="margin-top:8px">${GOP_Y}</p></div></footer></body></html>`;
}
const absImg = u => !u ? '' : /^https?:/.test(u) ? u : SITE + '/' + u;
const dir = path.join(R, 'gach'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const urls = [];

// ---- trang từng sản phẩm
sp.forEach((s, i) => {
  const { r, t } = s, men = MEN[t.men] || '', kk = t.tinhNang === 'KHÁNG_KHUẨN';
  const kich = s.w + 'x' + s.h + ' cm', xuong = r.cat === 'porcelain' ? 'Porcelain' : 'Ceramic';
  const ten = 'Gạch ' + s.ten + ' ' + kich + ' Đồng Tâm';
  const mota = [xuong, men, t.hoaVan ? 'vân ' + nhan(t.hoaVan).toLowerCase().replace(/^vân /, '') : '', t.mau ? 'màu ' + nhan(t.mau).toLowerCase() : ''].filter(Boolean).join(', ');
  const title = ten + ' · ' + [xuong, men].filter(Boolean).join(' ') + (kk ? ' kháng khuẩn' : '');
  let desc = ten + ': ' + mota + (kk ? ', men Nano kháng khuẩn' : '') + '. Giá lẻ tham khảo ' + tien(r.le) + ' đ/m². Xem mẫu thật tại đại lý gần bạn.';
  if (desc.length > 160) desc = ten + ': ' + mota + '. Giá lẻ tham khảo ' + tien(r.le) + ' đ/m². Xem mẫu thật tại đại lý.';
  if (desc.length > 160) desc = ten + '. Giá lẻ tham khảo ' + tien(r.le) + ' đ/m². Xem mẫu thật tại đại lý Đồng Tâm.';
  const url = '/gach/' + s.slug + '.html';
  const hang = [['Mã sản phẩm', r.ma], ['Kích thước', kich], ['Xương gạch', xuong], ['Bề mặt', nhan(men)], ['Hoa văn', nhan(t.hoaVan).replace(/^Vân /, 'Vân ')], ['Màu sắc', nhan(t.mau)], ['Công năng', nhan(t.congNang)], ['Tính năng', nhan(t.tinhNang) === 'Đặc thù' ? '' : nhan(t.tinhNang)]].filter(x => x[1]);
  // gợi ý cùng khổ
  const cung = sp.filter(x => x !== s && x.w === s.w && x.h === s.h && x.img).slice((i * 3) % Math.max(1, sp.filter(x => x.w === s.w && x.h === s.h).length - 4), 4 + (i * 3) % Math.max(1, sp.filter(x => x.w === s.w && x.h === s.h).length - 4));
  const body = `<div class="hero"><div class="wrap"><small>Gạch ${xuong} · ${kich}</small><h1>${esc(ten)}</h1><p>${esc(mota)}${kk ? '. Có men Nano kháng khuẩn.' : '.'}</p></div></div>
<div class="wrap"><div class="sp"><div>${s.img ? '<img class="anh" src="' + (s.imgLocal ? '../' + s.imgLocal : esc(s.img)) + '" alt="' + esc(ten) + '" width="900" height="900">' : ''}</div>
<div><div class="gia">${tien(r.le)} đ/m² <small>giá lẻ niêm yết tham khảo (đã gồm VAT), cập nhật ${NGAY}</small></div>
<table>${hang.map(h => '<tr><td>' + esc(h[0]) + '</td><td>' + esc(h[1]) + '</td></tr>').join('')}</table>
<a class="nut" href="${SITE}/?sp=${r.sap}">Xem giá, đại lý có mẫu thật</a><a class="nut v" href="${SITE}/?sp=${r.sap}#dai-ly">Nhắn đại lý gần bạn</a>
<p class="ghi">Giá chỉ để tham khảo, đại lý báo giá chính xác và chiết khấu theo công trình. Màu trên ảnh có thể khác thực tế do màn hình: nên xem mẫu thật và chọn cùng số lô.</p></div></div>
${cung.length ? '<h2>Gạch cùng khổ ' + kich + '</h2><div class="luoi">' + cung.map(c => '<a class="the" href="' + c.slug + '.html"><img loading="lazy" src="' + (c.imgLocal ? '../' + c.imgLocal : esc(c.img)) + '" alt="' + esc('Gạch ' + c.ten) + '"><span>' + esc(c.ten) + '<small>' + tien(c.r.le) + ' đ/m²</small></span></a>').join('') + '</div>' : ''}
<p class="ghi"><a href="./">← Tất cả gạch Đồng Tâm</a> · <a href="kich-thuoc-${s.w}x${s.h}.html">Gạch ${kich}</a></p></div>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: ten, sku: String(r.sap), mpn: r.ma, brand: { '@type': 'Brand', name: 'Đồng Tâm' }, category: 'Gạch ' + xuong, description: desc, image: s.img ? [absImg(s.img)] : undefined };
  fs.writeFileSync(path.join(dir, s.slug + '.html'), khung({ title, desc, url, og: 'product', img: absImg(s.img), body, ld }));
  urls.push(url);
});

// ---- trang theo kích thước + trang danh mục
const nhom = {}; sp.forEach(s => { (nhom[s.w + 'x' + s.h] = nhom[s.w + 'x' + s.h] || []).push(s); });
const the = c => '<a class="the" href="' + c.slug + '.html"><img loading="lazy" src="' + (c.imgLocal ? '../' + c.imgLocal : esc(c.img || '')) + '" alt="' + esc('Gạch ' + c.ten + ' ' + c.w + 'x' + c.h) + '"><span>' + esc(c.ten) + '<small>' + c.w + 'x' + c.h + ' · ' + tien(c.r.le) + ' đ/m²</small></span></a>';
Object.keys(nhom).sort((a, b) => nhom[b].length - nhom[a].length).forEach(k => {
  const ds = nhom[k].filter(x => x.img);
  if (ds.length < 3) return;
  const title = 'Gạch ' + k.replace('x', 'x') + ' cm Đồng Tâm: ' + ds.length + ' mẫu, giá tham khảo';
  const desc = ('Danh sách ' + ds.length + ' mẫu gạch Đồng Tâm khổ ' + k + ' cm: Porcelain, Ceramic, men bóng, men mờ, vân đá. Xem giá lẻ tham khảo và đại lý có mẫu thật.').slice(0, 158);
  const url = '/gach/kich-thuoc-' + k + '.html';
  const body = '<div class="hero"><div class="wrap"><small>Danh mục</small><h1>Gạch ' + k + ' cm Đồng Tâm</h1><p>' + ds.length + ' mẫu gạch khổ ' + k + ' cm. Bấm vào từng mẫu để xem thông số, giá lẻ tham khảo và đại lý có mẫu thật.</p></div></div><div class="wrap"><h2>Các mẫu gạch ' + k + ' cm</h2><div class="luoi">' + ds.map(the).join('') + '</div><p class="ghi"><a href="./">← Tất cả danh mục gạch</a></p></div>';
  fs.writeFileSync(path.join(dir, 'kich-thuoc-' + k + '.html'), khung({ title, desc, url, img: absImg(ds[0].img), body })); urls.push(url);
});
const ks = Object.keys(nhom).filter(k => nhom[k].filter(x => x.img).length >= 3).sort((a, b) => nhom[b].length - nhom[a].length);
const titleI = 'Gạch Đồng Tâm: ' + sp.length + ' mẫu gạch ốp lát theo khổ, màu, giá tham khảo';
const descI = 'Danh mục gạch Porcelain và Ceramic Đồng Tâm: các khổ 60x60, 80x80, 30x60, 40x80... Xem ảnh mặt gạch, giá lẻ tham khảo và đại lý có mẫu thật gần bạn.';
fs.writeFileSync(path.join(dir, 'index.html'), khung({ title: titleI, desc: descI, url: '/gach/', img: absImg('anh/bia-tong-hop.jpg'), body: '<div class="hero"><div class="wrap"><small>Danh mục</small><h1>Gạch ốp lát Đồng Tâm</h1><p>Chọn theo khổ gạch, rồi xem từng mẫu: ảnh mặt gạch, thông số, giá lẻ tham khảo và đại lý có mẫu thật.</p></div></div><div class="wrap"><h2>Theo kích thước</h2><ul class="ds">' + ks.map(k => '<li><a href="kich-thuoc-' + k + '.html">Gạch ' + k + ' cm</a> (' + nhom[k].filter(x => x.img).length + ' mẫu)</li>').join('') + '</ul><h2>Mẫu nổi bật</h2><div class="luoi">' + sp.filter(x => x.imgLocal).slice(0, 12).map(the).join('') + '</div></div>' })); urls.push('/gach/');

// ---- sitemap + robots
const ngay = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(R, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ['/'].concat(urls).map(u => '<url><loc>' + SITE + u + '</loc><lastmod>' + ngay + '</lastmod></url>').join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(R, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /chao-cong-trinh.html\nDisallow: /ct.html\nDisallow: /to-roi.html\nSitemap: ' + SITE + '/sitemap.xml\n');
console.log('san pham:', sp.length, 'trang:', urls.length, 'site:', SITE);
