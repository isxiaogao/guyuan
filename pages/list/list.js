const { request } = require('../../utils/request')

var searchTimer = null

Page({
  data: {
    categoryId: -1,
    categoryName: '全部',
    currentCategory: -1,
    categories: [],
    products: [],
    loading: true,
    empty: false,
    searchKeyword: ''
  },

  onLoad(options) {
    const categoryId = Number(options.categoryId) == 1 ? -1 : Number(options.categoryId)
    const categoryName = options.categoryName || '全部'
    this.setData({ categoryId, categoryName, currentCategory: categoryId })
    this.loadCategories()
    this.loadProducts()
  },

  loadCategories() {
    request('/api/categories').then(function (categories) {
      var filtered = categories.filter(function (c) { return c.name !== '全部' })
      var allCat = [{ id: -1, name: '全部' }]
      this.setData({ categories: allCat.concat(filtered) })
    }.bind(this)).catch(function () {
      // 静默失败
    })
  },

  loadProducts() {
    this.setData({ loading: true, empty: false })
    var params = {}
    if (this.data.currentCategory >= 0) {
      params.category = this.data.currentCategory
    }
    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword
    }
    request('/api/products', params).then(function (result) {
      this.setData({
        products: result.list,
        loading: false,
        empty: result.total === 0
      })
    }.bind(this)).catch(function () {
      this.setData({ products: [], loading: false, empty: true })
    }.bind(this))
  },

  onCategoryTap(e) {
    const { id } = e.currentTarget.dataset
    this.setData({ currentCategory: id, searchKeyword: '' })
    this.loadProducts()
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onPullDownRefresh() {
    this.loadProducts()
    setTimeout(() => wx.stopPullDownRefresh(), 600)
  },

  onSearchInput(e) {
    var keyword = e.detail.value.trim()
    this.setData({ searchKeyword: keyword })

    if (searchTimer) clearTimeout(searchTimer)

    if (!keyword) {
      this.loadProducts()
      return
    }

    searchTimer = setTimeout(function () {
      this.setData({ currentCategory: -1 })
      this.loadProducts()
    }.bind(this), 500)
  },

  onSearchConfirm(e) {
    var keyword = e.detail.value.trim()
    if (searchTimer) clearTimeout(searchTimer)
    this.setData({ searchKeyword: keyword, currentCategory: -1 })
    this.loadProducts()
  },

  onClearSearch() {
    if (searchTimer) clearTimeout(searchTimer)
    this.setData({ searchKeyword: '', currentCategory: -1 })
    this.loadProducts()
  }
})
