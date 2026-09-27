// utils/cloud.js
// 云函数统一调用封装：cloudfunctions/bike 以 type 字段分发

function callBike(type, data = {}) {
  return wx.cloud
    .callFunction({ name: "bike", data: { type, ...data } })
    .then((res) => res.result)
    .catch((err) => {
      console.error("云函数调用失败", type, err);
      return { errCode: -1, errMsg: "网络异常，请稍后重试" };
    });
}

// 从二维码内容解析车号：优先取 vehicleId= 参数值，参数位数变化也兼容；兜底取连续 8 位数字
function parseVehicleId(text) {
  if (!text) return null;
  const str = String(text);
  const m = str.match(/vehicleId=(\d{6,12})/i);
  if (m) return m[1];
  const digits = str.match(/\d{8}/);
  return digits ? digits[0] : null;
}

module.exports = { callBike, parseVehicleId };
