// ===== DANH SÁCH ĐẠI LÝ HỢP TÁC ĐỒNG TÂM =====
// Nguồn: Google Maps "Đại lý hợp tác Đồng Tâm" (địa chỉ cửa hàng, toạ độ) + file
// "Danh sách đại lý tôi đang hỗ trợ.xlsx" của anh Linh (mã KH, số điện thoại) — 22/11/2026.
// Dùng chung cho: trang khách index.html và tờ rơi to-roi.html.
//
// Mỗi đại lý có 1 "ma" (mã khách hàng Đồng Tâm) — mã này nằm trên link QR riêng: ...?dl=<ma>
//   - sdt: số gọi/Zalo của cửa hàng. Để "" thì trang dùng HOTLINE_HO_TRO.
//   - lat/lng: toạ độ để tính "đại lý gần nhất" + nút chỉ đường. ganDung: true = toạ độ ước lượng.
//   - mau: tên đại lý ĐÚNG NHƯ cột trong sheet Stock_by_Agency của app Quản lý mẫu, kèm các cửa hàng
//     (vị trí trong cuaHang, bỏ trống = mọi cửa hàng) đang trưng bày mẫu của cột đó.

var HOTLINE_HO_TRO = '0819548908';          // Gọi tư vấn: anh Lê Chí Linh, Đồng Tâm
var HOTLINE_HO_TRO_TEN = 'Tư vấn Đồng Tâm';
var ZALO_TU_VAN = '0819548908';               // Zalo anh Linh: khách bấm "Zalo tư vấn" là nhắn thẳng số này
var TEN_TU_VAN = 'anh Linh';
var LINK_MAP_TAT_CA = 'https://maps.app.goo.gl/N3aaxeVsy6NH9h8F7';

var DAI_LY = [
  { ma:'101290', ten:'Thiên Lộc Home', tenDay:'Cty TNHH VLXD Thiên Lộc', cuaHang:[
      { diaChi:'436 Lê Văn Việt, Tăng Nhơn Phú, TP.HCM', sdt:'0932603133', lat:10.8442751, lng:106.7891714 },
      { diaChi:'730 Lã Xuân Oai, Long Trường, TP.HCM',   sdt:'0906778388', lat:10.8076279, lng:106.8162281 },
      { diaChi:'303 Đường số 442, Tăng Nhơn Phú, TP.HCM', sdt:'0906778388', lat:10.8402564, lng:106.796096 }
    ], mau:[ {ten:'CÔNG TY TNHH VẬT LIỆU XÂY DỰNG THIÊN LỘC', ch:[1,2]}, {ten:'Cty TNHH VLXD Thiên Lộc ( Lê Văn Việt )', ch:[0]} ]},
  { ma:'110198', ten:'Đặng Ngọc Anh', tenDay:'Công ty CP Đặng Ngọc Anh', cuaHang:[
      { diaChi:'221 Hoàng Hữu Nam, Tăng Nhơn Phú, TP.HCM', sdt:'0973609898', lat:10.8591287, lng:106.8134277 } ],
    mau:[ {ten:'CÔNG TY CỔ PHẦN ĐẶNG NGỌC ANH'} ]},
  { ma:'101291', ten:'Tân Hùng Anh', tenDay:'Cty TM XD Tân Hùng Anh', cuaHang:[
      { diaChi:'646 Nguyễn Xiển, Long Bình, TP.HCM', sdt:'0906607456', lat:10.8449117, lng:106.8299636 } ],
    mau:[ {ten:'CÔNG TY TNHH THƯƠNG MẠI XÂY DỰNG TÂN HÙNG ANH'} ]},
  { ma:'101842', ten:'Hoàng Lam', tenDay:'Cty CP TM Hoàng Lam', cuaHang:[
      { diaChi:'06 Đường D6, KDC Nam Long, Phước Long, TP.HCM', sdt:'0987959595', lat:10.8121651, lng:106.7821972 } ],
    mau:[ {ten:'CÔNG TY CỔ PHẦN THƯƠNG MẠI HOÀNG LAM'} ]},
  { ma:'108318', ten:'Thanh Nhàn', tenDay:'Cty TNHH VLXD và TTNT Thanh Nhàn', cuaHang:[
      { diaChi:'19 Liên Phường, Phước Long, TP.HCM', sdt:'0909397945', lat:10.804697, lng:106.779553 } ],
    mau:[ {ten:'CÔNG TY TNHH VẬT LIỆU XÂY DỰNG VÀ TRANG TRÍ NỘI THẤT THANH NHÀN'} ]},
  { ma:'109168', ten:'Đức Truyền', tenDay:'Cty TNHH TM Đức Truyền', cuaHang:[
      { diaChi:'4 Hoàng Hữu Nam, Long Bình, TP.HCM', sdt:'0988214567', lat:10.8505928, lng:106.8138125 } ],
    mau:[ {ten:'CÔNG TY TNHH THƯƠNG MẠI ĐỨC TRUYỀN'} ]},
  { ma:'104897', ten:'Việt Mỹ Ceramic', tenDay:'Cty TNHH XD Việt Mỹ (Kho gạch Việt Mỹ)', cuaHang:[
      { diaChi:'128 Bưng Ông Thoàn, Long Trường, TP.HCM', sdt:'0919656389', lat:10.8056691, lng:106.7992883 } ],
    mau:[ {ten:'CÔNG TY TNHH XÂY DỰNG VIỆT MỸ CERAMIC'} ]},
  { ma:'101293', ten:'Tiến Phát', tenDay:'Cty TNHH VLXD và TTNT Tiến Phát', cuaHang:[
      { diaChi:'137 Liên Phường, Phước Long, TP.HCM', sdt:'0909447984', lat:10.8078428, lng:106.785243 } ],
    mau:[ {ten:'CÔNG TY TRÁCH NHIỆM HỮU HẠN VẬT LIỆU XÂY DỰNG VÀ TRANG TRÍ NỘI THẤT TIẾN PHÁT'} ]},
  { ma:'106439', ten:'Khang Anh Ceramic', tenDay:'Công ty TNHH Khang Anh Ceramic', cuaHang:[
      { diaChi:'1021 Nguyễn Duy Trinh, Long Trường, TP.HCM', sdt:'0933406027', lat:10.796037, lng:106.8075901 } ],
    mau:[ {ten:'CÔNG TY TNHH KHANG ANH CERAMIC'} ]},
  { ma:'109640', ten:'Nhật Nam', tenDay:'Cty TNHH VLXD Nhật Nam', cuaHang:[
      { diaChi:'310 Liên Phường, Phước Long, TP.HCM', sdt:'0933171168', lat:10.8065276, lng:106.7836536 } ],
    mau:[ {ten:'CÔNG TY TNHH VẬT LIỆU XÂY DỰNG NHẬT NAM'} ]},
  { ma:'102487', ten:'Hưng Lộc', tenDay:'Cty TNHH XD SX TM Hưng Lộc', cuaHang:[
      { diaChi:'107 Liên Phường, Phước Long, TP.HCM', sdt:'0879330325', lat:10.8066762, lng:106.788783 } ],
    mau:[ {ten:'CÔNG TY TNHH XÂY DỰNG SẢN XUẤT THUƠNG MẠI HƯNG LỘC'} ]},
  { ma:'101292', ten:'Thép Bình Nguyên', tenDay:'Ngói Đồng Tâm - Thép Bình Nguyên', cuaHang:[
      { diaChi:'113 Đường số 6, Long Bình, TP.HCM', sdt:'0918001212', lat:10.8580754, lng:106.8420843 } ],
    mau:[ {ten:'CÔNG TY TRÁCH NHIỆM HỮU HẠN XÂY DỰNG THÉP BÌNH NGUYÊN'} ]},
  { ma:'108364', ten:'Hoàng Tiến Phong', tenDay:'HKD Hoàng Tiến Phong 2', cuaHang:[
      { diaChi:'570 Nguyễn Xiển, Long Bình, TP.HCM', sdt:'0916828280', lat:10.8422531, lng:106.8289357 } ],
    mau:[ {ten:'HỘ KINH DOANH HOÀNG TIẾN PHONG 2'} ]},
  { ma:'108332', ten:'Long Trường Phát', tenDay:'Cửa hàng TTNT Long Trường Phát 1', cuaHang:[
      { diaChi:'732 Lã Xuân Oai, Long Trường, TP.HCM', sdt:'0902342266', lat:10.8076082, lng:106.8162753 } ],
    mau:[ {ten:'HỘ KINH DOANH CỬA HÀNG TRANG TRÍ NỘI THẤT LONG TRƯỜNG PHÁT 1'} ]},
  { ma:'106438', ten:'Gia Phát', tenDay:'Cty TNHH TM VLXD Gia Phát', cuaHang:[
      { diaChi:'766 Lã Xuân Oai, Long Trường, TP.HCM', sdt:'0843614499', lat:10.8079, lng:106.8172, ganDung:true } ],
    mau:[ {ten:'CÔNG TY TNHH THƯƠNG MẠI VLXD GIA PHÁT'}, {ten:'Cty TNHH TM VLXD Gia Phát'} ]},
  { ma:'111490', ten:'Khang Trang', tenDay:'Cty TNHH TC Khang Trang', cuaHang:[
      { diaChi:'59B Hiệp Bình, Hiệp Bình, TP.HCM', sdt:'0907352526', lat:10.847967, lng:106.7207906 } ],
    mau:[ {ten:'CÔNG TY TNHH TC KHANG TRANG'} ]},
  { ma:'110205', ten:'Sao Việt SVC', tenDay:'Cty TNHH XD TM Sao Việt SVC', cuaHang:[
      { diaChi:'501D Đường 26, Khu phố 5, Hiệp Bình, TP.HCM', sdt:'0908883461', lat:10.8465, lng:106.7215, ganDung:true } ],
    mau:[ {ten:'CÔNG TY TNHH XÂY DỰNG THƯƠNG MẠI SAO VIỆT SVC'} ]},
  { ma:'114306', ten:'Saigon Success', tenDay:'Cty TNHH TM & DV XD Saigon Success', cuaHang:[
      { diaChi:'57 Hiệp Bình, Khu phố 7, Hiệp Bình, TP.HCM', sdt:'0976367106', lat:10.8476, lng:106.7212, ganDung:true } ],
    mau:[ {ten:'CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ XÂY DỰNG SAIGON SUCCESS'} ]}
];

function timDaiLy(ma){
  ma = String(ma||'').trim();
  for(var i=0;i<DAI_LY.length;i++) if(DAI_LY[i].ma===ma) return DAI_LY[i];
  return null;
}
function dinhDangSdt(s){
  s = String(s||'').replace(/\D/g,'');
  if(s.length===10) return s.slice(0,4)+' '+s.slice(4,7)+' '+s.slice(7);
  return s;
}
function linkChiDuong(ch){
  return 'https://www.google.com/maps/dir/?api=1&destination='+ch.lat+','+ch.lng;
}
