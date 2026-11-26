// Tra cứu sản phẩm thật trong kho dữ liệu để viết bài (không được bịa mã).
// Ví dụ:  node tools/tim-sp.js --hoaVan "VÂN_GỖ" --limit 8
//         node tools/tim-sp.js --men "MỜ" --kc 600x600 --khangKhuan
// Lọc: --mau --hoaVan --men --kc --congNang --loai (porcelain|ceramic) --boSuuTap --khongGian (chữ trong cột không gian) --khangKhuan --moi --limit
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const kho = JSON.parse(fs.readFileSync(path.join(R, 'data', 'san-pham.json'), 'utf8')).sp;
const a = process.argv.slice(2), o = {}; for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { const k = a[i].slice(2), v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; o[k] = v; } }
const re = v => new RegExp(String(v), 'i');
let ds = kho.filter(x => x.dangKD);
if (o.mau) ds = ds.filter(x => re(o.mau).test(x.mau));
if (o.hoaVan) ds = ds.filter(x => re(o.hoaVan).test(x.hoaVan));
if (o.men) ds = ds.filter(x => re(o.men).test(x.men));
if (o.kc) ds = ds.filter(x => x.kc === o.kc);
if (o.congNang) ds = ds.filter(x => re(o.congNang).test(x.congNang));
if (o.loai) ds = ds.filter(x => x.loai === o.loai);
if (o.boSuuTap) ds = ds.filter(x => re(o.boSuuTap).test(x.boSuuTap));
if (o.khongGian) ds = ds.filter(x => x.dongtamshop && x.dongtamshop.khongGian.some(g => re(o.khongGian).test(g)));
if (o.khangKhuan) ds = ds.filter(x => x.khangKhuan);
if (o.moi) ds = ds.filter(x => x.moi);
ds.sort((p, q) => (q.uuTien ? 1 : 0) - (p.uuTien ? 1 : 0) || (p.hangBanChay || 9999) - (q.hangBanChay || 9999));
console.log('Tim thay', ds.length, 'ma dang kinh doanh (uu tien len truoc)');
ds.slice(0, +o.limit || 10).forEach(x => console.log([x.ma, x.kc, x.loai, x.men, x.hoaVan, x.mau, x.boSuuTap, x.moi ? 'MOI' : '', x.chuLuc ? 'BAN CHAY' : '', x.dongtamshop ? 'KG:' + x.dongtamshop.khongGian.slice(0, 4).join('/') : ''].filter(Boolean).join(' | ')));
