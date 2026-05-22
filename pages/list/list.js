const { request } = require('../../utils/request')

let searchTimer = null

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
    const categoryId = options.categoryId !== undefined && Number(options.categoryId) !== 0 ? Number(options.categoryId) : -1
    const categoryName = options.categoryName || '全部'
    this.setData({ categoryId, categoryName, currentCategory: categoryId })
    this.loadCategories()
    this.loadProducts()
  },

  loadCategories() {
    request('/api/categories').then((categories) => {
      const filtered = categories.filter((c) => c.name !== '全部')
      const allCat = [{ id: -1, name: '全部' }]
      this.setData({ categories: allCat.concat(filtered) })
    }).catch((err) => {
      console.error('[list] loadCategories failed', err)
    })
  },

  loadProducts() {
    this.setData({ loading: true, empty: false })
    const params = {}
    if (this.data.currentCategory >= 0) {
      params.category = this.data.currentCategory
    }
    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword
    }
    request('/api/products', params).then((result) => {
      this.setData({
        products: result.list,
        loading: false,
        empty: result.total === 0
      })
    }).catch((err) => {
      console.error('[list] loadProducts failed', err)
      this.setData({ products: [], loading: false, empty: true })
    })
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
    const keyword = e.detail.value.trim()
    this.setData({ searchKeyword: keyword })

    if (searchTimer) clearTimeout(searchTimer)

    if (!keyword) {
      this.loadProducts()
      return
    }

    searchTimer = setTimeout(() => {
      this.setData({ currentCategory: -1 })
      this.loadProducts()
    }, 500)
  },

  onSearchConfirm(e) {
    const keyword = e.detail.value.trim()
    if (searchTimer) clearTimeout(searchTimer)
    this.setData({ searchKeyword: keyword, currentCategory: -1 })
    this.loadProducts()
  },

  onClearSearch() {
    if (searchTimer) clearTimeout(searchTimer)
    this.setData({ searchKeyword: '', currentCategory: -1 })
    this.loadProducts()
  },

  onUnload() {
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
  }
})
