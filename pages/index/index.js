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

  loadAll() {
    Promise.all([
      request('/api/banners'),
      request('/api/categories'),
      request('/api/products/hot'),
      request('/api/products/new')
    ]).then(function (result) {
      var banners = result[0]
      var categories = result[1]
      var hotProducts = result[2]
      var newProducts = result[3]
      this.setData({
        banners: banners,
        categories: categories.map(function (c) {
            c.icon = '/images/menu_icon' + c.id + '.png'
          return c
        }),
        hotProducts: hotProducts.slice(0, 4),
        newProducts: newProducts.slice(0, 4)
      })
      console.log(categories)
    }.bind(this)).catch(function () {
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  getCategoryIcon(id) {
    return '/images/menu_icon' + id + '.png'
  },
  onCategoryTap(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/list/list?categoryId=${id}&categoryName=${name}` })
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  checkAdmin(callback) {
    if (wx.getStorageSync('isAdmin')) {
      return callback()
    }
    wx.showModal({
      title: '管理员验证',
      editable: true,
      placeholderText: '请输入管理密码',
      confirmText: '验证',
      success: function (res) {
        if (res.confirm && res.content === 'guyuan2024') {
          wx.setStorageSync('isAdmin', true)
          callback()
        } else if (res.confirm) {
          wx.showToast({ title: '密码错误', icon: 'error' })
        }
      }
    })
  },

  onAddTap() {
    var self = this
    this.checkAdmin(function () {
      wx.navigateTo({ url: '/pages/add/add' })
    })
  },

  onCategoryManageTap() {
    var self = this
    this.checkAdmin(function () {
      wx.navigateTo({ url: '/pages/category/category' })
    })
  },

  onLabelTap() {
    this.checkAdmin(function () {
      wx.navigateTo({ url: '/pages/label/label' })
    })
  },

  onAdminLongPress() {
    var self = this
    this.checkAdmin(function () {
      wx.showActionSheet({
        itemList: ['商品录入', '分类管理', '标签打印'],
        success: function (r) {
          if (r.tapIndex === 0) {
            wx.navigateTo({ url: '/pages/add/add' })
          } else if (r.tapIndex === 1) {
            wx.navigateTo({ url: '/pages/category/category' })
          } else {
            wx.navigateTo({ url: '/pages/label/label' })
          }
        }
      })
    })
  }
})
