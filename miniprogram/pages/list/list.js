// pages/list/list.js
const { callBike } = require("../../utils/cloud.js");

const STATUS_META = {
  slow: { label: "慢速", cls: "slow" },
  normal: { label: "普速", cls: "normal" },
  fast: { label: "神速", cls: "fast" },
};

Page({
  data: {
    loading: true,
    list: [],
  },

  // 每次进入/返回都刷新，投票后回到列表能看到最新状态
  onShow() {
    this.fetchList();
  },

  fetchList() {
    callBike("listVehicles").then((r) => {
      if (r.errCode !== 0) {
        this.setData({ loading: false });
        wx.showToast({ title: r.errMsg || "加载失败", icon: "none" });
        return;
      }
      const list = (r.list || []).map((x) => ({
        ...x,
        statusLabel: STATUS_META[x.status].label,
        statusCls: STATUS_META[x.status].cls,
      }));
      this.setData({ loading: false, list });
    });
  },

  onItemTap(e) {
    const vehicleId = e.currentTarget.dataset.vehicleId;
    if (!vehicleId) return;
    wx.navigateTo({
      url: `/pages/detail/detail?vehicleId=${vehicleId}&mode=view`,
    });
  },
});
