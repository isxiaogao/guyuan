const { request } = require('../../utils/request')

Page({
  data: {
    banners: [],
    categories: [],
    hotProducts: [],
    newProducts: []
  },

  onLoad() {
    this.loadAll()
  },

  async loadAll() {
    try {
      const [banners, categories, hotProducts, newProducts] = await Promise.all([
        request('/api/banners'),
        request('/api/categories'),
        request('/api/products/hot'),
        request('/api/products/new')
      ])
      this.setData({
        banners,
        categories: categories.filter(c => c.id > 0),
        hotProducts: hotProducts.slice(0, 4),
        newProducts: newProducts.slice(0, 4)
      })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onCategoryTap(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/list/list?categoryId=${id}&categoryName=${name}` })
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  }
})
