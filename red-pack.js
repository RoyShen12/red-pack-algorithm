const AvgNext = (lastAvg, thisVal, n) => lastAvg + (thisVal - lastAvg) / n
const VarNext = (lastAvg, lastVar, thisVal, n) => (n - 1) / Math.pow(n, 2) * Math.pow(thisVal - lastAvg, 2) + (n - 1) / n * lastVar

const range = (start, end, step) => {
  const ret = []
  let val = start
  while (val <= end) {
    ret.push(val)
    val += step
  }
  return ret
}

/**
 * @returns {[number, number[]]}
 */
const RedPack = (totalAmount, peopleAmount, AmplifyFactor = 3) => new Array(peopleAmount).fill(1).reduce((pv, cv, idx, arr) => {
  let thisTurn = idx === arr.length - 1 ? +(totalAmount - pv[0]).toFixed(2) : +Math.max(0.01, Math.random() /** [0, 1)] */ * AmplifyFactor * (totalAmount - pv[0]) / (arr.length - idx)).toFixed(2)
  if (thisTurn <= 0 && idx === arr.length - 1) {
    const op = pv[1][pv[1].length - 1]
    const t = thisTurn + pv[1][pv[1].length - 1]
    thisTurn = +(Math.random() * t).toFixed(2)
    const np = +(t - thisTurn).toFixed(2)
    // console.log(`op=${op}, np=${np}`)
    pv[1][pv[1].length - 1] = np
    pv[0] -= op - np
  }
  pv[0] += thisTurn
  pv[1].push(thisTurn)
  return pv
}, [0, []] /** [cost, dis] */)

function RedPackDebug(res) {
  console.log('\nDistribution: ', res[1])
  console.log('Sum: ', res[1].reduce((p, c) => p + c, 0), '\n')
}

function DoExperiment(totalAmount, peopleAmount, canvasW, canvasH, bottomPercent, AmplifyFactor) {
  const dpi = window.devicePixelRatio

  const canvas = document.createElement('canvas')
  canvas.width = canvasW * dpi
  canvas.height = canvasH * dpi

  canvas.style.border = '1px solid #f03333'
  canvas.style.width = canvasW + 'px'
  canvas.style.height = canvasH + 'px'

  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  ctx.scale(dpi, dpi)
  ctx.textAlign = 'center'

  /**
   * ------ 0
   * ------ 12 topDrawStartY
   *  ( top draw )  : topDrawH
   * ------ 99
   *  ( split line )
   * ------ 100 bottomDrawStartY
   *  ( bottom draw )  : bottomDrawH
   * ------ canvasH
   */

  const topDrawStartX = 0
  const topDrawStartY = 12
  const bottomDrawStartX = 0
  const bottomDrawStartY = Math.round(canvasH * (1 - bottomPercent))
  const topBottomSplitWidth = 1

  const topDrawH = bottomDrawStartY - topBottomSplitWidth - topDrawStartY
  const bottomDrawH = canvasH - bottomDrawStartY

  // black split line
  ctx.fillRect(0, bottomDrawStartY - topBottomSplitWidth, canvasW, topBottomSplitWidth)

  let ExpTime = 0

  /** @type {number[]} */
  const peopleMaxData = new Array(peopleAmount)
  /** @type {number[]} */
  const peopleMinData = new Array(peopleAmount)
  /** @type {number[]} */
  const peopleAvgData = new Array(peopleAmount)
  /** @type {number[]} */
  const peopleVarData = new Array(peopleAmount)

  /**************************************************** RedPackAnim ****************************************************/
  const redPackAnim = () => {
    // clear bottom
    ctx.clearRect(0, bottomDrawStartY, canvasW, bottomDrawH)

    const data = RedPack(totalAmount, peopleAmount, AmplifyFactor)[1]

    ExpTime++

    // refresh exp time
    const expTimeText = `Repeat: ${ExpTime}`
    ctx.fillStyle = '#909399'
    ctx.font = '8px Times New Roman'
    ctx.clearRect(0, 0, ctx.measureText(expTimeText).width + 8, 12)
    ctx.fillText(expTimeText, 24, 10)
    ctx.fillStyle = '#030303'
    ctx.fillText(`AmplifyFactor: ${AmplifyFactor}`, canvasW - 36, 10)

    if (bottomPercent !== 0) {

      const onePackAvg = data.reduce((p, c) => p + c, 0) / data.length
      const onePackMaxV = Math.max(...data) + 8
      const horizonSpan = 6
      const dataBlockW = Math.floor((canvasW - (data.length - 1) * horizonSpan) / data.length)
      const textOffset = (dataBlockW + horizonSpan / 2) / 2

      // draw avg line
      ctx.fillStyle = '#67C23A'
      const avgLineY = Math.round(bottomDrawStartY + bottomDrawH * (1 - onePackAvg / onePackMaxV)) - 1
      ctx.fillRect(bottomDrawStartX, avgLineY, canvasW, 2)
      ctx.fillText(`AVG: ${onePackAvg.toFixed(4)}`, canvasW - 26, avgLineY - 9)

      ctx.fillStyle = '#F56C6C'
      ctx.font = '18px Times New Roman'

      data.forEach((v, i) => {

        // if (!peopleHisData[i]) peopleHisData[i] = []
        // peopleHisData[i].push(v)
        // peopleAvgData[i] = peopleHisData[i].reduce((p, c) => p + c, 0) / ExpTime
        // peopleVarData[i] = peopleHisData[i].reduce((p, c) => p + (c - peopleAvgData[i]) ** 2, 0) / ExpTime
        peopleMaxData[i] = ExpTime === 1 ? v : Math.max(peopleMaxData[i], v)
        peopleMinData[i] = ExpTime === 1 ? v : Math.min(peopleMinData[i], v)
        peopleAvgData[i] = ExpTime === 1 ? v : AvgNext(peopleAvgData[i], v, ExpTime)
        peopleVarData[i] = ExpTime === 1 ? 0 : VarNext(peopleAvgData[i], peopleVarData[i], v, ExpTime)

        const dataH = Math.round(v / onePackMaxV * bottomDrawH)

        if (dataH === 0) return

        const x = Math.round(bottomDrawStartX + i * (dataBlockW + horizonSpan))
        const y = Math.round(bottomDrawStartY + bottomDrawH * (1 - v / onePackMaxV))
        // console.log(x, y, h)

        ctx.fillRect(x, y, dataBlockW, dataH)
        ctx.fillText(v, x + textOffset, Math.max(30, y - 15))
      })

    }

    /**************************************************** DrawTopStatistic ****************************************************/

    const maxValueExceed = 10
    const minValueExceed = 2

    ctx.clearRect(0, topDrawStartY, canvasW, topDrawH)

    const topAreaDrawer = (strokeStyle, fillStyle, font, data) => {
      ctx.strokeStyle = strokeStyle
      ctx.fillStyle = fillStyle
      ctx.font = font

      const dataPath = new Path2D()

      const maxAvg = Math.max(...data) + maxValueExceed
      const minAvg = Math.min(...data) - minValueExceed
      data.forEach((dataPoint, i) => {
        const x = Math.round(topDrawStartX + (i + 0.5) * canvasW / data.length)
        const y = Math.round(topDrawStartY + topDrawH * (1 - (dataPoint - minAvg) / maxAvg))

        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fill()

        if (i === 0) dataPath.moveTo(x, y)
        else dataPath.lineTo(x, y)

        ctx.fillText(dataPoint.toFixed(2), x, y - 4)
      })
      ctx.stroke(dataPath)
    }

    /**************************************************** DrawAvgLine ****************************************************/
    topAreaDrawer('#909399', '#909399', '6px Times New Roman', peopleAvgData)

    /**************************************************** DrawVarLine ****************************************************/
    topAreaDrawer('#E6A23C', '#E6A23C', '6px Times New Roman', peopleVarData)

    /**************************************************** DrawMaxLine ****************************************************/
    // topAreaDrawer('#f5222d', '#f5222d', '6px Times New Roman', peopleMaxData)

    /**************************************************** DrawMinLine ****************************************************/
    // topAreaDrawer('#1890ff', '#1890ff', '6px Times New Roman', peopleMinData)

    /**************************************************** AnimControl ****************************************************/

    // if (ExpTime < 1000) setTimeout(redPackAnim, 0)
    if (ExpTime < 100000) requestIdleCallback(redPackAnim)
    // requestAnimationFrame(redPackAnim)
  }

  redPackAnim()
}

if (typeof window !== 'object') {
  RedPackDebug(RedPack(200, 6))
  RedPackDebug(RedPack(100, 13))
  RedPackDebug(RedPack(177, 41))
} else {
  window.onload = function () {
    // range(1.5, 3.2, 0.1).forEach(amp => DoExperiment(200, 41, 300, 500, 0.75, +amp.toFixed(2)))
    range(1.90, 2.25, 0.01).forEach(amp => DoExperiment(1000, 33, 300, 500, 0.0001, +amp.toFixed(2)))
    // DoExperiment(200, 41, 500, 800, 3)
    // DoExperiment(200, 41, 500, 800, 2.75)
    // DoExperiment(200, 41, 500, 800, 2.5)
    // DoExperiment(200, 41, 500, 800, 2)
  }
}
