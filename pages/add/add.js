const { request, BASE_URL } = require('../../utils/request')
const form = require('../../utils/product-form')

Page({
  data: {
    productId: null,
    name: '',
    sizeOptions: ['均码', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    selectedSizes: ['均码'],
    tagOptions: [],
    tagMap: {},
    tags: [],
    tagId: '',
    tagName: '',
    categoryOptions: [],
    categoryMap: {},
    categories: [],
    categoryId: '',
    color: '',
    fabric: '',
    description: '',
    mediaFileList: [],
    images: [],
    videoUrl: '',
    submitting: false,
    loading: false,
    showCategoryPicker: false,
    showTagPicker: false
  },

  onLoad(options) {
    // 有 id 则为编辑模式
    if (options.id) {
      wx.setNavigationBarTitle({ title: '编辑商品' })
      this.setData({ productId: Number(options.id), loading: true })
      this._pendingLoad = { categories: false, tags: false }
      form.loadCategories((data) => {
        const categoryMap = {}
        data.categories.forEach(c => { categoryMap[String(c.id)] = c.name })
        this.setData({
          categories: data.categories,
          categoryOptions: data.categoryNames,
          categoryMap: categoryMap
        })
        this._pendingLoad.categories = true
        this._tryLoadProduct()
      })
      form.loadTags((data) => {
        const tagMap = {}
        data.tags.forEach(t => { tagMap[String(t.id)] = t.name })
        this.setData({
          tagOptions: data.tagOptions,
          tags: data.tags,
          tagMap: tagMap
        })
        this._pendingLoad.tags = true
        this._tryLoadProduct()
      })
    } else {
      // 新增模式
      this._loadCategories()
      this._loadTags()
    }
  },

  _tryLoadProduct() {
    if (this._pendingLoad.categories && this._pendingLoad.tags) {
      this.loadProduct()
    }
  },

  loadProduct() {
    request(`/api/products/${this.data.productId}`).then((product) => {
      const sizeStr = product.size || ''
      const selectedSizes = sizeStr.split('/').filter((s) => s)

      const mediaFileList = []
      if (product.video) {
        mediaFileList.push({ url: product.video, thumb: product.video, isImage: false })
      }
      ;(product.images || []).forEach((url) => {
        mediaFileList.push({ url, thumb: url, isImage: true })
      })

      this.setData({
        name: product.name,
        selectedSizes: selectedSizes.length > 0 ? selectedSizes : ['均码'],
        categoryId: product.category || '',
        tagId: product.tagId || '',
        tagName: product.tag || '',
        color: product.color || '',
        fabric: product.fabric || '',
        description: product.description || '',
        images: product.images || [],
        videoUrl: product.video || '',
        mediaFileList,
        loading: false
      })
    }).catch((err) => {
      console.error('[add] loadProduct failed', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    })
  },

  _loadCategories() {
    form.loadCategories((data) => {
      const categoryMap = {}
      data.categories.forEach(c => { categoryMap[String(c.id)] = c.name })
      this.setData({
        categories: data.categories,
        categoryOptions: data.categoryNames,
        categoryMap: categoryMap
      })
    })
  },

  _loadTags() {
    form.loadTags((data) => {
      const tagMap = {}
      data.tags.forEach(t => { tagMap[String(t.id)] = t.name })
      this.setData({
        tagOptions: data.tagOptions,
        tags: data.tags,
        tagMap: tagMap
      })
    })
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onColorInput(e) { this.setData({ color: e.detail.value }) },
  onFabricInput(e) { this.setData({ fabric: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },

  onSizeChange(e) {
    this.setData({ selectedSizes: e.detail })
  },

  onCategoryClick() {
    if (this.data.categoryOptions.length > 0) {
      this.setData({ showCategoryPicker: true })
    } else {
      wx.showToast({ title: '分类加载中，请稍候', icon: 'none' })
    }
  },

  onCancelCategory() { this.setData({ showCategoryPicker: false }) },

  onConfirmCategory(e) {
    const value = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value
    const category = this.data.categories.find(c => c.name === value)
    this.setData({ categoryId: category ? String(category.id) : '', showCategoryPicker: false })
  },

  onTagClick() {
    if (!this.data.tagOptions.length) return
    this.setData({ showTagPicker: true })
  },

  onCancelTag() { this.setData({ showTagPicker: false }) },

  onConfirmTag(e) {
    const value = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value
    const tag = this.data.tags.find(t => t.name === value)
    this.setData({
      tagId: tag ? String(tag.id) : '',
      tagName: tag ? tag.name : '',
      showTagPicker: false
    })
  },

  onChooseMedia() {
    const remain = 10 - this.data.mediaFileList.length
    if (remain <= 0) return

    const hasVideo = this.data.mediaFileList.some((m) => !m.isImage)
    if (hasVideo) {
      wx.chooseImage({
        count: remain,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          wx.showLoading({ title: '上传中...' })
          this._uploadImageFiles(res.tempFilePaths, true)
        }
      })
    } else {
      wx.showActionSheet({
        itemList: ['选择图片', '选择视频'],
        success: (r) => {
          if (r.tapIndex === 0) {
            wx.chooseImage({
              count: remain,
              sizeType: ['compressed'],
              sourceType: ['album', 'camera'],
              success: (res) => {
                wx.showLoading({ title: '上传中...' })
                this._uploadImageFiles(res.tempFilePaths, true)
              }
            })
          } else {
            wx.chooseVideo({
              sourceType: ['album', 'camera'],
              maxDuration: 30,
              success: (res) => {
                wx.showLoading({ title: '上传中...' })
                this._uploadImageFiles([res.tempFilePath], false)
              }
            })
          }
        }
      })
    }
  },

  _uploadImageFiles(paths, isImage) {
    const openid = wx.getStorageSync('openid')
    const totalCount = paths.length
    let finished = 0
    let hasError = false

    paths.forEach((filePath) => {
      if (!filePath) {
        finished++
        if (finished >= totalCount) wx.hideLoading()
        return
      }

      wx.uploadFile({
        url: BASE_URL + '/api/upload',
        filePath: filePath,
        name: 'file',
        header: { 'x-user-openid': openid },
        success: (res) => {
          if (hasError) return
          try {
            const data = JSON.parse(res.data)
            if (data.code === 200 && data.data?.url) {
              const serverUrl = BASE_URL + data.data.url
              const mediaItem = {
                url: serverUrl,
                thumb: isImage ? serverUrl : filePath,
                isImage: isImage
              }
              const mediaFileList = [...this.data.mediaFileList, mediaItem]
              const images = isImage ? [...this.data.images, serverUrl] : this.data.images
              const videoUrl = isImage ? this.data.videoUrl : serverUrl
              this.setData({ mediaFileList, images, videoUrl })
            } else {
              wx.showToast({ title: '上传失败', icon: 'none' })
              hasError = true
            }
          } catch (err) {
            console.error('[add] parse upload response failed', err)
            wx.showToast({ title: '上传失败', icon: 'none' })
            hasError = true
          }
        },
        fail: () => {
          wx.showToast({ title: '上传失败', icon: 'none' })
          hasError = true
        },
        complete: () => {
          finished++
          if (finished >= totalCount) wx.hideLoading()
        }
      })
    })
  },

  onMediaDelete(e) {
    const { index } = e.currentTarget.dataset
    const item = this.data.mediaFileList[index]
    const mediaFileList = this.data.mediaFileList.filter((_, i) => i !== index)
    const images = item.isImage ? this.data.images.filter((_, i) => i !== index) : this.data.images
    const videoUrl = item.isImage ? this.data.videoUrl : ''
    this.setData({ mediaFileList, images, videoUrl })
  },

  onPreviewMedia(e) {
    const { index } = e.currentTarget.dataset
    const item = this.data.mediaFileList[index]
    if (item.isImage) {
      const imageUrls = this.data.mediaFileList.filter((m) => m.isImage).map((m) => m.url)
      const currentIndex = this.data.mediaFileList.slice(0, index).filter((m) => m.isImage).length
      wx.previewImage({ current: imageUrls[currentIndex], urls: imageUrls })
    } else {
      // 视频预览
      wx.previewMedia({
        current: 0,
        sources: [{ type: 'video', url: item.url }]
      })
    }
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
        wx.showToast({ title: this.data.productId ? '修改成功' : '提交成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      },
      fail: (err) => {
        console.error('[add] submit failed', err)
        wx.showToast({ title: err.message || '提交失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ submitting: false })
      }
    })
  },

  onUnload() {
    wx.hideLoading()
  },

  onShareAppMessage() {
    return {
      title: this.data.name || '故媛工作室',
      path: '/pages/index/index'
    }
  }
})