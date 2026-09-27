// pages/detail/detail.js
const { callBike } = require("../../utils/cloud.js");

const STATUS_META = {
  slow: { label: "慢速", desc: "该车大概率被限速，赶时间慎选", cls: "slow" },
  normal: { label: "普速", desc: "暂无明确的投票结论", cls: "normal" },
  fast: { label: "神速", desc: "该车速度飞快，放心骑", cls: "fast" },
};

Page({
  data: {
    vehicleId: "",
    mode: "view", // scan: 扫码进入，可编辑可投票；view: 输入进入，只读
    loading: true,
    exists: false,
    plate: "",
    plateInput: "",
    status: "normal",
    statusLabel: "",
    statusDesc: "",
    counts: { slow: 0, normal: 0, fast: 0, total: 0 },
    myVote: null,
    savingPlate: false,
    statusBarHeight: 20,
  },

  onLoad(options) {
    const system = wx.getWindowInfo
      ? wx.getWindowInfo()
      : wx.getSystemInfoSync();
    this.setData({
      vehicleId: options.vehicleId || "",
      mode: options.mode === "scan" ? "scan" : "view",
      statusBarHeight: system.statusBarHeight || 20,
    });
    this.fetchInfo();
  },

  fetchInfo() {
    const vehicleId = this.data.vehicleId;
    if (!vehicleId) return;
    callBike("getVehicle", { vehicleId }).then((r) => {
      if (r.errCode !== 0 || !r.exists) {
        this.setData({ loading: false, exists: false });
        return;
      }
      const meta = STATUS_META[r.status] || STATUS_META.normal;
      this.setData({
        loading: false,
        exists: true,
        plate: r.vehicle.plate || "",
        plateInput: r.vehicle.plate || "",
        status: r.status,
        statusLabel: meta.label,
        statusDesc: meta.desc,
        counts: r.counts,
        myVote: r.myVote,
      });
    });
  },

  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.reLaunch({ url: "/pages/index/index" });
    }
  },

  onPlateInput(e) {
    this.setData({ plateInput: e.detail.value });
  },

  // 车牌号编辑（仅扫码模式），失焦时若有变更则保存，云端留修改记录
  onPlateBlur() {
    if (this.data.mode !== "scan") return;
    const next = (this.data.plateInput || "").trim();
    const current = this.data.plate;
    if (next === current) return;
    if (next !== "" && !/^\d{6}$/.test(next)) {
      wx.showToast({ title: "车牌号应为 6 位数字", icon: "none" });
      this.setData({ plateInput: current });
      return;
    }
    if (this.data.savingPlate) return;
    this.setData({ savingPlate: true });
    callBike("updatePlate", { vehicleId: this.data.vehicleId, plate: next }).then(
      (r) => {
        this.setData({ savingPlate: false });
        if (r.errCode !== 0) {
          wx.showToast({ title: r.errMsg || "保存失败", icon: "none" });
          this.setData({ plateInput: current });
          return;
        }
        this.setData({ plate: r.plate });
        wx.showToast({ title: "已保存", icon: "success" });
      }
    );
  },

  // 投票 / 改票：覆盖写入后服务端按最新 3 票重算状态
  onVote(e) {
    if (this.data.mode !== "scan") {
      wx.showToast({ title: "在车辆旁扫码进入，才能投票", icon: "none" });
      return;
    }
    const choice = e.currentTarget.dataset.choice;
    if (!choice) return;
    wx.showLoading({ title: "提交中", mask: true });
    callBike("vote", { vehicleId: this.data.vehicleId, choice }).then((r) => {
      wx.hideLoading();
      if (r.errCode !== 0 || !r.exists) {
        wx.showToast({ title: r.errMsg || "投票失败", icon: "none" });
        return;
      }
      const meta = STATUS_META[r.status] || STATUS_META.normal;
      this.setData({
        counts: r.counts,
        myVote: r.myVote,
        status: r.status,
        statusLabel: meta.label,
        statusDesc: meta.desc,
      });
    });
  },
});
