const { request, BASE_URL, login } = require('../../utils/request')

Page({
  data: {
    banners: [],
    categories: [],
    hotProducts: [],
    newProducts: [],
    isAdmin: false
  },

  onLoad() {
    this.setData({ isAdmin: wx.getStorageSync('isAdmin') || false })
    this.loadAll()
  },

  onShow() {
    this.setData({ isAdmin: wx.getStorageSync('isAdmin') || false })
  },

  loadAll() {
    Promise.all([
      request('/api/banners'),
      request('/api/categories'),
      request('/api/products/hot'),
      request('/api/products/new')
    ]).then((result) => {
      let banners = result[0] || []
      if (banners.length) {
        banners = banners.map((b) => {
          if (b.image && b.image.startsWith('/')) b.image = BASE_URL + b.image
          return b
        })
      }
      const categories = (result[1] || []).filter((c) => c.name !== '全部')
      const hotProducts = (result[2] || []).slice(0, 4)
      const newProducts = (result[3] || []).slice(0, 4)

      this.setData({
        banners,
        categories: categories.map((c) => ({ ...c, icon: `/images/menu_icon${c.id}.png` })),
        hotProducts,
        newProducts
      })
    }).catch(() => {
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onCategoryTap(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/list/list?categoryId=${id}&categoryName=${name}` })
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onAddTap() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  onBannerTap() {
    wx.navigateTo({ url: '/pages/banner/banner' })
  },

  onCategoryManageTap() {
    wx.navigateTo({ url: '/pages/category/category' })
  },

  onLabelTap() {
    wx.navigateTo({ url: '/pages/label/label' })
  },

  onAdminLongPress() {
    wx.showActionSheet({
      itemList: ['商品录入', '分类管理', '轮播图管理', '标签打印', '刷新身份'],
      success: (r) => {
        const actions = [
          '/pages/add/add',
          '/pages/category/category',
          '/pages/banner/banner',
          null, // 刷新身份
          '/pages/label/label'
        ]
        if (r.tapIndex === 3) {
          login(true).then(() => {
            this.setData({ isAdmin: wx.getStorageSync('isAdmin') || false })
            wx.showToast({ title: '已刷新', icon: 'success' })
          }).catch(() => {
            wx.showToast({ title: '刷新失败', icon: 'none' })
          })
        } else if (actions[r.tapIndex]) {
          wx.navigateTo({ url: actions[r.tapIndex] })
        }
      }
    })
  },

  onFavoritesTap() {
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  }
})
