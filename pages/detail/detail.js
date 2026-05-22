const { request, login } = require('../../utils/request')

Page({
  data: {
    product: null,
    currentImage: 0,
    images: [],
    loading: true,
    isFav: false,
    isAdmin: false
  },

  onLoad(options) {
    this.setData({ isAdmin: wx.getStorageSync('isAdmin') || false })
    request(`/api/products/${options.id}`).then((product) => {
      this.setData({
        product,
        images: product.images,
        loading: false
      })
      wx.setNavigationBarTitle({ title: product.name })
      this.checkFavStatus(product.id)
    }).catch((err) => {
      console.error('[detail] load product failed', err)
      wx.showToast({ title: '商品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    })
  },

  onShow() {
    this.setData({ isAdmin: wx.getStorageSync('isAdmin') || false })
  },

  checkFavStatus(productId) {
    const openid = wx.getStorageSync('openid')
    if (!openid) {
      login().then(() => {
        this.loadFavStatus(productId)
      }).catch((err) => {
        console.error('[detail] login for fav status failed', err)
      })
    } else {
      this.loadFavStatus(productId)
    }
  },

  loadFavStatus(productId) {
    request('/api/favorites').then((list) => {
      const isFav = list.some((item) => item.id === productId)
      this.setData({ isFav })
    }).catch((err) => {
      console.error('[detail] loadFavStatus failed', err)
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
    if (this.data.isFav) {
      this.removeFav(id)
    } else {
      this.addFav(id)
    }
  },

  addFav(id) {
    request('/api/favorites', { product_id: id }, 'POST').then(() => {
      this.setData({ isFav: true })
      wx.showToast({ title: '已收藏', icon: 'success' })
    }).catch((err) => {
      wx.showToast({ title: err.message || '收藏失败', icon: 'none' })
    })
  },

  removeFav(id) {
    request('/api/favorites', { product_id: id }, 'DELETE').then(() => {
      this.setData({ isFav: false })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    }).catch((err) => {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    })
  },

  onEditTap() {
    wx.navigateTo({ url: `/pages/edit/edit?id=${this.data.product.id}` })
  }
})
