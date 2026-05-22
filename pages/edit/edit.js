const { request } = require('../../utils/request')
const form = require('../../utils/product-form')

Page({
  data: {
    productId: null,
    name: '',
    price: '',
    originalPrice: '',
    sizeOptions: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    tagOptions: [],
    sizeIndex: -1,
    tagIndex: -1,
    color: '',
    fabric: '',
    description: '',
    categoryNames: [],
    categories: [],
    categoryIndex: -1,
    images: [],
    submitting: false,
    loading: true
  },

  onLoad(options) {
    this.setData({ productId: Number(options.id) })
    form.loadCategories((data) => {
      this.setData(data)
      this.loadProduct()
    })
    form.loadTags((data) => this.setData(data))
  },

  loadProduct() {
    request(`/api/products/${this.data.productId}`).then((product) => {
      const categories = this.data.categories
      const catIdx = categories.findIndex((c) => c.id === product.category)
      const tagOptions = this.data.tagOptions
      const tagIdx = product.tag ? tagOptions.findIndex((t) => t === product.tag) : -1
      const sizeIdx = product.size ? this.data.sizeOptions.findIndex((s) => s === product.size) : -1

      this.setData({
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice || '',
        sizeIndex: sizeIdx,
        tagIndex: tagIdx,
        color: product.color || '',
        fabric: product.fabric || '',
        description: product.description || '',
        categoryIndex: catIdx,
        images: product.images || [],
        loading: false
      })
    }).catch((err) => {
      console.error('[edit] loadProduct failed', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    })
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onPriceInput(e) { this.setData({ price: e.detail.value }) },
  onOriginalPriceInput(e) { this.setData({ originalPrice: e.detail.value }) },
  onSizeChange(e) { this.setData({ sizeIndex: Number(e.detail.value) }) },
  onColorInput(e) { this.setData({ color: e.detail.value }) },
  onFabricInput(e) { this.setData({ fabric: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },
  onCategoryChange(e) { this.setData({ categoryIndex: Number(e.detail.value) }) },
  onTagChange(e) { this.setData({ tagIndex: Number(e.detail.value) }) },

  onChooseImage() {
    form.chooseImage(this)
  },

  onDeleteImage(e) {
    const { index } = e.currentTarget.dataset
    form.deleteImage(this, index)
  },

  onSubmit() {
    const err = form.validate(this.data)
    if (err) {
      wx.showToast({ title: err, icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    form.submitProduct({
      productId: this.data.productId,
      data: this.data,
      success: () => {
        wx.showToast({ title: '修改成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      },
      fail: (err) => {
        console.error('[edit] submit failed', err)
        wx.showToast({ title: err.message || '修改失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ submitting: false })
      }
    })
  },

  onUnload() {
    wx.hideLoading()
  }
})
