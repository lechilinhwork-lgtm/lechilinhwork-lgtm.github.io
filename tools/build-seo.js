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
const KT = require('./kien-thuc.js');
const THE = (function () { try { return JSON.parse(fs.readFileSync(path.join(R, 'data', 'the-san-pham.json'), 'utf8')); } catch (e) { return { gach: {}, ngoi: {} }; } })();
const KHO = (function () { try { const d = JSON.parse(fs.readFileSync(path.join(R, 'data', 'san-pham.json'), 'utf8')); const m = {}; d.sp.forEach(x => { m[x.sap] = x; }); return m; } catch (e) { console.log('Chua co data/san-pham.json: chay node tools/lap-kho.js truoc'); return {}; } })();
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
  // hai nguồn ảnh: Face = mặt gạch sạch của hãng; thực = ảnh sản phẩm thực tế lấy từ Sale tool (tải về anh/sp/)
  const faces = []; if (FACE[k]) for (let n = 1; n <= (+FACE[k] || 1); n++) faces.push('anh/face/' + k + '-' + n + '.jpg');
  const thuc = []; for (let n = 1; n <= 6; n++) { const f = 'anh/sp/' + r.sap + '-' + n + '.webp'; if (fs.existsSync(path.join(R, f))) thuc.push(f); }
  const imgLocal = faces[0] || thuc[0] || '';
  const img = imgLocal || cuaGoc(IMG[r.sap]);
  const kho = KHO[r.sap] || {};
  const the = (THE.gach[k] || THE.gach[k.replace(/^(DTD|DTS|CT|D)(?=\d)/, '')] || []).filter(f => fs.existsSync(path.join(R, f)));
  sp.push({ r, k, slug, w: +m[1] / 10, h: +m[2] / 10, ten: tenMau(r.ma), t, img, imgLocal, faces, thuc, the, kho, ngung: !kho.dangKD });
});
// ưu tiên: sản phẩm chủ lực/mới lên trước, rồi theo hạng bán chạy
sp.sort((a, b) => (b.kho.uuTien ? 1 : 0) - (a.kho.uuTien ? 1 : 0) || (a.kho.hangBanChay || 9999) - (b.kho.hangBanChay || 9999));
const spKD = sp.filter(x => !x.ngung);

const CSS = `/* trang sản phẩm tĩnh: phong cách sang trọng đồng bộ web chính */
:root{--ruou:#1F2937;--do:#E81A21;--vang:#E81A21;--vangd:#E81A21;--kem:#F3F4F6;--chu:#111827;--phu:#6B7280;--vien:#E5E7EB}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Be Vietnam Pro",Arial,sans-serif;color:var(--chu);background:var(--kem);line-height:1.55}
a{color:inherit}.wrap{max-width:1040px;margin:0 auto;padding:0 18px}
.top{background:#fff;border-bottom:1px solid var(--vien)}.top .wrap{display:flex;align-items:center;gap:18px;min-height:58px;flex-wrap:wrap}
.top b{color:var(--do);font-size:18px;font-weight:900}.top nav{display:flex;gap:14px;font-size:13.5px;font-weight:600;flex-wrap:wrap}.top nav a{text-decoration:none}
.hero{background:linear-gradient(160deg,#2A3342,#111827);color:#fff;padding:22px 0 26px;border-bottom:3px solid var(--do)}
.hero small{color:#FCA5A5;letter-spacing:1.4px;text-transform:uppercase;font-size:12px}
.hero h1{font-family:'Playfair Display','Times New Roman',Cambria,serif;font-size:clamp(26px,5.5vw,38px);line-height:1.15;margin-top:6px}
.hero p{color:#E5E7EB;margin-top:8px;max-width:640px}
.sp{display:grid;grid-template-columns:1fr;gap:22px;padding:24px 0}
@media(min-width:800px){.sp{grid-template-columns:1fr 1fr;align-items:start}}
.sp img.anh{width:100%;height:auto;border-radius:14px;box-shadow:0 0 0 2px #fff,0 18px 40px rgba(17,24,39,.22);background:#E5E7EB;display:block}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--vien);border-radius:12px;overflow:hidden;margin-top:12px}
td{padding:10px 12px;border-bottom:1px solid var(--vien);font-size:15.5px}td:first-child{color:var(--phu);width:42%}
.gia{font-size:30px;font-weight:900;color:var(--do);margin-top:10px}.gia small{display:block;font-size:13px;color:var(--phu);font-weight:500;margin-top:2px}
.nut{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 24px;border-radius:12px;background:var(--do);color:#fff;font-weight:800;text-decoration:none;margin:12px 10px 0 0}
.nut.v{background:transparent;border:1.5px solid var(--ruou);color:var(--ruou)}
h2{font-family:'Playfair Display','Times New Roman',Cambria,serif;color:var(--ruou);font-size:22px;margin:26px 0 8px}
h2:after{content:"";display:block;width:46px;height:3px;background:var(--do);margin-top:6px}
.luoi{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}@media(min-width:700px){.luoi{grid-template-columns:repeat(4,1fr)}}
.the{background:#fff;border:1px solid var(--vien);border-radius:12px;text-decoration:none;overflow:hidden;display:block}
.the img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#E5E7EB}.the span{display:block;padding:9px 11px;font-size:13.5px;font-weight:700}.the small{display:block;font-weight:500;color:var(--phu);font-size:12.5px}
.ghi{font-size:13px;color:var(--phu);margin-top:14px}footer{background:#111827;color:#D1D5DB;font-size:13px;padding:22px 0;margin-top:30px}footer a{color:#FCA5A5}
ul.ds{margin:8px 0 0 18px}.ds li{margin:3px 0}
.nhan{display:inline-block;font-size:11.5px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;padding:2px 9px;border-radius:99px;background:#111827;color:#fff;margin:0 6px 6px 0}.nhan.moi{background:var(--do);color:#fff}
.loi p{margin:7px 0;font-size:15px}
.sp>div{min-width:0}img[src=""]{visibility:hidden}.gal{display:block}.gt{display:flex;gap:8px;margin:12px 0 0}.gt button{font:inherit;font-weight:700;font-size:14px;padding:8px 16px;border-radius:99px;border:1px solid var(--vien);background:#fff;color:var(--ruou);cursor:pointer}.gt button.on{background:var(--ruou);color:#fff;border-color:var(--ruou)}
.gs{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.gs a{position:relative;display:block;border:2px solid var(--vien);border-radius:10px;overflow:hidden;width:72px;height:72px;background:#E5E7EB}.gs a.on{border-color:var(--do)}.gs img{width:100%;height:100%;object-fit:cover;display:block}.gs a[data-lb]::after{content:attr(data-lb);position:absolute;left:0;right:0;bottom:0;background:rgba(17,24,39,.78);color:#fff;font-size:10.5px;font-weight:700;text-align:center;padding:1px 0;letter-spacing:.2px}.gt small{opacity:.6;font-weight:500;margin-left:2px}
h1,h2,.gia,.the span{font-variant-numeric:lining-nums;font-feature-settings:"lnum" 1}
.chip{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 0}.chip a{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--vien);border-radius:99px;padding:8px 16px;font-weight:700;font-size:14.5px;text-decoration:none;color:var(--ruou)}.chip a small{font-weight:500;color:var(--phu);font-size:12.5px}.chip a:hover{background:var(--ruou);color:#fff}.chip a:hover small{color:#FCA5A5}
.the{position:relative}.the .im{display:block;position:relative;aspect-ratio:1;background:#E5E7EB;overflow:hidden}.the .im img{width:100%;height:100%;aspect-ratio:auto;object-fit:cover;display:block}.the .im .i2{position:absolute;inset:0;opacity:0;transition:opacity .3s}.the:hover .im .i2{opacity:1}.the .nh{position:absolute;top:8px;left:8px;background:var(--do);color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;padding:2px 8px;border-radius:99px}
/* bài viết */
.bv-hero{display:grid;gap:22px;align-items:center}@media(min-width:820px){.bv-hero{grid-template-columns:1.25fr .75fr}}
.bv-hero img{width:100%;max-height:200px;object-fit:cover;border-radius:14px;box-shadow:0 0 0 2px #fff,0 14px 34px rgba(0,0,0,.4);display:block}
.bv-meta{color:#FCA5A5;font-size:13px;margin-top:10px;letter-spacing:.3px}
.tomtat{background:#fff;border:1px solid var(--vien);border-left:5px solid var(--do);border-radius:12px;padding:14px 18px;margin:22px auto 0;max-width:760px;font-size:16.5px;line-height:1.7}.tomtat b{color:var(--do);display:block;font-size:12.5px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:3px}
.khoi{padding:30px 0}.khoi .tr{max-width:760px;margin:0 auto;padding:0 18px}.khoi p,.khoi li{font-size:17px;line-height:1.8}.khoi li{margin:6px 0}
.khoi h2{font-size:clamp(23px,4.6vw,30px);margin:0 0 12px}.khoi h2 .so{display:block;font-family:'Be Vietnam Pro',Arial,sans-serif;font-size:13px;font-weight:800;letter-spacing:2px;color:var(--vangd);margin-bottom:4px}
.khoi.k1{background:var(--kem)}.khoi.k2{background:#fff;border-top:1px solid var(--vien);border-bottom:1px solid var(--vien)}
.khoi.k3{background:linear-gradient(160deg,#2A3342,#111827);color:#F3F4F6}.khoi.k3 h2{color:#fff}.khoi.k3 h2 .so{color:#FCA5A5}.khoi.k3 h2:after{background:var(--do)}.khoi.k3 a{color:#FCA5A5}
.khoi .ds{margin-left:22px}
.cuon{overflow-x:auto;margin:14px 0}.sosanh{margin:0;min-width:470px}@media(min-width:820px){.bv-hero img{max-height:300px}}.sosanh th{background:var(--ruou);color:#fff;text-align:left;padding:10px 12px;font-size:14.5px}.sosanh td:first-child{width:auto;font-weight:700;color:var(--ruou);background:#F9FAFB}.sosanh td{font-size:15.5px;vertical-align:top}.canh{background:#FFFBEB;border:1px solid #F59E0B;border-radius:12px;padding:11px 14px;margin-top:12px;font-size:14px}`;

const KHONG_CHINH_THUC = 'Trang tham khảo về gạch, ngói, keo Đồng Tâm do nhân viên kinh doanh khu vực thực hiện, không phải trang chính thức của hãng. Tư vấn, báo giá và giao hàng do đại lý Đồng Tâm thực hiện.';
const GOP_Y = 'Góp ý về trang: <a href="https://zalo.me/0819548908">Zalo 0819 548 908</a> · <a href="mailto:lechilinh.work@gmail.com">lechilinh.work@gmail.com</a>';

function khung(o) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${SITE}${o.url}">${o.noindex ? '\n<meta name="robots" content="noindex,follow">' : ''}
<meta property="og:type" content="${o.og || 'website'}"><meta property="og:locale" content="vi_VN"><meta property="og:site_name" content="Gạch, ngói, keo Đồng Tâm tham khảo">
<meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${SITE}${o.url}">
${o.img ? '<meta property="og:image" content="' + esc(o.img) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + esc(o.img) + '">' : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;800&family=Playfair+Display:wght@600;700&display=swap">
<style>${CSS}</style>${o.ld ? '<script type="application/ld+json">' + JSON.stringify(o.ld) + '</script>' : ''}</head><body>
<div class="top"><div class="wrap"><b>Dongtam</b><nav><a href="${SITE}/">Chọn gạch theo ngân sách</a><a href="${SITE}/gach/">Gạch</a><a href="${SITE}/ngoi/">Ngói</a><a href="${SITE}/keo/">Keo và ron</a><a href="${SITE}/kinh/">Gạch kính</a>${bai.length ? '<a href="' + SITE + '/bai-viet/">Bài viết</a>' : ''}<a href="${SITE}/#dai-ly">Đại lý gần bạn</a></nav></div></div>
${o.body}
<footer><div class="wrap"><p>${KHONG_CHINH_THUC}</p><p style="margin-top:8px">${GOP_Y}</p></div></footer></body></html>`;
}
const absImg = u => !u ? '' : /^https?:/.test(u) ? u : SITE + '/' + u;
const dir = path.join(R, 'gach'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const urls = [];

// ---- BÀI VIẾT: nguồn ở bai-viet-nguon/*.md (đã duyệt). Bản nháp nằm ngoài repo: ../bai-nhap/*.md, chỉ dùng khi chạy với --xem-nhap để xem thử.
// Định dạng: dòng đầu "---", các dòng "khoa: giá trị" (tieu-de, mo-ta, ngay, san-pham = các mã cách nhau dấu phẩy, nhom), dòng "---", rồi nội dung markdown đơn giản (## tiêu đề, danh sách -, **đậm**, [chữ](link)).
const XEM_NHAP = process.argv.includes('--xem-nhap');
function docBai(f) {
  const t = fs.readFileSync(f, 'utf8').replace(/\r/g, ''), m = t.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/); if (!m) return null;
  const o = { slug: path.basename(f, '.md'), nd: m[2].trim() }; m[1].split('\n').forEach(l => { const k = l.match(/^([\w-]+):\s*(.*)$/); if (k) o[k[1]] = k[2].trim(); });
  o.sp = String(o['san-pham'] || '').split(',').map(x => x.trim().toUpperCase()).filter(Boolean); o.ten = o['tieu-de']; return o.ten ? o : null;
}
const bai = [];
[[path.join(R, 'bai-viet-nguon'), false]].concat(XEM_NHAP ? [[path.join(R, '..', 'bai-nhap'), true]] : []).forEach(([d, nhap]) => { if (fs.existsSync(d)) fs.readdirSync(d).filter(f => f.endsWith('.md') && !/^_/.test(f)).forEach(f => { const b = docBai(path.join(d, f)); if (b) { b.nhap = nhap; bai.push(b); } }); });
bai.sort((a, b) => String(b.ngay || '').localeCompare(String(a.ngay || '')));
const baiTheoSp = {}; bai.forEach(b => b.sp.forEach(m => { (baiTheoSp[m] = baiTheoSp[m] || []).push(b); }));
const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (x, a, u) => '<a href="' + u.replace(/^\//, SITE + '/') + '">' + a + '</a>');
function mdHtml(nd, ctx) {
  const out = []; let ul = false, the = [], tb = []; const dong = () => {
    if (ul) { out.push('</ul>'); ul = false; }
    if (tb.length) {
      const hang = tb.map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim())).filter(r => !r.every(c => /^:?-{2,}:?$/.test(c)));
      out.push('<div class="cuon"><table class="sosanh"><tr>' + hang[0].map(c => '<th>' + inl(c) + '</th>').join('') + '</tr>' + hang.slice(1).map(r => '<tr>' + r.map(c => '<td>' + inl(c) + '</td>').join('') + '</tr>').join('') + '</table></div>'); tb = [];
    }
    if (the.length) { out.push('<div class="luoi" style="grid-template-columns:repeat(2,minmax(0,200px));margin:12px 0">' + the.join('') + '</div>'); the = []; } };
  nd.split('\n').forEach(l => {
    const t = l.trim(); if (!t) { return; }
    let m;
    if (t.charAt(0) === '|') { if (ul) dong(); tb.push(t); return; }
    if (tb.length) dong();
    if ((m = t.match(/^\{\{sp:([^}]+)\}\}$/))) { if (ul) dong(); const s = ctx.tim(m[1]); if (s) the.push(ctx.the(s)); return; }
    if ((m = t.match(/^(#{2,3})\s+(.*)$/))) { dong(); out.push('<h' + m[1].length + '>' + inl(m[2]) + '</h' + m[1].length + '>'); return; }
    if ((m = t.match(/^[-*]\s+(.*)$/))) { if (!ul) { out.push('<ul class="ds">'); ul = true; } out.push('<li>' + inl(m[1]) + '</li>'); return; }
    dong(); out.push('<p>' + inl(t) + '</p>');
  });
  dong(); return out.join('\n');
}


// ảnh trên thẻ danh sách: Thẻ sản phẩm -> Ảnh thực tế -> Mặt gạch; di chuột (máy tính) đổi sang ảnh khác
function cardAnh(c, pre, alt) {
  const ds = [(c.the || [])[0], (c.thuc || [])[0], (c.faces || [])[0]].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  if (!ds.length) return c.img ? '<span class="im"><img loading="lazy" src="' + esc(c.img) + '" alt="' + alt + '"></span>' : '<span class="im"></span>';
  return '<span class="im"><img loading="lazy" src="' + pre + ds[0] + '" alt="' + alt + '">' + (ds[1] ? '<img class="i2" loading="lazy" src="' + pre + ds[1] + '" alt="">' : '') + '</span>';
}
// Bộ ảnh dùng chung cho trang gạch, ngói, keo: bo = [{k, nhan, alt, ds:[đường dẫn từ gốc web]}...] theo thứ tự ưu tiên (tab đầu hiện trước).
const GAL_JS = '(function(){var A=document.getElementById("gA");if(!A)return;var box=document.querySelector(".gs");if(!box)return;var as=box.querySelectorAll("a");var tb=document.querySelectorAll(".gt button");' +
  'function bat(a){for(var i=0;i<as.length;i++){as[i].classList.toggle("on",as[i]===a);}A.src=a.getAttribute("data-s");var t=a.getAttribute("data-k");for(var j=0;j<tb.length;j++){tb[j].classList.toggle("on",tb[j].getAttribute("data-t")===t);}}' +
  'box.onclick=function(e){var a=e.target.closest("a");if(!a)return;e.preventDefault();bat(a);};' +
  'for(var k=0;k<tb.length;k++){tb[k].onclick=function(){var t=this.getAttribute("data-t");for(var i=0;i<as.length;i++){if(as[i].getAttribute("data-k")===t){bat(as[i]);break;}}};}})();';
function boAnh(bo, ten, tienTo) {
  bo = bo.filter(x => x.ds && x.ds.length); if (!bo.length) return '';
  const src = u => tienTo + u, tong = bo.reduce((n, x) => n + x.ds.length, 0);
  const tab = bo.length > 1 ? '<div class="gt">' + bo.map((x, i) => '<button type="button" data-t="' + x.k + '"' + (i === 0 ? ' class="on"' : '') + '>' + x.nhan + ' <small>' + x.ds.length + '</small></button>').join('') + '</div>' : '';
  const strip = tong > 1 ? '<div class="gs">' + bo.map((x, bi) => x.ds.map((u, n) => '<a href="' + src(u) + '" data-s="' + src(u) + '" data-k="' + x.k + '"' + (n === 0 ? ' data-lb="' + (x.ngan || x.nhan) + '"' : '') + (bi === 0 && n === 0 ? ' class="on"' : '') + '><img loading="lazy" src="' + src(u) + '" alt="' + esc(x.alt + ' ' + ten + (x.ds.length > 1 ? ' (' + (n + 1) + ')' : '')) + '" width="72" height="72"></a>').join('')).join('') + '</div>' : '';
  return '<div class="gal"><img class="anh" id="gA" src="' + src(bo[0].ds[0]) + '" alt="' + esc(bo[0].alt + ' ' + ten) + '" width="900" height="900">' + tab + strip + '</div>' + (strip ? '<script>' + GAL_JS + '</script>' : '');
}

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
  const kho = s.kho, ds = kho.dongtamshop;
  const hang = [['Mã sản phẩm', r.ma], ['Kích thước', kich], ['Xương gạch', xuong], ['Bề mặt', nhan(men)], ['Hoa văn', nhan(t.hoaVan).replace(/^Vân /, 'Vân ')], ['Màu sắc', nhan(t.mau)], ['Công năng', nhan(t.congNang)], ['Tính năng', nhan(t.tinhNang) === 'Đặc thù' ? '' : nhan(t.tinhNang)],
    ['Bộ sưu tập', kho.boSuuTap ? nhan(kho.boSuuTap) : ''],
    ['Không gian phù hợp', ds && ds.khongGian && ds.khongGian.length ? ds.khongGian.filter((v, j, a) => a.findIndex(z => z.toLowerCase() === v.toLowerCase()) === j).slice(0, 8).join(', ') : ''],
    ['Quy cách', ds && ds.vienThung ? ds.vienThung + ' viên/thùng = ' + String(ds.m2Thung).replace('.', ',') + ' m²' : '']].filter(x => x[1]);
  const nhanHtml = (kho.moi ? '<span class="nhan moi">Mới</span>' : '') + (kho.chuLuc ? '<span class="nhan">Bán chạy</span>' : '');
  const loi = KT.loiKhuyen(t);
  const khoiLoi = loi.length ? '<h2>Gợi ý chọn và sử dụng</h2><div class="loi">' + loi.map(x => '<p>' + esc(x) + '</p>').join('') + '</div>' : '';
  const lienQuan = (baiTheoSp[String(r.ma).toUpperCase()] || baiTheoSp[String(r.sap)] || []).slice(0, 3);
  const khoiBai = lienQuan.length ? '<h2>Bài viết liên quan</h2><ul class="ds">' + lienQuan.map(b => '<li><a href="../bai-viet/' + b.slug + '.html">' + esc(b.ten) + '</a></li>').join('') + '</ul>' : '';
  const canh = s.ngung ? '<div class="canh">Mã này đã được công ty đưa vào diện ngưng sản xuất hoặc bỏ mẫu, có thể chỉ còn một ít tại đại lý. Anh/chị nên xem các mẫu tương tự bên dưới.</div>' : '';
  // gợi ý cùng khổ (chỉ mã đang kinh doanh)
  const cungAll = spKD.filter(x => x !== s && x.w === s.w && x.h === s.h && x.img), off = (i * 3) % Math.max(1, cungAll.length - 4);
  const cung = s.ngung ? cungAll.slice(0, 4) : cungAll.slice(0, 4).length < 4 ? cungAll : cungAll.slice(off, off + 4);
  // bộ ảnh theo thứ tự ưu tiên: Thẻ sản phẩm (banner của công ty) -> Ảnh thực tế (Sale tool) -> Mặt gạch (Face)
  let khoiAnh = boAnh([{ k: 'the', nhan: 'Thẻ sản phẩm', ngan: 'Thẻ', alt: 'Thẻ sản phẩm', ds: s.the }, { k: 'thuc', nhan: 'Ảnh thực tế', ngan: 'Thực tế', alt: 'Ảnh thực tế', ds: s.thuc }, { k: 'face', nhan: 'Mặt gạch (Face)', ngan: 'Face', alt: 'Mặt gạch', ds: s.faces }], ten, '../');
  if (!khoiAnh && s.img) khoiAnh = '<img class="anh" src="' + esc(s.img) + '" alt="' + esc(ten) + '" width="900" height="900" onerror="this.style.display=\'none\'">';
  const body = `<div class="hero"><div class="wrap"><small>Gạch ${xuong} · ${kich}</small><h1>${esc(ten)}</h1><p>${esc(mota)}${kk ? '. Có men Nano kháng khuẩn.' : '.'}</p></div></div>
<div class="wrap"><div class="sp"><div>${khoiAnh}</div>
<div>${nhanHtml}<div class="gia">${tien(r.le)} đ/m² <small>giá lẻ niêm yết tham khảo (đã gồm VAT), cập nhật ${NGAY}</small></div>${canh}
<table>${hang.map(h => '<tr><td>' + esc(h[0]) + '</td><td>' + esc(h[1]) + '</td></tr>').join('')}</table>
<a class="nut" href="${SITE}/?sp=${r.sap}">Xem giá, đại lý có mẫu thật</a><a class="nut v" href="${SITE}/?sp=${r.sap}#dai-ly">Nhắn đại lý gần bạn</a>
<p class="ghi">Giá chỉ để tham khảo, đại lý báo giá chính xác và chiết khấu theo công trình. Màu trên ảnh có thể khác thực tế do màn hình: nên xem mẫu thật và chọn cùng số lô.</p></div></div>
${khoiLoi}<h2>Vật tư đi kèm</h2><p class="ghi" style="font-size:15px">Ốp lát đẹp và bền cần đúng keo dán và bột chà ron: xem <a href="../keo/">keo dán gạch GECKO và bột chà ron GROUTEX</a> của Đồng Tâm.</p>${khoiBai}
${cung.length ? '<h2>Gạch cùng khổ ' + kich + '</h2><div class="luoi">' + cung.map(c => '<a class="the" href="' + c.slug + '.html">' + (c.kho.moi ? '<i class="nh">Mới</i>' : '') + cardAnh(c, '../', esc('Gạch ' + c.ten)) + '<span>' + esc(c.ten) + '<small>' + tien(c.r.le) + ' đ/m²</small></span></a>').join('') + '</div>' : ''}
<p class="ghi"><a href="./">← Tất cả gạch Đồng Tâm</a> · <a href="kich-thuoc-${s.w}x${s.h}.html">Gạch ${kich}</a></p></div>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: ten, sku: String(r.sap), mpn: r.ma, brand: { '@type': 'Brand', name: 'Đồng Tâm' }, category: 'Gạch ' + xuong, description: desc, image: (s.the.slice(0, 1).concat(s.thuc.slice(0, 2)).concat(s.faces.slice(0, 1)).length ? s.the.slice(0, 1).concat(s.thuc.slice(0, 2)).concat(s.faces.slice(0, 1)).map(absImg) : (s.img ? [absImg(s.img)] : undefined)) };
  fs.writeFileSync(path.join(dir, s.slug + '.html'), khung({ title, desc, url, og: 'product', img: absImg(s.the[0] || s.thuc[0] || s.img), body, ld, noindex: s.ngung }));
  if (!s.ngung) urls.push(url);
});

// ---- trang theo kích thước + trang danh mục
const nhom = {}; spKD.forEach(s => { (nhom[s.w + 'x' + s.h] = nhom[s.w + 'x' + s.h] || []).push(s); });
const the = c => '<a class="the" href="' + c.slug + '.html">' + (c.kho.moi ? '<i class="nh">Mới</i>' : '') + cardAnh(c, '../', esc('Gạch ' + c.ten + ' ' + c.w + 'x' + c.h)) + '<span>' + esc(c.ten) + '<small>' + c.w + 'x' + c.h + ' · ' + tien(c.r.le) + ' đ/m²</small></span></a>';
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
const titleI = 'Gạch Đồng Tâm: ' + spKD.length + ' mẫu gạch ốp lát theo khổ, màu, giá tham khảo';
const descI = 'Danh mục gạch Porcelain và Ceramic Đồng Tâm: các khổ 60x60, 80x80, 30x60, 40x80... Xem ảnh mặt gạch, giá lẻ tham khảo và đại lý có mẫu thật gần bạn.';
fs.writeFileSync(path.join(dir, 'index.html'), khung({ title: titleI, desc: descI, url: '/gach/', img: absImg('anh/bia-tong-hop.jpg'), body: '<div class="hero"><div class="wrap"><small>Danh mục</small><h1>Gạch ốp lát Đồng Tâm</h1><p>Chọn theo khổ gạch, rồi xem từng mẫu: ảnh mặt gạch, thông số, giá lẻ tham khảo và đại lý có mẫu thật.</p></div></div><div class="wrap"><h2>Theo kích thước</h2><div class="chip">' + ks.map(k => '<a href="kich-thuoc-' + k + '.html">' + k + ' cm <small>' + nhom[k].filter(x => x.img).length + ' mẫu</small></a>').join('') + '</div><h2>Mẫu bán chạy và mẫu mới</h2><div class="luoi">' + spKD.filter(x => x.imgLocal && x.kho.uuTien).slice(0, 12).map(the).join('') + '</div></div>' })); urls.push('/gach/');

// ---- ngói, keo, ron
require('./build-ngoi-keo.js')({ fs, path, R, SITE, NGAY, khung, esc, tien, absImg, boAnh, urls, G, THE });

// ---- trang bài viết + trang danh sách bài viết
const bdir = path.join(R, 'bai-viet'); fs.rmSync(bdir, { recursive: true, force: true });
if (bai.length) {
  fs.mkdirSync(bdir, { recursive: true });
  const tim = m => { m = String(m).trim().toUpperCase(); return sp.find(x => String(x.r.ma).toUpperCase() === m || String(x.r.sap) === m); };
  const theB = c => '<a class="the" href="../gach/' + c.slug + '.html">' + (c.kho.moi ? '<i class="nh">Mới</i>' : '') + cardAnh(c, '../', esc('Gạch ' + c.ten + ' ' + c.w + 'x' + c.h)) + '<span>' + esc(c.ten) + '<small>' + c.w + 'x' + c.h + ' · ' + tien(c.r.le) + ' đ/m²</small></span></a>';
  bai.forEach(b => {
    const dsSp = b.sp.map(tim).filter(Boolean), url = '/bai-viet/' + b.slug + '.html';
    const thamKhao = dsSp.length ? '<h2>Mẫu gạch được nhắc trong bài</h2><div class="luoi">' + dsSp.map(theB).join('') + '</div>' : '';
    const anh = (dsSp.find(x => x.img) || {}), tu = b.nd.split(/\s+/).length, phut = Math.max(1, Math.round(tu / 190));
    const ctx = { tim, the: theB };
    const phan = b.nd.split(/\n(?=## )/), dau = /^## /.test(phan[0]) ? '' : phan.shift();
    const cacKhoi = phan.map(p => {
      const m = p.match(/^## (.*)\n?([\s\S]*)$/), tieu = m[1], nd = m[2];
      const lop = /^Vấn đề/i.test(tieu) ? ['k1', '01'] : /^Giải pháp/i.test(tieu) ? ['k2', '02'] : /^Kết quả/i.test(tieu) ? ['k3', '03'] : ['k1', ''];
      return '<section class="khoi ' + lop[0] + '"><div class="tr"><h2>' + (lop[1] ? '<span class="so">' + lop[1] + '</span>' : '') + inl(tieu) + '</h2>' + mdHtml(nd, ctx) + '</div></section>';
    }).join('');
    const imgTag = anh.img ? '<img src="' + (anh.imgLocal ? '../' + anh.imgLocal : esc(anh.img)) + '" alt="' + esc('Gạch ' + anh.ten) + '" onerror="this.style.display=\'none\'">' : '';
    const body = '<div class="hero"><div class="wrap bv-hero"><div><small>Bài viết' + (b.nhom ? ' · ' + esc(b.nhom) : '') + '</small><h1>' + esc(b.ten) + '</h1><div class="bv-meta">' + (b.ngay ? esc(b.ngay.split('-').reverse().join('/')) + ' · ' : '') + 'Đọc khoảng ' + phut + ' phút</div></div>' + imgTag + '</div></div>'
      + '<div class="wrap"><div class="tomtat"><b>Tóm tắt nhanh</b>' + inl(b['tom-tat'] || b['mo-ta'] || '') + '</div></div>'
      + (dau.trim() ? '<div class="khoi k1" style="padding-bottom:0"><div class="tr">' + mdHtml(dau, ctx) + '</div></div>' : '')
      + cacKhoi
      + '<div class="wrap">' + thamKhao + '<p class="ghi">Giá và chương trình thay đổi theo từng thời điểm; đại lý báo giá chính xác và chiết khấu theo công trình. <a href="./">← Tất cả bài viết</a></p></div>';
    const img = dsSp.length ? absImg(dsSp[0].img) : absImg('anh/bia-tong-hop.jpg');
    const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: b.ten, description: b['mo-ta'] || '', datePublished: b.ngay || undefined, image: [img], inLanguage: 'vi' };
    fs.writeFileSync(path.join(bdir, b.slug + '.html'), khung({ title: b.ten, desc: (b['mo-ta'] || b.ten).slice(0, 158), url, og: 'article', img, body, ld, noindex: !!b.nhap }));
    if (!b.nhap) urls.push(url);
  });
  const bodyI = '<div class="hero"><div class="wrap"><small>Kiến thức</small><h1>Bài viết về gạch, ngói, keo Đồng Tâm</h1><p>Cách chọn gạch theo không gian, màu sắc, bề mặt và công năng, kèm link đến từng mẫu.</p></div></div><div class="wrap"><ul class="ds" style="list-style:none;margin:14px 0 0">' + bai.map(b => '<li style="margin:14px 0"><a href="' + b.slug + '.html" style="font-weight:800;font-size:17px">' + esc(b.ten) + '</a><br><span class="ghi" style="margin:0">' + esc(b['mo-ta'] || '') + (b.ngay ? ' · ' + esc(b.ngay) : '') + '</span></li>').join('') + '</ul></div>';
  fs.writeFileSync(path.join(bdir, 'index.html'), khung({ title: 'Bài viết về gạch, ngói, keo Đồng Tâm: cách chọn, ứng dụng, tư vấn', desc: 'Kiến thức chọn gạch ốp lát Đồng Tâm theo không gian, màu sắc, bề mặt, công năng, kèm link xem giá lẻ tham khảo từng mẫu.', url: '/bai-viet/', img: absImg('anh/bia-tong-hop.jpg'), body: bodyI })); urls.push('/bai-viet/');
}

// ---- sitemap + robots
const ngay = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(R, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ['/'].concat(urls).map(u => '<url><loc>' + SITE + u + '</loc><lastmod>' + ngay + '</lastmod></url>').join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(R, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /chao-cong-trinh.html\nDisallow: /ct.html\nDisallow: /to-roi.html\nSitemap: ' + SITE + '/sitemap.xml\n');
console.log('san pham:', sp.length, '(dang kinh doanh', spKD.length, ', uu tien', spKD.filter(x => x.kho.uuTien).length, ') trang trong sitemap:', urls.length, 'site:', SITE);
