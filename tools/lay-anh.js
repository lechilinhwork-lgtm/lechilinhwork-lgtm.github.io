// Tải ẢNH SẢN PHẨM THỰC TẾ (lấy từ Sale tool, trường spImagesMulti trong gia-snapshot.js) về anh/sp/<sap>-<n>.webp
// để trang SEO nhanh, ổn định, không phụ thuộc Google Drive. Mỗi mã tối đa 4 ảnh, chỉ mã đang kinh doanh (ưu tiên chủ lực/mới trước).
// Chạy:  node tools/lap-kho.js  rồi  node tools/lay-anh.js    (cần ffmpeg trong PATH). Bỏ qua ảnh đã có.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const R = path.join(__dirname, '..');
const snap = (function () { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(R, 'gia-snapshot.js'), 'utf8'), c); return c.window; })();
const MULTI = snap.GIA_SNAPSHOT.spImagesMulti || {}, ONE = snap.GIA_SNAPSHOT.spImages || {};
const kho = JSON.parse(fs.readFileSync(path.join(R, 'data', 'san-pham.json'), 'utf8')).sp.filter(x => x.dangKD);
kho.sort((a, b) => (b.uuTien ? 1 : 0) - (a.uuTien ? 1 : 0) || (a.hangBanChay || 9999) - (b.hangBanChay || 9999));
const NK = snap.GIA_SNAPSHOT.ngoiKeoKinh || {};
const them = ((NK.keo && NK.keo.data) || []).concat((NK.ngoi && NK.ngoi.data) || []).map(x => ({ sap: x.ma }));
kho.push(...them);
const MAX = 4, nghi = ms => new Promise(r => setTimeout(r, ms));
const dir = path.join(R, 'anh', 'sp'); fs.mkdirSync(dir, { recursive: true });
const idDrive = u => { const m = String(u || '').match(/\/d\/([\w-]+)/) || String(u || '').match(/id=([\w-]+)/); return m ? m[1] : ''; };
(async () => {
  let ok = 0, loi = 0, co = 0;
  for (const x of kho) {
    const ds = (Array.isArray(MULTI[x.sap]) && MULTI[x.sap].length ? MULTI[x.sap] : (ONE[x.sap] ? [ONE[x.sap]] : [])).slice(0, MAX);
    for (let i = 0; i < ds.length; i++) {
      const f = path.join(dir, x.sap + '-' + (i + 1) + '.webp'); if (fs.existsSync(f) && fs.statSync(f).size > 1500) { co++; continue; }
      const id = idDrive(ds[i]); if (!id) continue;
      try {
        const r = await fetch('https://lh3.googleusercontent.com/d/' + id + '=w1000'); const b = Buffer.from(await r.arrayBuffer());
        if (!r.ok || b.length < 2000 || !/image/.test(r.headers.get('content-type') || '')) { loi++; continue; }
        const p = cp.spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', 'pipe:0', '-vf', "scale='min(900,iw)':-2", '-quality', '78', f], { input: b });
        if (p.status === 0) ok++; else loi++;
      } catch (e) { loi++; }
      await nghi(200);
    }
  }
  console.log('da tai', ok, 'co san', co, 'loi', loi);
})();
