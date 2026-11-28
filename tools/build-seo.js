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
function tenMau(ma) {
  let t = String(ma).toUpperCase(); const loai = (t.match(/\s*LO[ẠA]I\s*(\d)/) || [])[1]; t = t.replace(/\s*LO[ẠA]I\s*\d.*$/, '');
  const goc = t, c = t.replace(/^(?:DTD|DTS|CT|D)?\d+/, ''), k = c.match(/^([A-Z]+?)[-_ ]?(\d+)/);
  const r = k ? k[1] + ' ' + k[2] : (c || goc).replace(/-.*$/, '');
  return loai ? r + ' (loại ' + loai + ')' : r;
}
const MEN = { 'BÓNG': 'men bóng', 'MỜ': 'men mờ', 'DOUBLE_CHARGE': 'double charge', 'ĐỒNG_CHẤT': 'đồng chất' };
const cuaGoc = u => { u = String(u || ''); const m = u.match(/\/d\/([\w-]+)/) || u.match(/id=([\w-]+)/); return m ? 'https://lh3.googleusercontent.com/d/' + m[1] + '=w900' : ''; };

// ---- chuẩn bị danh sách sản phẩm
const sp = [], dung = {};
G.gach.data.filter(r => r.le > 0).forEach(r => {
  const k = khoa(r.ma), m = String(r.kc || '').match(/(\d+)x(\d+)/i); if (!m) return;
  let slug = 'gach-' + tenMau(r.ma).toLowerCase().replace(/\(loại (\d)\)/, 'loai-$1').replace(/\s+/g, '-') + '-' + m[1] / 10 + 'x' + m[2] / 10;
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
.sp>div{min-width:0}img[src=""]{visibility:hidden}.gal{display:block}
/* ---- bài viết: giao diện máy tính hai cột ---- */
.gopy{background:#fff;border:1px solid var(--vien);border-radius:16px;padding:24px 26px;margin:6px 18px 26px}.gopy h2{margin:0 0 4px;font-size:22px}.gopy p{margin:6px 0 12px;font-size:15.5px}.gopy small{display:block;margin-top:12px;color:var(--phu);font-size:12.5px;line-height:1.5}
.gy-nut{display:flex;gap:10px;flex-wrap:wrap}.gy-nut button{font:inherit;font-weight:700;font-size:14.5px;padding:10px 18px;border-radius:99px;border:1.5px solid var(--vien);background:#fff;cursor:pointer;color:var(--ruou)}.gy-nut button.on{background:var(--ruou);border-color:var(--ruou);color:#fff}
.gy-form{margin-top:14px}.gy-form[hidden]{display:none}.gy-form textarea{width:100%;font:inherit;font-size:15px;padding:12px 14px;border:1.5px solid var(--vien);border-radius:12px;resize:vertical;min-height:96px;background:#F9FAFB}.gy-form textarea:focus{outline:2px solid var(--do);outline-offset:1px;background:#fff}.gy-hang{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.gy-hang .nut{margin:0;min-height:44px}.gy-ok{margin:10px 0 0!important;font-size:14px!important;color:#15803D;font-weight:700}.gy-ok[hidden]{display:none}
.pbar{position:fixed;top:0;left:0;height:3px;width:0;background:var(--do);z-index:80}
.khoi h3{font-family:'Be Vietnam Pro',Arial,sans-serif;font-size:19px;font-weight:800;color:var(--ruou);margin:30px 0 8px;display:flex;align-items:center;gap:10px;line-height:1.35}
.khoi h3 .n{flex:0 0 30px;width:30px;height:30px;border-radius:50%;background:var(--do);color:#fff;font-size:14px;display:inline-flex;align-items:center;justify-content:center}
.khoi.k3 h3{color:#fff}.khoi figure{margin:22px 0!important}.khoi figcaption{font-size:13px!important;color:var(--phu)!important;margin-top:8px!important}.khoi.k3 figcaption{color:#CBD5E1!important}
.khoi .luoi{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))!important}
.bv-side{display:none}
/* chữ đọc bài: thân bài chữ có chân (Source Serif 4) dễ đọc lâu, tiêu đề và giao diện chữ không chân đậm (Be Vietnam Pro) */
.khoi p,.khoi li{font-family:'Source Serif 4',Georgia,'Times New Roman',serif;color:#2B3441;font-size:18px;line-height:1.8;letter-spacing:0}
.khoi.k3 p,.khoi.k3 li{color:#E5E7EB}
.khoi p b,.khoi li b{font-weight:700;color:#111827}.khoi.k3 p b,.khoi.k3 li b{color:#fff}
.khoi h2,.bv-hero h1{font-family:'Be Vietnam Pro',Arial,sans-serif;font-weight:800;letter-spacing:-.012em}
.bv-hero h1{font-size:clamp(26px,5.4vw,38px);line-height:1.22}
.khoi h2{font-size:clamp(23px,4.6vw,28px);line-height:1.28}
.tomtat{font-family:'Source Serif 4',Georgia,serif;font-size:17.5px;line-height:1.7}.tomtat b{font-family:'Be Vietnam Pro',Arial,sans-serif}
.khoi .cuon,.khoi table{font-family:'Be Vietnam Pro',Arial,sans-serif}
.bk{max-width:1180px;margin:8px auto 0;padding:0 18px}.bk-luoi{display:grid;gap:14px;grid-template-columns:1fr}.bk-luoi a{display:flex;flex-direction:column;gap:4px;background:#fff;border:1px solid var(--vien);border-radius:14px;padding:16px 18px;text-decoration:none}.bk-luoi a:hover{border-color:var(--do)}.bk-luoi small{color:var(--do);font-weight:800;font-size:11.5px;letter-spacing:.8px;text-transform:uppercase}.bk-luoi b{font-size:16.5px;line-height:1.4;color:var(--ruou)}.bk-luoi span{font-size:13.5px;color:var(--phu);line-height:1.5}
@media(min-width:1024px){
.bvp .top .wrap{max-width:1180px;padding:0 24px}
.bv-hero{grid-template-columns:1.05fr .95fr;gap:48px}.hero .bv-hero h1{font-size:38px}.bv-hero img{aspect-ratio:16/10;max-height:none;height:auto;object-fit:cover}
.hero{padding:34px 0 38px}.hero .wrap{max-width:1180px;padding:0 24px}
.bv-wrap{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:40px;max-width:1180px;margin:0 auto;padding:30px 24px 0;align-items:start}
.bv-main .tt-wrap{padding:0;max-width:none}.bv-main .tomtat{max-width:none;margin:0 0 24px;font-size:17px}
.bv-main .khoi{background:#fff;border:1px solid var(--vien);border-radius:18px;padding:36px 44px;margin:0 0 24px}
.bv-main .khoi.k3{background:linear-gradient(160deg,#2A3342,#111827);border-color:#111827}
.bv-main .khoi .tr{max-width:none;margin:0;padding:0}
.bv-main .khoi p,.bv-main .khoi li{font-size:18.5px;line-height:1.85}.bv-main .khoi p{margin:12px 0}
.bv-main .khoi h2{font-size:29px}
.bv-main .tt-wrap .ghi{margin:0 0 28px}
  .bv-tk{display:none}
.gopy{margin:0 0 24px}
.bv-side{display:grid;gap:14px;position:sticky;top:16px}
.mucluc,.side-mau{background:#fff;border:1px solid var(--vien);border-radius:14px;padding:16px 18px}
.mucluc b,.side-mau b{display:block;font-size:12.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--phu);margin-bottom:6px}
.mucluc ol{list-style:none;margin:0;padding:0}.mucluc a{display:block;padding:5px 0 5px 12px;border-left:3px solid var(--vien);font-size:14px;line-height:1.4;color:var(--phu);text-decoration:none}.mucluc a.h3{padding-left:26px;font-size:13px}.mucluc a:hover{color:var(--chu)}.mucluc a.on{color:var(--do);border-left-color:var(--do);font-weight:700}
.side-mau a{display:flex;gap:11px;align-items:center;padding:6px 0;text-decoration:none;border-top:1px solid var(--vien)}.side-mau b+a{border-top:0}.side-mau i{flex:0 0 46px;height:46px;border-radius:10px;background-color:#E5E7EB;background-repeat:no-repeat;display:block}.side-mau span{font-weight:800;font-size:14px;line-height:1.3}.side-mau small{display:block;font-weight:500;color:var(--phu);font-size:12.5px;margin-top:2px}.side-mau a:hover span{color:var(--do)}
.side-cta{background:linear-gradient(160deg,#2A3342,#111827);color:#fff;border-radius:14px;padding:16px 18px 18px}.side-cta b{display:block;font-family:'Be Vietnam Pro',Arial,sans-serif;font-weight:800;font-size:16px;margin-bottom:4px}.side-cta p{display:none}.side-cta .nut{width:100%;margin:10px 0 0;min-height:44px}
.bk{padding:0 24px;margin-top:14px}.bk-luoi{grid-template-columns:repeat(3,1fr);gap:18px}
}

.gm{position:relative}.gm img.anh{cursor:zoom-in;display:block}.gn{position:absolute;right:10px;top:10px;background:rgba(17,24,39,.78);color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px}
.gp,.gx{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.92);box-shadow:0 2px 10px rgba(0,0,0,.22);font-size:24px;line-height:1;cursor:pointer;color:#1F2937;padding:0}.gp{left:8px}.gx{right:8px}
.lb{display:none;position:fixed;inset:0;z-index:100;background:rgba(10,12,18,.95);align-items:center;justify-content:center}.lb.on{display:flex}.lb img{max-width:100%;max-height:100%;object-fit:contain}
img.anh-bv{cursor:zoom-in}.lb .lbcap{position:absolute;left:0;right:0;bottom:0;padding:26px 18px 16px;color:#E5E7EB;font-size:14px;line-height:1.45;text-align:center;background:linear-gradient(transparent,rgba(0,0,0,.75));pointer-events:none}
.lb.to{display:block;overflow:auto;-webkit-overflow-scrolling:touch}.lb.to img{max-width:none;max-height:none;width:220%;cursor:zoom-out}.lb.to .lbcap,.lb.to .lbp,.lb.to .lbn{display:none}.lb .lbx{position:fixed}
@media(min-width:900px){.lb.to img{width:160%}}
.lbx{position:absolute;top:10px;right:12px;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;font-size:28px;line-height:1;cursor:pointer;z-index:2}
.lbp,.lbn{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;font-size:28px;line-height:1;cursor:pointer;z-index:2}.lbp{left:8px}.lbn{right:8px}
.lbc{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:#fff;font-size:13px;font-weight:700;background:rgba(0,0,0,.4);padding:3px 12px;border-radius:99px}
.dinh{display:none}
@media(max-width:700px){
.top .wrap{min-height:46px;gap:12px;flex-wrap:nowrap}.top b{flex:0 0 auto}.top nav{overflow-x:auto;flex-wrap:nowrap;white-space:nowrap;scrollbar-width:none;gap:14px}.top nav::-webkit-scrollbar{display:none}
.gal .gt{overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none;margin-top:10px}.gt::-webkit-scrollbar{display:none}.gal .gt button{white-space:nowrap;flex:0 0 auto;padding:7px 13px;font-size:13px}
.gal .gs{flex-wrap:nowrap;overflow-x:auto;scroll-snap-type:x proximity;padding-bottom:4px;scrollbar-width:none}.gs::-webkit-scrollbar{display:none}.gal .gs a{flex:0 0 auto;scroll-snap-align:center}
.gp,.gx{width:34px;height:34px;font-size:20px}
.sp{padding:14px 0 18px}
.hero{padding:16px 0 18px}
body{padding-bottom:72px}
.dinh{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:60;background:#fff;border-top:1px solid var(--vien);padding:8px 14px;gap:12px;align-items:center;box-shadow:0 -6px 22px rgba(17,24,39,.1)}
.dinh .g{flex:1;font-weight:900;color:var(--do);font-size:18px;line-height:1.15}.dinh .g small{display:block;font-size:11.5px;color:var(--phu);font-weight:500}
.dinh a.nut{margin:0;min-height:46px;padding:0 20px;flex:0 0 auto}
}
.gt{display:flex;gap:8px;margin:12px 0 0}.gt button{font:inherit;font-weight:700;font-size:14px;padding:8px 16px;border-radius:99px;border:1px solid var(--vien);background:#fff;color:var(--ruou);cursor:pointer}.gt button.on{background:var(--ruou);color:#fff;border-color:var(--ruou)}
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
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;800&family=Playfair+Display:wght@600;700&family=Source+Serif+4:wght@400;600;700&display=swap">
<style>${CSS}</style>${o.ld ? '<script type="application/ld+json">' + JSON.stringify(o.ld) + '</script>' : ''}</head><body${o.cls ? ' class="' + o.cls + '"' : ''}>
<div class="top"><div class="wrap"><b>Dongtam</b><nav><a href="${SITE}/">Chọn gạch theo ngân sách</a><a href="${SITE}/gach/">Gạch</a><a href="${SITE}/ngoi/">Ngói</a><a href="${SITE}/keo/">Keo và ron</a><a href="${SITE}/kinh/">Gạch kính</a>${bai.length ? '<a href="' + SITE + '/bai-viet/">Bài viết</a>' : ''}<a href="${SITE}/#dai-ly">Đại lý gần bạn</a></nav></div></div>
${o.body}
<footer><div class="wrap"><p>${KHONG_CHINH_THUC}</p><p style="margin-top:8px">${GOP_Y}</p></div></footer>${o.dinh ? '<div class="dinh"><div class="g">' + o.dinh.gia + '<small>giá lẻ tham khảo</small></div><a class="nut" href="' + o.dinh.href + '">Nhắn đại lý</a></div>' : ''}</body></html>`;
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
    // ảnh minh hoạ trong bài: {{anh:thu-muc/file.webp|chú thích}}, file nằm ở anh/bai-viet/
    if ((m = t.match(/^\{\{anh:([^|}]+)(?:\|([^}]*))?\}\}$/))) { dong(); const cap = (m[2] || '').trim(); out.push('<figure style="margin:16px 0"><img class="anh-bv" title="Bấm để xem ảnh lớn" loading="lazy" src="../anh/bai-viet/' + esc(m[1].trim()) + '" alt="' + esc(cap) + '" style="width:100%;height:auto;border-radius:12px;display:block">' + (cap ? '<figcaption style="font-size:13px;color:#6b625b;margin-top:6px;line-height:1.45">' + inl(cap) + '</figcaption>' : '') + '</figure>'); return; }
    if ((m = t.match(/^\{\{sp:([^}]+)\}\}$/))) { if (ul) dong(); const s = ctx.tim(m[1]); if (s) the.push(ctx.the(s)); return; }
    if ((m = t.match(/^\*\*(\d+)\.\s+(.+?)\*\*$/))) { dong(); const id = 'm-' + (ctx.id = (ctx.id || 0) + 1); (ctx.toc = ctx.toc || []).push({ id, t: m[1] + '. ' + m[2], l: 3 }); out.push('<h3 id="' + id + '"><span class="n">' + m[1] + '</span>' + inl(m[2]) + '</h3>'); return; }
    if ((m = t.match(/^(#{2,3})\s+(.*)$/))) { dong(); if (m[1].length === 3) { const id = 'm-' + (ctx.id = (ctx.id || 0) + 1); (ctx.toc = ctx.toc || []).push({ id, t: m[2], l: 3 }); out.push('<h3 id="' + id + '">' + inl(m[2]) + '</h3>'); } else out.push('<h2>' + inl(m[2]) + '</h2>'); return; }
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
const GAL_JS = "(function(){var A=document.getElementById(\"gA\");if(!A)return;var box=document.querySelector(\".gs\"),as=box?box.querySelectorAll(\"a\"):[],tb=document.querySelectorAll(\".gt button\"),N=document.getElementById(\"gN\"),cur=0,lb=null,lbi=null,lbOn=false;function swipe(el,fn){var x0=null,y0=0;el.addEventListener(\"touchstart\",function(e){x0=e.touches[0].clientX;y0=e.touches[0].clientY;},{passive:true});el.addEventListener(\"touchend\",function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.5){fn(dx<0?1:-1);}},{passive:true});}function lbShow(){lbi.src=as[cur].getAttribute(\"data-s\");lb.querySelector(\".lbc\").textContent=(cur+1)+\" / \"+as.length;}function bat(i){if(!as.length)return;if(i<0)i=as.length-1;if(i>=as.length)i=0;cur=i;var a=as[i];for(var k=0;k<as.length;k++){as[k].classList.toggle(\"on\",k===i);}A.src=a.getAttribute(\"data-s\");var t=a.getAttribute(\"data-k\");for(var j=0;j<tb.length;j++){tb[j].classList.toggle(\"on\",tb[j].getAttribute(\"data-t\")===t);}if(N)N.textContent=(i+1)+\"/\"+as.length;if(box){box.scrollLeft=a.offsetLeft-(box.clientWidth-a.offsetWidth)/2;}if(lbOn)lbShow();}function lbClose(){lbOn=false;if(lb)lb.classList.remove(\"on\");document.body.style.overflow=\"\";}function lbOpen(){if(!lb){lb=document.createElement(\"div\");lb.className=\"lb\";lb.innerHTML='<button type=\"button\" class=\"lbx\" aria-label=\"Đóng\">×</button><button type=\"button\" class=\"lbp\" aria-label=\"Ảnh trước\">‹</button><img alt=\"\"><button type=\"button\" class=\"lbn\" aria-label=\"Ảnh sau\">›</button><span class=\"lbc\"></span>';document.body.appendChild(lb);lbi=lb.querySelector(\"img\");lb.querySelector(\".lbx\").onclick=lbClose;lb.querySelector(\".lbp\").onclick=function(){bat(cur-1);};lb.querySelector(\".lbn\").onclick=function(){bat(cur+1);};lb.onclick=function(e){if(e.target===lb)lbClose();};swipe(lb,function(d){bat(cur+d);});}lbOn=true;lb.classList.add(\"on\");document.body.style.overflow=\"hidden\";lbShow();}if(as.length){box.onclick=function(e){var a=e.target.closest(\"a\");if(!a)return;e.preventDefault();for(var i=0;i<as.length;i++){if(as[i]===a){bat(i);break;}}};for(var k=0;k<tb.length;k++){tb[k].onclick=function(){var t=this.getAttribute(\"data-t\");for(var i=0;i<as.length;i++){if(as[i].getAttribute(\"data-k\")===t){bat(i);break;}}};}var gp=document.querySelector(\".gp\"),gx=document.querySelector(\".gx\");if(gp)gp.onclick=function(){bat(cur-1);};if(gx)gx.onclick=function(){bat(cur+1);};swipe(A.parentNode,function(d){bat(cur+d);});A.onclick=lbOpen;document.addEventListener(\"keydown\",function(e){if(!lbOn)return;if(e.key===\"Escape\")lbClose();else if(e.key===\"ArrowRight\")bat(cur+1);else if(e.key===\"ArrowLeft\")bat(cur-1);});}})();";
// Bài viết: bấm ảnh minh hoạ để xem toàn màn hình; chạm/bấm vào ảnh lớn để phóng to xem chi tiết vân, ron (kéo để xem); vuốt hoặc ‹ › để chuyển ảnh; Esc/× để đóng.
function anhBaiViet() {
  var ds = document.querySelectorAll('img.anh-bv'); if (!ds.length) return;
  var lb, im, cap, cur = 0;
  function hien() { var a = ds[cur]; im.src = a.currentSrc || a.src; im.alt = a.alt; cap.textContent = a.alt + (ds.length > 1 ? '  (' + (cur + 1) + '/' + ds.length + ')' : '') + '  · Chạm vào ảnh để phóng to'; lb.classList.remove('to'); }
  function chuyen(d) { cur = (cur + d + ds.length) % ds.length; hien(); }
  function dong() { lb.classList.remove('on', 'to'); document.body.style.overflow = ''; }
  function mo(i) {
    if (!lb) {
      lb = document.createElement('div'); lb.className = 'lb';
      lb.innerHTML = '<button type="button" class="lbx" aria-label="Đóng">×</button>' + (ds.length > 1 ? '<button type="button" class="lbp" aria-label="Ảnh trước">‹</button><button type="button" class="lbn" aria-label="Ảnh sau">›</button>' : '') + '<img alt=""><div class="lbcap"></div>';
      document.body.appendChild(lb); im = lb.querySelector('img'); cap = lb.querySelector('.lbcap');
      lb.querySelector('.lbx').onclick = function (e) { e.stopPropagation(); dong(); };
      if (ds.length > 1) { lb.querySelector('.lbp').onclick = function (e) { e.stopPropagation(); chuyen(-1); }; lb.querySelector('.lbn').onclick = function (e) { e.stopPropagation(); chuyen(1); }; }
      im.onclick = function (e) { e.stopPropagation(); var to = !lb.classList.contains('to'); var rx = e.offsetX / im.clientWidth, ry = e.offsetY / im.clientHeight; lb.classList.toggle('to', to); if (to) { lb.scrollLeft = rx * lb.scrollWidth - lb.clientWidth / 2; lb.scrollTop = ry * lb.scrollHeight - lb.clientHeight / 2; } };
      lb.onclick = function (e) { if (e.target === lb && !lb.classList.contains('to')) dong(); };
      var x0 = null, y0 = 0;
      lb.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } else x0 = null; }, { passive: true });
      lb.addEventListener('touchend', function (e) { if (x0 === null || lb.classList.contains('to')) return; var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && ds.length > 1) chuyen(dx < 0 ? 1 : -1); }, { passive: true });
      document.addEventListener('keydown', function (e) { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') dong(); else if (e.key === 'ArrowRight') chuyen(1); else if (e.key === 'ArrowLeft') chuyen(-1); });
    }
    cur = i; lb.classList.add('on'); document.body.style.overflow = 'hidden'; hien();
  }
  ds.forEach(function (a, i) { a.addEventListener('click', function () { mo(i); }); });
}
const ANH_BV_JS = '(' + anhBaiViet.toString() + ')();';
function boAnh(bo, ten, tienTo) {
  bo = bo.filter(x => x.ds && x.ds.length); if (!bo.length) return '';
  const src = u => tienTo + u, tong = bo.reduce((n, x) => n + x.ds.length, 0);
  const tab = bo.length > 1 ? '<div class="gt">' + bo.map((x, i) => '<button type="button" data-t="' + x.k + '"' + (i === 0 ? ' class="on"' : '') + '>' + x.nhan + ' <small>' + x.ds.length + '</small></button>').join('') + '</div>' : '';
  const strip = tong > 1 ? '<div class="gs">' + bo.map((x, bi) => x.ds.map((u, n) => '<a href="' + src(u) + '" data-s="' + src(u) + '" data-k="' + x.k + '"' + (n === 0 ? ' data-lb="' + (x.ngan || x.nhan) + '"' : '') + (bi === 0 && n === 0 ? ' class="on"' : '') + '><img loading="lazy" src="' + src(u) + '" alt="' + esc(x.alt + ' ' + ten + (x.ds.length > 1 ? ' (' + (n + 1) + ')' : '')) + '" width="72" height="72"></a>').join('')).join('') + '</div>' : '';
  return '<div class="gal"><div class="gm"><img class="anh" id="gA" src="' + src(bo[0].ds[0]) + '" alt="' + esc(bo[0].alt + ' ' + ten) + '" width="900" height="900">' + (tong > 1 ? '<span class="gn" id="gN">1/' + tong + '</span><button type="button" class="gp" aria-label="Ảnh trước">‹</button><button type="button" class="gx" aria-label="Ảnh sau">›</button>' : '') + '</div>' + tab + strip + '</div>' + (strip ? '<script>' + GAL_JS + '</script>' : '');
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
  fs.writeFileSync(path.join(dir, s.slug + '.html'), khung({ title, desc, url, og: 'product', img: absImg(s.the[0] || s.thuc[0] || s.img), body, ld, noindex: s.ngung, dinh: { gia: tien(r.le) + ' đ/m²', href: SITE + '/?sp=' + r.sap + '#dai-ly' } }));
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
  const thumbMau = c => { const f = (c.the || [])[0]; return f ? '<i style="background-image:url(../' + f + ');background-size:118%;background-position:center top"></i>' : '<i style="background-image:url(' + (c.imgLocal ? '../' + c.imgLocal : esc(c.img || '')) + ');background-size:cover"></i>'; };
  const BV_JS = '(function(){var pb=document.getElementById("pbar");function pr(){var h=document.documentElement.scrollHeight-innerHeight;if(pb)pb.style.width=(h>0?Math.min(100,scrollY/h*100):0)+"%";}addEventListener("scroll",pr,{passive:true});pr();var ls=document.querySelectorAll(".mucluc a");if(!ls.length||!("IntersectionObserver" in window))return;var map={};for(var i=0;i<ls.length;i++){map[ls[i].getAttribute("href").slice(1)]=ls[i];}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){for(var k in map){map[k].classList.remove("on");}var a=map[e.target.id];if(a)a.classList.add("on");}});},{rootMargin:"-15% 0px -75% 0px"});Object.keys(map).forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el);});})();';
  const GY_JS = "(function(){var bx=document.getElementById(\"gop-y\");if(!bx)return;var tt=bx.getAttribute(\"data-t\"),vote=\"\",f=bx.querySelector(\".gy-form\"),ta=bx.querySelector(\"textarea\"),z=bx.querySelector(\".gy-zalo\"),m=bx.querySelector(\".gy-mail\"),to=bx.querySelector(\".gy-ok\");var bs=bx.querySelectorAll(\".gy-nut button\");function nd(){return \"Góp ý bài viết: \"+tt+\"\\nĐánh giá: \"+(vote===\"co\"?\"Hữu ích\":\"Chưa rõ\")+\"\\nGóp ý: \"+(ta.value||\"(chưa ghi thêm)\");}function cap(){m.href=\"mailto:lechilinh.work@gmail.com?subject=\"+encodeURIComponent(\"Góp ý bài viết: \"+tt)+\"&body=\"+encodeURIComponent(nd());}for(var i=0;i<bs.length;i++){bs[i].onclick=function(){vote=this.getAttribute(\"data-v\");for(var j=0;j<bs.length;j++){bs[j].classList.toggle(\"on\",bs[j]===this);}f.hidden=false;cap();};}ta.oninput=cap;z.onclick=function(){var t=nd();try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t);}else{ta.select();document.execCommand(\"copy\");}}catch(e){}to.textContent=\"Đã chép nội dung góp ý. Dán vào khung chat Zalo rồi gửi nhé.\";to.hidden=false;};})();";
  const gopY = ten => '<section class="gopy" id="gop-y" data-t="' + esc(ten) + '"><h2>Góp ý của bạn</h2><p>Bài viết này có giúp ích cho bạn không?</p><div class="gy-nut"><button type="button" data-v="co">👍 Hữu ích</button><button type="button" data-v="chua">🤔 Chưa rõ</button></div><div class="gy-form" hidden><textarea rows="4" placeholder="Bạn muốn bổ sung hay sửa điều gì? Ví dụ: thêm mẫu gạch, giải thích rõ hơn, sai thông tin..."></textarea><div class="gy-hang"><a class="nut gy-zalo" href="https://zalo.me/0819548908" target="_blank" rel="noopener">Gửi qua Zalo</a><a class="nut v gy-mail" href="mailto:lechilinh.work@gmail.com">Gửi qua email</a></div><p class="gy-ok" hidden></p></div><small>Góp ý về nội dung trang do anh Lê Chí Linh tiếp nhận. Mọi tư vấn, báo giá và giao hàng vẫn do đại lý Đồng Tâm thực hiện.</small></section>';
  bai.forEach(b => {
    const dsSp = b.sp.map(tim).filter(Boolean), url = '/bai-viet/' + b.slug + '.html';
    const thamKhao = dsSp.length ? '<div class="bv-tk"><h2>Mẫu gạch được nhắc trong bài</h2><div class="luoi">' + dsSp.map(theB).join('') + '</div></div>' : '';
    const anh = (dsSp.find(x => x.img) || {}), tu = b.nd.split(/\s+/).length, phut = Math.max(1, Math.round(tu / 190));
    const ctx = { tim, the: theB, toc: [], id: 0 };
    const phan = b.nd.split(/\n(?=## )/), dau = /^## /.test(phan[0]) ? '' : phan.shift();
    let nMuc = 0;
    const cacKhoi = phan.map(p => {
      const m = p.match(/^## (.*)\n?([\s\S]*)$/), tieu = m[1], nd = m[2], idm = 'muc-' + (++nMuc);
      const lop = /^Vấn đề/i.test(tieu) ? ['k1', '01'] : /^Giải pháp/i.test(tieu) ? ['k2', '02'] : /^Kết quả/i.test(tieu) ? ['k3', '03'] : ['k1', ''];
      ctx.toc.push({ id: idm, t: tieu.replace(/^(Vấn đề|Giải pháp|Kết quả)\s*:\s*/i, '$1: '), l: 2 });
      return '<section class="khoi ' + lop[0] + '"><div class="tr"><h2 id="' + idm + '">' + (lop[1] ? '<span class="so">' + lop[1] + '</span>' : '') + inl(tieu) + '</h2>' + mdHtml(nd, ctx) + '</div></section>';
    }).join('');
    // ảnh đầu bài: ưu tiên ảnh phòng trong bài, sau đó ảnh mẫu gạch
    const dsAnh = [...b.nd.matchAll(/\{\{anh:([^|}]+)/g)].map(x => x[1]), ah = dsAnh.find(x => !/so-sanh/i.test(x)) || dsAnh[0];
    const imgTag = ah ? '<img src="../anh/bai-viet/' + esc(ah.trim()) + '" alt="' + esc(b.ten) + '" onerror="this.style.display=\'none\'">'
      : (anh.img ? '<img src="' + (anh.imgLocal ? '../' + anh.imgLocal : esc(anh.img)) + '" alt="' + esc('Gạch ' + anh.ten) + '" onerror="this.style.display=\'none\'">' : '');
    const muc = '<nav class="mucluc" aria-label="Mục lục"><b>Trong bài này</b><ol>' + ctx.toc.map(x => '<li><a href="#' + x.id + '"' + (x.l === 3 ? ' class="h3"' : '') + '>' + esc(x.t) + '</a></li>').join('') + '</ol></nav>';
    const mau = dsSp.length ? '<div class="side-mau"><b>Mẫu gạch trong bài</b>' + dsSp.map(c => '<a href="../gach/' + c.slug + '.html">' + thumbMau(c) + '<span>' + esc(c.ten) + '<small>' + c.w + 'x' + c.h + ' · ' + tien(c.r.le) + ' đ/m²</small></span></a>').join('') + '</div>' : '';
    const cta = '<div class="side-cta"><b>Cần tư vấn thêm?</b><p>Đại lý Đồng Tâm gần bạn cho xem mẫu thật, tính số lượng và báo giá theo công trình.</p><a class="nut" href="' + SITE + '/#dai-ly">Nhắn đại lý gần bạn</a></div>';
    const khac = bai.filter(x => x !== b && !x.nhap).slice(0, 3);
    const khacHtml = khac.length ? '<section class="bk"><h2>Đọc thêm</h2><div class="bk-luoi">' + khac.map(x => '<a href="' + x.slug + '.html"><small>' + esc(x.nhom || 'Bài viết') + '</small><b>' + esc(x.ten) + '</b><span>' + esc(x['mo-ta'] || '') + '</span></a>').join('') + '</div></section>' : '';
    const body = '<div id="pbar" class="pbar"></div><div class="hero"><div class="wrap bv-hero"><div><small>Bài viết' + (b.nhom ? ' · ' + esc(b.nhom) : '') + '</small><h1>' + esc(b.ten) + '</h1><div class="bv-meta">' + (b.ngay ? esc(b.ngay.split('-').reverse().join('/')) + ' · ' : '') + 'Đọc khoảng ' + phut + ' phút</div></div>' + imgTag + '</div></div>'
      + '<div class="bv-wrap"><article class="bv-main">'
      + '<div class="wrap tt-wrap"><div class="tomtat"><b>Tóm tắt nhanh</b>' + inl(b['tom-tat'] || b['mo-ta'] || '') + '</div></div>'
      + (dau.trim() ? '<div class="khoi k1" style="padding-bottom:0"><div class="tr">' + mdHtml(dau, ctx) + '</div></div>' : '')
      + cacKhoi
      + '<div class="wrap tt-wrap">' + thamKhao + '<p class="ghi">Giá và chương trình thay đổi theo từng thời điểm; đại lý báo giá chính xác và chiết khấu theo công trình. <a href="./">← Tất cả bài viết</a></p></div>'
      + gopY(b.ten) + '</article><aside class="bv-side">' + muc + mau + cta + '</aside></div>' + khacHtml + '<script>' + BV_JS + GY_JS + ANH_BV_JS + '</script>';
    const img = ah ? absImg('anh/bai-viet/' + ah.trim()) : (dsSp.length ? absImg(dsSp[0].img) : absImg('anh/bia-tong-hop.jpg'));
    const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: b.ten, description: b['mo-ta'] || '', datePublished: b.ngay || undefined, image: [img], inLanguage: 'vi' };
    fs.writeFileSync(path.join(bdir, b.slug + '.html'), khung({ title: b.ten, desc: (b['mo-ta'] || b.ten).slice(0, 158), url, og: 'article', img, body, ld, noindex: !!b.nhap, cls: 'bvp' }));
    if (!b.nhap) urls.push(url);
  });
  const bodyI = '<div class="hero"><div class="wrap"><small>Kiến thức</small><h1>Bài viết về gạch, ngói, keo Đồng Tâm</h1><p>Cách chọn gạch theo không gian, màu sắc, bề mặt và công năng, kèm link đến từng mẫu.</p></div></div><div class="wrap"><ul class="ds" style="list-style:none;margin:14px 0 0">' + bai.map(b => '<li style="margin:14px 0"><a href="' + b.slug + '.html" style="font-weight:800;font-size:17px">' + esc(b.ten) + '</a><br><span class="ghi" style="margin:0">' + esc(b['mo-ta'] || '') + (b.ngay ? ' · ' + esc(b.ngay) : '') + '</span></li>').join('') + '</ul></div>';
  fs.writeFileSync(path.join(bdir, 'index.html'), khung({ title: 'Bài viết về gạch, ngói, keo Đồng Tâm: cách chọn, ứng dụng, tư vấn', desc: 'Kiến thức chọn gạch ốp lát Đồng Tâm theo không gian, màu sắc, bề mặt, công năng, kèm link xem giá lẻ tham khảo từng mẫu.', url: '/bai-viet/', img: absImg('anh/bia-tong-hop.jpg'), body: bodyI })); urls.push('/bai-viet/');
}

// ---- sitemap + robots
const ngay = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(R, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ['/'].concat(urls).map(u => '<url><loc>' + SITE + u + '</loc><lastmod>' + ngay + '</lastmod></url>').join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(R, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /chao-cong-trinh.html\nDisallow: /ct.html\nDisallow: /to-roi.html\nSitemap: ' + SITE + '/sitemap.xml\n');
// dữ liệu ảnh cho trang chủ (index.html): thẻ sản phẩm + số ảnh thực tế
(function () {
  const the = {}; Object.keys(THE.gach || {}).forEach(k => { const f = (THE.gach[k] || []).filter(x => fs.existsSync(path.join(R, x))); if (f.length) the[k] = f; });
  Object.keys(THE.ngoi || {}).forEach(k => { if (/^ngoi-(titan|alpha)-/.test(k) && fs.existsSync(path.join(R, THE.ngoi[k]))) the[k] = [THE.ngoi[k]]; });
  const thuc = {}; fs.readdirSync(path.join(R, 'anh', 'sp')).forEach(f => { const m = f.match(/^(\d+)-(\d+)\.webp$/); if (m) thuc[m[1]] = Math.max(thuc[m[1]] || 0, +m[2]); });
  fs.writeFileSync(path.join(R, 'anh-data.js'), '// Tạo tự động bởi tools/build-seo.js: ảnh thẻ sản phẩm và số ảnh thực tế (anh/sp/<mã>-n.webp)\nwindow.ANH_THE=' + JSON.stringify(the) + ';\nwindow.ANH_THUC=' + JSON.stringify(thuc) + ';\n');
})();
console.log('san pham:', sp.length, '(dang kinh doanh', spKD.length, ', uu tien', spKD.filter(x => x.kho.uuTien).length, ') trang trong sitemap:', urls.length, 'site:', SITE);
