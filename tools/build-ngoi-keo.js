// Dựng trang NGÓI (theo từng màu TITAN/ALPHA, kèm phụ kiện và giá) và trang KEO/RON. Được gọi từ build-seo.js.
// Dữ liệu: gia-snapshot.js (ngoiKeoKinh.ngoi / .keo, extra.mo_ta, spImagesMulti), data/the-san-pham.json (thẻ ngói), anh/sp/<mã>-n.webp (ảnh thực tế).
module.exports = function (c) {
  const { fs, path, R, SITE, NGAY, khung, esc, tien, absImg, boAnh, urls, G, THE } = c;
  const NK = G.ngoiKeoKinh || {}, EX = G.extra || {};
  const tepAnh = (ma, toiDa) => { const o = []; for (let n = 1; n <= (toiDa || 4); n++) { const f = 'anh/sp/' + ma + '-' + n + '.webp'; if (fs.existsSync(path.join(R, f))) o.push(f); } return o; };
  // mô tả của công ty: bỏ dòng trống/dấu "x" và các câu có từ so sánh tuyệt đối hay cam kết
  const CAM = /nhất|tuyệt đối|cam kết|vĩnh cửu|trên thị trường|\d+\s*năm|nửa thế kỷ|giảm chi phí|hàng đầu|số 1/i;
  const moTa = ma => { const t = (EX[ma] && EX[ma].mo_ta) || ''; return t.replace(/\r/g, '').split('\n').map(x => x.trim()).filter(x => x.length > 2 && x !== 'x' && !CAM.test(x)).slice(0, 18); };
  const html = ds => ds.map(l => /^[^:]{2,40}:\s*\S/.test(l) && l.length < 140 ? '<li>' + esc(l) + '</li>' : '<p>' + esc(l) + '</p>').join('').replace(/(<li>.*?<\/li>)+/g, m => '<ul class="ds">' + m + '</ul>');
  const dk = (arr, f) => { const v = {}; return arr.filter(x => { const k = f(x); if (v[k]) return false; v[k] = 1; return true; }); };
  const CHAN = '<p class="ghi">Giá chỉ để tham khảo, đại lý báo giá chính xác và chiết khấu theo công trình. Màu trên ảnh có thể khác thực tế do màn hình: nên xem mẫu thật.</p>';
  const NUT = '<a class="nut" href="' + SITE + '/#dai-ly">Nhắn đại lý gần bạn</a>';
  const gui = (dir, ten, file, o) => { fs.writeFileSync(path.join(dir, file), khung(o)); };

  // ---------------- NGÓI ----------------
  const ngoiRaw = dk((NK.ngoi && NK.ngoi.data) || [], x => x.ten + '|' + x.kc);
  const THU_TU = ['Ngói lợp', 'Ngói rìa', 'Ngói chặn cuối rìa', 'Ngói nóc', 'Ngói chặn cuối nóc', 'Ngói chạc ba CBK', 'Ngói chạc ba CBY', 'Ngói chạc chữ T', 'Ngói chạc tư'];
  const thuTu = t => { const i = THU_TU.findIndex(p => t.indexOf(p) === 0); return i < 0 ? 99 : i; };
  const mau = {};
  ngoiRaw.forEach(x => { const m = x.ten.match(/(TITAN|ALPHA)\s*(\d+)/i); if (!m) return; const k = m[1].toUpperCase() + m[2]; (mau[k] = mau[k] || { dong: m[1].toUpperCase(), so: m[2], ds: [] }).ds.push(x); });
  const DONG = { TITAN: { ten: 'TITAN', loai: 'ngói sóng tráng men', slug: 'ngoi-titan' }, ALPHA: { ten: 'ALPHA', loai: 'ngói phẳng tráng men', slug: 'ngoi-alpha' } };
  const dirN = path.join(R, 'ngoi'); fs.rmSync(dirN, { recursive: true, force: true }); fs.mkdirSync(dirN, { recursive: true });
  const pkBanner = Object.keys(THE.ngoi || {}).filter(k => /^ngoi-pk-/.test(k)).map(k => THE.ngoi[k]).filter(f => fs.existsSync(path.join(R, f)));
  const cacMau = Object.keys(mau).sort();
  const thongTinDong = {};
  cacMau.forEach(k => { // vòng 1: chuẩn bị dữ liệu mọi màu (để thẻ "màu khác" dùng được)
    const g = mau[k], d = DONG[g.dong], ds = g.ds.sort((a, b) => thuTu(a.ten) - thuTu(b.ten));
    g.lop = ds.find(x => /^Ngói lợp/.test(x.ten)) || ds[0]; g.slug = d.slug + '-' + g.so; g.ten = 'Ngói ' + d.ten + ' ' + g.so;
    g.the = THE.ngoi && THE.ngoi[g.slug] && fs.existsSync(path.join(R, THE.ngoi[g.slug])) ? [THE.ngoi[g.slug]] : [];
    g.thuc = []; ds.forEach(x => { tepAnh(x.ma, 3).forEach(f => { if (g.thuc.length < 6) g.thuc.push(f); }); });
  });
  cacMau.forEach(k => {
    const g = mau[k], d = DONG[g.dong], ds = g.ds.sort((a, b) => thuTu(a.ten) - thuTu(b.ten));
    const lop = ds.find(x => /^Ngói lợp/.test(x.ten)) || ds[0], ten = 'Ngói ' + d.ten + ' ' + g.so, slug = d.slug + '-' + g.so;
    g.slug = slug; g.ten = ten; g.lop = lop;
    const the = THE.ngoi && THE.ngoi[slug] && fs.existsSync(path.join(R, THE.ngoi[slug])) ? [THE.ngoi[slug]] : [];
    let thuc = []; ds.forEach(x => { tepAnh(x.ma, 3).forEach(f => { if (thuc.length < 6) thuc.push(f); }); });
    g.the = the; g.thuc = thuc;
    if (!thongTinDong[g.dong]) { const t = moTa(lop.ma); if (t.length) thongTinDong[g.dong] = t; }
    const mt = moTa(lop.ma).length ? moTa(lop.ma) : (thongTinDong[g.dong] || []);
    const khoiAnh = boAnh([{ k: 'the', nhan: 'Thẻ sản phẩm', ngan: 'Thẻ', alt: 'Thẻ sản phẩm', ds: the }, { k: 'thuc', nhan: 'Ảnh thực tế', ngan: 'Thực tế', alt: 'Ảnh thực tế', ds: thuc }, { k: 'pk', nhan: 'Phụ kiện', ngan: 'Phụ kiện', alt: 'Phụ kiện ngói', ds: pkBanner }], ten, '../');
    const hang = ds.map(x => '<tr><td>' + esc(x.ten.replace(/\s*(TITAN|ALPHA)\s*\d+/i, '')) + '</td><td>' + esc(x.kc.replace(/x/g, ' x ') + ' mm') + '</td><td>' + esc(x.dong_goi || '') + '</td><td><b>' + tien(x.le) + ' đ</b></td></tr>').join('');
    const url = '/ngoi/' + slug + '.html', title = ten + ' Đồng Tâm: ' + d.loai + ', phụ kiện và giá tham khảo';
    const desc = (ten + ' Đồng Tâm (' + d.loai + '): ngói lợp ' + tien(lop.le) + ' đ/viên, đủ ngói rìa, nóc, chạc. Xem giá lẻ tham khảo và đại lý gần bạn.').slice(0, 158);
    const cung = cacMau.filter(z => mau[z].dong === g.dong && z !== k);
    const body = '<div class="hero"><div class="wrap"><small>Ngói ' + esc(d.loai) + '</small><h1>' + esc(ten) + ' Đồng Tâm</h1><p>Ngói lợp ' + esc(lop.kc.replace(/x/g, ' x ')) + ' mm, ' + esc(lop.dong_goi || '') + '. Đủ ngói rìa, ngói nóc, ngói chạc cùng màu.</p></div></div>'
      + '<div class="wrap"><div class="sp"><div>' + khoiAnh + '</div><div><div class="gia">' + tien(lop.le) + ' đ/viên <small>giá lẻ ngói lợp tham khảo, cập nhật ' + NGAY + '</small></div>'
      + '<div class="cuon"><table class="sosanh" style="min-width:420px"><tr><th>Loại ngói</th><th>Kích thước</th><th>Đóng gói</th><th>Giá lẻ/viên</th></tr>' + hang + '</table></div>'
      + '<p class="ghi">Định mức ngói lợp khoảng 11 đến 12 viên/m² mái, tùy khoảng cách mè. Phụ kiện tính theo bản vẽ mái.</p>' + NUT + CHAN + '</div></div>'
      + (mt.length ? '<h2>Thông tin ' + esc(d.loai) + ' ' + d.ten + '</h2><div class="loi">' + html(mt) + '</div>' : '')
      + (cung.length ? '<h2>Các màu ' + d.ten + ' khác</h2><div class="luoi">' + cung.map(z => { const q = mau[z], im = q.the[0] || q.thuc[0] || ''; return '<a class="the" href="' + q.slug + '.html"><img loading="lazy" src="' + (im ? '../' + im : '') + '" alt="' + esc(q.ten) + '"><span>' + esc('Ngói ' + d.ten + ' ' + q.so) + '<small>' + tien(q.lop.le) + ' đ/viên</small></span></a>'; }).join('') + '</div>' : '')
      + '<p class="ghi"><a href="./">← Tất cả ngói Đồng Tâm</a></p></div>';
    const ld = { '@context': 'https://schema.org', '@type': 'Product', name: ten + ' Đồng Tâm', sku: String(lop.ma), brand: { '@type': 'Brand', name: 'Đồng Tâm' }, category: 'Ngói lợp mái', description: desc, image: the.concat(thuc.slice(0, 2)).map(absImg) };
    gui(dirN, ten, slug + '.html', { title, desc, url, og: 'product', img: absImg(the[0] || thuc[0] || ''), body, ld, dinh: { gia: tien(lop.le) + ' đ/viên', href: SITE + '/#dai-ly' } });
    urls.push(url);
  });
  // trang tổng ngói
  const cardN = q => { const im = q.the[0] || q.thuc[0] || ''; return '<a class="the" href="' + q.slug + '.html"><img loading="lazy" src="' + (im ? '../' + im : '') + '" alt="' + esc(q.ten) + '"><span>' + esc(q.ten.replace('Ngói ', 'Ngói ')) + '<small>' + tien(q.lop.le) + ' đ/viên</small></span></a>'; };
  const phanDong = Object.keys(DONG).map(dn => { const ms = cacMau.filter(z => mau[z].dong === dn); return ms.length ? '<h2>Ngói ' + dn + ': ' + DONG[dn].loai + ' (' + ms.length + ' màu)</h2><div class="luoi">' + ms.map(z => cardN(mau[z])).join('') + '</div>' : ''; }).join('');
  gui(dirN, '', 'index.html', { title: 'Ngói Đồng Tâm: ngói sóng TITAN, ngói phẳng ALPHA, giá phụ kiện tham khảo', desc: 'Ngói lợp mái tráng men Đồng Tâm: ngói sóng TITAN và ngói phẳng ALPHA, đủ ngói rìa, nóc, chạc. Xem màu, giá lẻ tham khảo và đại lý gần bạn.'.slice(0, 158), url: '/ngoi/', img: absImg(mau[cacMau[0]] && (mau[cacMau[0]].the[0] || mau[cacMau[0]].thuc[0]) || 'anh/bia-tong-hop.jpg'), body: '<div class="hero"><div class="wrap"><small>Ngói lợp mái</small><h1>Ngói Đồng Tâm</h1><p>Hai dòng ngói tráng men: TITAN dáng sóng và ALPHA dáng phẳng. Chọn màu, xem phụ kiện đi kèm và giá lẻ tham khảo.</p></div></div><div class="wrap">' + phanDong + '<p class="ghi">' + 'Giá lẻ tham khảo, cập nhật ' + NGAY + '. Đại lý báo giá chính xác theo công trình.</p></div>' });
  urls.push('/ngoi/');

  // ---------------- KEO / RON ----------------
  const keo = (NK.keo && NK.keo.data) || [], dirK = path.join(R, 'keo'); fs.rmSync(dirK, { recursive: true, force: true }); fs.mkdirSync(dirK, { recursive: true });
  const slugK = x => x.ten.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const khoK = keo.map(x => ({ x, slug: slugK(x), thuc: tepAnh(x.ma, 4), ron: /ron/i.test(x.ten) }));
  khoK.forEach(k => {
    const x = k.x, mt = moTa(x.ma), url = '/keo/' + k.slug + '.html', loai = k.ron ? 'Bột chà ron' : 'Keo dán gạch';
    const title = x.ten.replace(/\s*\(.*?\)\s*/, ' ').trim() + ' Đồng Tâm: ' + (k.ron ? 'bột chà ron' : 'keo dán gạch') + ', giá tham khảo';
    const desc = (x.ten + ' Đồng Tâm, quy cách ' + (x.qc || '') + '/' + (x.dv || '') + ', giá lẻ tham khảo ' + tien(x.le) + ' đ. Xem công dụng, định mức và đại lý gần bạn.').slice(0, 158);
    const khoiAnh = boAnh([{ k: 'thuc', nhan: 'Ảnh sản phẩm', alt: 'Ảnh', ds: k.thuc }], x.ten, '../');
    const cung = khoK.filter(z => z !== k && z.ron === k.ron || (z !== k && !z.ron && !k.ron));
    const hang = [['Loại', loai], ['Quy cách', (x.qc || '') + (x.dv ? ' / ' + x.dv : '')], ['Mã sản phẩm', x.ma]].filter(r => r[1]);
    const body = '<div class="hero"><div class="wrap"><small>' + esc(loai) + '</small><h1>' + esc(x.ten) + ' Đồng Tâm</h1><p>Quy cách ' + esc((x.qc || '') + (x.dv ? ' / ' + x.dv : '')) + '. Dùng cùng gạch ốp lát Đồng Tâm.</p></div></div>'
      + '<div class="wrap"><div class="sp"><div>' + khoiAnh + '</div><div><div class="gia">' + tien(x.le) + ' đ/' + esc(x.dv || 'sản phẩm') + ' <small>giá lẻ tham khảo, cập nhật ' + NGAY + '</small></div><table>' + hang.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>' + NUT + CHAN + '</div></div>'
      + (mt.length ? '<h2>Công dụng và thông tin kỹ thuật</h2><div class="loi">' + html(mt) + '</div>' : '')
      + '<h2>Sản phẩm cùng nhóm</h2><div class="luoi">' + khoK.filter(z => z !== k).slice(0, 4).map(z => { const im = z.thuc[0] || ''; return '<a class="the" href="' + z.slug + '.html"><img loading="lazy" src="' + (im ? '../' + im : '') + '" alt="' + esc(z.x.ten) + '"><span>' + esc(z.x.ten) + '<small>' + tien(z.x.le) + ' đ/' + esc(z.x.dv || '') + '</small></span></a>'; }).join('') + '</div>'
      + '<p class="ghi"><a href="./">← Keo dán gạch và bột chà ron</a> · <a href="../gach/">Gạch ốp lát Đồng Tâm</a></p></div>';
    const ld = { '@context': 'https://schema.org', '@type': 'Product', name: x.ten + ' Đồng Tâm', sku: String(x.ma), brand: { '@type': 'Brand', name: 'Đồng Tâm' }, category: loai, description: desc, image: k.thuc.slice(0, 3).map(absImg) };
    gui(dirK, x.ten, k.slug + '.html', { title, desc, url, og: 'product', img: absImg(k.thuc[0] || ''), body, ld, dinh: { gia: tien(x.le) + ' đ/' + (x.dv || 'sp'), href: SITE + '/#dai-ly' } }); urls.push(url);
  });
  gui(dirK, '', 'index.html', { title: 'Keo dán gạch GECKO và bột chà ron GROUTEX Đồng Tâm: công dụng, giá tham khảo', desc: 'Keo dán gạch GECKO Wall, Floor, Pro, Super và bột chà ron GROUTEX của Đồng Tâm: chọn đúng loại cho ốp tường, lát nền, khu vực ẩm. Giá lẻ tham khảo.'.slice(0, 158), url: '/keo/', img: absImg((khoK[0] && khoK[0].thuc[0]) || 'anh/bia-tong-hop.jpg'), body: '<div class="hero"><div class="wrap"><small>Vật tư đi kèm</small><h1>Keo dán gạch và bột chà ron</h1><p>Keo GECKO cho từng nhu cầu ốp tường, lát nền, khu vực ẩm và bột chà ron GROUTEX cùng thương hiệu Đồng Tâm.</p></div></div><div class="wrap"><h2>Danh sách sản phẩm</h2><div class="luoi">' + khoK.map(z => '<a class="the" href="' + z.slug + '.html"><img loading="lazy" src="' + (z.thuc[0] ? '../' + z.thuc[0] : '') + '" alt="' + esc(z.x.ten) + '"><span>' + esc(z.x.ten) + '<small>' + tien(z.x.le) + ' đ/' + esc(z.x.dv || '') + '</small></span></a>').join('') + '</div><p class="ghi">Giá lẻ tham khảo, cập nhật ' + NGAY + '. Đại lý báo giá chính xác theo công trình.</p></div>' });
  urls.push('/keo/');

  // ---------------- GẠCH KÍNH ----------------
  const kinhRaw = (NK.kinh && NK.kinh.data) || [], dirG = path.join(R, 'kinh'); fs.rmSync(dirG, { recursive: true, force: true }); fs.mkdirSync(dirG, { recursive: true });
  const kinh = kinhRaw.map(x => ({ x, so: (x.ten.match(/(\d+)\s*$/) || [])[1] || x.ma, thuc: tepAnh(x.ma, 4) })).map(k => Object.assign(k, { slug: 'gach-kinh-' + k.so }));
  const soVien = x => { const m = String(x.dong_goi || x.dv || '').match(/(\d+)\s*v/i) || String(x.dv || '').match(/(\d+)\s*viên/i); return m ? +m[1] : 0; };
  kinh.forEach(k => {
    const x = k.x, sv = soVien(x), mt = moTa(x.ma), url = '/kinh/' + k.slug + '.html', ten = 'Gạch kính ' + k.so;
    const title = ten + ' Đồng Tâm ' + (x.kc || '') + ': gạch kính lấy sáng, giá tham khảo';
    const desc = (ten + ' Đồng Tâm kích thước ' + (x.kc || '') + ', ' + (x.dong_goi || '') + ', giá lẻ tham khảo ' + tien(x.le) + ' đ/thùng. Xem hình và đại lý gần bạn.').slice(0, 158);
    const khoiAnh = boAnh([{ k: 'thuc', nhan: 'Ảnh thực tế', ngan: 'Thực tế', alt: 'Ảnh thực tế', ds: k.thuc }], ten, '../');
    const hang = [['Mã sản phẩm', x.ma], ['Kích thước', (x.kc || '').replace(/x/g, ' x ')], ['Quy cách', x.dv || x.dong_goi || '']].filter(r => r[1]);
    const body = '<div class="hero"><div class="wrap"><small>Gạch kính</small><h1>' + esc(ten) + ' Đồng Tâm</h1><p>Kích thước ' + esc((x.kc || '').replace(/x/g, ' x ')) + ', ' + esc(x.dv || x.dong_goi || '') + '. Dùng làm vách lấy sáng, điểm nhấn trang trí.</p></div></div>'
      + '<div class="wrap"><div class="sp"><div>' + khoiAnh + '</div><div><div class="gia">' + tien(x.le) + ' đ/thùng <small>' + (sv ? 'giá lẻ tham khảo, khoảng ' + tien(x.le / sv) + ' đ/viên, ' : 'giá lẻ tham khảo, ') + 'cập nhật ' + NGAY + '</small></div><table>' + hang.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>' + NUT + CHAN + '</div></div>'
      + (mt.length ? '<h2>Thông tin</h2><div class="loi">' + html(mt) + '</div>' : '')
      + (kinh.length > 1 ? '<h2>Các mã gạch kính khác</h2><div class="luoi">' + kinh.filter(z => z !== k).map(z => '<a class="the" href="' + z.slug + '.html"><span class="im">' + (z.thuc[0] ? '<img loading="lazy" src="../' + z.thuc[0] + '" alt="Gạch kính ' + esc(z.so) + '">' : '') + '</span><span>Gạch kính ' + esc(z.so) + '<small>' + tien(z.x.le) + ' đ/thùng</small></span></a>').join('') + '</div>' : '')
      + '<p class="ghi"><a href="./">← Gạch kính Đồng Tâm</a> · <a href="../gach/">Gạch ốp lát</a></p></div>';
    const ld = { '@context': 'https://schema.org', '@type': 'Product', name: ten + ' Đồng Tâm', sku: String(x.ma), brand: { '@type': 'Brand', name: 'Đồng Tâm' }, category: 'Gạch kính', description: desc, image: k.thuc.slice(0, 3).map(absImg) };
    gui(dirG, ten, k.slug + '.html', { title, desc, url, og: 'product', img: absImg(k.thuc[0] || ''), body, ld, dinh: { gia: tien(x.le) + ' đ/thùng', href: SITE + '/#dai-ly' } }); urls.push(url);
  });
  gui(dirG, '', 'index.html', { title: 'Gạch kính Đồng Tâm: ' + kinh.length + ' mã lấy sáng, giá tham khảo', desc: 'Gạch kính Đồng Tâm kích thước 19x19 cm, 6 viên/thùng: vách lấy sáng, điểm nhấn trang trí. Xem hình thực tế, giá lẻ tham khảo và đại lý gần bạn.'.slice(0, 158), url: '/kinh/', img: absImg((kinh[0] && kinh[0].thuc[0]) || 'anh/bia-tong-hop.jpg'), body: '<div class="hero"><div class="wrap"><small>Gạch kính</small><h1>Gạch kính Đồng Tâm</h1><p>Gạch kính 19 x 19 cm lấy sáng cho vách ngăn, tường trang trí. Xem hình thực tế và giá lẻ tham khảo từng mã.</p></div></div><div class="wrap"><h2>Các mã gạch kính</h2><div class="luoi">' + kinh.map(z => '<a class="the" href="' + z.slug + '.html"><span class="im">' + (z.thuc[0] ? '<img loading="lazy" src="../' + z.thuc[0] + '" alt="Gạch kính ' + esc(z.so) + '">' : '') + '</span><span>Gạch kính ' + esc(z.so) + '<small>' + tien(z.x.le) + ' đ/thùng</small></span></a>').join('') + '</div><p class="ghi">Giá lẻ tham khảo, cập nhật ' + NGAY + '. Đại lý báo giá chính xác theo công trình.</p></div>' });
  urls.push('/kinh/');
  console.log('ngoi: ' + cacMau.length + ' mau, keo/ron: ' + keo.length + ' san pham, kinh: ' + kinh.length + ' ma');
};
