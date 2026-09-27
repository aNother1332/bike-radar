// pages/index/index.js
const { callBike, parseVehicleId } = require("../../utils/cloud.js");

Page({
  data: {
    vehicleId: "",
    vehicleCount: null,
  },

  // 每次回到主页都刷新收录数，扫码建了新车后返回时数字也会更新
  onShow() {
    callBike("countVehicles").then((r) => {
      if (r.errCode === 0) {
        this.setData({ vehicleCount: r.count });
      }
    });
  },

  onInput(e) {
    this.setData({ vehicleId: e.detail.value });
  },

  // 扫码进入：解析车号 -> 新车自动建档 -> 以 scan 模式进入详情页（可编辑可投票）
  onScan() {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        const vehicleId = parseVehicleId(res.result);
        if (!vehicleId) {
          wx.showToast({ title: "无法识别该二维码", icon: "none" });
          return;
        }
        wx.showLoading({ title: "识别中", mask: true });
        callBike("ensureVehicle", { vehicleId }).then((r) => {
          wx.hideLoading();
          if (r.errCode !== 0) {
            wx.showToast({ title: r.errMsg || "识别失败", icon: "none" });
            return;
          }
          wx.navigateTo({
            url: `/pages/detail/detail?vehicleId=${vehicleId}&mode=scan`,
          });
        });
      },
    });
  },

  // 输入车号：仅查询已有车辆，以 view 模式进入（只读）
  onQuery() {
    const vehicleId = (this.data.vehicleId || "").trim();
    if (!/^\d{8}$/.test(vehicleId)) {
      wx.showToast({ title: "请输入 8 位数字车号", icon: "none" });
      return;
    }
    wx.showLoading({ title: "查询中", mask: true });
    callBike("getVehicle", { vehicleId }).then((r) => {
      wx.hideLoading();
      if (r.errCode !== 0) {
        wx.showToast({ title: r.errMsg || "查询失败", icon: "none" });
        return;
      }
      if (!r.exists) {
        wx.showToast({ title: "库内不包含此车", icon: "none" });
        return;
      }
      wx.navigateTo({
        url: `/pages/detail/detail?vehicleId=${vehicleId}&mode=view`,
      });
    });
  },
});
