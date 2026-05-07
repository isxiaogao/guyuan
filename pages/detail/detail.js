const { request } = require('../../utils/request')

Page({
  data: {
    product: null,
    currentImage: 0,
    images: [],
    loading: true
  },

  async onLoad(options) {
    try {
      const product = await request(`/api/products/${options.id}`)
      const discount = product.originalPrice
        ? Math.round(product.price / product.originalPrice * 10)
        : ''

      this.setData({
        product: { ...product, discount },
        images: product.images,
        loading: false
      })

      wx.setNavigationBarTitle({ title: product.name })
    } catch (e) {
      wx.showToast({ title: '商品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
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

  onAddCart() {
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  },

  onBuyNow() {
    wx.showToast({ title: '功能开发中...', icon: 'none' })
  }
})
