// Tải ảnh sản phẩm ưu tiên (chủ lực/mới) chưa có ảnh mặt gạch về anh/sp/<sap>.jpg để trang SEO nhanh, ổn định, không phụ thuộc Google Drive.
// Chạy:  node tools/lay-anh.js   (sau lap-kho.js). Bỏ qua mã đã có ảnh.
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = path.join(__dirname, '..');
const snap = (function () { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(R, 'gia-snapshot.js'), 'utf8'), c); return c.window; })();
const IMG = snap.GIA_SNAPSHOT.spImages || {};
const kho = JSON.parse(fs.readFileSync(path.join(R, 'data', 'san-pham.json'), 'utf8')).sp;
const face = (function () { const c = { window: {}, self: {} }; vm.runInNewContext(fs.readFileSync(path.join(R, 'face-data.js'), 'utf8') + ';this.__v=typeof FACE_GACH!=="undefined"?FACE_GACH:null;', c); return c.__v || c.window.FACE_GACH || {}; })();
const khoa = ma => String(ma).toUpperCase().replace(/^\d{6}_/, '').replace(/[-_ ]?(H\+|FP|NUNG2L)/g, '').replace(/[^A-Z0-9]/g, '');
const nghi = ms => new Promise(r => setTimeout(r, ms));
const dir = path.join(R, 'anh', 'sp'); fs.mkdirSync(dir, { recursive: true });
(async () => {
  const ds = kho.filter(x => x.uuTien && !face[khoa(x.ma)] && IMG[x.sap]);
  console.log('can tai:', ds.length); let ok = 0, loi = 0;
  for (const x of ds) {
    const f = path.join(dir, x.sap + '.jpg'); if (fs.existsSync(f) && fs.statSync(f).size > 2000) continue;
    const m = String(IMG[x.sap]).match(/\/d\/([\w-]+)/) || String(IMG[x.sap]).match(/id=([\w-]+)/); if (!m) continue;
    try { const r = await fetch('https://lh3.googleusercontent.com/d/' + m[1] + '=w800'); const b = Buffer.from(await r.arrayBuffer()); if (r.ok && b.length > 2000 && /image/.test(r.headers.get('content-type') || '')) { fs.writeFileSync(f, b); ok++; } else loi++; } catch (e) { loi++; }
    await nghi(250);
  }
  console.log('da tai', ok, 'loi', loi);
})();
