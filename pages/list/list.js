const { request } = require('../../utils/request')

Page({
  data: {
    categoryId: 0,
    categoryName: '全部',
    currentCategory: 0,
    categories: [],
    products: [],
    loading: true,
    empty: false
  },

  onLoad(options) {
    const categoryId = Number(options.categoryId || 0)
    const categoryName = options.categoryName || '全部'
    this.setData({ categoryId, categoryName, currentCategory: categoryId })
    this.loadCategories()
    this.loadProducts()
  },

  async loadCategories() {
    try {
      const categories = await request('/api/categories')
      this.setData({ categories })
    } catch (e) {
      // 使用本地兜底
    }
  },

  async loadProducts() {
    this.setData({ loading: true, empty: false })
    try {
      const { list, total } = await request('/api/products', {
        category: this.data.currentCategory
      })
      this.setData({
        products: list,
        loading: false,
        empty: total === 0
      })
    } catch (e) {
      this.setData({ products: [], loading: false, empty: true })
    }
  },

  onCategoryTap(e) {
    const { id } = e.currentTarget.dataset
    this.setData({ currentCategory: id })
    this.loadProducts()
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onPullDownRefresh() {
    this.loadProducts()
    setTimeout(() => wx.stopPullDownRefresh(), 600)
  }
})
