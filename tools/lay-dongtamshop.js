// Lấy thông tin công khai (bề mặt, công năng, không gian, bộ sưu tập, số viên/thùng, còn hàng) từ dongtamshop.com
// KHÔNG lấy giá (giá lấy từ gia-snapshot.js). Chạy:  node tools/lay-dongtamshop.js   (ở thư mục web-khach)
// Kết quả: data/dongtamshop.json. Nghỉ giữa các lần tải để không làm nặng máy chủ.
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const GOC = 'https://dongtamshop.com/danh-muc/gach-ceramic-gach-porcelain';
const nghi = ms => new Promise(r => setTimeout(r, ms));
const text = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '-').replace(/\s+/g, ' ').trim();
async function tai(u) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (tham-khao-san-pham)' }, redirect: 'follow' }); if (r.ok) return await r.text(); } catch (e) { }
    await nghi(1500);
  }
  return '';
}
const khoa = s => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
(async () => {
  const out = path.join(R, 'data', 'dongtamshop.json'); fs.mkdirSync(path.dirname(out), { recursive: true });
  const kq = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
  const links = new Set();
  for (let p = 1; p <= 25; p++) {
    const h = await tai(p === 1 ? GOC : GOC + '/page/' + p); if (!h) break;
    const m = [...h.matchAll(/href="(https:\/\/dongtamshop\.com\/san-pham\/[^"#?]+)"/g)].map(x => x[1]);
    if (!m.length) break; m.forEach(x => links.add(x)); await nghi(350);
    if (p > 1 && !new RegExp('/page/' + (p + 1) + '"').test(h) && p >= 20) break;
  }
  console.log('so link san pham:', links.size);
  let n = 0;
  for (const u of links) {
    if (Object.values(kq).some(x => x.url === u)) continue;
    const h = await tai(u); if (!h) continue;
    const ten = text((h.match(/<h1[^>]*>(.*?)<\/h1>/s) || [])[1]); if (!ten) continue;
    const a = {}; [...h.matchAll(/attribute_pa_([a-z-]+)">\s*<th[^>]*>.*?<\/th>\s*<td[^>]*>(.*?)<\/td>/gs)].forEach(m => a[m[1]] = text(m[2]));
    const sv = (a['so-vien'] || '').match(/(\d+)\s*vi[êe]n\s*=\s*([\d.,]+)/i);
    kq[khoa(ten)] = {
      ten, url: u, mau: a['mau-sac'] || '', men: a['men'] || '', beMat: a['be-mat'] || '', hoaVan: a['hoa-van'] || '', congNang: a['cong-nang'] || '',
      loai: a['loai-gach'] || '', khongGian: (a['ghep'] || '').split(',').map(x => x.trim()).filter(Boolean), boSuuTap: a['bo-suu-tap'] || '',
      vienThung: sv ? +sv[1] : 0, m2Thung: sv ? +sv[2].replace(',', '.') : 0, conHang: /Còn hàng/.test(h), sale: /onsale|>\s*SALE\s*</i.test(h)
    };
    if (++n % 25 === 0) { fs.writeFileSync(out, JSON.stringify(kq)); console.log('da lay', n); }
    await nghi(350);
  }
  fs.writeFileSync(out, JSON.stringify(kq));
  console.log('xong:', Object.keys(kq).length, 'san pham ->', out);
})();
