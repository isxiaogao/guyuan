Page({
  data: {
    showReward: false,
    src:'https://guyuan.allyd.cn/uploads/20260521_160344_upload_567284.png'
  },

  onCopyWechat() {
    wx.setClipboardData({
      data: 'guyuan-design',
      success: () => {
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
