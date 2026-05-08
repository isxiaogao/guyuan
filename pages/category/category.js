const { request, BASE_URL } = require('../../utils/request')

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
    request('/api/categories').then(function (list) {
      this.setData({ list: list })
    }.bind(this)).catch(function () {
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onInput(e) { this.setData({ newName: e.detail.value }) },

  onAdd() {
    var name = this.data.newName.trim()
    if (!name) { wx.showToast({ title: '请输入分类名称', icon: 'none' }); return }

    this.setData({ adding: true })
    wx.request({
      url: BASE_URL + '/api/categories',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { name: name },
      success: function (res) {
        if (res.data.code === 200) {
          wx.showToast({ title: '添加成功', icon: 'success' })
          this.setData({ newName: '' })
          this.loadList()
        } else {
          wx.showToast({ title: res.data.message || '添加失败', icon: 'none' })
        }
      }.bind(this),
      fail: function () {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: function () {
        this.setData({ adding: false })
      }.bind(this)
    })
  },

  onEdit(e) {
    this.setData({
      editing: true,
      editId: e.currentTarget.dataset.id,
      editName: e.currentTarget.dataset.name
    })
  },

  onEditInput(e) { this.setData({ editName: e.detail.value }) },

  onCancelEdit() { this.setData({ editing: false }) },

  onConfirmEdit() {
    var name = this.data.editName.trim()
    if (!name) { wx.showToast({ title: '请输入分类名称', icon: 'none' }); return }

    this.setData({ saving: true })
    wx.request({
      url: BASE_URL + '/api/categories/' + this.data.editId,
      method: 'PUT',
      header: { 'Content-Type': 'application/json' },
      data: { name: name },
      success: function (res) {
        if (res.data.code === 200) {
          wx.showToast({ title: '更新成功', icon: 'success' })
          this.setData({ editing: false })
          this.loadList()
        } else {
          wx.showToast({ title: res.data.message || '更新失败', icon: 'none' })
        }
      }.bind(this),
      fail: function () {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: function () {
        this.setData({ saving: false })
      }.bind(this)
    })
  },

  onDelete(e) {
    var name = e.currentTarget.dataset.name
    var id = e.currentTarget.dataset.id
    var that = this
    wx.showModal({
      title: '确认删除',
      content: '删除分类「' + name + '」？如有商品引用此分类将无法删除',
      success: function (res) {
        if (res.confirm) {
          wx.request({
            url: BASE_URL + '/api/categories/' + id,
            method: 'DELETE',
            success: function (res) {
              if (res.data.code === 200) {
                wx.showToast({ title: '删除成功', icon: 'success' })
                that.loadList()
              } else {
                wx.showToast({ title: res.data.message || '删除失败', icon: 'none' })
              }
            },
            fail: function () {
              wx.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  }
})
