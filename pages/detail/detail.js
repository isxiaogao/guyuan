const { request } = require('../../utils/request')

Page({
  data: {
    product: null,
    currentImage: 0,
    images: [],
    loading: true,
    isFav: false
  },

  onLoad(options) {
    request(`/api/products/${options.id}`).then(function (product) {
      const discount = product.originalPrice && product.price < product.originalPrice
        ? (product.price / product.originalPrice * 10).toFixed(1).replace(/\.0$/, '')
        : ''

      const favs = wx.getStorageSync('favorites') || []
      const isFav = favs.indexOf(Number(options.id)) !== -1

      this.setData({
        product: { ...product, discount },
        images: product.images,
        loading: false,
        isFav: isFav
      })

      wx.setNavigationBarTitle({ title: product.name })
    }.bind(this)).catch(function () {
      wx.showToast({ title: '商品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    })
  },

  onImageChange(e) {
    this.setData({ currentImage: e.detail.current })
  },

  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    })
  },

  onContactAuthor() {
    wx.navigateTo({ url: '/pages/about/about' })
  },

  onFavorite() {
    const id = this.data.product.id
    const favs = wx.getStorageSync('favorites') || []
    let isFav = this.data.isFav
    if (isFav) {
      const idx = favs.indexOf(id)
      if (idx !== -1) favs.splice(idx, 1)
      isFav = false
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      favs.push(id)
      isFav = true
      wx.showToast({ title: '已收藏', icon: 'success' })
    }
    wx.setStorageSync('favorites', favs)
    this.setData({ isFav: isFav })
  }
})
