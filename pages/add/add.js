const { request, BASE_URL } = require('../../utils/request')

Page({
  data: {
    name: '',
    price: '',
    originalPrice: '',
    sizeOptions: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    tagOptions: ['热卖', '新品'],
    sizeIndex: -1,
    tagIndex: -1,
    color: '',
    fabric: '',
    description: '',
    categoryNames: [],
    categories: [],
    categoryIndex: -1,
    images: [],
    submitting: false
  },

  onLoad() {
    this.loadCategories()
  },

  loadCategories() {
    request('/api/categories').then(function (categories) {
      var list = categories.filter(function (c) { return c.name !== '全部' })
      var names = list.map(function (c) { return c.name })
      this.setData({ categories: list, categoryNames: names })
    }.bind(this))
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onPriceInput(e) { this.setData({ price: e.detail.value }) },
  onOriginalPriceInput(e) { this.setData({ originalPrice: e.detail.value }) },
  onSizeChange(e) { this.setData({ sizeIndex: Number(e.detail.value) }) },
  onColorInput(e) { this.setData({ color: e.detail.value }) },
  onFabricInput(e) { this.setData({ fabric: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },

  onCategoryChange(e) {
    this.setData({ categoryIndex: Number(e.detail.value) })
  },

  onTagChange(e) {
    this.setData({ tagIndex: Number(e.detail.value) })
  },

  onChooseImage() {
    var that = this
    var maxCount = 9 - this.data.images.length
    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        var paths = res.tempFiles.map(function (f) { return f.tempFilePath })
        var newImages = that.data.images.concat(paths)
        that.setData({ images: newImages })
        that.uploadImages(paths)
      }
    })
  },

  uploadImages(paths) {
    var that = this
    var allCount = paths.length
    var finished = 0

    paths.forEach(function (path, idx) {
      wx.uploadFile({
        url: BASE_URL + '/api/upload',
        filePath: path,
        name: 'file',
        success(res) {
          var data = JSON.parse(res.data)
          if (data.code === 200) {
            var images = that.data.images.slice()
            var localIdx = that.data.images.indexOf(path)
            if (localIdx !== -1) {
              images[localIdx] = BASE_URL + data.data.url
              that.setData({ images: images })
            }
          }
        },
        complete() {
          finished++
          if (finished >= allCount) {
            wx.hideLoading()
          }
        }
      })
    })
  },

  onDeleteImage(e) {
    var index = e.currentTarget.dataset.index
    var images = this.data.images.slice()
    images.splice(index, 1)
    this.setData({ images: images })
  },

  onSubmit() {
    var d = this.data
    if (!d.name) { wx.showToast({ title: '请输入名称', icon: 'none' }); return }
    if (!d.price) { wx.showToast({ title: '请输入价格', icon: 'none' }); return }
    if (d.categoryIndex < 0) { wx.showToast({ title: '请选择类型', icon: 'none' }); return }
    if (d.sizeIndex < 0) { wx.showToast({ title: '请选择尺码', icon: 'none' }); return }
    if (d.images.length === 0) { wx.showToast({ title: '请上传图片', icon: 'none' }); return }

    this.setData({ submitting: true })

    var size = d.sizeOptions[d.sizeIndex]
    var category = d.categories[d.categoryIndex]
    var postData = {
      name: d.name,
      price: parseFloat(d.price),
      originalPrice: d.originalPrice ? parseFloat(d.originalPrice) : null,
      image: d.images[0],
      tag: d.tagIndex >= 0 ? d.tagOptions[d.tagIndex] : '',
      category: category.id,
      description: d.description,
      detail: '面料：' + d.fabric + '\n尺码：' + size + '\n颜色：' + d.color,
      images: d.images,
      size: size,
      color: d.color,
      fabric: d.fabric
    }

    wx.request({
      url: BASE_URL + '/api/products',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: postData,
      success: function (res) {
        if (res.data.code === 200) {
          wx.showToast({ title: '提交成功', icon: 'success' })
          setTimeout(function () { wx.navigateBack() }, 1500)
        } else {
          wx.showToast({ title: res.data.message || '提交失败', icon: 'none' })
        }
      },
      fail: function () {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: function () {
        this.setData({ submitting: false })
      }.bind(this)
    })
  }
})
