const { request, BASE_URL } = require('../../utils/request')
const ADMIN_TOKEN = 'guyuan-admin-token'

Page({
  data: {
    list: [],
    newName: '',
    adding: false,
    editing: false,
    editId: 0,
    editName: '',
    saving: false
  },

  onLoad() {
    this.loadList()
  },

  loadList() {
    request('/api/categories').then((list) => {
      this.setData({ list })
    }).catch((err) => {
      console.error('[category] loadList failed', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onInput(e) {
    this.setData({ newName: e.detail.value })
  },

  onAdd() {
    const name = this.data.newName.trim()
    if (!name) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }

    this.setData({ adding: true })
    const openid = wx.getStorageSync('openid')
    wx.request({
      url: BASE_URL + '/api/categories',
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN, 'x-user-openid': openid },
      data: { name, openid },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '添加成功', icon: 'success' })
          this.setData({ newName: '' })
          this.loadList()
        } else {
          wx.showToast({ title: res.data.message || '添加失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ adding: false })
      }
    })
  },

  onEdit(e) {
    const { id, name } = e.currentTarget.dataset
    this.setData({ editing: true, editId: id, editName: name })
  },

  onEditInput(e) {
    this.setData({ editName: e.detail.value })
  },

  onCancelEdit() {
    this.setData({ editing: false })
  },

  onConfirmEdit() {
    const name = this.data.editName.trim()
    if (!name) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    const openid = wx.getStorageSync('openid')
    wx.request({
      url: BASE_URL + '/api/categories/' + this.data.editId,
      method: 'PUT',
      header: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN, 'x-user-openid': openid },
      data: { name, openid },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '更新成功', icon: 'success' })
          this.setData({ editing: false })
          this.loadList()
        } else {
          wx.showToast({ title: res.data.message || '更新失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ saving: false })
      }
    })
  },

  onDelete(e) {
    const { name, id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: `删除分类「${name}」？如有商品引用此分类将无法删除`,
      success: (res) => {
        if (res.confirm) {
          const openid = wx.getStorageSync('openid')
          wx.request({
            url: BASE_URL + '/api/categories/' + id,
            method: 'DELETE',
            header: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN, 'x-user-openid': openid },
            data: { openid },
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({ title: '删除成功', icon: 'success' })
                this.loadList()
              } else {
                wx.showToast({ title: res.data.message || '删除失败', icon: 'none' })
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
