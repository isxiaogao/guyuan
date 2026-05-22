const { request, login } = require('../../utils/request')

Page({
  data: {
    favorites: [],
    loading: true,
    openid: ''
  },

  onLoad() {
    this.ensureLogin()
  },

  onShow() {
    if (this.data.openid) {
      this.loadFavorites()
    }
  },

  ensureLogin() {
    const openid = wx.getStorageSync('openid')
    if (openid) {
      this.setData({ openid })
      this.loadFavorites()
    } else {
      login().then((oid) => {
        this.setData({ openid: oid })
        this.loadFavorites()
      }).catch((err) => {
        console.error('[favorites] login failed', err)
        this.setData({ loading: false })
      })
    }
  },

  onLoginTap() {
    this.setData({ loading: true })
    login(true).then((oid) => {
      this.setData({ openid: oid })
      this.loadFavorites()
    }).catch((err) => {
      console.error('[favorites] force login failed', err)
      this.setData({ loading: false })
      wx.showToast({ title: '登录失败', icon: 'none' })
    })
  },

  onLoginLongPress() {
    wx.showModal({
      title: '刷新身份',
      content: '将重新从服务器获取您的登录信息',
      confirmText: '刷新',
      success: (res) => {
        if (res.confirm) {
          this.onLoginTap()
        }
      }
    })
  },

  loadFavorites() {
    this.setData({ loading: true })
    request('/api/favorites').then((list) => {
      this.setData({ favorites: list, loading: false })
    }).catch((err) => {
      console.error('[favorites] loadFavorites failed', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onUnfavTap(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认',
      content: '确定移除该收藏？',
      confirmText: '移除',
      success: (res) => {
        if (res.confirm) {
          request('/api/favorites', { product_id: id }, 'DELETE').then(() => {
            wx.showToast({ title: '已移除', icon: 'success' })
            this.loadFavorites()
          }).catch((err) => {
            console.error('[favorites] remove favorite failed', err)
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
        }
      }
    })
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
