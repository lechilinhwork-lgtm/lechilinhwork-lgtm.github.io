// Đăng một bài đã duyệt (đã lên web) lên Fanpage Facebook.
// Mã bí mật để NGOÀI repo: D:\Tờ rơi chào SP\bi-mat\facebook.json  (xem facebook.mau.json cùng thư mục).
//
// Chạy:
//   node tools/dang-facebook.js ten-bai                      -> chỉ in nội dung sẽ đăng (xem trước, không đăng)
//   ANH_LINH_DA_DUYET=1 node tools/dang-facebook.js ten-bai --that   -> đợi trang bài lên mạng rồi đăng thật
//   node tools/dang-facebook.js --kiem-tra                   -> kiểm tra mã Fanpage còn dùng được không
//   node tools/dang-facebook.js --doi-ma                     -> đổi mã ngắn hạn (maNguoiDung) thành mã Fanpage dài hạn, lưu vào facebook.json
//
// Mỗi bài chỉ đăng 1 lần (ghi sổ ở bai-nhap\_DA_DANG_FACEBOOK.md). Muốn đăng lại thì thêm --dang-lai.
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..'), GOC = path.join(R, '..');
const FILE_MA = path.join(GOC, 'bi-mat', 'facebook.json');
const SO_GHI = path.join(GOC, 'bai-nhap', '_DA_DANG_FACEBOOK.md');
const GRAPH = 'https://graph.facebook.com/v21.0';
const SITE = (() => { try { return JSON.parse(fs.readFileSync(path.join(R, 'site-config.json'), 'utf8')).site || ''; } catch (e) { return ''; } })().replace(/\/$/, '') || 'https://gachngoikeodongtam.com';

const args = process.argv.slice(2), co = k => args.includes(k);
const slug = (args.find(a => !a.startsWith('--')) || '').replace(/\.md$/, '');

function docMa() {
  if (!fs.existsSync(FILE_MA)) { console.log('Chua co file ma:', FILE_MA, '\nXem huong dan: D:\\To roi chao SP\\HUONG_DAN_DANG_FACEBOOK.md'); process.exit(1); }
  return JSON.parse(fs.readFileSync(FILE_MA, 'utf8'));
}
async function goi(duong, { method = 'GET', token, body } = {}) {
  const r = await fetch(GRAPH + duong, {
    method, headers: Object.assign({ 'Content-Type': 'application/x-www-form-urlencoded' }, token ? { Authorization: 'Bearer ' + token } : {}),
    body: body ? new URLSearchParams(body).toString() : undefined
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
  return j;
}

function docBai(s) {
  const f = path.join(R, 'bai-viet-nguon', s + '.md');
  if (!fs.existsSync(f)) { console.log('Bai chua duoc duyet (khong thay', f + ')'); process.exit(1); }
  const t = fs.readFileSync(f, 'utf8').replace(/\r/g, ''), m = t.match(/^---\n([\s\S]*?)\n---/);
  const fm = {}; (m ? m[1] : '').split('\n').forEach(l => { const k = l.match(/^([\w-]+):\s*(.*)$/); if (k) fm[k[1]] = k[2].trim(); });
  return fm;
}
function soanTin(fm, url) {
  return [
    fm['tieu-de'], '',
    fm['tom-tat'], '',
    '👉 Đọc bài đầy đủ và xem mẫu gạch thật: ' + url, '',
    'Cần báo giá, anh chị nhờ đại lý Đồng Tâm gần nhất nhé.', '',
    '#GachDongTam #GachOpLat #KinhNghiemChonGach'
  ].join('\n');
}
function daDang(s) { return fs.existsSync(SO_GHI) && fs.readFileSync(SO_GHI, 'utf8').includes('`' + s + '`'); }
function ghiSo(s, id) {
  if (!fs.existsSync(SO_GHI)) fs.writeFileSync(SO_GHI, '# Bài đã đăng Facebook\n\n');
  fs.appendFileSync(SO_GHI, '- ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' `' + s + '` → bài FB ' + id + '\n');
}
async function doiTrangLen(url, tieuDe, phut = 10) {
  const het = Date.now() + phut * 60000;
  while (Date.now() < het) {
    try { const r = await fetch(url, { cache: 'no-store' }); if (r.ok && (await r.text()).includes(tieuDe)) return true; } catch (e) {}
    process.stdout.write('.'); await new Promise(z => setTimeout(z, 20000));
  }
  return false;
}

(async () => {
  if (co('--kiem-tra')) {
    const c = docMa(); const me = await goi('/me?fields=id,name', { token: c.maFanpage });
    console.log('Ma Fanpage dung duoc. Trang:', me.name, '(id ' + me.id + ')'); return;
  }
  if (co('--doi-ma')) {
    const c = docMa();
    if (!c.appId || !c.appSecret || !c.maNguoiDung) { console.log('Can dien appId, appSecret, maNguoiDung trong', FILE_MA); process.exit(1); }
    const dai = await goi('/oauth/access_token', { method: 'POST', body: { grant_type: 'fb_exchange_token', client_id: c.appId, client_secret: c.appSecret, fb_exchange_token: c.maNguoiDung } });
    const ds = await goi('/me/accounts?fields=id,name,access_token', { token: dai.access_token });
    const trang = (ds.data || []).find(p => !c.pageId || p.id === String(c.pageId));
    if (!trang) { console.log('Khong thay Fanpage nao anh quan tri' + (c.pageId ? ' co id ' + c.pageId : '')); process.exit(1); }
    c.pageId = trang.id; c.tenTrang = trang.name; c.maFanpage = trang.access_token; delete c.maNguoiDung;
    fs.writeFileSync(FILE_MA, JSON.stringify(c, null, 2));
    console.log('Da luu ma Fanpage dai han cho trang:', trang.name, '(id ' + trang.id + ')'); return;
  }
  if (!slug) { console.log('Thieu ten bai. Vi du: node tools/dang-facebook.js chon-gach-lat-nha-tam-chong-tron-truot'); process.exit(1); }
  const fm = docBai(slug), url = SITE + '/bai-viet/' + slug + '.html', tin = soanTin(fm, url);
  console.log('--- NOI DUNG SE DANG ---\n' + tin + '\n--- (link: ' + url + ') ---');
  if (!co('--that')) { console.log('Moi xem truoc. Dang that: ANH_LINH_DA_DUYET=1 node tools/dang-facebook.js ' + slug + ' --that'); return; }
  if (process.env.ANH_LINH_DA_DUYET !== '1') { console.log('Dung lai: chi dang khi anh Linh da noi duyet (dat ANH_LINH_DA_DUYET=1).'); process.exit(1); }
  if (daDang(slug) && !co('--dang-lai')) { console.log('Bai nay da dang Facebook roi (xem ' + SO_GHI + '). Them --dang-lai neu muon dang lan nua.'); process.exit(1); }
  const c = docMa(); if (!c.pageId || !c.maFanpage) { console.log('Thieu pageId hoac maFanpage trong', FILE_MA); process.exit(1); }
  process.stdout.write('Doi trang bai len mang');
  if (!(await doiTrangLen(url, fm['tieu-de']))) { console.log('\nSau 10 phut trang bai van chua len. Chua dang. Chay lai lenh nay sau.'); process.exit(1); }
  console.log(' xong.');
  const kq = await goi('/' + c.pageId + '/feed', { method: 'POST', token: c.maFanpage, body: { message: tin, link: url } });
  ghiSo(slug, kq.id);
  console.log('Da dang Facebook. Ma bai:', kq.id, '\nXem: https://www.facebook.com/' + kq.id);
})().catch(e => { console.log('LOI Facebook:', e.message); process.exit(1); });
