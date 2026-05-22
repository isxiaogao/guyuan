const { request, BASE_URL } = require('./request')

/**
 * 商品表单公共逻辑
 * 供 pages/add/add.js 和 pages/edit/edit.js 复用
 */

function loadTags(cb) {
  request('/api/tags', { enabled: 1 }).then((tags) => {
    cb({ tagOptions: tags.map((t) => t.name) })
  }).catch((err) => {
    console.error('[product-form] loadTags failed', err)
  })
}

function loadCategories(cb) {
  request('/api/categories').then((categories) => {
    const list = categories.filter((c) => c.name !== '全部')
    cb({
      categories: list,
      categoryNames: list.map((c) => c.name)
    })
  }).catch((err) => {
    console.error('[product-form] loadCategories failed', err)
  })
}

function chooseImage(page) {
  const maxCount = 9 - page.data.images.length
  wx.chooseMedia({
    count: maxCount,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const paths = res.tempFiles.map((f) => f.tempFilePath)
      uploadImages(page, paths)
    }
  })
}

function uploadImages(page, paths) {
  wx.showLoading({ title: '上传中...' })
  const allCount = paths.length
  let finished = 0
  const openid = wx.getStorageSync('openid')

  paths.forEach((path) => {
    wx.uploadFile({
      url: BASE_URL + '/api/upload',
      filePath: path,
      name: 'file',
      header: { 'x-user-openid': openid },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 200 && data.data?.url) {
          const images = [...page.data.images, BASE_URL + data.data.url]
          page.setData({ images })
        }
      },
      fail: (err) => {
        console.error('[product-form] upload image failed', err)
      },
      complete: () => {
        finished++
        if (finished >= allCount) {
          wx.hideLoading()
        }
      }
    })
  })
}

/**
 * 删除图片：从数组移除
 */
function deleteImage(page, index) {
  const images = page.data.images.slice()
  images.splice(index, 1)
  page.setData({ images })
}

function validate(d) {
  if (!d.name) return '请输入名称'
  if (!d.price) return '请输入价格'
  if (d.categoryIndex < 0) return '请选择类型'
  if (d.sizeIndex < 0) return '请选择尺码'
  if (d.images.length === 0) return '请上传图片'
  return null
}

function buildPostData(d) {
  const size = d.sizeOptions[d.sizeIndex]
  const category = d.categories[d.categoryIndex]
  return {
    name: d.name,
    price: parseFloat(d.price),
    originalPrice: d.originalPrice ? parseFloat(d.originalPrice) : null,
    image: d.images[0],
    tag: d.tagIndex >= 0 ? d.tagOptions[d.tagIndex] : '',
    category: category.id,
    description: d.description,
    detail: `面料：${d.fabric}\n尺码：${size}\n颜色：${d.color}`,
    images: d.images,
    size,
    color: d.color,
    fabric: d.fabric
  }
}

module.exports = {
  loadTags,
  loadCategories,
  chooseImage,
  uploadImages,
  deleteImage,
  validate,
  buildPostData,
  submitProduct,
  BASE_URL
}

/**
 * 提交商品（新增或编辑），走 request() 封装，自动携带 openid
 */
function submitProduct({ productId, data, success, fail, complete }) {
  const url = productId ? `/api/products/${productId}` : '/api/products'
  const method = productId ? 'PUT' : 'POST'

  request(url, buildPostData(data), method)
    .then((res) => {
      if (success) success(res)
    })
    .catch((err) => {
      if (fail) fail(err)
    })
    .then(() => {
      if (complete) complete()
    })
}
