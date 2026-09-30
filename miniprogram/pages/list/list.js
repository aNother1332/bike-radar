// pages/list/list.js
const { callBike } = require("../../utils/cloud.js");

const STATUS_META = {
  slow: { label: "慢速", cls: "slow" },
  normal: { label: "普速", cls: "normal" },
  fast: { label: "神速", cls: "fast" },
};

// 青桔「车号开车」页短链（失效时在青桔小程序内重新「复制链接」替换）
const QINGJU_SHORT_LINK = "#小程序://青桔/rZ6WMhfhlbtIFHG";

Page({
  data: {
    loading: true,
    list: [],
    // 找车确认弹窗
    findModalShown: false,
    findVehicleId: "",
    findBtnRevealed: false,
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

  // ===== 找车功能 =====

  // 点击神速车的「去找车」：弹出强制阅读弹窗
  onFindTap(e) {
    const vehicleId = e.currentTarget.dataset.vehicleId;
    if (!vehicleId) return;
    this.setData({
      findModalShown: true,
      findVehicleId: vehicleId,
      findBtnRevealed: false,
    });
    // 若声明内容不足一屏（无法触发 scrolltolower），直接解锁按钮
    setTimeout(() => this.checkModalScrollable(), 300);
  },

  // 声明内容没超出滚动区时 scrolltolower 永远不会触发，这里兜底解锁
  checkModalScrollable() {
    if (this.data.findBtnRevealed) return;
    const query = wx.createSelectorQuery();
    query.select(".modal-scroll").boundingClientRect();
    query.select(".modal-body").boundingClientRect();
    query.exec((res) => {
      const box = res && res[0];
      const body = res && res[1];
      if (!box || !body) return;
      if (body.height <= box.height + 8) {
        this.setData({ findBtnRevealed: true });
      }
    });
  },

  // 用户滑动到声明底部后解锁「去找车」按钮
  onModalReachBottom() {
    if (!this.data.findBtnRevealed) {
      this.setData({ findBtnRevealed: true });
    }
  },

  onModalCancel() {
    this.setData({ findModalShown: false });
  },

  noop() {},

  // 复制车号并跳转青桔「车号开车」页
  onConfirmFind() {
    wx.setClipboardData({
      data: this.data.findVehicleId,
      success: () => {
        wx.navigateToMiniProgram({
          shortLink: QINGJU_SHORT_LINK,
          fail: (e) => {
            const msg = (e && e.errMsg) || "";
            if (msg.indexOf("cancel") < 0) {
              wx.showToast({ title: "跳转失败，请稍后重试", icon: "none" });
            }
          },
          complete: () => {
            this.setData({ findModalShown: false });
          },
        });
      },
    });
  },
});
