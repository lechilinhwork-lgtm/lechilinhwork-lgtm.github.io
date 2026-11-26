// Kiến thức sản phẩm gạch (tóm lược từ tài liệu đào tạo "Làm chủ ngành gạch", không có số liệu kiểm nghiệm).
// Dùng cho trang sản phẩm và bài viết. Số liệu kháng khuẩn/chống trượt CHỈ dùng theo giấy kiểm nghiệm đã có (xem chứng nhận trong index.html).
const MEN = {
  'BÓNG': 'Bề mặt bóng, nhẵn mịn, độ cứng cao, chống trầy tốt và dễ lau chùi. Khi bề mặt ướt thì dễ trơn, nên ưu tiên cho phòng khách, phòng ngủ, khu vực khô.',
  'MỜ': 'Bề mặt mờ (men matt) cho cảm giác mộc mạc, tự nhiên, ma sát tốt hơn nên thường dùng cho phòng vệ sinh, ban công, sân vườn.',
  'DOUBLE_CHARGE': 'Công nghệ rải liệu hai lớp (double charge) cho hoa văn vân đá có chiều sâu, sát với đá tự nhiên.',
  'ĐỒNG_CHẤT': 'Gạch đồng chất: màu và hoa văn đồng nhất từ bề mặt đến thân gạch, chịu mài mòn tốt, hợp khu vực đi lại nhiều.'
};
const HOA_VAN = [
  [/MARBLE|CARARAS|CREMA|ONYX|TRAVERTINE|LIMESTONE|QUARTZ|VÂN_ĐÁ$/, 'Vân đá tạo cảm giác sang trọng, hợp phòng khách, sảnh, phòng tắm cao cấp. Không gian rộng nên chọn vân lớn, không gian hẹp chọn vân nhỏ.'],
  [/TERRAZZO/, 'Vân terrazzo sáng tạo, hiện đại, mang nét hoài cổ; hợp sàn nhà, tường bếp, quán cà phê, cửa hàng. Nên phối với nội thất tối giản để nổi bật hoa văn.'],
  [/VÂN_GỖ/, 'Vân gỗ ấm cúng, gần gũi thiên nhiên; hợp phòng khách, phòng ngủ, nhà hàng. Bền và dễ vệ sinh hơn sàn gỗ thật, không sợ ẩm hay mối mọt.'],
  [/XI_MĂNG/, 'Vân xi măng đơn giản, cá tính, hiện đại; hợp quán cà phê, nhà ở phong cách công nghiệp hoặc vintage, sàn ban công, tường bếp.'],
  [/VÂN_CÁT|MUỐI_TIÊU/, 'Vân cát nhẹ nhàng, không cầu kỳ, hợp nhiều phong cách (hiện đại, tân cổ điển, đông dương), tạo cảm giác không gian rộng, thoáng.'],
  [/VÂN_MÂY/, 'Vân mây mềm mại, dịu mắt, hợp không gian thanh lịch; diện tích nhỏ sẽ có cảm giác rộng, thoáng hơn.'],
  [/VÂN_VẢI/, 'Vân vải ấm áp, mềm mại, hợp phòng ngủ, phòng khách; dễ phối với nội thất gỗ hoặc vải.'],
  [/MOSAIC/, 'Mosaic tinh xảo, hợp phòng tắm, hồ bơi hoặc mảng tường điểm nhấn; chi phí thi công thường cao hơn.'],
  [/HÌNH_HỌC|HOA_LÁ/, 'Họa tiết trang trí năng động, hợp mảng tường bếp, phòng tắm; dùng ở không gian rộng để tránh rối mắt.'],
  [/KHÔNG_HOA_VĂN/, 'Gạch trơn tối giản, linh hoạt, dễ phối đồ, hợp hầu hết không gian.']
];
const MAU = {
  'TRẮNG': 'Màu trắng làm không gian sáng, rộng, sạch sẽ; hợp phòng tắm, bếp, phòng khách nhỏ. Cần vệ sinh thường xuyên vì dễ lộ vết bẩn.',
  'XÁM': 'Màu xám hiện đại, thanh lịch, dễ phối với trắng, xanh, vàng; hợp phòng khách, phòng ngủ, văn phòng. Chọn xám nhạt cho phòng nhỏ, xám đậm cho phòng rộng.',
  'KEM': 'Màu kem ấm áp, dễ chịu, hợp nhà ở gia đình, phòng ngủ, khách sạn; phản quang tốt nên phòng sáng hơn.',
  'NÂU': 'Màu nâu ấm, gần gũi thiên nhiên; hợp phòng ngủ, phòng khách, không gian cần sự ấm cúng.',
  'ĐEN': 'Màu đen sang trọng, mạnh mẽ; nên dùng làm điểm nhấn, tránh lạm dụng trong phòng nhỏ vì dễ gây cảm giác chật.',
  'VÀNG': 'Màu vàng ấm, tươi sáng; hợp nhà phố, bếp, sảnh.',
  'XANH': 'Màu xanh tươi mát, thư giãn; hợp phòng tắm, phòng ngủ. Chọn xanh nhạt cho phòng nhỏ, xanh đậm làm điểm nhấn.'
};
const KHONG_GIAN_THEO_CONG_NANG = { 'LÁT_NỀN': 'lát nền', 'ỐP_TƯỜNG': 'ốp tường', 'ỐP_LÁT': 'ốp tường và lát nền', 'TRANG_TRÍ': 'trang trí', 'GẠCH_GỖ': 'lát sàn vân gỗ', 'HỒ_BƠI': 'hồ bơi' };
function loiKhuyen(t) {
  const o = [];
  if (t.men && MEN[t.men]) o.push(MEN[t.men]);
  const hv = HOA_VAN.find(x => x[0].test(t.hoaVan || '')); if (hv) o.push(hv[1]);
  const mk = String(t.mau || '').split('_')[0]; if (MAU[mk]) o.push(MAU[mk]);
  return o;
}
module.exports = { MEN, HOA_VAN, MAU, KHONG_GIAN_THEO_CONG_NANG, loiKhuyen };
