// Kiểm tra một bản nháp bài viết trước khi đưa cho anh Linh duyệt.
// Chạy:  node tools/kiem-tra-bai.js "D:\Tờ rơi chào SP\bai-nhap\ten-bai.md"
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const f = process.argv[2]; if (!f) { console.log('Thieu duong dan file .md'); process.exit(1); }
const kho = JSON.parse(fs.readFileSync(path.join(R, 'data', 'san-pham.json'), 'utf8')).sp;
const theoMa = {}; kho.forEach(x => { theoMa[String(x.ma).toUpperCase()] = x; theoMa[String(x.sap)] = x; });
const t = fs.readFileSync(f, 'utf8').replace(/\r/g, ''), m = t.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
const loi = [], canh = [];
if (!m) { console.log('LOI: thieu khoi dau --- ... ---'); process.exit(1); }
const fm = {}; m[1].split('\n').forEach(l => { const k = l.match(/^([\w-]+):\s*(.*)$/); if (k) fm[k[1]] = k[2].trim(); });
const nd = m[2];
['tieu-de', 'mo-ta', 'ngay', 'nhom', 'tom-tat', 'san-pham'].forEach(k => { if (!fm[k]) loi.push('thieu truong ' + k); });
if ((fm['tieu-de'] || '').length > 90) loi.push('tieu-de dai hon 90 ky tu');
if ((fm['mo-ta'] || '').length > 160) loi.push('mo-ta dai hon 160 ky tu');
['Vấn đề', 'Giải pháp', 'Kết quả'].forEach(k => { if (!new RegExp('^## ' + k, 'm').test(nd)) loi.push('thieu muc "## ' + k + '..."'); });
const tu = nd.split(/\s+/).length; if (tu < 350 || tu > 1100) canh.push('so tu ' + tu + ' (nen 450-900)');
const ma = new Set((fm['san-pham'] || '').split(',').map(x => x.trim().toUpperCase()).filter(Boolean));
[...nd.matchAll(/\{\{sp:([^}]+)\}\}/g)].forEach(x => ma.add(x[1].trim().toUpperCase()));
if (!ma.size) loi.push('chua gan ma san pham nao');
ma.forEach(c => { const x = theoMa[c]; if (!x) loi.push('ma khong ton tai trong kho: ' + c); else if (!x.dangKD) loi.push('ma da ngung/bo mau: ' + c); });
const cam = [[/\d+\s*%\s*(vi khuẩn|khuẩn)|diệt\s*\d+/i, 'so lieu khang khuan tu ghi (chi dung so trong phieu kiem nghiem da duyet)'], [/\d[\d.,]*\s*(?:đ|vnđ|đồng|nghìn|triệu)(?![\p{L}])/iu, 'khong ghi gia tien trong bai'], [/tốt nhất|rẻ nhất|số 1|duy nhất|cam kết|đảm bảo 100/i, 'cau quang cao tuyet doi'], [/R\s?1[0-3]\b/, 'chi so chong truot R: chi dung neu co phieu kiem nghiem'], [/bảo hành\s*\d+/i, 'khong tu ghi thoi han bao hanh']];
cam.forEach(([r, msg]) => { if (r.test(nd) || r.test(fm['tom-tat'] || '')) loi.push('noi dung vi pham: ' + msg); });
console.log(loi.length ? 'KHONG DAT:\n - ' + loi.join('\n - ') : 'DAT (khong co loi chan)'); if (canh.length) console.log('Canh bao: ' + canh.join('; '));
process.exit(loi.length ? 1 : 0);
