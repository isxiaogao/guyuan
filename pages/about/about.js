Page({
  data: {
    showReward: false
  },

  onCopyWechat() {
    wx.setClipboardData({
      data: 'guyuan-design',
      success: function () {
        wx.showToast({ title: '已复制微信号', icon: 'success' })
      }
    })
  },

  onReward() {
    this.setData({ showReward: true })
  },

  onCloseReward() {
    this.setData({ showReward: false })
  }
})
