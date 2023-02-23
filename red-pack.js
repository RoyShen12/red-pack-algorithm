const cancelToken = {
  __cancelIdleCallback: new Map(),
  __clearTimeout: new Map(),
  __clearInterval: new Map(),
  __cancelAnimationFrame: new Map(),
  cancel() {
    Object.keys(this)
      .filter(key => key.startsWith('__'))
      .forEach(token => {
        /** @type {Map<string, Array<number>>} */
        const tokenMap = this[token]
        if (tokenMap.size > 0) {
          tokenMap.forEach(vArr => {
            vArr.forEach(v => window[token.replace('__', '')].call(null, v))
          })
        }

        this[token] = new Map()
      })
  },
}

const randomStr = bits => {
  let ret = ''
  for (let index = 0; index < bits; index++) {
    ret += (((Math.random() * 16) | 0) & 0xf).toString(16)
  }
  return ret
}

const AvgNext = (lastAvg, thisVal, n) => lastAvg + (thisVal - lastAvg) / n
const VarNext = (lastAvg, lastVar, thisVal, n) =>
  ((n - 1) / Math.pow(n, 2)) * Math.pow(thisVal - lastAvg, 2) + ((n - 1) / n) * lastVar

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
const RedPack = (totalMoney, peopleAmount, AmplifyFactor = 3) =>
  new Array(peopleAmount).fill(1).reduce(
    (pv, cv, idx, arr) => {
      let thisTurn =
        idx === arr.length - 1
          ? +(totalMoney - pv[0]).toFixed(2)
          : +Math.max(
              0.01,
              (Math.random() /** [0, 1)] */ * AmplifyFactor * (totalMoney - pv[0])) / (arr.length - idx)
            ).toFixed(2)

      if (thisTurn <= 0 && idx === arr.length - 1) {
        const op = pv[1][pv[1].length - 1]
        const t = thisTurn + pv[1][pv[1].length - 1]
        thisTurn = +(Math.random() * t).toFixed(2)
        const np = +(t - thisTurn).toFixed(2)
        pv[1][pv[1].length - 1] = np
        pv[0] -= op - np
      }

      pv[0] += thisTurn
      pv[1].push(thisTurn)

      return pv
    },
    [0, []] /** [cost, distribution] */
  )

function RedPackDebug(res) {
  console.log('\nDistribution: ', res[1])
  console.log(
    'Sum: ',
    res[1].reduce((p, c) => p + c, 0),
    '\n'
  )
}

function DoExperiment(totalAmount, peopleAmount, canvasW, canvasH, bottomPercent, AmplifyFactor) {
  const thisId = randomStr(16)

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

  let onceDraw = false

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

    if (!onceDraw) {
      ctx.fillStyle = '#030303'
      const hintText = `money: ${totalAmount}  people: ${peopleAmount}  AmplifyFactor: ${AmplifyFactor.toFixed(4)}`
      ctx.fillText(hintText, canvasW - 90, 10)

      ctx.fillStyle = '#E6A23C'
      ctx.fillText('—— 方差', canvasW - 250, 10)
      ctx.fillStyle = '#909399'
      ctx.fillText('—— 均值', canvasW - 290, 10)

      onceDraw = true
    }

    if (bottomPercent !== 0) {
      const onePackAvg = data.reduce((p, c) => p + c, 0) / data.length
      const onePackMaxV = Math.max(...data) + 8
      const horizonSpan = 6
      const dataBlockW = Math.floor((canvasW - (data.length - 1) * horizonSpan) / data.length)
      const textOffset = (dataBlockW + horizonSpan / 2) / 2

      // draw avg line
      // ctx.fillStyle = '#67C23A'
      // const avgLineY = Math.round(bottomDrawStartY + bottomDrawH * (1 - onePackAvg / onePackMaxV)) - 1
      // ctx.fillRect(bottomDrawStartX, avgLineY, canvasW, 2)
      // ctx.fillText(`AVG: ${onePackAvg.toFixed(4)}`, canvasW - 26, avgLineY - 9)

      ctx.fillStyle = '#F56C6C'
      ctx.font = '12px Times New Roman'

      data.forEach((v, i) => {
        // if (!peopleHisData[i]) peopleHisData[i] = []
        // peopleHisData[i].push(v)
        // peopleAvgData[i] = peopleHisData[i].reduce((p, c) => p + c, 0) / ExpTime
        // peopleVarData[i] = peopleHisData[i].reduce((p, c) => p + (c - peopleAvgData[i]) ** 2, 0) / ExpTime
        peopleMaxData[i] = ExpTime === 1 ? v : Math.max(peopleMaxData[i], v)
        peopleMinData[i] = ExpTime === 1 ? v : Math.min(peopleMinData[i], v)
        peopleAvgData[i] = ExpTime === 1 ? v : AvgNext(peopleAvgData[i], v, ExpTime)
        peopleVarData[i] = ExpTime === 1 ? 0 : VarNext(peopleAvgData[i], peopleVarData[i], v, ExpTime)

        const dataH = Math.round((v / onePackMaxV) * bottomDrawH)

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
        const x = Math.round(topDrawStartX + ((i + 0.5) * canvasW) / data.length)
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

    if (ExpTime < 100000) {
      const hdl = requestIdleCallback(redPackAnim)
      cancelToken.__cancelIdleCallback.has(thisId) || cancelToken.__cancelIdleCallback.set(thisId, [])
      cancelToken.__cancelIdleCallback.get(thisId).push(hdl)

      // const hdl = setTimeout(redPackAnim, 0)
      // cancelToken.__cancelAnimationFrame.has(thisId) || cancelToken.__cancelAnimationFrame.set(thisId, [])
      // cancelToken.__cancelAnimationFrame.get(thisId).push(hdl)
    }
  }

  redPackAnim()
}

if (typeof window !== 'object') {
  RedPackDebug(RedPack(200, 6))
  RedPackDebug(RedPack(100, 13))
  RedPackDebug(RedPack(177, 41))
} else {
  window.onload = function () {
    // console.log(RedPack.toString().split('\n'))
    const run = () =>
      range(runtimeValues.runRangeFrom, runtimeValues.runRangeTo, runtimeValues.runStep).forEach(amp =>
        DoExperiment(runtimeValues.money, runtimeValues.people, 500, 500, 0.25, amp)
      )

    const algorithmText = RedPack.toString()
      .split('\n')
      .map(codeLine => {
        let html = codeLine
          .replace(/\s\s/g, '<span class="empty_block"></span>')
          .replace(
            /AmplifyFactor(\s?=\s?\d+\.?\d*)?/g,
            '<code style="color:#FFFFCC;font-weight:bold;">AmplifyFactor</code>'
          )
          .replace(/(\/\*\*.*\*\/)/g, '<code style="color:#669933">$1</code>')

        ;['totalMoney', 'peopleAmount', 'pv', 'cv', 'idx', 'arr', 'thisTurn'].forEach(token => {
          html = html.replace(new RegExp(token, 'g'), `<code style="color:#CCCCFF">${token}</code>`)
        })
        ;['fill', 'reduce', 'push', 'toFixed', 'random', 'max', 'min'].forEach(token => {
          html = html.replace(new RegExp(token, 'g'), `<code style="color:#FFFFCC">${token}</code>`)
        })
        ;['Array', 'Math', 'new'].forEach(token => {
          html = html.replace(new RegExp(token, 'g'), `<code style="color:#CCFFFF">${token}</code>`)
        })

        return html.includes('AmplifyFactor') && html.includes('*')
          ? `<code style="background-color:#404244">${html}</code>`
          : `<code>${html}</code>`
      })

    console.log(algorithmText)

    const algorithmNode = document.createElement('div')
    algorithmNode.innerHTML = algorithmText.join('<br>')
    algorithmNode.style.padding = '20px 22px'
    algorithmNode.style.backgroundColor = '#303133'
    algorithmNode.style.borderRadius = '1rem'
    algorithmNode.style.marginTop = '16px'
    algorithmNode.style.color = '#0099CC'

    const controlNode = document.createElement('div')
    controlNode.style.display = 'flex'
    controlNode.style.flexDirection = 'row'
    controlNode.style.alignItems = 'center'
    controlNode.style.justifyContent = 'flex-start'
    controlNode.style.flexWrap = 'wrap'
    controlNode.style.width = '100%'
    controlNode.style.marginBottom = '2px'
    controlNode.style.order = '-1'

    const stop_button = document.createElement('div')
    stop_button.style.padding = '4px 16px'
    stop_button.style.margin = '10px'
    stop_button.style.border = '1px solid rgba(32, 32, 32, 0.32)'
    stop_button.style.borderRadius = '5px'
    stop_button.style.userSelect = 'none'
    stop_button.textContent = 'Stop'
    stop_button.onclick = () => {
      cancelToken.cancel()
    }

    const start_button = stop_button.cloneNode()
    start_button.textContent = 'Start'
    start_button.onclick = () => {
      cancelToken.cancel()
      Array.from(document.getElementsByTagName('canvas')).forEach(cvs => document.body.removeChild(cvs))

      run()
    }

    // <input id="dot_rang" style="margin: 0 0 0 10px;width:60px;"
    // type="range" min="0.000" max="0.100" step="0.0001" value="0.0001"
    // onchange="setGlobalDifferentialOfTime(+this.value)">
    let runtimeValues = {
      people: 21,
      money: 200,
      runRangeFrom: 1.9,
      runRangeTo: 2.25,
      runStep: 0.01,
    }

    /**
     * @param {number} initValue
     * @param {number} slowPlus
     * @param {number} quickPlus
     */
    const makeNumberTuneModule = (controlKey, disc, slowPlus, quickPlus) => {
      const node = document.createElement('div')
      node.style.margin = '2px 12px'
      node.style.padding = '0 8px'
      node.style.display = 'flex'
      node.style.alignItems = 'center'

      const hint = document.createElement('span')
      hint.style.margin = '0 8px'
      hint.style.flexGrow = '1'
      const refreshHint = () =>
        (hint.textContent = `${disc}: ${runtimeValues[controlKey].toFixed(5).replace(/0+$/, '').replace(/\.$/, '')}`)
      refreshHint()

      const btnArr = [-quickPlus, -slowPlus, +slowPlus, +quickPlus].map(c => {
        /** @type {HTMLDivElement} */
        const btn = stop_button.cloneNode()
        btn.style.fontSize = '10px'
        btn.style.padding = '2px 2px'
        btn.style.margin = '0 2px'
        btn.textContent = (c > 0 ? '+ ' : '- ') + String(Math.abs(c))
        btn.onclick = () => {
          runtimeValues[controlKey] = runtimeValues[controlKey] + c
          refreshHint()
        }
        return btn
      })

      node.appendChild(btnArr[0])
      node.appendChild(btnArr[1])
      node.appendChild(hint)
      node.appendChild(btnArr[2])
      node.appendChild(btnArr[3])

      return node
    }

    controlNode.appendChild(makeNumberTuneModule('money', 'Total Money', 50, 10))
    controlNode.appendChild(makeNumberTuneModule('people', 'People', 5, 1))
    controlNode.appendChild(makeNumberTuneModule('runRangeFrom', 'Amp From', 0.01, 0.1))
    controlNode.appendChild(makeNumberTuneModule('runRangeTo', 'Amp To', 0.01, 0.1))
    controlNode.appendChild(makeNumberTuneModule('runStep', 'Amp Change Step', 0.0001, 0.001))
    controlNode.appendChild(start_button)
    controlNode.appendChild(stop_button)

    document.body.appendChild(algorithmNode)
    document.body.appendChild(controlNode)

    // start experiment
    run()
  }
}
