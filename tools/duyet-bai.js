// Duyệt một bài nháp: chép vào bai-viet-nguon/, chuyển bản nháp sang bai-nhap/da-duyet/, dựng lại web. KHÔNG tự commit/đẩy GitHub.
// Chạy:  node tools/duyet-bai.js ten-bai        (không cần đuôi .md)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const R = path.join(__dirname, '..'), N = path.join(R, '..', 'bai-nhap');
const slug = (process.argv[2] || '').replace(/\.md$/, ''); if (!slug) { console.log('Thieu ten bai'); process.exit(1); }
const src = path.join(N, slug + '.md'); if (!fs.existsSync(src)) { console.log('Khong thay ban nhap:', src); process.exit(1); }
const kt = cp.spawnSync('node', [path.join(__dirname, 'kiem-tra-bai.js'), src], { encoding: 'utf8' }); process.stdout.write(kt.stdout);
if (kt.status !== 0) { console.log('Bai chua dat kiem tra, khong duyet.'); process.exit(1); }
fs.mkdirSync(path.join(R, 'bai-viet-nguon'), { recursive: true }); fs.mkdirSync(path.join(N, 'da-duyet'), { recursive: true });
fs.copyFileSync(src, path.join(R, 'bai-viet-nguon', slug + '.md')); fs.renameSync(src, path.join(N, 'da-duyet', slug + '.md'));
const b = cp.spawnSync('node', [path.join(__dirname, 'build-seo.js')], { cwd: R, encoding: 'utf8' }); process.stdout.write(b.stdout);
console.log('Da duyet:', slug, '-> chua dua len GitHub (can commit + push).');
