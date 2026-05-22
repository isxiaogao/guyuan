const { generateTSPL } = require('../../utils/label')
const { request } = require('../../utils/request')
const { BASE_URL, ADMIN_TOKEN } = require('../../utils/request')

const STORAGE_KEY = 'label_templates'
const EL_TYPE_NAMES = { text: '文本', price: '价格', barcode: '条码', qrcode: '二维码', box: '边框', line: '分割线' }
const EL_TYPE_ICONS = { text: 'T', price: '¥', barcode: '║', qrcode: '▣', box: '☐', line: '━' }

Page({
  data: {
    activeTab: 'print',
    view: 'list',
    templates: [],
    template: null,
    form: { name: '', width: 40, height: 30 },
    dpiOptions: ['203 DPI', '300 DPI'],
    dpiIndex: 0,
    fontSizeOptions: [8, 12, 16, 20, 24, 28, 32, 40, 48],
    alignOptions: ['左对齐', '居中', '右对齐'],
    variableOptions: ['固定内容', 'name', 'price', 'originalPrice', 'size', 'color', 'fabric', 'category', 'tag'],
    canvasW: 0,
    canvasH: 0,
    editingElId: '',
    elForm: {},
    elFormVariableIndex: 0,
    elFormFontSizeIndex: 0,
    elFormAlignIndex: 0,
    printerName: '',
    printerDeviceId: '',
    printerServiceId: '',
    printerCharId: '',
    printerConnected: false,
    printCopies: 1,
    products: [],
    productNames: [],
    productIndex: -1,
    touchStartX: 0,
    touchStartY: 0,
    touchElId: '',
    touchStartElX: 0,
    touchStartElY: 0,
    tags: [],
    tagLoading: false,
    showTagModal: false,
    editingTag: false,
    editingTagIndex: -1,
    tagForm: { name: '', code: '', sort: 0 }
  },

  onLoad() {
    this.loadTemplates()
    this.loadTags()
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  loadTags() {
    this.setData({ tagLoading: true })
    request('/api/tags').then((tags) => {
      this.setData({ tags, tagLoading: false })
    }).catch((err) => {
      console.error('[label] loadTags failed', err)
      this.setData({ tagLoading: false })
    })
  },

  onShowAddTag() {
    this.setData({
      showTagModal: true,
      editingTag: false,
      editingTagIndex: -1,
      tagForm: { name: '', code: '', sort: 0 }
    })
  },

  onEditTag(e) {
    const index = e.currentTarget.dataset.index
    const tag = this.data.tags[index]
    this.setData({
      showTagModal: true,
      editingTag: true,
      editingTagIndex: index,
      tagForm: { name: tag.name, code: tag.code, sort: tag.sort }
    })
  },

  onTagFormInput(e) {
    const field = e.currentTarget.dataset.field
    const tagForm = { ...this.data.tagForm }
    tagForm[field] = field === 'sort' ? (parseInt(e.detail.value) || 0) : e.detail.value
    this.setData({ tagForm })
  },

  onCancelTag() {
    this.setData({ showTagModal: false })
  },

  onSaveTag() {
    const { tagForm, editingTag, editingTagIndex, tags } = this.data
    if (!tagForm.name.trim()) { wx.showToast({ title: '名称不能为空', icon: 'none' }); return }
    if (!tagForm.code.trim()) { wx.showToast({ title: '代码不能为空', icon: 'none' }); return }

    const url = editingTag ? `/api/tags/${tags[editingTagIndex].id}` : '/api/tags'
    const method = editingTag ? 'PUT' : 'POST'

    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      header: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
      data: tagForm,
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: editingTag ? '更新成功' : '添加成功', icon: 'success' })
          this.setData({ showTagModal: false })
          this.loadTags()
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('[label] saveTag failed', err)
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  onToggleTag(e) {
    const index = e.currentTarget.dataset.index
    const tag = this.data.tags[index]
    const newEnabled = tag.enabled ? 0 : 1

    wx.request({
      url: `${BASE_URL}/api/tags/${tag.id}`,
      method: 'PUT',
      header: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
      data: { enabled: newEnabled },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: newEnabled ? '已启用' : '已停用', icon: 'success' })
          this.loadTags()
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('[label] toggleTag failed', err)
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  onDeleteTag(e) {
    const index = e.currentTarget.dataset.index
    const tag = this.data.tags[index]
    wx.showModal({
      title: '确认删除',
      content: `确定删除标签"${tag.name}"？`,
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${BASE_URL}/api/tags/${tag.id}`,
            method: 'DELETE',
            header: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
            success: (r) => {
              if (r.data.code === 200) {
                wx.showToast({ title: '已删除', icon: 'success' })
                this.loadTags()
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
  },

  loadTemplates() {
    const data = wx.getStorageSync(STORAGE_KEY) || []
    this.setData({ templates: data })
  },

  saveTemplates() {
    wx.setStorageSync(STORAGE_KEY, this.data.templates)
  },

  onNewTemplate() {
    this.setData({
      view: 'newTemplate',
      form: { name: '', width: 40, height: 30 },
      dpiIndex: 0
    })
  },

  onCancelNew() {
    this.setData({ view: 'list' })
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    const form = { ...this.data.form, [field]: e.detail.value }
    this.setData({ form })
  },

  onDpiChange(e) {
    this.setData({ dpiIndex: Number(e.detail.value) })
  },

  onConfirmNew() {
    const { form, dpiIndex } = this.data
    if (!form.name.trim()) { wx.showToast({ title: '请输入模板名称', icon: 'none' }); return }
    const width = parseInt(form.width) || 40
    const height = parseInt(form.height) || 30
    const dpi = dpiIndex === 1 ? 300 : 203

    const template = {
      id: Date.now(),
      name: form.name.trim(),
      width,
      height,
      dpi,
      margin: { top: 2, right: 2, bottom: 2, left: 2 },
      elements: []
    }

    this.setData({
      templates: [...this.data.templates, template],
      template,
      view: 'edit'
    })
    this.calcCanvas()
  },

  onEditTemplate(e) {
    const index = e.currentTarget.dataset.index
    const template = this.data.templates[index]
    this.setData({ template: JSON.parse(JSON.stringify(template)), view: 'edit' })
    this.calcCanvas()
  },

  onDeleteTemplate(e) {
    const index = e.currentTarget.dataset.index
    const name = this.data.templates[index].name
    wx.showModal({
      title: '确认删除',
      content: `确定删除模板"${name}"？`,
      success: (res) => {
        if (res.confirm) {
          const templates = this.data.templates.filter((_, i) => i !== index)
          this.setData({ templates })
          this.saveTemplates()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  onBackToList() {
    this.setData({ view: 'list' })
  },

  calcCanvas() {
    const sys = wx.getSystemInfoSync()
    const screenW = sys.windowWidth
    const padding = 48
    const maxW = screenW - padding
    const { template } = this.data
    const ratio = template.width / template.height
    let canvasW = maxW
    let canvasH = Math.round(canvasW / ratio)
    if (canvasH > 400) {
      canvasH = 400
      canvasW = Math.round(canvasH * ratio)
    }
    this.setData({ canvasW, canvasH })
  },

  elTypeIcon(type) {
    return EL_TYPE_ICONS[type] || '?'
  },

  onAddElement(e) {
    const type = e.currentTarget.dataset.type
    const { template } = this.data
    const el = {
      id: `el_${Date.now()}`,
      type,
      content: type === 'text' ? '文本' : (type === 'price' ? '' : ''),
      variable: (type === 'price' || type === 'barcode') ? 'price' : '',
      x: 2,
      y: 2,
      width: type === 'line' ? template.width - 4 : (type === 'box' ? template.width - 4 : 15),
      height: type === 'line' ? 1 : (type === 'box' ? template.height - 4 : 8),
      fontSize: type === 'price' ? 24 : 16,
      fontWeight: 'normal',
      align: 'left',
      rotation: 0,
      showText: true,
      borderWidth: 1,
      lineHeight: 1,
      xMultiplier: 1,
      yMultiplier: 1
    }

    const elements = [...template.elements, el]
    this.setData({ 'template.elements': elements })
    this.openElementEditor(el)
  },

  onSelectElement(e) {
    const id = e.currentTarget.dataset.id
    const el = this.data.template.elements.find((item) => item.id === id)
    if (el) this.openElementEditor(el)
  },

  openElementEditor(el) {
    const { fontSizeOptions, alignOptions, variableOptions } = this.data
    const fi = fontSizeOptions.indexOf(el.fontSize)
    const ai = alignOptions.indexOf(el.align === 'left' ? '左对齐' : el.align === 'center' ? '居中' : '右对齐')
    const vi = variableOptions.indexOf(el.variable || '固定内容')

    this.setData({
      view: 'editElement',
      editingElId: el.id,
      elForm: { ...el, typeName: EL_TYPE_NAMES[el.type] },
      elFormVariableIndex: fi >= 0 ? fi : 0,
      elFormFontSizeIndex: fi >= 0 ? fi : 0,
      elFormAlignIndex: ai >= 0 ? ai : 0
    })
  },

  onDeleteElement(e) {
    const id = e.currentTarget.dataset.id
    const elements = this.data.template.elements.filter((el) => el.id !== id)
    this.setData({ 'template.elements': elements })
  },

  onElInput(e) {
    const field = e.currentTarget.dataset.field
    const val = ['x', 'y', 'width', 'height', 'borderWidth', 'lineHeight'].includes(field)
      ? (parseFloat(e.detail.value) || 0)
      : e.detail.value
    this.setData({ elForm: { ...this.data.elForm, [field]: val } })
  },

  onVariableChange(e) {
    const idx = Number(e.detail.value)
    const val = this.data.variableOptions[idx]
    this.setData({
      elFormVariableIndex: idx,
      'elForm.variable': val === '固定内容' ? '' : val
    })
  },

  onFontSizeChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      elFormFontSizeIndex: idx,
      'elForm.fontSize': this.data.fontSizeOptions[idx]
    })
  },

  onAlignChange(e) {
    const idx = Number(e.detail.value)
    const map = ['left', 'center', 'right']
    this.setData({
      elFormAlignIndex: idx,
      'elForm.align': map[idx]
    })
  },

  onShowTextChange(e) {
    this.setData({ 'elForm.showText': e.detail.value })
  },

  onSaveElement() {
    const { elForm, editingElId, template } = this.data
    const elements = template.elements.map((el) => {
      if (el.id === editingElId) {
        return { ...el, ...elForm }
      }
      return el
    })
    this.setData({ 'template.elements': elements, view: 'edit' })
  },

  onCancelElement() {
    this.setData({ view: 'edit' })
  },

  onTouchStart(e) {
    const id = e.currentTarget.dataset.id
    const el = this.data.template.elements.find((item) => item.id === id)
    if (!el) return
    const touch = e.touches[0]
    const { canvasW } = this.data

    this.setData({
      touchElId: id,
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
      touchStartElX: el.x,
      touchStartElY: el.y
    })
  },

  onTouchMove(e) {
    const { touchElId, touchStartX, touchStartY, touchStartElX, touchStartElY, template, canvasW } = this.data
    if (!touchElId) return
    const touch = e.touches[0]
    const ratio = template.width / canvasW
    const dx = (touch.clientX - touchStartX) * ratio
    const dy = (touch.clientY - touchStartY) * ratio

    const newX = Math.max(0, Math.min(touchStartElX + dx, template.width - 5))
    const newY = Math.max(0, Math.min(touchStartElY + dy, template.height - 5))

    const elements = template.elements.map((el) => {
      if (el.id === touchElId) {
        return { ...el, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 }
      }
      return el
    })
    this.setData({ 'template.elements': elements })
  },

  onTouchEnd() {
    this.setData({ touchElId: '' })
  },

  onSaveTemplate() {
    const { template, templates } = this.data
    if (!template.name.trim()) { wx.showToast({ title: '模板名称不能为空', icon: 'none' }); return }

    const idx = templates.findIndex((t) => t.id === template.id)
    if (idx >= 0) {
      templates[idx] = template
    } else {
      templates.push(template)
    }
    this.setData({ templates })
    this.saveTemplates()
    wx.showToast({ title: '已保存', icon: 'success' })
    this.setData({ view: 'list' })
  },

  onPrintTemplate(e) {
    const index = e ? e.currentTarget.dataset.index : 0
    const template = e ? this.data.templates[index] : this.data.template
    if (!template) return

    this.setData({
      template: JSON.parse(JSON.stringify(template)),
      view: 'print',
      printCopies: 1,
      productIndex: -1,
      printerName: this.data.printerName
    })
    this.calcCanvas()
    this.loadProducts()
  },

  onBackToEdit() {
    this.setData({ view: 'edit' })
    this.calcCanvas()
  },

  loadProducts() {
    request('/api/products', { pageSize: 500 }).then((result) => {
      this.setData({
        products: result.list,
        productNames: result.list.map((p) => p.name)
      })
    }).catch((err) => {
      console.error('[label] loadProducts failed', err)
    })
  },

  onProductChange(e) {
    this.setData({ productIndex: Number(e.detail.value) })
  },

  onCopyMinus() {
    this.setData({ printCopies: Math.max(1, this.data.printCopies - 1) })
  },

  onCopyPlus() {
    this.setData({ printCopies: Math.min(99, this.data.printCopies + 1) })
  },

  onChoosePrinter() {
    wx.showToast({ title: '搜索打印机...', icon: 'loading', duration: 999999 })
    this.startBluetoothSearch()
  },

  startBluetoothSearch() {
    wx.openBluetoothAdapter({
      success: () => {
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: false,
          success: () => {
            wx.onBluetoothDeviceFound((res) => {
              const devices = res.devices || []
              for (const d of devices) {
                if (d.name && /gprinter|hprt|zebra|printer/i.test(d.name)) {
                  this.connectPrinter(d)
                  return
                }
              }
            })
          }
        })
      },
      fail: (err) => {
        wx.hideToast()
        console.error('[label] bluetooth adapter failed', err)
        wx.showModal({ title: '蓝牙未开启', content: '请开启手机蓝牙后重试', showCancel: false })
      }
    })
  },

  connectPrinter(device) {
    wx.hideToast()

    wx.createBLEConnection({
      deviceId: device.deviceId,
      timeout: 10000,
      success: () => {
        wx.stopBluetoothDevicesDiscovery()
        this.setData({
          printerName: device.name,
          printerDeviceId: device.deviceId,
          printerConnected: true
        })
        wx.showToast({ title: '已连接', icon: 'success' })
        this.getPrinterServices()
      },
      fail: (err) => {
        console.error('[label] connect printer failed', err)
        wx.showToast({ title: '连接失败', icon: 'error' })
      }
    })
  },

  getPrinterServices() {
    wx.getBLEDeviceServices({
      deviceId: this.data.printerDeviceId,
      success: (res) => {
        for (const service of res.services) {
          this.getPrinterCharacteristics(service.uuid)
        }
      }
    })
  },

  getPrinterCharacteristics(serviceId) {
    wx.getBLEDeviceCharacteristics({
      deviceId: this.data.printerDeviceId,
      serviceId,
      success: (res) => {
        for (const char of res.characteristics) {
          if (char.properties.write || char.properties.writeNoResponse) {
            this.setData({
              printerServiceId: serviceId,
              printerCharId: char.uuid
            })
            return
          }
        }
      }
    })
  },

  sendTSPL(text) {
    return new Promise((resolve, reject) => {
      const buffer = this.stringToBuffer(text)
      const chunkSize = 20
      let offset = 0

      const sendNext = () => {
        if (offset >= buffer.byteLength) {
          resolve()
          return
        }
        const chunk = buffer.slice(offset, Math.min(offset + chunkSize, buffer.byteLength))
        offset += chunkSize

        wx.writeBLECharacteristicValue({
          deviceId: this.data.printerDeviceId,
          serviceId: this.data.printerServiceId,
          characteristicId: this.data.printerCharId,
          value: chunk,
          success: () => {
            setTimeout(sendNext, 50)
          },
          fail: (err) => {
            reject(err)
          }
        })
      }

      sendNext()
    })
  },

  stringToBuffer(str) {
    const bytes = []
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i)
      if (code < 0x80) {
        bytes.push(code)
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
      } else if (code < 0x10000) {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
      }
    }
    return new Uint8Array(bytes).buffer
  },

  onDoPrint() {
    if (!this.data.printerConnected) { wx.showToast({ title: '请先连接打印机', icon: 'none' }); return }
    if (this.data.productIndex < 0) { wx.showToast({ title: '请选择商品', icon: 'none' }); return }

    wx.showLoading({ title: '打印中...' })

    const product = this.data.products[this.data.productIndex]
    const tspl = generateTSPL(this.data.template, product)

    this.sendTSPL(tspl).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '打印成功', icon: 'success' })
    }).catch((err) => {
      console.error('[label] print failed', err)
      wx.hideLoading()
      wx.showToast({ title: '打印失败', icon: 'error' })
    })
  },

  onUnload() {
    if (this.data.printerDeviceId) {
      wx.closeBLEConnection({ deviceId: this.data.printerDeviceId })
      wx.closeBluetoothAdapter()
    }
  }
})
