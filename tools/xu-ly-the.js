// Xử lý bộ ẢNH THẺ SẢN PHẨM (banner thiết kế sẵn của công ty): chỉ THU NHỎ về 900px dạng WebP, KHÔNG cắt, KHÔNG sửa nội dung.
// Chạy:  node tools/xu-ly-the.js "C:\\Users\\hp\\Downloads\\OneDrive_1_26-11-2026 (1)"     (cần ffmpeg trong PATH)
// Kết quả: anh/the/<khoa>.webp (+ -2, -3 nếu có biến thể), data/the-san-pham.json, và báo cáo ảnh chưa khớp: ../ANH_THE_CHUA_KHOP.md
const fs = require('fs'), path = require('path'), cp = require('child_process');
const R = path.join(__dirname, '..'), GOC = process.argv[2]; if (!GOC || !fs.existsSync(GOC)) { console.log('Thieu duong dan thu muc anh the'); process.exit(1); }
const kho = JSON.parse(fs.readFileSync(path.join(R, 'data', 'san-pham.json'), 'utf8')).sp;
const kh = s => String(s).toUpperCase().replace(/^\d{6}_/, '').replace(/[-_ ]?(H\+|FP|NUNG2L)/g, '').replace(/[^A-Z0-9]/g, '');
const BO_TIEN_TO = k => k.replace(/^(DTD|DTS|CT|D)(?=\d)/, '');
const idx = {}; kho.forEach(x => { const k = kh(x.ma); idx[k] = x; const k2 = BO_TIEN_TO(k); if (k2 !== k && !idx[k2]) idx[k2] = x; });
const TIEN_TO = { '1000x1000': '100', '200x200': '2020', '300x300': '3030', '300x600': '3060', '400x400': '4040', '400x800': '4080', '600x1200': '60120', '600x600': '6060', '800x800': '8080' };
const dir = path.join(R, 'anh', 'the'); fs.mkdirSync(dir, { recursive: true });
const files = []; (function quet(d, goc) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (!/thiết kế/i.test(f.name)) quet(p, goc || f.name); } else if (/\.(jpg|jpeg|png)$/i.test(f.name)) files.push({ p, ten: f.name, thuMuc: goc || '' }); } })(GOC, '');
// -> danh sách mã ứng viên từ tên file
function ungVien(f) {
  let b = f.ten.replace(/\.(jpg|jpeg|png)$/i, '').replace(/\s*copy.*$/i, '').replace(/\s+/g, '').toUpperCase();
  let bienThe = 0;
  const ds = new Set(), thu = s => { if (s) ds.add(kh(s.replace(/-H(?![+\w])/g, ''))); };
  const m = b.match(/^(\d+)_(.*)$/), size = (f.thuMuc.match(/(\d+x\d+)/) || [])[1], tt = TIEN_TO[size] || '';
  const cac = [];
  if (m) { cac.push(m[2].startsWith(m[1]) ? m[2] : m[1] + m[2]); cac.push(tt + m[2]); cac.push(m[2]); } else { cac.push(b); cac.push(b.replace(/^D(?=\d)/, '')); cac.push(tt + b); }
  cac.forEach(c => { thu(c); const v = c.match(/^(.*?)-(\d{2})$/); if (v) { thu(v[1]); } thu(c.replace(/-?(FP-?H\+?|H\+)-?\d*$/, '')); });
  const vm = b.match(/-(\d{2})$/); if (vm) bienThe = +vm[1];
  return { ds: [...ds], bienThe };
}
const ketQua = {}, chuaKhop = [], trung = [];
function ra(f, khoa, n) { const out = path.join(dir, khoa + (n > 1 ? '-' + n : '') + '.webp'); const p = cp.spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f.p, '-vf', "scale='min(900,iw)':-2", '-quality', '82', out]); return p.status === 0; }
files.filter(f => !/NGOI/i.test(f.ten) && !/^Ngói/.test(f.thuMuc)).forEach(f => {
  const u = ungVien(f); const khoa = u.ds.find(k => idx[k]);
  if (!khoa) { chuaKhop.push({ ten: f.ten, thuMuc: f.thuMuc, thu: u.ds.slice(0, 2).join(' / ') }); return; }
  (ketQua[khoa] = ketQua[khoa] || []).push({ f, bienThe: u.bienThe });
});
let n = 0;
Object.keys(ketQua).forEach(khoa => {
  const ds = ketQua[khoa].sort((a, b) => a.bienThe - b.bienThe || a.f.ten.length - b.f.ten.length), tep = [];
  ds.forEach((x, i) => { if (ra(x.f, khoa, i + 1)) { tep.push('anh/the/' + khoa + (i ? '-' + (i + 1) : '') + '.webp'); n++; } });
  ketQua[khoa] = tep; if (ds.length > 1) trung.push(khoa + ': ' + ds.map(x => x.f.ten).join(', '));
});
// ----- NGÓI: tên dạng NGOISONG_TITAN001.png, NGOIPHANG_ALPHA001.png, NGOIPHUKIEN_NGOINOC.png ...
const ngoi = {};
files.filter(f => /NGOI/i.test(f.ten)).forEach(f => {
  const b = f.ten.replace(/\.(png|jpg|jpeg)$/i, '').replace(/\s*copy.*$/i, '').toUpperCase();
  const m = b.match(/^NGOI(?:SONG|PHANG)_(TITAN|ALPHA)(\d+)$/), pk = b.match(/^NGOIPHUKIEN_(.+)$/);
  const khoa = m ? 'ngoi-' + m[1].toLowerCase() + '-' + m[2] : pk ? 'ngoi-pk-' + pk[1].toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
  if (!khoa) { chuaKhop.push({ ten: f.ten, thuMuc: f.thuMuc, thu: '(ngói: không nhận ra dạng tên)' }); return; }
  if (ra(f, khoa, 1)) { ngoi[khoa] = 'anh/the/' + khoa + '.webp'; n++; }
});
fs.writeFileSync(path.join(R, 'data', 'the-san-pham.json'), JSON.stringify({ gach: ketQua, ngoi }));
const mdFile = path.join(R, '..', 'ANH_THE_CHUA_KHOP.md');
const dsKD = kho.filter(x => x.dangKD), coThe = dsKD.filter(x => ketQua[kh(x.ma)]);
fs.writeFileSync(mdFile, '# Ảnh thẻ sản phẩm chưa khớp mã\n\nTạo ngày ' + new Date().toISOString().slice(0, 10) + '. Ảnh đã xử lý: ' + n + ' file WebP. Mã đang kinh doanh có thẻ: ' + coThe.length + '/' + dsKD.length + '.\n\n## 1. Ảnh có trong thư mục nhưng không tìm được mã tương ứng (' + chuaKhop.length + ')\nTên file, thư mục, mã em đã thử:\n\n' + chuaKhop.map(x => '- `' + x.ten + '` (' + x.thuMuc + '), đã thử: ' + (x.thu || '-')).join('\n') + '\n\n## 2. Mã có nhiều ảnh (biến thể -02, -03, hoặc trùng) (' + trung.length + ')\nẢnh đầu tiên dùng làm ảnh chính, các ảnh sau hiện thêm trong bộ ảnh.\n\n' + trung.map(x => '- ' + x).join('\n') + '\n\n## 3. Mã gạch ưu tiên (chủ lực/mới) CHƯA có ảnh thẻ (' + dsKD.filter(x => x.uuTien && !ketQua[kh(x.ma)]).length + ')\n\n' + dsKD.filter(x => x.uuTien && !ketQua[kh(x.ma)]).map(x => '- ' + x.ma + ' (' + x.kc + ')').join('\n') + '\n');
console.log('anh xu ly', n, '| ma gach co the', Object.keys(ketQua).length, '| mau ngoi', Object.keys(ngoi).length, '| chua khop', chuaKhop.length, '| bao cao:', mdFile);
