const { request, BASE_URL, ADMIN_TOKEN } = require('../../utils/request')

Page({
  data: {
    banners: [],
    loading: true,
    adding: false,
    title: '',
    tempImagePath: ''
  },

  onLoad() {
    this.loadList()
  },

  loadList() {
    request('/api/banners').then((banners) => {
      const processed = (banners || []).map((b) => {
        if (b.image && b.image.startsWith('/')) b.image = BASE_URL + b.image
        return b
      })
      this.setData({ banners: processed, loading: false })
    }).catch((err) => {
      console.error('[banner] loadList failed', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ tempImagePath: res.tempFiles[0].tempFilePath })
      }
    })
  },

  onClearImage() {
    this.setData({ tempImagePath: '' })
  },

  onAdd() {
    const { tempImagePath, title } = this.data
    if (!tempImagePath) {
      wx.showToast({ title: '请先选择图片', icon: 'none' })
      return
    }
    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return
    }

    this.setData({ adding: true })
    wx.showLoading({ title: '上传中...' })

    wx.uploadFile({
      url: BASE_URL + '/api/upload',
      filePath: tempImagePath,
      name: 'file',
      header: { 'x-user-openid': wx.getStorageSync('openid') },
      success: (uploadRes) => {
        const data = JSON.parse(uploadRes.data)
        if (data.code !== 200) {
          wx.hideLoading()
          this.setData({ adding: false })
          return wx.showToast({ title: data.message || '图片上传失败', icon: 'none' })
        }

        const imageUrl = BASE_URL + data.data.url
        const openid = wx.getStorageSync('openid')
        wx.request({
          url: BASE_URL + '/api/banners',
          method: 'POST',
          header: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN, 'x-user-openid': openid },
          data: { image: imageUrl, title: title.trim(), openid },
          success: (res) => {
            wx.hideLoading()
            if (res.data.code === 200) {
              wx.showToast({ title: '添加成功', icon: 'success' })
              this.setData({ title: '', tempImagePath: '' })
              this.loadList()
            } else {
              wx.showToast({ title: res.data.message || '添加失败', icon: 'none' })
            }
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({ title: '网络错误', icon: 'none' })
          },
          complete: () => {
            this.setData({ adding: false })
          }
        })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('[banner] upload image failed', err)
        this.setData({ adding: false })
        wx.showToast({ title: '图片上传失败', icon: 'none' })
      }
    })
  },

  onDelete(e) {
    const { id, title: name } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: `确定删除轮播图「${name}」？`,
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: BASE_URL + '/api/banners/' + id,
            method: 'DELETE',
            header: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN, 'x-user-openid': wx.getStorageSync('openid') },
            data: { openid: wx.getStorageSync('openid') },
            success: (r) => {
              if (r.data.code === 200) {
                wx.showToast({ title: '已删除', icon: 'success' })
                this.loadList()
              } else {
                wx.showToast({ title: r.data.message || '删除失败', icon: 'none' })
              }
            },
            fail: () => {
              wx.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  }
})
