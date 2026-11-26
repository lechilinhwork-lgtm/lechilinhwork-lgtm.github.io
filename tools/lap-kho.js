// Ghép các nguồn thành KHO DỮ LIỆU SẢN PHẨM: data/san-pham.json (mỗi mã = 1 bản ghi).
// Nguồn: gia-snapshot.js (giá lẻ, thuộc tính), data/nguon-bang-tinh.json (trạng thái, hạng bán chạy, bộ sưu tập), data/dongtamshop.json (không gian, số viên/thùng...).
// Chạy:  node tools/lap-kho.js   (ở thư mục web-khach). Chỉ giá LẺ, không giá đại lý, không tồn kho.
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = path.join(__dirname, '..');
const snap = (function () { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(R, 'gia-snapshot.js'), 'utf8'), c); return c.window; })();
const G = snap.GIA_SNAPSHOT, TT = G.thuocTinh.data;
const doc = f => { try { return JSON.parse(fs.readFileSync(path.join(R, 'data', f), 'utf8')); } catch (e) { return null; } };
const BT = (doc('nguon-bang-tinh.json') || {}).sp || {};
const DS = doc('dongtamshop.json') || {};
const kh = s => String(s).toUpperCase().replace(/^\d{6}_/, '').replace(/[-_ ]?(H\+|FP|NUNG2L)/g, '').replace(/[^A-Z0-9]/g, '');
const khDS = ten => { const t = String(ten).toUpperCase(), m = t.match(/\d{2,5}[A-Z]+\d{1,3}(?:[-_][A-Z0-9+]+)*/); return kh(m ? m[0] : t); };
const dsMap = {}; Object.values(DS).forEach(x => { dsMap[khDS(x.ten)] = x; });
const DANG_KD = ['MX', 'MV', 'DDH', 'MM'];   // theo quy ước chung: MX, MV, DDH, MM = đang kinh doanh; BM, MD, NSX = bỏ/ngưng
const out = [];
G.gach.data.filter(r => r.le > 0).forEach(r => {
  const t = TT[r.ma] || {}, b = BT[r.sap] || {}, d = dsMap[kh(r.ma)] || null;
  const trangThai = b.tt || '';
  const dangKD = DANG_KD.includes(trangThai);
  const chuLuc = dangKD && (b.pl === 'Bán chạy chủ lực' || /Chủ lực|★/.test(r.gio || ''));
  const moi = dangKD && trangThai === 'MM';
  const chongTruot = /chống trượt|chống trơn/i.test((d && (d.men + ' ' + d.beMat)) || '');
  const khangKhuan = t.tinhNang === 'KHÁNG_KHUẨN' || /kháng khuẩn/i.test((d && d.men) || '') || /KHUẨN|KK/i.test(r.ma);
  out.push({
    sap: r.sap, ma: r.ma, kc: r.kc, loai: r.cat, giaLe: r.le,
    mau: t.mau || '', congNang: t.congNang || '', hoaVan: t.hoaVan || '', men: t.men || '',
    trangThai, dangKD, chuLuc, moi, uuTien: chuLuc || moi,
    hangBanChay: b.hang || 0, phanLoai: b.pl || '', boSuuTap: ((d && d.boSuuTap) || b.bst || '').replace(/_\d{5,}$/, ''), namBST: b.nam || 0,
    khangKhuan, chongTruot,
    dongtamshop: d ? { url: d.url, beMat: d.beMat, congNang: d.congNang, khongGian: d.khongGian, vienThung: d.vienThung, m2Thung: d.m2Thung, conHang: d.conHang } : null
  });
});
fs.mkdirSync(path.join(R, 'data'), { recursive: true });
fs.writeFileSync(path.join(R, 'data', 'san-pham.json'), JSON.stringify({ ngayGia: snap.GIA_SNAPSHOT_NGAY, sp: out }));
const dem = f => out.filter(f).length;
console.log('tong', out.length, '| dang KD', dem(x => x.dangKD), '| chu luc', dem(x => x.chuLuc), '| moi', dem(x => x.moi), '| uu tien', dem(x => x.uuTien), '| co thong tin dongtamshop', dem(x => x.dongtamshop), '| uu tien thieu dongtamshop', dem(x => x.uuTien && !x.dongtamshop));
