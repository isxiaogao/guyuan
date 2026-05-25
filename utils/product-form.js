const { request, BASE_URL } = require('./request')

/**
 * 商品表单公共逻辑
 * 供 pages/add/add.js 和 pages/edit/edit.js 复用
 */

function loadTags(cb) {
  request('/api/tags', { enabled: 1 }).then((tags) => {
    cb({
      tags: tags,
      tagOptions: tags.map((t) => t.name)
    })
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

function validate(d) {
  if (!d.name) return '请输入名称'
  if (!d.categoryId) return '请选择类型'
  if (!d.selectedSizes || d.selectedSizes.length === 0) return '请选择尺码'
  if (d.images.length === 0) return '请上传图片'
  return null
}

function buildPostData(d) {
  const sizes = d.selectedSizes
  return {
    name: d.name,
    price: 0,
    originalPrice: null,
    image: d.images[0],
    tag: d.tagName || '',
    tagId: d.tagId || '',
    category: d.categoryId,
    description: d.description,
    detail: `面料：${d.fabric}\n尺码：${sizes.join('/')}\n颜色：${d.color}`,
    images: d.images,
    size: sizes.join('/'),
    color: d.color,
    fabric: d.fabric,
    video: d.videoUrl || null
  }
}

/**
 * 提交商品（新增或编辑），走 request() 封装，自动携带 openid
 */
function submitProduct({ productId, data, success, fail, complete }) {
  const url = productId ? `/api/products/${productId}` : '/api/products'
  const method = productId ? 'PUT' : 'POST'
  const openid = wx.getStorageSync('openid')

  request(url, { ...buildPostData(data), openid }, method)
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

module.exports = {
  loadTags,
  loadCategories,
  validate,
  buildPostData,
  submitProduct,
  BASE_URL
}
