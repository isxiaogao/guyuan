const { request, login } = require('../../utils/request')

Page({
  data: {
    product: null,
    mediaList: [],
    loading: true,
    isFav: false,
    isAdmin: false,
    currentMediaIndex: 0
  },

  onLoad(options) {
    this.setData({ isAdmin: wx.getStorageSync('isAdmin') || false })
    request(`/api/products/${options.id}`).then((product) => {
      // 构建混合媒体列表：图片在前，视频在后
      const mediaList = []
      // 先添加图片
      ;(product.images || []).forEach((img) => {
        mediaList.push({ type: 'image', url: img })
      })
      // 最后添加视频
      if (product.video) {
        mediaList.push({ type: 'video', url: product.video })
      }

      this.setData({
        product,
        mediaList,
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

  onSwiperChange(e) {
    const current = e.detail.current
    this.setData({ currentMediaIndex: current })

    // 切换到非视频时暂停视频
    const currentMedia = this.data.mediaList[current]
    if (currentMedia && currentMedia.type !== 'video') {
      const videoCtx = wx.createVideoContext('detailVideo', this)
      videoCtx?.pause()
    }
  },

  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset
    const imageItems = this.data.mediaList.filter((m) => m.type === 'image')
    wx.previewImage({
      current: imageItems[index].url,
      urls: imageItems.map((m) => m.url)
    })
  },

  // 点击视频全屏播放
  onVideoTap(e) {
    const videoCtx = wx.createVideoContext('detailVideo', this)
    videoCtx?.requestFullScreen()
    videoCtx?.play()
  },

  // 视频全屏状态变化
  onVideoFullScreenChange(e) {
    // 退出全屏时暂停视频
    if (!e.detail.fullScreen) {
      const videoCtx = wx.createVideoContext('detailVideo', this)
      videoCtx?.pause()
    }
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
    wx.navigateTo({ url: `/pages/add/add?id=${this.data.product.id}` })
  },

  onDeleteTap() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${this.data.product.name}"吗？`,
      confirmColor: '#b7472a',
      success: (res) => {
        if (res.confirm) {
          this.deleteProduct()
        }
      }
    })
  },

  deleteProduct() {
    wx.showLoading({ title: '删除中...' })
    const openid = wx.getStorageSync('openid')
    request(`/api/products/${this.data.product.id}`, { openid }, 'DELETE').then(() => {
      wx.hideLoading()
      wx.showToast({ title: '删除成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch((err) => {
      wx.hideLoading()
      wx.showToast({ title: err.message || '删除失败', icon: 'none' })
    })
  },

  onShareAppMessage() {
    const product = this.data.product
    return {
      title: product ? product.name : '故媛工作室',
      path: `/pages/detail/detail?id=${product ? product.id : ''}`,
      imageUrl: product && product.images && product.images.length > 0 ? product.images[0] : ''
    }
  }
})
