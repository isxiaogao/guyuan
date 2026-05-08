/**
 * TSPL 标签打印指令生成器
 * 适用于佳博、得力、汉印等 TSPL 协议热敏标签打印机
 */

const DPI_MAP = {
  203: 8,       // 8 dots/mm
  300: 11.81    // 11.81 dots/mm
}

const FONT_MAP = {
  8: '1', 12: '2', 16: '3', 24: '4', 32: '5', 48: '6'
}

function mmToDots(mm, dpi) {
  return Math.round(mm * DPI_MAP[dpi] || mm * 8)
}

function getFontId(pt) {
  const sizes = Object.keys(FONT_MAP).map(Number).sort((a, b) => a - b)
  let best = sizes[0]
  for (const s of sizes) {
    if (s <= pt) best = s
  }
  return FONT_MAP[best]
}

function generateTSPL(template, productData) {
  const { width, height, dpi = 203, margin = {}, elements } = template
  const m = { top: 2, right: 2, bottom: 2, left: 2, ...margin }

  let cmds = []

  // 标签尺寸（mm）
  cmds.push(`SIZE ${width} mm,${height} mm`)
  cmds.push('GAP 2 mm,0 mm')
  cmds.push('CLS')

  for (const el of elements) {
    const x = mmToDots(el.x, dpi)
    const y = mmToDots(el.y, dpi)
    const w = mmToDots(el.width, dpi)
    const h = mmToDots(el.height, dpi)
    const rotation = el.rotation || 0
    const content = resolveContent(el, productData)

    switch (el.type) {
      case 'text': {
        const fontId = getFontId(el.fontSize || 16)
        const xMul = el.xMultiplier || 1
        const yMul = el.yMultiplier || 1
        cmds.push(`TEXT ${x},${y},${fontId},${rotation},${xMul},${yMul},"${content}"`)
        break
      }
      case 'price': {
        const fontId = getFontId(el.fontSize || 24)
        const xMul = el.xMultiplier || 2
        const yMul = el.yMultiplier || 2
        cmds.push(`TEXT ${x},${y},${fontId},${rotation},${xMul},${yMul},"${content}"`)
        break
      }
      case 'barcode': {
        // Code 128 barcode
        const barcodeH = h || mmToDots(8, dpi)
        const barcodeW = 2 // narrow bar width
        cmds.push(`BARCODE ${x},${y},"128",${barcodeH},${el.showText ? 1 : 0},0,${barcodeW},2,"${content}"`)
        break
      }
      case 'qrcode': {
        const qrLevel = el.qrLevel || 'L'
        const qrSize = Math.min(w, h) || mmToDots(15, dpi)
        cmds.push(`QRCODE ${x},${y},${qrLevel},${qrSize},A,0,"${content}"`)
        break
      }
      case 'box': {
        const borderW = el.borderWidth || 1
        cmds.push(`BOX ${x},${y},${x + w},${y + h},${borderW}`)
        break
      }
      case 'line': {
        const lineH = el.lineHeight || 1
        cmds.push(`BAR ${x},${y},${w},${lineH}`)
        break
      }
      case 'image': {
        // Bitmap image (requires BMP conversion, simplified here)
        cmds.push(`BITMAP ${x},${y},${w},${h},0,${content}`)
        break
      }
    }
  }

  cmds.push(`PRINT 1,1`)
  return cmds.join('\r\n') + '\r\n'
}

function resolveContent(el, data) {
  if (!el.variable || !data) return el.content || ''
  const fieldMap = {
    name: data.name || '',
    price: data.price ? `¥${data.price}` : '',
    originalPrice: data.originalPrice ? `¥${data.originalPrice}` : '',
    size: data.size || '',
    color: data.color || '',
    fabric: data.fabric || '',
    category: data.category || '',
    tag: data.tag || ''
  }
  return fieldMap[el.variable] || el.content || ''
}

function generatePreviewText(template, productData) {
  const texts = []
  for (const el of template.elements) {
    const content = resolveContent(el, productData)
    if (content) {
      texts.push({
        type: el.type,
        content,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        fontSize: el.fontSize,
        fontWeight: el.fontWeight,
        rotation: el.rotation || 0,
        align: el.align || 'left',
        showText: el.showText !== false,
        borderWidth: el.borderWidth || 1,
        lineHeight: el.lineHeight || 1
      })
    }
  }
  return texts
}

module.exports = { generateTSPL, generatePreviewText }
